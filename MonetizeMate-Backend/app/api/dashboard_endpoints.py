from datetime import timedelta
from typing import Iterable
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
import pandas as pd
from app.core.security import get_current_user
from app.database.database import get_db
from app.schemas.audience import AudienceResponse
from app.crud import files as crud_files
import os
from app.core.config import settings

try:
    import openpyxl
except ImportError:
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Missing optional dependency 'openpyxl'. Install it using 'pip install openpyxl'.",
    )

router = APIRouter()

# Column groups used to keep dashboard reads narrow.
ENDPOINT_COLUMNS = ["endpoint", "API NAME", "api_name", "api"]
GEO_COLUMNS = ["geo", "country", "region", "location"]


# ─── Shared helpers ────────────────────────────────────────────────────────────

def _is_safe_upload_path(file_path: str) -> bool:
    upload_dir_abs = os.path.abspath(settings.UPLOAD_DIRECTORY)
    candidate = os.path.abspath(file_path)
    try:
        return os.path.commonpath([upload_dir_abs, candidate]) == upload_dir_abs
    except ValueError:
        return False


def _read_dataframe(file_path: str, columns: Iterable[str] | None = None) -> pd.DataFrame:
    ext = os.path.splitext(file_path)[1].lower()
    usecols = None

    if columns:
        wanted = set(columns)
        header = (
            pd.read_csv(file_path, nrows=0)
            if ext == ".csv"
            else pd.read_excel(file_path, nrows=0)
        )
        usecols = [col for col in header.columns if col in wanted]
        if not usecols:
            return pd.DataFrame()

    if ext == ".csv":
        return pd.read_csv(file_path, usecols=usecols)
    return pd.read_excel(file_path, usecols=usecols)


def _load_file(
    db: Session,
    file_id: int,
    current_user: AudienceResponse,
    columns: Iterable[str] | None = None,
) -> pd.DataFrame:
    """Authorise and load only the columns needed for the requested chart."""
    db_file = crud_files.get_file_by_id(db, file_id)
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found in database")
    if db_file.audience_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this file")
    file_path = db_file.path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk (metadata exists)")
    if not _is_safe_upload_path(file_path):
        raise HTTPException(status_code=400, detail="Invalid file path")
    return _read_dataframe(file_path, columns=columns)


def _require_cols(df: pd.DataFrame, cols: list) -> None:
    for col in cols:
        if col not in df.columns:
            raise HTTPException(status_code=422, detail=f"Missing required column: {col}")


def _prepare_timestamps(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df
    df = df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce", utc=True)
    df["timestamp"] = df["timestamp"].dt.tz_localize(None)
    df = df.dropna(subset=["timestamp"])
    return df


def _apply_time_filter(df: pd.DataFrame, time_filter: str) -> pd.DataFrame:
    if "timestamp" not in df.columns or df.empty:
        return df
    df = _prepare_timestamps(df)
    if df.empty:
        return df
    days_map = {"1d": 1, "7d": 7, "30d": 30, "90d": 90}
    days = days_map.get(time_filter, 7)
    data_end = df["timestamp"].dt.date.max()
    data_start = data_end - timedelta(days=days - 1)
    filtered = df[df["timestamp"].dt.date.between(data_start, data_end)]
    return filtered if not filtered.empty else df


def _detect_endpoint_col(df: pd.DataFrame):
    for candidate in ENDPOINT_COLUMNS:
        if candidate in df.columns:
            return candidate
    return None


def _detect_geo_col(df: pd.DataFrame):
    for candidate in GEO_COLUMNS:
        if candidate in df.columns:
            return candidate
    return None


def _value_counts_to_list(df: pd.DataFrame, col: str, label: str = None) -> list:
    if col not in df.columns:
        return []
    out_key = label or col
    vc = df[col].value_counts().reset_index()
    if "count" in vc.columns:
        vc = vc.rename(columns={col: out_key})
    else:
        vc = vc.rename(columns={"index": out_key, col: "count"})
    return vc.to_dict("records")


def _coerce_numeric(df: pd.DataFrame, columns: Iterable[str]) -> pd.DataFrame:
    df = df.copy()
    for col in columns:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    return df


# ─── /overview/{file_id} ──────────────────────────────────────────────────────

@router.get("/overview/{file_id}")
def overview_endpoint(
    file_id: int,
    time_filter: str = Query(default="7d"),
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user),
):
    df = _load_file(db, file_id, current_user, ["timestamp", "status_code", "requests", "response_time"])
    _require_cols(df, ["timestamp", "status_code", "requests"])

    df = _coerce_numeric(df, ["status_code", "requests", "response_time"])
    df = _prepare_timestamps(df)
    if df.empty:
        return {
            "total_requests": 0,
            "successful_requests": 0,
            "errors": 0,
            "avg_response_time": None,
            "daily_usage": [],
        }

    days_map = {"1d": 1, "7d": 7, "30d": 30, "90d": 90}
    days = days_map.get(time_filter, 7)
    data_end = df["timestamp"].dt.date.max()
    data_start = data_end - timedelta(days=days - 1)

    df_f = df[df["timestamp"].dt.date.between(data_start, data_end)]
    if df_f.empty:
        df_f = df

    total_requests = int(df_f["requests"].sum())
    successful = int(df_f[df_f["status_code"] == 200]["requests"].sum())
    errors = int(df_f[df_f["status_code"] != 200]["requests"].sum())
    avg_rt = None
    if "response_time" in df_f.columns and not df_f["response_time"].isna().all():
        avg_rt = float(df_f["response_time"].mean())

    all_days = [d.date() for d in pd.date_range(data_start, data_end)]
    if not df_f.empty:
        ds = (
            df_f.groupby(df_f["timestamp"].dt.date, as_index=False)
            .agg(
                total_requests=("requests", "sum"),
                errors=("status_code", lambda x: int((x != 200).sum())),
            )
        )
        ds.columns = ["date", "total_requests", "errors"]
        ds = (
            ds.set_index("date")
            .reindex(all_days, fill_value=0)
            .reset_index()
            .rename(columns={"index": "date"})
        )
    else:
        ds = pd.DataFrame({"date": all_days, "total_requests": 0, "errors": 0})

    return {
        "total_requests": total_requests,
        "successful_requests": successful,
        "errors": errors,
        "avg_response_time": avg_rt,
        "daily_usage": [
            {
                "date": str(r["date"]),
                "total_requests": int(r["total_requests"]),
                "errors": int(r["errors"]),
            }
            for _, r in ds.iterrows()
        ],
    }


# ─── /analysis/{file_id} ──────────────────────────────────────────────────────

@router.get("/analysis/{file_id}")
def analysis_endpoint(
    file_id: int,
    time_filter: str = Query(default="7d"),
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user),
):
    df = _load_file(db, file_id, current_user, ENDPOINT_COLUMNS + ["requests", "status_code", "timestamp"])
    endpoint_col = _detect_endpoint_col(df)
    if endpoint_col is None:
        raise HTTPException(status_code=422, detail="Missing required column: endpoint (or 'API NAME')")
    _require_cols(df, ["requests", "status_code"])
    df = _coerce_numeric(df, ["requests", "status_code"])
    df = _apply_time_filter(df, time_filter)

    top_5 = (
        df.groupby(endpoint_col)["requests"].sum().nlargest(5).reset_index()
        .rename(columns={endpoint_col: "endpoint", "requests": "total_requests"})
    )
    error_df = df[df["status_code"] != 200]
    apis_errors = (
        error_df.groupby(endpoint_col)["requests"].sum()
        .sort_values(ascending=False).reset_index()
        .rename(columns={endpoint_col: "endpoint", "requests": "error_requests"})
    )
    return {
        "top_5_apis_by_consumption": top_5.to_dict("records"),
        "apis_with_most_errors": apis_errors.to_dict("records"),
    }


# ─── /temporal/{file_id} ──────────────────────────────────────────────────────

@router.get("/temporal/{file_id}")
def temporal_endpoint(
    file_id: int,
    time_filter: str = Query(default="30d"),
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user),
):
    df = _load_file(db, file_id, current_user, ["timestamp", "requests"])
    _require_cols(df, ["timestamp", "requests"])
    df = _coerce_numeric(df, ["requests"])
    df = _apply_time_filter(df, time_filter)
    if df.empty:
        return {"daily_request_volume": [], "hourly_call_distribution": []}

    daily = (
        df.groupby(df["timestamp"].dt.date)["requests"].sum().reset_index()
        .rename(columns={"timestamp": "date", "requests": "total_requests"})
    )
    df = df.copy()
    df["hour"] = df["timestamp"].dt.hour
    hourly = df.groupby("hour")["requests"].sum().reset_index()

    return {
        "daily_request_volume": [
            {"date": str(r["date"]), "total_requests": int(r["total_requests"])}
            for _, r in daily.iterrows()
        ],
        "hourly_call_distribution": [
            {"hour": int(r["hour"]), "total_requests": int(r["requests"])}
            for _, r in hourly.iterrows()
        ],
    }


# ─── /clients/{file_id} ───────────────────────────────────────────────────────

@router.get("/clients/{file_id}")
def clients_endpoint(
    file_id: int,
    time_filter: str = Query(default="7d"),
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user),
):
    df = _load_file(db, file_id, current_user, ["client_id", "requests", "timestamp"])
    _require_cols(df, ["client_id", "requests"])
    df = _coerce_numeric(df, ["requests"])
    df = _apply_time_filter(df, time_filter)

    top = (
        df.groupby("client_id")["requests"].sum()
        .sort_values(ascending=False).reset_index()
        .rename(columns={"requests": "total_requests"})
    )
    return {"top_consumers": top.to_dict("records")}


# ─── /distribution/{file_id} ──────────────────────────────────────────────────

@router.get("/distribution/{file_id}")
def distribution_endpoint(
    file_id: int,
    time_filter: str = Query(default="7d"),
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user),
):
    df = _load_file(db, file_id, current_user, GEO_COLUMNS + ["brand", "partner", "team", "timestamp"])
    df = _apply_time_filter(df, time_filter)

    geo_col = _detect_geo_col(df)
    geo_label = "geo"

    geo_dist = []
    if geo_col:
        geo_dist = _value_counts_to_list(df, geo_col, label=geo_label)

    return {
        "geographic_distribution": geo_dist,
        "brand_distribution": _value_counts_to_list(df, "brand"),
        "partner_distribution": _value_counts_to_list(df, "partner"),
        "team_distribution": _value_counts_to_list(df, "team"),
    }


# ─── /rankings/{file_id} ──────────────────────────────────────────────────────

@router.get("/rankings/{file_id}")
def rankings_endpoint(
    file_id: int,
    time_filter: str = Query(default="7d"),
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user),
):
    df = _load_file(db, file_id, current_user, ENDPOINT_COLUMNS + ["client_id", "requests", "status_code", "timestamp"])
    df = _coerce_numeric(df, ["requests", "status_code"])
    df = _apply_time_filter(df, time_filter)

    endpoint_col = _detect_endpoint_col(df)

    clients = []
    if "client_id" in df.columns and "requests" in df.columns:
        clients = (
            df.groupby("client_id")["requests"].sum()
            .sort_values(ascending=False).head(20).reset_index()
            .rename(columns={"requests": "total_requests"}).to_dict("records")
        )

    apis = []
    if endpoint_col and "requests" in df.columns:
        apis = (
            df.groupby(endpoint_col)["requests"].sum()
            .sort_values(ascending=False).head(20).reset_index()
            .rename(columns={endpoint_col: "endpoint", "requests": "total_requests"})
            .to_dict("records")
        )

    failed_apis = []
    if endpoint_col and "status_code" in df.columns and "requests" in df.columns:
        err_df = df[df["status_code"] != 200]
        failed_apis = (
            err_df.groupby(endpoint_col)["requests"].sum()
            .sort_values(ascending=False).head(20).reset_index()
            .rename(columns={endpoint_col: "endpoint", "requests": "error_requests"})
            .to_dict("records")
        )

    return {
        "top_20_clients": clients,
        "top_20_apis_accessed": apis,
        "top_20_failed_apis": failed_apis,
    }
