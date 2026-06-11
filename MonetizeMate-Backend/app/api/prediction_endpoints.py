from sklearn.linear_model import LogisticRegression
# --- Error Type Classification Endpoint ---
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import json
from sklearn.ensemble import IsolationForest
import numpy as np
# Initialize the API router for dashboard-related endpoints
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.security import get_current_user
from app.database.database import get_db
from app.schemas.audience import AudienceResponse
from app.crud import files as crud_files
from app.core.config import settings
import pandas as pd
import os
from sqlalchemy.orm import Session
from sklearn.linear_model import LinearRegression
import joblib
from datetime import date, timedelta

router = APIRouter()

# --- Helper Function for Feature Engineering ---
def create_features(df):
    """Creates time-series features from a datetime index."""
    df_featured = df.copy()
    df_featured['Date'] = pd.to_datetime(df_featured['Date'])
    df_featured['DayOfYear'] = df_featured['Date'].dt.dayofyear
    df_featured['DayOfWeek'] = df_featured['Date'].dt.dayofweek
    df_featured['Month'] = df_featured['Date'].dt.month
    df_featured['Year'] = df_featured['Date'].dt.year
    return df_featured


def _read_dataframe(file_path: str) -> pd.DataFrame:
    ext = os.path.splitext(file_path)[1].lower()
    if ext in [".json", ".log"]:
        from app.core.file_parsers import load_log_or_json_to_df
        return load_log_or_json_to_df(file_path)
    elif ext == ".xlsx":
        return pd.read_excel(file_path)
    else:
        return pd.read_csv(file_path)

# --- Anomaly Detection Endpoint ---
@router.get("/anomalies/{file_id}", summary="Detect anomalies in prediction data")
async def detect_anomalies(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user)
):
    """
    Detects anomalies in prediction data using Isolation Forest.
    Returns the top 10 most anomalous data points.
    """
    # Retrieve file metadata from the database using the file_id
    db_file = crud_files.get_file_by_id(db, file_id)
    if not db_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found in database")
    # Authorize: Ensure the current user is the owner of the file
    if db_file.audience_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this file")
    # Check decisionMetrics
    if getattr(db_file, "decisionMetrics", getattr(db_file, "decision_metrics", None)) != "prediction":
        raise HTTPException(status_code=400, detail="File is not of 'prediction' type.")
    file_path = db_file.path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on disk (metadata exists)")
    if not os.path.abspath(file_path).startswith(os.path.abspath(settings.UPLOAD_DIRECTORY)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file path")
    # Read the file
    df = _read_dataframe(file_path)
    # Select relevant features
    feature_cols = ["request_count", "response_time", "cpu_usage", "memory_usage"]
    error_col = None
    for col in df.columns:
        if "error" in col.lower() and "code" in col.lower():
            error_col = col
            break
    if error_col:
        feature_cols.append(error_col)
    missing = [col for col in feature_cols if col not in df.columns]
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing required columns: {', '.join(missing)}")
    X = df[feature_cols].fillna(0)
    # Fit Isolation Forest
    model = IsolationForest(n_estimators=100, contamination=0.01, random_state=42)
    preds = model.fit_predict(X)
    # Anomaly score (lower means more anomalous)
    scores = model.decision_function(X)
    # Get top 10 anomalies (lowest scores)
    anomaly_indices = np.argsort(scores)[:10]
    anomalies = df.iloc[anomaly_indices].copy()
    anomalies["anomaly_score"] = scores[anomaly_indices]

    # Calculate thresholds for each feature (95th percentile for high, 5th for low)
    thresholds = {}
    for col in feature_cols:
        thresholds[col] = {
            "high": X[col].quantile(0.95),
            "low": X[col].quantile(0.05)
        }

    # Helper to classify anomaly type and reason
    def classify_anomaly(row):
        reasons = []
        types = []
        if row["request_count"] > thresholds["request_count"]["high"]:
            types.append("request_spike")
            reasons.append(f"Unusually high request_count: {row['request_count']}")
        if row["response_time"] > thresholds["response_time"]["high"]:
            types.append("latency_spike")
            reasons.append(f"Unusually high response_time: {row['response_time']}")
        if row["cpu_usage"] > thresholds["cpu_usage"]["high"]:
            types.append("resource_spike")
            reasons.append(f"Unusually high cpu_usage: {row['cpu_usage']}")
        if row["memory_usage"] > thresholds["memory_usage"]["high"]:
            types.append("resource_spike")
            reasons.append(f"Unusually high memory_usage: {row['memory_usage']}")
        if error_col and row[error_col] > thresholds[error_col]["high"]:
            types.append("error_spike")
            reasons.append(f"Unusually high {error_col}: {row[error_col]}")
        if not types:
            types.append("other")
            reasons.append("Anomalous pattern detected by model, but no single feature is extreme.")
        return {"type": ", ".join(types), "reason": "; ".join(reasons)}

    # Annotate anomalies with type and reason
    anomaly_records = []
    for _, row in anomalies.iterrows():
        record = row.to_dict()
        classification = classify_anomaly(row)
        record["type"] = classification["type"]
        record["reason"] = classification["reason"]
        anomaly_records.append(record)

    # Group anomalies by type
    grouped = {}
    for record in anomaly_records:
        for t in record["type"].split(", "):
            grouped.setdefault(t, []).append(record)

    return {"anomalies_by_type": grouped, "top_anomalies": anomaly_records}

# --- Peak Usage Period Identification Endpoint ---
@router.get("/peak-usage/{file_id}", summary="Identify peak usage periods in prediction data")
async def peak_usage_periods(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user)
):
    """
    Identifies peak usage periods (by day of week and hour) for a prediction file.
    Returns a table of mean and median request_count for each (day_of_week, hour) group.
    """
    # Retrieve file metadata from the database using the file_id
    db_file = crud_files.get_file_by_id(db, file_id)
    if not db_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found in database")
    # Authorize: Ensure the current user is the owner of the file
    if db_file.audience_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this file")
    # Check decisionMetrics
    if getattr(db_file, "decisionMetrics", getattr(db_file, "decision_metrics", None)) != "prediction":
        raise HTTPException(status_code=400, detail="File is not of 'prediction' type.")
    file_path = db_file.path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on disk (metadata exists)")
    if not os.path.abspath(file_path).startswith(os.path.abspath(settings.UPLOAD_DIRECTORY)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file path")
    # Read the file
    df = _read_dataframe(file_path)
    # Check required columns
    for col in ["timestamp", "request_count"]:
        if col not in df.columns:
            raise HTTPException(status_code=422, detail=f"Missing required column: {col}")
    # Parse timestamp
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df = df.dropna(subset=["timestamp"])
    df["hour"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.dayofweek  # 0=Monday, 6=Sunday
    grouped = df.groupby(["day_of_week", "hour"])["request_count"].agg(["mean", "median", "sum", "count"]).reset_index()
    # Sort by mean request_count descending to show busiest periods first
    grouped = grouped.sort_values(by="mean", ascending=False)
    # Format output
    result = grouped.to_dict(orient="records")
    return {"peak_usage_periods": result}


@router.get("/error-type-classification/{file_id}", summary="Classify error types in prediction data")
async def error_type_classification(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user)
):
    """
    Trains a Random Forest classifier to predict error type (response_code) based on system state.
    Returns model accuracy, feature importances, and sample predictions.
    """
    # Retrieve file metadata from the database using the file_id
    db_file = crud_files.get_file_by_id(db, file_id)
    if not db_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found in database")
    # Authorize: Ensure the current user is the owner of the file
    if db_file.audience_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this file")
    # Check decisionMetrics
    if getattr(db_file, "decisionMetrics", getattr(db_file, "decision_metrics", None)) != "prediction":
        raise HTTPException(status_code=400, detail="File is not of 'prediction' type.")
    file_path = db_file.path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on disk (metadata exists)")
    if not os.path.abspath(file_path).startswith(os.path.abspath(settings.UPLOAD_DIRECTORY)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file path")
    # Read the file
    df = _read_dataframe(file_path)
    # Check required columns
    required_cols = ["response_code", "request_count", "cpu_usage", "memory_usage", "endpoint", "user_id"]
    missing = [col for col in required_cols if col not in df.columns]
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing required columns: {', '.join(missing)}")
    # Filter to error rows
    df_error = df[df["response_code"] >= 400].copy()
    if df_error.empty:
        raise HTTPException(status_code=422, detail="No error rows (response_code >= 400) found in the file.")
    # One-hot encode categorical features
    X = df_error[["request_count", "cpu_usage", "memory_usage", "endpoint", "user_id"]].copy()
    X = pd.get_dummies(X, columns=["endpoint", "user_id"], drop_first=True)
    y = df_error["response_code"]
    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    # Train Random Forest
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)
    # Feature importances
    importances = dict(zip(X.columns, clf.feature_importances_))
    # Sample predictions
    sample_preds = []
    for i in range(min(10, len(y_test))):
        idx = y_test.index[i]
        sample_preds.append({
            "features": X_test.iloc[i].to_dict(),
            "true_response_code": int(y_test.iloc[i]),
            "predicted_response_code": int(y_pred[i])
        })
    return {
        "train_accuracy": acc,
        "classification_report": report,
        "feature_importances": importances,
        "sample_predictions": sample_preds
    }
    
    # --- Quota Limit Exceedance Endpoint ---


@router.get("/quota-limit-exceedance/{file_id}", summary="Predict quota limit exceedance for users")
async def quota_limit_exceedance(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user)
):
    """
    Predicts if a user will exceed their API quota within a day using Logistic Regression.
    Returns model accuracy, feature importances, and sample predictions.
    """
    # Retrieve file metadata from the database using the file_id
    db_file = crud_files.get_file_by_id(db, file_id)
    if not db_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found in database")
    # Authorize: Ensure the current user is the owner of the file
    if db_file.audience_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this file")
    # Check decisionMetrics
    if getattr(db_file, "decisionMetrics", getattr(db_file, "decision_metrics", None)) != "prediction":
        raise HTTPException(status_code=400, detail="File is not of 'prediction' type.")
    file_path = db_file.path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on disk (metadata exists)")
    if not os.path.abspath(file_path).startswith(os.path.abspath(settings.UPLOAD_DIRECTORY)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file path")
    # Read the file
    df = _read_dataframe(file_path)
    # Check required columns
    required_cols = ["current_usage", "quota_limit", "rps", "timestamp", "user_id"]
    missing = [col for col in required_cols if col not in df.columns]
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing required columns: {', '.join(missing)}")
    # Parse timestamp
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df = df.dropna(subset=["timestamp"])
    df["date"] = df["timestamp"].dt.date
    df["hour_of_day"] = df["timestamp"].dt.hour
    df["percentage_of_quota_used"] = df["current_usage"] / df["quota_limit"]
    # Calculate requests in last hour for each user
    df = df.sort_values(["user_id", "timestamp"])
    df["requests_in_last_hour"] = df.groupby("user_id")["current_usage"].diff().fillna(0)
    # For each user and day, determine if quota was ever exceeded
    exceed_df = df.groupby(["user_id", "date"]).apply(lambda g: int((g["current_usage"] > g["quota_limit"]).any())).reset_index()
    exceed_df.columns = ["user_id", "date", "will_exceed_quota"]
    # Merge back to main df
    df = df.merge(exceed_df, on=["user_id", "date"], how="left")
    # Prepare features and target
    feature_cols = ["current_usage", "quota_limit", "rps", "hour_of_day", "percentage_of_quota_used", "requests_in_last_hour", "user_id"]
    X = df[feature_cols].copy()
    X = pd.get_dummies(X, columns=["user_id"], drop_first=True)
    y = df["will_exceed_quota"]
    # Remove rows with missing target
    mask = y.notnull()
    X = X[mask]
    y = y[mask]
    # Train/test split
    from sklearn.model_selection import train_test_split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    # Train Logistic Regression
    clf = LogisticRegression(max_iter=1000)
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)
    from sklearn.metrics import accuracy_score, classification_report
    acc = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)
    # Feature importances (coefficients)
    importances = dict(zip(X.columns, clf.coef_[0]))
    # Sample predictions
    sample_preds = []
    # Get feature importances for explanation
    feature_names = list(X.columns)
    importances_arr = clf.coef_[0]
    for i in range(min(10, len(y_test))):
        features = X_test.iloc[i].to_dict()
        pred = int(y_pred[i])
        # Find top contributing features
        top_features = sorted(zip(feature_names, importances_arr, [features.get(f, 0) for f in feature_names]), key=lambda x: abs(x[1]*x[2]), reverse=True)[:3]
        reason_parts = []
        for fname, imp, val in top_features:
            if abs(imp) > 0.01:
                direction = "high" if imp * val > 0 else "low"
                reason_parts.append(f"{fname} is {direction} ({val:.2f})")
        reason = "; ".join(reason_parts) if reason_parts else "Typical usage pattern."
        sample_preds.append({
            "features": features,
            "true_will_exceed_quota": int(y_test.iloc[i]),
            "predicted_will_exceed_quota": pred,
            "reason": reason
        })
    return {
        "train_accuracy": acc,
        "classification_report": report,
        "feature_importances": importances,
        "sample_predictions": sample_preds
    }
    
    # --- Future Request Volume Prediction Endpoint ---


@router.get("/predict-future-volume/{file_id}", summary="Predict future request volume for a file")
async def predict_future_request_volume(
    file_id: int,
    days: int = Query(7, description="Number of future days to predict (default: 7)"),
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user)
):
    """
    Predicts future request volume for a file using Linear Regression with time features.
    Returns predicted request_count for the next N days.
    """
    # Retrieve file metadata from the database using the file_id
    db_file = crud_files.get_file_by_id(db, file_id)
    if not db_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found in database")
    # Authorize: Ensure the current user is the owner of the file
    if db_file.audience_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this file")
    # Check decisionMetrics
    if getattr(db_file, "decisionMetrics", getattr(db_file, "decision_metrics", None)) != "prediction":
        raise HTTPException(status_code=400, detail="File is not of 'prediction' type.")
    file_path = db_file.path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on disk (metadata exists)")
    if not os.path.abspath(file_path).startswith(os.path.abspath(settings.UPLOAD_DIRECTORY)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file path")
    # Read the file
    df = _read_dataframe(file_path)
    # Check required columns
    for col in ["timestamp", "request_count"]:
        if col not in df.columns:
            raise HTTPException(status_code=422, detail=f"Missing required column: {col}")
    # Parse timestamp
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df = df.dropna(subset=["timestamp"])
    # Aggregate by day
    daily = df.groupby(df["timestamp"].dt.date)["request_count"].sum().reset_index()
    daily = daily.rename(columns={"timestamp": "date", "request_count": "total_requests"})
    # Feature engineering: day number
    daily["day_num"] = (pd.to_datetime(daily["date"]) - pd.to_datetime(daily["date"]).min()).dt.days
    X = daily[["day_num"]]
    y = daily["total_requests"]
    # Train Linear Regression
    model = LinearRegression()
    model.fit(X, y)
    # Predict for future days
    last_day = daily["day_num"].max()
    future_days = [last_day + i for i in range(1, days + 1)]
    future_dates = [pd.to_datetime(daily["date"]).min() + pd.Timedelta(days=int(d)) for d in future_days]
    X_future = pd.DataFrame({"day_num": future_days})
    y_pred = model.predict(X_future)
    # Format response
    predictions = [
        {"date": d.strftime("%Y-%m-%d"), "predicted_request_count": int(max(0, round(p)))}
        for d, p in zip(future_dates, y_pred)
    ]
    return {
        "predictions": predictions,
        "model": "Linear Regression",
        "history_days": int(last_day + 1),
        "predicted_days": days
    }
    
    # --- Rate Limit Prediction Endpoint ---


@router.get("/rate-limit-prediction/{file_id}", summary="Predict rate limit exceedance for users")
async def rate_limit_prediction(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user)
):
    """
    Predicts if a user is likely to hit their rate limit (rps > allowed_rps) soon.
    Returns predictions for each user with probability and explanation.
    """
    # Retrieve file metadata from the database using the file_id
    db_file = crud_files.get_file_by_id(db, file_id)
    if not db_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found in database")
    # Authorize: Ensure the current user is the owner of the file
    if db_file.audience_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this file")
    # Check decisionMetrics
    if getattr(db_file, "decisionMetrics", getattr(db_file, "decision_metrics", None)) != "prediction":
        raise HTTPException(status_code=400, detail="File is not of 'prediction' type.")
    file_path = db_file.path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on disk (metadata exists)")
    if not os.path.abspath(file_path).startswith(os.path.abspath(settings.UPLOAD_DIRECTORY)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file path")
    # Read the file
    df = _read_dataframe(file_path)
    # Check required columns
    required_cols = ["user_id", "timestamp", "rps", "allowed_rps"]
    missing = [col for col in required_cols if col not in df.columns]
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing required columns: {', '.join(missing)}")
    # Parse timestamp
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df = df.dropna(subset=["timestamp"])
    # Create target: will_exceed_rate_limit in next time window (e.g., next hour)
    df = df.sort_values(["user_id", "timestamp"])
    df["will_exceed_rate_limit"] = (df["rps"] > df["allowed_rps"]).astype(int)
    # Feature engineering: hour_of_day, recent_rps_mean, recent_rps_max
    df["hour_of_day"] = df["timestamp"].dt.hour
    df["recent_rps_mean"] = df.groupby("user_id")["rps"].rolling(window=3, min_periods=1).mean().reset_index(level=0, drop=True)
    df["recent_rps_max"] = df.groupby("user_id")["rps"].rolling(window=3, min_periods=1).max().reset_index(level=0, drop=True)
    # Prepare features and target
    feature_cols = ["rps", "allowed_rps", "hour_of_day", "recent_rps_mean", "recent_rps_max", "user_id"]
    X = df[feature_cols].copy()
    X = pd.get_dummies(X, columns=["user_id"], drop_first=True)
    y = df["will_exceed_rate_limit"]
    # Remove rows with missing target
    mask = y.notnull()
    X = X[mask]
    y = y[mask]
    # Train/test split
    from sklearn.model_selection import train_test_split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    # Train Logistic Regression
    from sklearn.linear_model import LogisticRegression
    clf = LogisticRegression(max_iter=1000)
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)[:, 1]
    from sklearn.metrics import accuracy_score, classification_report
    acc = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)
    # Feature importances (coefficients)
    importances = dict(zip(X.columns, clf.coef_[0]))
    # Sample predictions with explanation
    sample_preds = []
    feature_names = list(X.columns)
    importances_arr = clf.coef_[0]
    for i in range(min(10, len(y_test))):
        features = X_test.iloc[i].to_dict()
        pred = int(y_pred[i])
        prob = float(y_prob[i])
        # Find top contributing features
        top_features = sorted(zip(feature_names, importances_arr, [features.get(f, 0) for f in feature_names]), key=lambda x: abs(x[1]*x[2]), reverse=True)[:3]
        reason_parts = []
        for fname, imp, val in top_features:
            if abs(imp) > 0.01:
                direction = "high" if imp * val > 0 else "low"
                reason_parts.append(f"{fname} is {direction} ({val:.2f})")
        reason = "; ".join(reason_parts) if reason_parts else "Typical usage pattern."
        sample_preds.append({
            "features": features,
            "true_will_exceed_rate_limit": int(y_test.iloc[i]),
            "predicted_will_exceed_rate_limit": pred,
            "probability": prob,
            "reason": reason
        })
    return {
        "train_accuracy": acc,
        "classification_report": report,
        "feature_importances": importances,
        "sample_predictions": sample_preds
    }
    
    # --- Resource Usage Prediction Endpoint ---


@router.get("/predict-resource-usage/{file_id}", summary="Predict future resource usage for a file")
async def predict_resource_usage(
    file_id: int,
    periods: int = Query(7, description="Number of future periods (days) to predict (default: 7)"),
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user)
):
    """
    Predicts future cpu_usage and memory_usage for a file using Linear Regression with time features.
    Returns predicted values for the next N days.
    """
    # Retrieve file metadata from the database using the file_id
    db_file = crud_files.get_file_by_id(db, file_id)
    if not db_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found in database")
    # Authorize: Ensure the current user is the owner of the file
    if db_file.audience_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this file")
    # Check decisionMetrics
    if getattr(db_file, "decisionMetrics", getattr(db_file, "decision_metrics", None)) != "prediction":
        raise HTTPException(status_code=400, detail="File is not of 'prediction' type.")
    file_path = db_file.path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on disk (metadata exists)")
    if not os.path.abspath(file_path).startswith(os.path.abspath(settings.UPLOAD_DIRECTORY)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file path")
    # Read the file
    df = _read_dataframe(file_path)
    # Check required columns
    for col in ["timestamp", "cpu_usage", "memory_usage"]:
        if col not in df.columns:
            raise HTTPException(status_code=422, detail=f"Missing required column: {col}")
    # Parse timestamp
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df = df.dropna(subset=["timestamp"])
    # Aggregate by day
    daily = df.groupby(df["timestamp"].dt.date)[["cpu_usage", "memory_usage"]].mean().reset_index()
    daily = daily.rename(columns={"timestamp": "date"})
    # Feature engineering: day number
    daily["day_num"] = (pd.to_datetime(daily["date"]) - pd.to_datetime(daily["date"]).min()).dt.days
    X = daily[["day_num"]]
    y_cpu = daily["cpu_usage"]
    y_mem = daily["memory_usage"]
    # Train Linear Regression for each resource
    model_cpu = LinearRegression()
    model_cpu.fit(X, y_cpu)
    model_mem = LinearRegression()
    model_mem.fit(X, y_mem)
    # Predict for future days
    last_day = daily["day_num"].max()
    future_days = [last_day + i for i in range(1, periods + 1)]
    future_dates = [pd.to_datetime(daily["date"]).min() + pd.Timedelta(days=int(d)) for d in future_days]
    X_future = pd.DataFrame({"day_num": future_days})
    cpu_pred = model_cpu.predict(X_future)
    mem_pred = model_mem.predict(X_future)
    # Format response
    predictions = [
        {
            "date": d.strftime("%Y-%m-%d"),
            "predicted_cpu_usage": float(round(max(0, c), 2)),
            "predicted_memory_usage": float(round(max(0, m), 2))
        }
        for d, c, m in zip(future_dates, cpu_pred, mem_pred)
    ]
    return {
        "predictions": predictions,
        "model": "Linear Regression",
        "history_days": int(last_day + 1),
        "predicted_days": periods
    }
    
    # --- User Behavior & Usage Patterns Endpoint ---


@router.get("/user-behavior-patterns/{file_id}", summary="Summarize user behavior and usage patterns")
async def user_behavior_patterns(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user)
):
    """
    Summarizes user behavior and usage patterns for a prediction file.
    Returns per-user stats: avg/median requests, peak usage, top endpoints, error rate.
    """
    # Retrieve file metadata from the database using the file_id
    db_file = crud_files.get_file_by_id(db, file_id)
    if not db_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found in database")
    # Authorize: Ensure the current user is the owner of the file
    if db_file.audience_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this file")
    # Check decisionMetrics
    if getattr(db_file, "decisionMetrics", getattr(db_file, "decision_metrics", None)) != "prediction":
        raise HTTPException(status_code=400, detail="File is not of 'prediction' type.")
    file_path = db_file.path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on disk (metadata exists)")
    if not os.path.abspath(file_path).startswith(os.path.abspath(settings.UPLOAD_DIRECTORY)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file path")
    # Read the file
    df = _read_dataframe(file_path)
    # Check required columns
    required_cols = ["user_id", "timestamp", "request_count", "endpoint", "response_code"]
    missing = [col for col in required_cols if col not in df.columns]
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing required columns: {', '.join(missing)}")
    # Parse timestamp
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df = df.dropna(subset=["timestamp"])
    df["hour"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.dayofweek
    # Group by user
    user_stats = {}
    for user, group in df.groupby("user_id"):
        avg_requests_per_day = group.groupby(group["timestamp"].dt.date)["request_count"].mean().mean()
        median_requests_per_day = group.groupby(group["timestamp"].dt.date)["request_count"].sum().median()
        avg_requests_per_hour = group.groupby("hour")["request_count"].mean().mean()
        peak_hour = group.groupby("hour")["request_count"].sum().idxmax()
        peak_day = group.groupby("day_of_week")["request_count"].sum().idxmax()
        top_endpoints = group["endpoint"].value_counts().head(3).index.tolist()
        error_rate = (group["response_code"] >= 400).mean()
        user_stats[user] = {
            "avg_requests_per_day": float(round(avg_requests_per_day, 2)),
            "median_requests_per_day": float(round(median_requests_per_day, 2)),
            "avg_requests_per_hour": float(round(avg_requests_per_hour, 2)),
            "peak_usage_hour": int(peak_hour),
            "peak_usage_day_of_week": int(peak_day),
            "top_endpoints": top_endpoints,
            "error_rate": float(round(error_rate, 3))
        }
    return {"user_behavior_patterns": user_stats}