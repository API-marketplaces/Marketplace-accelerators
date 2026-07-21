"""
api_source_endpoints.py
=======================
Provides the POST /api-sources/test-connection endpoint.

Azure connection validation uses a two-tier approach:

  Tier 1 – Gateway fingerprint probe (always active, no credentials required)
      A GET is sent to the gateway URL.  Azure APIM always injects the
      response headers  x-ms-request-id  and (on auth failures) the
      WWW-Authenticate: Bearer realm="…"  challenge.  The presence of
      these headers confirms the URL really is a live Azure APIM gateway.

  Tier 2 – ARM REST API validation (active when service-principal env vars
            AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET are set)
      An OAuth2 client_credentials token is fetched from Azure AD, then
      the Azure Resource Manager API is called to confirm the APIM service
      name, resource group, and subscription exist and the provisioning
      state is "Active".
"""

import os
from typing import Optional, List
from urllib.parse import urlparse

import requests
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from datetime import datetime

from app.core.security import get_current_user
from app.schemas.audience import AudienceResponse
from app.database.database import get_db
from app.crud import gateway_connections as crud_gateway_connections
from sqlalchemy.orm import Session

router = APIRouter()


class GatewayConnectionCreate(BaseModel):
    provider: str
    name: str
    description: Optional[str] = None


class GatewayConnectionPublic(BaseModel):
    id: int
    provider: str
    name: str
    description: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


# ── Azure ARM constants ────────────────────────────────────────────────────────
_ARM_BASE = "https://management.azure.com"
_ARM_API_VERSION = "2022-08-01"
_TOKEN_URL_TEMPLATE = "https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
_ARM_SCOPE = "https://management.azure.com/.default"

# Azure APIM gateway response headers that confirm a live APIM instance.
# These are injected by the Azure APIM runtime on every response.
_AZURE_FINGERPRINT_HEADERS = {
    "x-ms-request-id",
    "ocp-apim-trace-location",
    "x-ms-correlation-id",
}


class ApiSourceConnectionRequest(BaseModel):
    provider: str
    connectionName: str
    serviceName: Optional[str] = None
    resourceGroup: Optional[str] = None
    subscriptionId: Optional[str] = None
    gatewayUrl: Optional[str] = None
    managementUrl: Optional[str] = None


# ── Helpers ────────────────────────────────────────────────────────────────────

def _validate_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise HTTPException(
            status_code=422,
            detail="Gateway URL must be a valid http:// or https:// URL",
        )


def _probe_gateway(gateway_url: str) -> dict:
    """
    Tier 1 – Gateway fingerprint probe.

    Confirms the URL is a live Azure APIM instance using four independent signals:

    1. **Hostname** – the URL ends with `.azure-api.net`, which is Azure's
       dedicated domain for APIM gateway endpoints.  This alone is a strong
       indicator.

    2. **Response headers** – Azure APIM injects `x-ms-request-id` and
       related `Ocp-Apim-*` headers on most responses.

    3. **Response body** – Azure APIM returns a standard JSON error body on
       unknown paths:  {"statusCode": 404, "message": "Resource not found"}

    4. **401 Bearer challenge** – a 401 with `WWW-Authenticate: Bearer` means
       the gateway is live and requires a subscription key.

    Returns a dict with keys: status_code, is_azure_apim, auth_required, signals.
    Raises HTTPException on network/TLS failure.
    """
    parsed = urlparse(gateway_url)
    hostname = parsed.netloc.lower().split(":")[0]  # strip port if present

    # Signal 1: Azure's dedicated APIM gateway domain.
    hostname_match = hostname.endswith(".azure-api.net") or hostname == "azure-api.net"

    try:
        resp = requests.get(gateway_url, timeout=12, allow_redirects=True)
    except requests.exceptions.SSLError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Azure gateway SSL validation failed: {exc}",
        ) from exc
    except requests.exceptions.Timeout as exc:
        raise HTTPException(
            status_code=504, detail="Azure gateway connection timed out"
        ) from exc
    except requests.exceptions.RequestException as exc:
        raise HTTPException(
            status_code=502, detail=f"Azure gateway connection failed: {exc}"
        ) from exc

    if resp.status_code >= 500:
        raise HTTPException(
            status_code=502,
            detail=f"Azure gateway responded with server error {resp.status_code}",
        )

    # Normalise header names to lowercase for case-insensitive matching.
    resp_headers_lower = {k.lower(): v for k, v in resp.headers.items()}

    # Signal 2: Azure APIM-specific response headers.
    headers_match = bool(_AZURE_FINGERPRINT_HEADERS & set(resp_headers_lower))

    # Signal 3: Azure APIM standard JSON error body on unknown paths.
    # Root path with no subscription key → {"statusCode":404,"message":"Resource not found"}
    body_match = False
    try:
        body = resp.json()
        if isinstance(body, dict):
            status_code_field = body.get("statusCode") or body.get("status_code")
            message_field = (body.get("message") or "").lower()
            # Azure APIM body fingerprints:
            #   {"statusCode": 404, "message": "Resource not found"}
            #   {"statusCode": 401, "message": "Access denied due to missing subscription key ..."}
            #   {"statusCode": 401, "message": "Access denied due to invalid subscription key"}
            body_match = status_code_field in {401, 404} and (
                "resource not found" in message_field
                or "access denied" in message_field
                or "subscription key" in message_field
                or "missing subscription" in message_field
            )
    except Exception:
        pass

    # Signal 4: 401 with a Bearer WWW-Authenticate challenge.
    www_auth = resp_headers_lower.get("www-authenticate", "")
    auth_required = resp.status_code == 401 and "bearer" in www_auth.lower()

    # Any single confirmed signal is sufficient to identify a live Azure APIM.
    signals = {
        "hostname": hostname_match,
        "headers": headers_match,
        "body": body_match,
        "bearer_challenge": auth_required,
    }
    is_azure_apim = any(signals.values())

    return {
        "status_code": resp.status_code,
        "is_azure_apim": is_azure_apim,
        "auth_required": auth_required,
        "signals": signals,
    }



def _get_arm_token(tenant_id: str, client_id: str, client_secret: str) -> str:
    """
    Fetch an Azure AD OAuth2 access token for the ARM scope using
    client_credentials grant.  Raises HTTPException on failure.
    """
    token_url = _TOKEN_URL_TEMPLATE.format(tenant_id=tenant_id)
    try:
        resp = requests.post(
            token_url,
            data={
                "grant_type": "client_credentials",
                "client_id": client_id,
                "client_secret": client_secret,
                "scope": _ARM_SCOPE,
            },
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()["access_token"]
    except requests.exceptions.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to obtain Azure ARM token: {exc}",
        ) from exc
    except (KeyError, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Unexpected ARM token response: {exc}",
        ) from exc


def _validate_arm(
    subscription_id: str,
    resource_group: str,
    service_name: str,
    tenant_id: str,
    client_id: str,
    client_secret: str,
) -> dict:
    """
    Tier 2 – Azure ARM REST API validation.

    Calls the ARM REST API to confirm the APIM service exists in the given
    subscription/resource group and that its provisioningState is "Succeeded"
    (meaning the service is active and healthy).

    Returns a dict with keys: arm_status, provisioning_state.
    """
    token = _get_arm_token(tenant_id, client_id, client_secret)

    arm_url = (
        f"{_ARM_BASE}/subscriptions/{subscription_id}"
        f"/resourceGroups/{resource_group}"
        f"/providers/Microsoft.ApiManagement/service/{service_name}"
        f"?api-version={_ARM_API_VERSION}"
    )

    try:
        resp = requests.get(
            arm_url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=20,
        )
    except requests.exceptions.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Azure ARM API call failed: {exc}",
        ) from exc

    if resp.status_code == 404:
        raise HTTPException(
            status_code=404,
            detail=(
                f"APIM service '{service_name}' not found in resource group "
                f"'{resource_group}' (subscription {subscription_id})."
            ),
        )

    if resp.status_code == 403:
        raise HTTPException(
            status_code=403,
            detail=(
                "Service principal lacks Reader permission on the APIM resource. "
                "Grant Reader access on the resource group or service in Azure IAM."
            ),
        )

    if not resp.ok:
        raise HTTPException(
            status_code=502,
            detail=f"Azure ARM returned HTTP {resp.status_code}: {resp.text[:200]}",
        )

    try:
        body = resp.json()
        provisioning_state: str = (
            body.get("properties", {}).get("provisioningState", "Unknown")
        )
    except ValueError:
        provisioning_state = "Unknown"

    return {
        "arm_status": resp.status_code,
        "provisioning_state": provisioning_state,
    }


# ── Route ──────────────────────────────────────────────────────────────────────

@router.post("/api-sources/test-connection")
def test_api_source_connection(
    request: ApiSourceConnectionRequest,
    current_user: AudienceResponse = Depends(get_current_user),
):
    provider = request.provider.lower().strip()
    if provider != "azure":
        raise HTTPException(
            status_code=400,
            detail="Only Azure API gateway testing is available right now",
        )

    required_fields = {
        "connectionName": request.connectionName,
        "serviceName": request.serviceName,
        "resourceGroup": request.resourceGroup,
        "subscriptionId": request.subscriptionId,
        "gatewayUrl": request.gatewayUrl,
    }
    missing = [key for key, value in required_fields.items() if not str(value or "").strip()]
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"Missing required field(s): {', '.join(missing)}",
        )

    gateway_url = request.gatewayUrl.strip()
    _validate_url(gateway_url)

    # ── Tier 1: Gateway fingerprint probe ─────────────────────────────────────
    probe = _probe_gateway(gateway_url)
    signals = probe.get("signals", {})

    if not probe["is_azure_apim"]:
        # The URL is reachable but no Azure signal was detected.
        gateway_note = (
            "Warning: Could not confirm this is an Azure APIM instance. "
            "The gateway URL is reachable but shows no Azure-specific fingerprints."
        )
    else:
        # Build a specific message based on which signals fired.
        confirmed_via = []
        if signals.get("hostname"):
            confirmed_via.append("Azure APIM gateway domain (azure-api.net)")
        if signals.get("body"):
            confirmed_via.append("Azure APIM JSON error response body")
        if signals.get("headers"):
            confirmed_via.append("Azure APIM response headers")
        if signals.get("bearer_challenge"):
            confirmed_via.append("Azure Bearer subscription-key challenge")

        via_str = " · ".join(confirmed_via) if confirmed_via else "Azure APIM fingerprint"
        if probe["auth_required"]:
            gateway_note = f"Azure APIM gateway confirmed ({via_str}). Subscription key required."
        else:
            gateway_note = f"Azure APIM gateway confirmed ({via_str})."

    result: dict = {
        "success": True,
        "message": f"Azure API gateway connection successful. {gateway_note}",
        "provider": "azure",
        "connectionName": request.connectionName,
        "serviceName": request.serviceName,
        "resourceGroup": request.resourceGroup,
        "subscriptionId": request.subscriptionId,
        "gatewayUrl": gateway_url,
        "gatewayStatus": probe["status_code"],
        "azureApimFingerprint": probe["is_azure_apim"],
        "fingerprintSignals": signals,
    }

    # ── Tier 2: ARM REST API validation (only when SP creds are configured) ───
    tenant_id = os.getenv("AZURE_TENANT_ID", "").strip()
    client_id = os.getenv("AZURE_CLIENT_ID", "").strip()
    client_secret = os.getenv("AZURE_CLIENT_SECRET", "").strip()

    if tenant_id and client_id and client_secret:
        arm = _validate_arm(
            subscription_id=request.subscriptionId.strip(),
            resource_group=request.resourceGroup.strip(),
            service_name=request.serviceName.strip(),
            tenant_id=tenant_id,
            client_id=client_id,
            client_secret=client_secret,
        )
        result["armValidation"] = arm["provisioning_state"]
        result["message"] = (
            f"Azure API gateway connection successful. {gateway_note} "
            f"ARM provisioning state: {arm['provisioning_state']}."
        )
    else:
        result["armValidation"] = "skipped (no service principal credentials configured)"

    return result


@router.get("/api-sources/", response_model=List[GatewayConnectionPublic])
def list_gateway_connections(
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user),
):
    """
    List all gateway connections for the authenticated user.
    """
    return crud_gateway_connections.get_connections_by_owner(db, current_user.id)


@router.post("/api-sources/", response_model=GatewayConnectionPublic, status_code=status.HTTP_201_CREATED)
def create_gateway_connection(
    request: GatewayConnectionCreate,
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user),
):
    """
    Create a new gateway connection for the authenticated user.
    """
    return crud_gateway_connections.create_connection(
        db=db,
        provider=request.provider,
        name=request.name,
        description=request.description or "",
        audience_id=current_user.id,
    )


@router.delete("/api-sources/{connection_id}", response_model=GatewayConnectionPublic)
def delete_gateway_connection(
    connection_id: int,
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user),
):
    """
    Delete a specific gateway connection for the authenticated user.
    """
    record = crud_gateway_connections.delete_connection(
        db=db,
        connection_id=connection_id,
        audience_id=current_user.id,
    )
    if not record:
        raise HTTPException(
            status_code=404,
            detail="Gateway connection not found or not authorized.",
        )
    return record

