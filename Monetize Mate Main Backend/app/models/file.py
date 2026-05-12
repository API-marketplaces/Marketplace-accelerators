from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base
from datetime import datetime

class File(Base):
    """
    SQLAlchemy model for the 'files' table.
    Stores metadata about uploaded files.
    """
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True) # Unique ID for the file record
    filename = Column(String, index=True, nullable=False) # Original filename
    path = Column(String, unique=True, nullable=False) # Full path to the file on disk
    displayname = Column(String, nullable=False)  # New column for display name
    description = Column(String, nullable=True)  # File description
    file_size = Column(Integer, nullable=False)  # File size in bytes
    file_type = Column(String, nullable=False)    # File MIME type
    decision_metrics = Column(String, nullable=True)  # Plain string for decision metrics (e.g., 'analytics', 'prediction', 'strategy')
    records = Column(Integer, nullable=True)  # Number of data records (rows) in the uploaded file
    audience_id = Column(Integer, ForeignKey("audiences.id"), nullable=False) # Foreign key to the user who uploaded it
    upload_time = Column(DateTime, default=datetime.utcnow, nullable=False) # Timestamp of upload

    # Define relationship with the User model
    owner = relationship("Audience", back_populates="files")
    
    def __repr__(self):
        return f"<File(id={self.id}, filename='{self.filename}', displayname='{self.displayname}', user_id={self.user_id})>"

