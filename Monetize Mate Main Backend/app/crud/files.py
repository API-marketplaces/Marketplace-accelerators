from sqlalchemy.orm import Session
from app.models import file as models
from app.schemas.file import FileCreate
from datetime import datetime

def create_file_record(db: Session, filename: str, filepath: str, displayname: str, description: str, file_size: int, file_type: str, owner_id: int, decisionMetrics: str, records: int = None):
    """
    Creates a new file metadata record in the database.
    """
    db_file = models.File(
        filename=filename,
        path=filepath,
        displayname=displayname,  # Store display name
        description=description,  # Store description
        file_size=file_size,      # Store file size
        file_type=file_type,      # Store file type
        audience_id=owner_id,
        upload_time=datetime.utcnow(),
    decision_metrics=decisionMetrics,
    records=records
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file

def get_file_by_id(db: Session, file_id: int):
    """
    Retrieves a single file metadata record by its ID.
    """
    file = db.query(models.File).filter(models.File.id == file_id).first()
    if file and file.decision_metrics:
        file.decisionMetrics = file.decision_metrics
    else:
        file.decisionMetrics = None
    return file

def get_files_by_owner(db: Session, owner_id: int, skip: int = 0, limit: int = 100):
    """
    Retrieves a list of file metadata records for a specific owner.
    """
    files = db.query(models.File).filter(models.File.audience_id == owner_id).offset(skip).limit(limit).all()
    for file in files:
        if file.decision_metrics:
            file.decisionMetrics = file.decision_metrics
        else:
            file.decisionMetrics = None
    return files

def delete_file_record(db: Session, file_id: int):
    """
    Deletes a file metadata record from the database.
    Returns the deleted record if found, otherwise None.
    """
    db_file = db.query(models.File).filter(models.File.id == file_id).first()
    if db_file:
        db.delete(db_file)
        db.commit()
    return db_file
