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

    # Define the 'files' relationship here
    # This indicates that an Audience can have many File objects
    files = relationship("File", back_populates="owner") # <-- THIS IS KEY

    def __repr__(self):
        return f"<Audience(id={self.id}, name='{self.name}', email='{self.email}')>"
