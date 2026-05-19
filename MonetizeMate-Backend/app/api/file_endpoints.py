import os
import uuid  # Add this import for generating unique identifiers
from fastapi import APIRouter, Depends, Form, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
from io import BytesIO
# Local imports from the application's modules
from app.database.database import get_db
from app.schemas.audience import AudienceResponse
from app.schemas.file import FilePublic
from app.crud import files as crud_files
from app.core.security import get_current_user
from app.core.config import settings

# Initialize the API router for file-related endpoints
router = APIRouter()

from fastapi import Body
@router.post("/uploadfile/", response_model=FilePublic, status_code=status.HTTP_201_CREATED)
async def upload_file(
    displayname: str = Form(),
    description: str = Form(""),
    file: UploadFile = File(...),
    decisionMetrics: str = Form(),
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user)
):
    """
    Uploads a single file to the server and records its metadata in the database.
    - Requires authentication.
    - Stores the file in the configured UPLOAD_DIRECTORY.
    - Returns the metadata of the uploaded file including its ID.
    """
    # Ensure the upload directory exists (use absolute path)
    upload_dir_abs = os.path.abspath(settings.UPLOAD_DIRECTORY)
    os.makedirs(upload_dir_abs, exist_ok=True)

    # Sanitize filename to prevent directory traversal issues
    orig_filename = os.path.basename(file.filename)
    unique_suffix = str(uuid.uuid4())
    name_part, file_extension = os.path.splitext(orig_filename)
    filename = f"{name_part}_{unique_suffix}{file_extension}"

    # ✅ FIX: Store as absolute path so os.path.exists() always resolves correctly
    # regardless of the working directory the backend process was launched from.
    file_location = os.path.abspath(os.path.join(settings.UPLOAD_DIRECTORY, filename))

    metrics = decisionMetrics  # Treat decisionMetrics as a plain string

    try:
        # Restrict allowed file types
        allowed_mime_types = [
            "text/csv",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ]
        allowed_extensions = [".csv", ".xls", ".xlsx"]
        if (file.content_type not in allowed_mime_types and file_extension.lower() not in allowed_extensions):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only CSV and Excel files are allowed."
            )

        # Save the file bytes to memory and get file size
        file_bytes = await file.read()
        metrics = decisionMetrics  # Treat as plain string, do not parse as JSON

        # Try to read the file into a DataFrame to count records (rows)
        def get_df():
            if file_extension.lower() == ".csv":
                return pd.read_csv(BytesIO(file_bytes))
            else:
                return pd.read_excel(BytesIO(file_bytes))

        try:
            df_for_count = get_df()
            records_count = int(len(df_for_count.index))
        except Exception:
            records_count = None

        # If analytics or prediction, validate template columns
        if metrics == "analytics":
            df = get_df()
            validate_analytics_template(df)
        elif metrics == "prediction":
            df = get_df()
            validate_prediction_template(df)
        elif metrics == "strategy":
            df = get_df()
            validate_strategy_template(df)

        with open(file_location, "wb") as buffer:
            buffer.write(file_bytes)
        file_size = len(file_bytes)
        file_type = file.content_type

        # Create a new file record in the database
        db_file = crud_files.create_file_record(
            db=db,
            filename=filename,
            filepath=file_location,   # absolute path stored here
            displayname=displayname,
            description=description,
            file_size=file_size,
            file_type=file_type,
            owner_id=current_user.id,
            decisionMetrics=metrics,
            records=records_count
        )
        return db_file
    except Exception as e:
        # Clean up the partially uploaded file if database record creation fails
        if os.path.exists(file_location):
            os.remove(file_location)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not upload file or record metadata: {e}"
        )

from fastapi import Query
@router.get("/files/", response_model=List[FilePublic])
async def list_files(
    decisionMetrics: str = Query(None, description="Filter by decisionMetrics (plain string, e.g. 'analytics', 'prediction', 'strategy')"),
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user)
):
    """
    Lists all uploaded files for the current user, fetched from the database.
    - Requires authentication.
    - Returns a list of file metadata (including IDs).
    """
    # Fetch files associated with the current user from the database
    files = crud_files.get_files_by_owner(db, current_user.id)
    # If decisionMetrics is provided, filter files in-memory by plain string match
    if decisionMetrics:
        files = [f for f in files if getattr(f, 'decisionMetrics', None) == decisionMetrics or getattr(f, 'decision_metrics', None) == decisionMetrics]
    return files

@router.get("/files/{file_id}")
async def serve_file(
    file_id: int, # Now fetching by ID
    db: Session = Depends(get_db), # Inject database session
    current_user: AudienceResponse = Depends(get_current_user) # Protect this endpoint
):
    """
    Serves a specific uploaded file by its ID.
    - Requires authentication.
    - Returns the file as a FileResponse.
    - Ensures the user owns the file before serving.
    """
    # Retrieve file metadata from the database using the file_id
    db_file = crud_files.get_file_by_id(db, file_id)
    if not db_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found in database")
    
    # Authorize: Ensure the current user is the owner of the file
    if db_file.audience_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this file")

    file_path = db_file.path # Use the stored file path

    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on disk (metadata exists)")
    
    # Ensure the file is within the allowed upload directory to prevent path traversal
    upload_dir_abs = os.path.abspath(settings.UPLOAD_DIRECTORY)
    if not os.path.abspath(file_path).startswith(upload_dir_abs):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file path")

    return FileResponse(path=file_path, filename=db_file.filename, media_type="application/octet-stream")

def validate_analytics_template(df):
    required_cols = ["timestamp", "endpoint", "client_id", "requests", "status_code"]
    missing = [col for col in required_cols if col not in df.columns]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Missing required columns for analytics: {', '.join(missing)}"
        )

def validate_prediction_template(df):
    required_fields = [
        {"name": "timestamp", "mappedKeys": ["date", "datetime", "time", "created_at", "timestamp"]},
        {"name": "request_count", "mappedKeys": ["requests", "request_count", "api_requests", "calls", "hits"]}
    ]
    missing = []
    for field in required_fields:
        if not any(col in df.columns for col in field["mappedKeys"]):
            missing.append(field["name"])
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Missing required columns for prediction: {', '.join(missing)}"
        )

def validate_strategy_template(df):
    allowed_answers = ["Yes", "No", "Maybe"]
    if set(df.columns) != {"question", "answer"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Strategy template must have exactly two columns: 'question' and 'answer'"
        )
    invalid_answers = df[~df["answer"].isin(allowed_answers)]["answer"].unique().tolist()
    if invalid_answers:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid answers found in strategy template: {', '.join(invalid_answers)}. Allowed answers are: {', '.join(allowed_answers)}"
        )