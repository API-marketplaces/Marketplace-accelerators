from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

# Local imports from the application's modules
from app.database.database import get_db
from app.schemas.audience import AudienceCreate, AudienceResponse, PasswordResetRequest, Token
from app.crud import audiences as crud_users
from app.core.security import authenticate_user, create_access_token, get_current_user
from app.core.config import settings

# Initialize the API router for user-related endpoints
router = APIRouter()

@router.post("/register", response_model=AudienceResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: AudienceCreate, db: Session = Depends(get_db)):
    """
    Registers a new user.
    - Checks if the email is already registered.
    - Creates a new user if the email is unique.
    """
    db_user = crud_users.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    return crud_users.create_user(db=db, user=user)

@router.post("/forgot-password")
def forgot_password(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    """
    Resets a user's password after validating the account email.
    """
    db_user = crud_users.update_user_password(db=db, email=payload.email, password=payload.password)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found for this email"
        )
    return {"ok": True, "message": "Password updated successfully"}

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Authenticates a user and issues an access token.
    - Takes username (email) and password from form data.
    - Authenticates against the database.
    - If successful, generates a JWT access token.
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=AudienceResponse)
async def read_users_me(current_user: AudienceResponse = Depends(get_current_user)):
    """
    Retrieves the details of the currently authenticated user.
    - Requires a valid JWT access token in the Authorization header.
    """
    return current_user

