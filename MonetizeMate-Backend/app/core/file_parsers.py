import re
import json
import os
from datetime import datetime
import pandas as pd

# Regex patterns for matching date-times in typical text log formats
TIMESTAMP_PATTERN_1 = re.compile(
    r'\b([A-Z][a-z]{2})\s+(\d{1,2}),\s+(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)\b'
)
TIMESTAMP_PATTERN_2 = re.compile(
    r'\b(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{4}|Z)?)\b'
)


def try_parse_timestamp(line: str):
    """
    Search a log line for known date-time patterns and return a datetime object
    and the matching substring.
    """
    # 1. Look for Apr 07, 2025 8:16:02 AM
    m1 = TIMESTAMP_PATTERN_1.search(line)
    if m1:
        dt_str = m1.group(0)
        try:
            return datetime.strptime(dt_str, "%b %d, %Y %I:%M:%S %p"), dt_str
        except Exception:
            pass

    # 2. Look for ISO-like timestamps (e.g. 2025-04-07 08:16:04.461+0000)
    m2 = TIMESTAMP_PATTERN_2.search(line)
    if m2:
        dt_str = m2.group(0)
        try:
            # pd.to_datetime handles ISO, timezones, etc. nicely
            return pd.to_datetime(dt_str), dt_str
        except Exception:
            pass

    return None, None


def flatten_dict(d: dict, parent_key: str = '', sep: str = '_') -> dict:
    """Recursively flattens a nested dictionary."""
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)


def normalize_record(record: dict | str, index: int, default_time: datetime) -> dict:
    """
    Normalizes a log/JSON record into a flat dictionary with standardized fields
    needed by MonetizeMate's analytics and prediction modules.
    """
    flat = flatten_dict(record) if isinstance(record, dict) else {"message": str(record)}

    # 1. Normalize Timestamp
    timestamp = None
    for ts_key in ["@timestamp", "timestamp", "time", "date", "datetime", "created_at"]:
        if ts_key in flat and flat[ts_key]:
            try:
                timestamp = pd.to_datetime(flat[ts_key])
                break
            except Exception:
                pass

    if timestamp is None and "unixtime" in flat and flat["unixtime"]:
        try:
            timestamp = pd.to_datetime(float(flat["unixtime"]), unit="s")
        except Exception:
            pass

    if timestamp is None:
        # Stateful timestamp logic fallback: increment by index seconds
        timestamp = default_time + pd.Timedelta(seconds=index)

    # 2. Normalize Endpoint / API Name
    endpoint = None
    for ep_key in ["endpoint", "api_name", "api", "logger_name", "logger", "loggerName"]:
        if ep_key in flat and flat[ep_key]:
            endpoint = str(flat[ep_key])
            break
    if not endpoint:
        endpoint = "api_endpoint"

    # 3. Normalize Client ID / User ID
    client_id = None
    for c_key in ["client_id", "user_id", "client", "user", "clientId", "userId"]:
        if c_key in flat and flat[c_key]:
            client_id = str(flat[c_key])
            break
    if not client_id:
        client_id = "client_1"

    # 4. Normalize Status Code / Response Code / Log Level
    status_code = None
    for sc_key in ["status_code", "response_code", "status", "code", "statusCode", "responseCode"]:
        if sc_key in flat and flat[sc_key]:
            try:
                status_code = int(flat[sc_key])
                break
            except Exception:
                pass

    if status_code is None:
        level = None
        for lvl_key in ["level", "severity", "log_level"]:
            if lvl_key in flat and flat[lvl_key]:
                level = str(flat[lvl_key]).upper()
                break
        if level:
            if any(err in level for err in ["ERR", "FAIL", "WARN", "SEV"]):
                status_code = 500
            else:
                status_code = 200
        else:
            status_code = 200

    # 5. Normalize Requests / Call Count
    requests = None
    for req_key in ["requests", "request_count", "requestCount", "calls", "hits"]:
        if req_key in flat and flat[req_key]:
            try:
                requests = int(flat[req_key])
                break
            except Exception:
                pass
    if requests is None:
        requests = 1

    # 6. Normalize Other Optional/Machine Learning Metrics
    response_time = None
    for rt_key in ["response_time", "latency", "duration", "responseTime"]:
        if rt_key in flat and flat[rt_key]:
            try:
                response_time = float(flat[rt_key])
                break
            except Exception:
                pass
    if response_time is None:
        response_time = 0.0

    cpu_usage = None
    for cpu_key in ["cpu_usage", "cpu", "cpuUsage"]:
        if cpu_key in flat and flat[cpu_key]:
            try:
                cpu_usage = float(flat[cpu_key])
                break
            except Exception:
                pass
    if cpu_usage is None:
        cpu_usage = 0.0

    memory_usage = None
    for mem_key in ["memory_usage", "memory", "mem", "memoryUsage"]:
        if mem_key in flat and flat[mem_key]:
            try:
                memory_usage = float(flat[mem_key])
                break
            except Exception:
                pass
    if memory_usage is None:
        memory_usage = 0.0

    quota_limit = None
    for q_key in ["quota_limit", "quota", "quotaLimit"]:
        if q_key in flat and flat[q_key]:
            try:
                quota_limit = float(flat[q_key])
                break
            except Exception:
                pass
    if quota_limit is None:
        quota_limit = 1000.0

    current_usage = None
    for cu_key in ["current_usage", "usage", "currentUsage"]:
        if cu_key in flat and flat[cu_key]:
            try:
                current_usage = float(flat[cu_key])
                break
            except Exception:
                pass
    if current_usage is None:
        current_usage = 1.0

    rps = None
    for rps_key in ["rps", "requests_per_second"]:
        if rps_key in flat and flat[rps_key]:
            try:
                rps = float(flat[rps_key])
                break
            except Exception:
                pass
    if rps is None:
        rps = 1.0

    allowed_rps = None
    for ar_key in ["allowed_rps", "allowedRps"]:
        if ar_key in flat and flat[ar_key]:
            try:
                allowed_rps = float(flat[ar_key])
                break
            except Exception:
                pass
    if allowed_rps is None:
        allowed_rps = 100.0

    return {
        "timestamp": timestamp,
        "endpoint": endpoint,
        "client_id": client_id,
        "user_id": client_id,
        "requests": requests,
        "request_count": requests,
        "status_code": status_code,
        "response_code": status_code,
        "response_time": response_time,
        "cpu_usage": cpu_usage,
        "memory_usage": memory_usage,
        "quota_limit": quota_limit,
        "current_usage": current_usage,
        "rps": rps,
        "allowed_rps": allowed_rps
    }


def load_log_or_json_to_df(file_path: str) -> pd.DataFrame:
    """
    Parses a log or json file (JSON-lines or standard JSON or raw text log file)
    and returns a fully normalized pandas DataFrame.
    """
    ext = os.path.splitext(file_path)[1].lower()
    records = []

    # 1. If JSON extension, try standard JSON first
    if ext == ".json":
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    records = data
                elif isinstance(data, dict):
                    records = [data]
        except Exception:
            pass  # Fail back to reading line by line

    # 2. Line by line reading (useful for NDJSON and text log files)
    if not records:
        current_timestamp = None
        current_logger = None

        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            for line in f:
                line_str = line.strip()
                if not line_str:
                    continue

                # A. Try parsing the line as a JSON object
                try:
                    parsed_json = json.loads(line_str)
                    records.append(parsed_json)
                    # If this line has timestamp info, capture it as state
                    for ts_key in ["@timestamp", "timestamp", "time"]:
                        if ts_key in parsed_json and parsed_json[ts_key]:
                            try:
                                current_timestamp = pd.to_datetime(parsed_json[ts_key])
                                break
                            except Exception:
                                pass
                    if "logger_name" in parsed_json:
                        current_logger = parsed_json["logger_name"]
                    continue
                except Exception:
                    pass

                # B. Textual log parsing with stateful fallback
                parsed_dt, dt_str = try_parse_timestamp(line_str)
                if parsed_dt:
                    current_timestamp = parsed_dt
                    # Extract logger from text remainder
                    remaining = line_str.replace(dt_str, "").strip()
                    parts = remaining.split()
                    if parts:
                        current_logger = parts[0]
                    records.append({
                        "timestamp": current_timestamp,
                        "logger_name": current_logger,
                        "message": remaining
                    })
                else:
                    # Check if line matches "LEVEL: message"
                    level_match = re.match(r'^([A-Z]+):\s*(.*)$', line_str)
                    if level_match:
                        level = level_match.group(1)
                        message = level_match.group(2)
                        records.append({
                            "timestamp": current_timestamp,
                            "level": level,
                            "logger_name": current_logger,
                            "message": message
                        })
                    else:
                        records.append({
                            "timestamp": current_timestamp,
                            "logger_name": current_logger,
                            "message": line_str
                        })

    # 3. Normalize all records
    default_time = datetime.utcnow()
    normalized_records = [
        normalize_record(rec, idx, default_time) for idx, rec in enumerate(records)
    ]

    if not normalized_records:
        return pd.DataFrame(columns=[
            "timestamp", "endpoint", "client_id", "user_id", "requests", "request_count",
            "status_code", "response_code", "response_time", "cpu_usage", "memory_usage",
            "quota_limit", "current_usage", "rps", "allowed_rps"
        ])

    return pd.DataFrame(normalized_records)
