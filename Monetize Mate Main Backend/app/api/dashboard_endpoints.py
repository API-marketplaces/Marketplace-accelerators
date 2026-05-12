from datetime import datetime, timedelta
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
        detail="Missing optional dependency 'openpyxl'.",
    )

router = APIRouter()

# ── Helper: load dataframe ────────────────────────────────────────────────────
def load_df(db_file, current_user):
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found in database")
    if db_file.audience_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this file")
    file_path = db_file.path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    if not os.path.abspath(file_path).startswith(os.path.abspath(settings.UPLOAD_DIRECTORY)):
        raise HTTPException(status_code=400, detail="Invalid file path")
    ext = os.path.splitext(file_path)[1].lower()
    return pd.read_csv(file_path) if ext == ".csv" else pd.read_excel(file_path)

# ── Helper: parse days from time filter string ────────────────────────────────
def parse_days(time_filter: str) -> int:
    mapping = {"1d": 1, "7d": 7, "30d": 30, "90d": 90}
    return mapping.get(time_filter, 7)


# ── Overview ──────────────────────────────────────────────────────────────────
@router.get("/overview/{file_id}")
async def overview_endpoint(
    file_id: int,
    time_filter: str = Query("7d"),
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user)
):
    db_file = crud_files.get_file_by_id(db, file_id)
    df = load_df(db_file, current_user)

    for col in ["timestamp", "status_code", "requests"]:
        if col not in df.columns:
            raise HTTPException(status_code=422, detail=f"Missing required column: {col}")

    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df = df.dropna(subset=["timestamp"])

    # Use data's max date as reference (handles historical data)
    today = df["timestamp"].dt.date.max()
    days = parse_days(time_filter)
    start_date = today - timedelta(days=days - 1)

    df_filtered = df[df["timestamp"].dt.date.between(start_date, today)]

    total_requests = int(df_filtered["requests"].sum()) if not df_filtered.empty else int(df["requests"].sum())
    successful_requests = int(df_filtered[df_filtered["status_code"] == 200]["requests"].sum()) if not df_filtered.empty else 0
    errors = int(df_filtered[df_filtered["status_code"] != 200]["requests"].sum()) if not df_filtered.empty else 0
    avg_response_time = float(df_filtered["response_time"].mean()) if "response_time" in df_filtered.columns and not df_filtered.empty else None

    # Daily usage trend
    daily_stats = pd.DataFrame(columns=["date", "total_requests", "errors"])
    if not df_filtered.empty:
        daily_stats = (
            df_filtered.groupby(df_filtered["timestamp"].dt.date, as_index=False)
            .agg(
                total_requests=("requests", "sum"),
                errors=("status_code", lambda x: (x != 200).sum()),
            )
        )
        daily_stats = daily_stats.rename(columns={daily_stats.columns[0]: "date"})
        all_days = [d.date() for d in pd.date_range(start_date, today)]
        daily_stats = (
            daily_stats.set_index("date")
            .reindex(all_days, fill_value=0)
            .reset_index()
            .rename(columns={"index": "date"})
        )

    return {
        "total_requests": total_requests,
        "successful_requests": successful_requests,
        "errors": errors,
        "avg_response_time": avg_response_time,
        "daily_usage": [
            {
                "date": str(row["date"]),
                "total_requests": int(row["total_requests"]),
                "errors": int(row["errors"]),
            }
            for _, row in daily_stats.iterrows()
        ],
    }


# ── Analysis ──────────────────────────────────────────────────────────────────
@router.get("/analysis/{file_id}")
async def analysis_endpoint(
    file_id: int,
    time_filter: str = Query("7d"),
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user)
):
    db_file = crud_files.get_file_by_id(db, file_id)
    df = load_df(db_file, current_user)

    for col in ["endpoint", "requests", "status_code"]:
        if col not in df.columns:
            raise HTTPException(status_code=422, detail=f"Missing required column: {col}")

    # Apply time filter if timestamp exists
    if "timestamp" in df.columns:
        df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
        df = df.dropna(subset=["timestamp"])
        today = df["timestamp"].dt.date.max()
        days = parse_days(time_filter)
        start_date = today - timedelta(days=days - 1)
        df = df[df["timestamp"].dt.date.between(start_date, today)]

    top_5_consumed = (
        df.groupby("endpoint")["requests"].sum().nlargest(5).reset_index()
        .rename(columns={"requests": "total_requests"})
        .to_dict("records")
    )
    error_df = df[df["status_code"] != 200]
    apis_with_errors = (
        error_df.groupby("endpoint")["requests"].sum()
        .sort_values(ascending=False).reset_index()
        .rename(columns={"requests": "error_requests"})
        .to_dict("records")
    )
    return {
        "top_5_apis_by_consumption": top_5_consumed,
        "apis_with_most_errors": apis_with_errors,
    }


# ── Temporal ──────────────────────────────────────────────────────────────────
@router.get("/temporal/{file_id}")
async def temporal_endpoint(
    file_id: int,
    time_filter: str = Query("30d"),
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user)
):
    db_file = crud_files.get_file_by_id(db, file_id)
    df = load_df(db_file, current_user)

    for col in ["timestamp", "requests"]:
        if col not in df.columns:
            raise HTTPException(status_code=422, detail=f"Missing required column: {col}")

    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df = df.dropna(subset=["timestamp"])

    today = df["timestamp"].dt.date.max()
    days = parse_days(time_filter)
    start_date = today - timedelta(days=days - 1)
    df_filtered = df[df["timestamp"].dt.date.between(start_date, today)]

    daily_volume = (
        df_filtered.groupby(df_filtered["timestamp"].dt.date)["requests"]
        .sum().reset_index()
        .rename(columns={"timestamp": "date", "requests": "total_requests"})
    )
    daily_volume_list = [
        {"date": str(row["date"]), "total_requests": int(row["total_requests"])}
        for _, row in daily_volume.iterrows()
    ]

    df["hour"] = df["timestamp"].dt.hour
    hourly_dist = df.groupby("hour")["requests"].sum().reset_index()
    hourly_dist_list = [
        {"hour": int(row["hour"]), "total_requests": int(row["requests"])}
        for _, row in hourly_dist.iterrows()
    ]

    return {
        "daily_request_volume": daily_volume_list,
        "hourly_call_distribution": hourly_dist_list,
    }


# ── Clients ───────────────────────────────────────────────────────────────────
@router.get("/clients/{file_id}")
async def clients_endpoint(
    file_id: int,
    time_filter: str = Query("7d"),
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user)
):
    db_file = crud_files.get_file_by_id(db, file_id)
    df = load_df(db_file, current_user)

    for col in ["client_id", "requests"]:
        if col not in df.columns:
            raise HTTPException(status_code=422, detail=f"Missing required column: {col}")

    if "timestamp" in df.columns:
        df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
        df = df.dropna(subset=["timestamp"])
        today = df["timestamp"].dt.date.max()
        days = parse_days(time_filter)
        start_date = today - timedelta(days=days - 1)
        df = df[df["timestamp"].dt.date.between(start_date, today)]

    top_consumers = (
        df.groupby("client_id")["requests"].sum()
        .sort_values(ascending=False).reset_index()
        .rename(columns={"requests": "total_requests"})
        .to_dict("records")
    )
    return {"top_consumers": top_consumers}


# ── Distribution ──────────────────────────────────────────────────────────────
@router.get("/distribution/{file_id}")
async def distribution_endpoint(
    file_id: int,
    time_filter: str = Query("7d"),
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user)
):
    db_file = crud_files.get_file_by_id(db, file_id)
    df = load_df(db_file, current_user)

    if "timestamp" in df.columns:
        df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
        df = df.dropna(subset=["timestamp"])
        today = df["timestamp"].dt.date.max()
        days = parse_days(time_filter)
        start_date = today - timedelta(days=days - 1)
        df = df[df["timestamp"].dt.date.between(start_date, today)]

    def get_distribution(col, fallback=None):
        actual = fallback if fallback and fallback in df.columns and col not in df.columns else col
        if actual not in df.columns:
            return []
        dist = df[actual].value_counts().reset_index()
        dist.columns = [col, "count"]
        return dist.to_dict("records")

    return {
        "geographic_distribution": get_distribution("geo", "country"),
        "brand_distribution": get_distribution("brand"),
        "partner_distribution": get_distribution("partner"),
        "team_distribution": get_distribution("team"),
    }


# ── Rankings ──────────────────────────────────────────────────────────────────
@router.get("/rankings/{file_id}")
async def rankings_endpoint(
    file_id: int,
    time_filter: str = Query("7d"),
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user)
):
    db_file = crud_files.get_file_by_id(db, file_id)
    df = load_df(db_file, current_user)

    if "timestamp" in df.columns:
        df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
        df = df.dropna(subset=["timestamp"])
        today = df["timestamp"].dt.date.max()
        days = parse_days(time_filter)
        start_date = today - timedelta(days=days - 1)
        df = df[df["timestamp"].dt.date.between(start_date, today)]

    api_col = "endpoint" if "endpoint" in df.columns else "API NAME"

    clients = []
    if "client_id" in df.columns and "requests" in df.columns:
        clients = (
            df.groupby("client_id")["requests"].sum()
            .sort_values(ascending=False).head(20).reset_index()
            .rename(columns={"requests": "total_requests"})
            .to_dict("records")
        )

    apis = []
    if api_col in df.columns and "requests" in df.columns:
        apis = (
            df.groupby(api_col)["requests"].sum()
            .sort_values(ascending=False).head(20).reset_index()
            .rename(columns={"requests": "total_requests", api_col: "endpoint"})
            .to_dict("records")
        )

    failed_apis = []
    if api_col in df.columns and "status_code" in df.columns and "requests" in df.columns:
        error_df = df[df["status_code"] != 200]
        failed_apis = (
            error_df.groupby(api_col)["requests"].sum()
            .sort_values(ascending=False).head(20).reset_index()
            .rename(columns={"requests": "error_requests", api_col: "endpoint"})
            .to_dict("records")
        )

    return {
        "top_20_clients": clients,
        "top_20_apis_accessed": apis,
        "top_20_failed_apis": failed_apis,
    }