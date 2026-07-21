from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.database import Base


class AdminActivity(Base):
    __tablename__ = "admin_activity"

    id = Column(Integer, primary_key=True, index=True)
    audience_id = Column(Integer, ForeignKey("audiences.id"), nullable=True, index=True)
    activity_type = Column(String, nullable=False, index=True)
    industry = Column(String, nullable=True, index=True)
    persona = Column(String, nullable=True)
    use_case = Column(String, nullable=True)
    strategy = Column(String, nullable=True)
    source = Column(String, nullable=True)
    answers_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    audience = relationship("Audience")
