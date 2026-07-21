from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base
from datetime import datetime


class GatewayConnection(Base):
    """
    SQLAlchemy model for the 'gateway_connections' table.
    Stores API gateway source connections per user.
    """
    __tablename__ = "gateway_connections"

    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String, nullable=False)           # "azure" | "apigee" | "kong"
    name = Column(String, nullable=False)               # User-defined connection name
    description = Column(String, nullable=True)
    status = Column(String, default="connected", nullable=False)
    audience_id = Column(Integer, ForeignKey("audiences.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("Audience", back_populates="gateway_connections")

    def __repr__(self):
        return f"<GatewayConnection(id={self.id}, name='{self.name}', provider='{self.provider}')>"
