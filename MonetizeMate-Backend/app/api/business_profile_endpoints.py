from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.database import get_db
from app.schemas.audience import AudienceResponse
from app.schemas.business_profile import (
    BusinessProfileCreate,
    BusinessProfileOut,
    BusinessProfileUpdate,
)
from app.crud import business_profiles as crud_business_profiles

router = APIRouter()


@router.get("/business-profiles/", response_model=List[BusinessProfileOut])
def list_business_profiles(
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user),
):
    """List all saved business profiles for the authenticated user."""
    return crud_business_profiles.get_profiles_by_owner(db, current_user.id)


@router.post("/business-profiles/", response_model=BusinessProfileOut, status_code=status.HTTP_201_CREATED)
def create_business_profile(
    request: BusinessProfileCreate,
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user),
):
    """Create a new business profile for the authenticated user."""
    return crud_business_profiles.create_profile(db, current_user.id, request.model_dump())


@router.get("/business-profiles/{profile_id}", response_model=BusinessProfileOut)
def get_business_profile(
    profile_id: int,
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user),
):
    """Retrieve a single saved business profile for the authenticated user."""
    record = crud_business_profiles.get_profile_by_id(db, profile_id, current_user.id)
    if not record:
        raise HTTPException(status_code=404, detail="Business profile not found.")
    return record


@router.put("/business-profiles/{profile_id}", response_model=BusinessProfileOut)
def update_business_profile(
    profile_id: int,
    request: BusinessProfileUpdate,
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user),
):
    """Edit an existing business profile for the authenticated user."""
    record = crud_business_profiles.update_profile(
        db, profile_id, current_user.id, request.model_dump()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Business profile not found.")
    return record


@router.delete("/business-profiles/{profile_id}", response_model=BusinessProfileOut)
def delete_business_profile(
    profile_id: int,
    db: Session = Depends(get_db),
    current_user: AudienceResponse = Depends(get_current_user),
):
    """Delete a saved business profile for the authenticated user."""
    record = crud_business_profiles.delete_profile(db, profile_id, current_user.id)
    if not record:
        raise HTTPException(status_code=404, detail="Business profile not found.")
    return record
