from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base


class BusinessProfile(Base):
    """
    SQLAlchemy model for the 'business_profiles' table.
    Stores a categorized business profile (Business Model, Customers, APIs,
    Revenue, Technology, Objectives) per user so it can be created, edited,
    retrieved, and reused across assessments instead of re-entered every time.
    """
    __tablename__ = "business_profiles"

    id = Column(Integer, primary_key=True, index=True)
    audience_id = Column(Integer, ForeignKey("audiences.id"), nullable=False)
    profile_name = Column(String, nullable=False)

    business_model = Column(JSON, nullable=False, default=dict)
    customers = Column(JSON, nullable=False, default=dict)
    apis = Column(JSON, nullable=False, default=dict)
    revenue = Column(JSON, nullable=False, default=dict)
    technology = Column(JSON, nullable=False, default=dict)
    objectives = Column(JSON, nullable=False, default=dict)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    owner = relationship("Audience", back_populates="business_profiles")

    def __repr__(self):
        return f"<BusinessProfile(id={self.id}, profile_name='{self.profile_name}')>"
