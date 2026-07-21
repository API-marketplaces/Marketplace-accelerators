from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import audience as models
from app.schemas.audience import AudienceCreate

def get_user(db: Session, user_id: int):
    """
    Retrieves a single user by their ID.
    """
    return db.query(models.Audience).filter(models.Audience.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    """
    Retrieves a single user by their email address.
    """
    return db.query(models.Audience).filter(func.lower(models.Audience.email) == email.strip().lower()).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    """
    Retrieves a list of users with pagination.
    """
    return db.query(models.Audience).offset(skip).limit(limit).all()

def create_user(db: Session, user: AudienceCreate):
    """
    Creates a new user in the database.
    Hashes the password before storing.

    Args:
        db: The SQLAlchemy database session.
        user: A Pydantic UserCreate model containing the user's data.

    Returns:
        The newly created User SQLAlchemy model instance.
    """
    # Hash the plain-text password from the Pydantic model
    from app.core.security import get_password_hash
    hashed_password = get_password_hash(user.password)

    # Create a new SQLAlchemy User instance
    db_user = models.Audience(
        name=user.name,
        email=user.email.strip().lower(),
        hashed_password=hashed_password,
        is_active=user.is_active,
        first_name=user.first_name,
        last_name=user.last_name,
        company_name=user.company_name,
        job_title=user.job_title,
        department=user.department,
        country=user.country,
        industry=user.industry,
        company_size=user.company_size,
        annual_revenue=user.annual_revenue,
        api_maturity=user.api_maturity,
        primary_objectives=user.primary_objectives,
        api_gateway=user.api_gateway,
        apis_managed=user.apis_managed,
        team_size=user.team_size,
        analytics_consent=bool(user.analytics_consent),
    )

    # Add the user to the session, commit, and refresh
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_password(db: Session, email: str, password: str):
    """
    Updates an existing user's password and returns the user, or None if not found.
    """
    db_user = get_user_by_email(db, email=email)
    if not db_user:
        return None

    from app.core.security import get_password_hash
    db_user.hashed_password = get_password_hash(password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user



