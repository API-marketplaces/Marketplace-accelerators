from sqlalchemy.orm import Session
from datetime import datetime
from app.models.business_profile import BusinessProfile


def create_profile(db: Session, audience_id: int, data: dict) -> BusinessProfile:
    """Create a new business profile record for a user."""
    record = BusinessProfile(audience_id=audience_id, **data)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_profiles_by_owner(db: Session, audience_id: int) -> list[BusinessProfile]:
    """Return all saved business profiles belonging to a user, most recently updated first."""
    return (
        db.query(BusinessProfile)
        .filter(BusinessProfile.audience_id == audience_id)
        .order_by(BusinessProfile.updated_at.desc())
        .all()
    )


def get_profile_by_id(db: Session, profile_id: int, audience_id: int):
    """Return a single business profile, scoped to the owning user."""
    return (
        db.query(BusinessProfile)
        .filter(
            BusinessProfile.id == profile_id,
            BusinessProfile.audience_id == audience_id,
        )
        .first()
    )


def update_profile(db: Session, profile_id: int, audience_id: int, data: dict):
    """Update an existing business profile. Returns the updated record or None."""
    record = get_profile_by_id(db, profile_id, audience_id)
    if not record:
        return None
    for key, value in data.items():
        setattr(record, key, value)
    record.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(record)
    return record


def delete_profile(db: Session, profile_id: int, audience_id: int):
    """Delete a business profile. Returns the deleted record or None."""
    record = get_profile_by_id(db, profile_id, audience_id)
    if record:
        db.delete(record)
        db.commit()
    return record
