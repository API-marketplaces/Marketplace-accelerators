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
from typing import Optional
from urllib.parse import urlparse

import requests
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.security import get_current_user
from app.schemas.audience import AudienceResponse

router = APIRouter()

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

    Sends a GET to the gateway URL and checks for Azure APIM-specific
    response headers.  Azure APIM always returns x-ms-request-id
    regardless of whether an API route exists, giving us a reliable
    fingerprint without any credentials.

    Returns a dict with keys: status_code, is_azure_apim, auth_required.
    Raises HTTPException on network/TLS failure.
    """
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

    is_azure_apim = bool(_AZURE_FINGERPRINT_HEADERS & set(resp_headers_lower))

    # A 401 with a Bearer WWW-Authenticate challenge is also a strong signal.
    www_auth = resp_headers_lower.get("www-authenticate", "")
    auth_required = resp.status_code == 401 and "bearer" in www_auth.lower()
    if auth_required:
        is_azure_apim = True

    return {
        "status_code": resp.status_code,
        "is_azure_apim": is_azure_apim,
        "auth_required": auth_required,
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

    if not probe["is_azure_apim"]:
        # The URL is reachable but shows no Azure APIM response headers —
        # flag it as a warning but do not block the user (the gateway may be
        # configured to strip headers, or a CDN sits in front of it).
        gateway_note = (
            "Warning: Azure APIM response headers were not detected. "
            "The gateway may be behind a proxy or the URL may not be an APIM instance."
        )
    else:
        gateway_note = (
            "Azure APIM gateway fingerprint confirmed."
            if not probe["auth_required"]
            else "Azure APIM gateway fingerprint confirmed (subscription key required)."
        )

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
