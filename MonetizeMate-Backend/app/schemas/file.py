from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class FileBase(BaseModel):
    filename: str

class FileCreate(FileBase):
    path: str
    displayname: str
    description: Optional[str] = None
    file_size: int
    file_type: str
    audience_id: int
    decisionMetrics: Optional[str] = None
    records: Optional[int] = None

class FilePublic(FileBase):
    id: int
    displayname: str
    description: Optional[str] = None
    file_size: int
    file_type: str
    audience_id: int
    upload_time: datetime
    decisionMetrics: Optional[str] = None
    records: Optional[int] = None

    class Config:
        from_attributes = True
        populate_by_name = True

        @classmethod
        def alias_generator(cls, field_name: str) -> str:
            return field_name