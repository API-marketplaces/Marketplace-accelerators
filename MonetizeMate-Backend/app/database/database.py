from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Database URL from settings (e.g., "sqlite:///./sql_app.db")
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Create the SQLAlchemy engine
# connect_args={"check_same_thread": False} is required for SQLite
# to allow multiple threads to interact with the database.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)

# Create a SessionLocal class for database sessions
# autocommit=False ensures transactions are explicitly committed.
# autoflush=False ensures objects are not flushed to the database until commit.
# bind=engine connects the session to the database engine.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for declarative models
Base = declarative_base()

def get_db():
    """
    Dependency function to get a database session.
    - Creates a new session.
    - Yields the session to the caller.
    - Ensures the session is closed after the request is finished.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """
    Creates all database tables defined in the models.
    This function should be called once to initialize the database schema.
    """
    # Import models to ensure they are registered with Base.metadata
    # This ensures SQLAlchemy knows about the User table when creating tables.
    from app.models import audience
    Base.metadata.create_all(bind=engine)

