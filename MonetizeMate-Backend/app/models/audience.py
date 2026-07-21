from sqlalchemy import Column, Integer, String, Boolean
from app.database.database import Base
from sqlalchemy.orm import relationship

class Audience(Base):
    """
    SQLAlchemy model for the 'audiences' table.
    Represents an audience in the database.
    """
    __tablename__ = "audiences" # Define the table name

    # Define columns
    id = Column(Integer, primary_key=True, index=True) # Primary key, auto-incrementing
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True) # Audience's email, must be unique
    hashed_password = Column(String) # Hashed password string
    is_active = Column(Boolean, default=True) # Audience account status, default to active
    is_admin = Column(Boolean, default=False, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    company_name = Column(String, nullable=True)
    job_title = Column(String, nullable=True)
    department = Column(String, nullable=True)
    country = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    company_size = Column(String, nullable=True)
    annual_revenue = Column(String, nullable=True)
    api_maturity = Column(String, nullable=True)
    primary_objectives = Column(String, nullable=True)
    api_gateway = Column(String, nullable=True)
    apis_managed = Column(String, nullable=True)
    team_size = Column(String, nullable=True)
    analytics_consent = Column(Boolean, default=False, nullable=False)

    # Define the 'files' relationship here
    # This indicates that an Audience can have many File objects
    files = relationship("File", back_populates="owner") # <-- THIS IS KEY

    # Gateway connections relationship
    gateway_connections = relationship("GatewayConnection", back_populates="owner")

    # Business profiles relationship
    business_profiles = relationship("BusinessProfile", back_populates="owner")

    def __repr__(self):
        return f"<Audience(id={self.id}, name='{self.name}', email='{self.email}')>"




