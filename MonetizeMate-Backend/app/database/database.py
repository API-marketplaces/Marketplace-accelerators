from sqlalchemy import create_engine, inspect, text
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
    import app.models
    Base.metadata.create_all(bind=engine)
    ensure_admin_schema()
    ensure_admin_user()


def ensure_admin_schema():
    inspector = inspect(engine)
    if "audiences" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("audiences")}
    column_definitions = {
        "is_admin": "BOOLEAN DEFAULT FALSE NOT NULL",
        "first_name": "VARCHAR",
        "last_name": "VARCHAR",
        "company_name": "VARCHAR",
        "job_title": "VARCHAR",
        "department": "VARCHAR",
        "country": "VARCHAR",
        "industry": "VARCHAR",
        "company_size": "VARCHAR",
        "annual_revenue": "VARCHAR",
        "api_maturity": "VARCHAR",
        "primary_objectives": "VARCHAR",
        "api_gateway": "VARCHAR",
        "apis_managed": "VARCHAR",
        "team_size": "VARCHAR",
        "analytics_consent": "BOOLEAN DEFAULT FALSE NOT NULL",
    }
    missing_columns = [name for name in column_definitions if name not in columns]
    if missing_columns:
        with engine.begin() as connection:
            for column_name in missing_columns:
                connection.execute(text(f"ALTER TABLE audiences ADD COLUMN {column_name} {column_definitions[column_name]}"))


def ensure_admin_user():
    from app.models.audience import Audience
    from app.core.security import get_password_hash

    admin_email = settings.ADMIN_EMAIL.strip().lower()
    legacy_admin_email = "admin@monetizemate.local"
    if not admin_email or not settings.ADMIN_PASSWORD:
        return

    db = SessionLocal()
    try:
        admin = db.query(Audience).filter(Audience.email == admin_email).first()
        legacy_admin = db.query(Audience).filter(Audience.email == legacy_admin_email).first()
        if admin:
            admin.is_admin = True
            if not admin.is_active:
                admin.is_active = True
            if legacy_admin and legacy_admin.id != admin.id:
                legacy_admin.is_admin = False
        else:
            if legacy_admin:
                legacy_admin.email = admin_email
                legacy_admin.name = settings.ADMIN_NAME
                legacy_admin.is_active = True
                legacy_admin.is_admin = True
            else:
                admin = Audience(
                    name=settings.ADMIN_NAME,
                    email=admin_email,
                    hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
                    is_active=True,
                    is_admin=True,
                )
                db.add(admin)
        db.commit()
    finally:
        db.close()


