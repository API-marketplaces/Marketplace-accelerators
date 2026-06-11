from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import hashlib
import hmac
import secrets
from urllib.parse import urlencode

# Local imports from the application's modules
from app.database.database import get_db
from app.schemas.audience import AudienceCreate, AudienceResponse, PasswordResetLinkRequest, PasswordResetRequest, Token
from app.crud import audiences as crud_users
from app.core.security import authenticate_user, create_access_token, get_current_user
from app.core.config import settings
from app.core.email import send_password_reset_link

# Initialize the API router for user-related endpoints
router = APIRouter()
password_reset_tokens = {}

def _hash_reset_token(token: str) -> str:
    value = f"{token}:{settings.SECRET_KEY}"
    return hashlib.sha256(value.encode("utf-8")).hexdigest()

def _clear_expired_reset_tokens():
    now = datetime.utcnow()
    expired_tokens = [
        token_hash for token_hash, entry in password_reset_tokens.items() if entry["expires_at"] <= now
    ]
    for token_hash in expired_tokens:
        password_reset_tokens.pop(token_hash, None)

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

@router.post("/forgot-password/request-link")
def request_password_reset_link(payload: PasswordResetLinkRequest, db: Session = Depends(get_db)):
    """
    Sends a secure one-time reset link to the account email.
    """
    _clear_expired_reset_tokens()
    email = payload.email.strip().lower()
    db_user = crud_users.get_user_by_email(db, email=email)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found for this email"
        )

    token = secrets.token_urlsafe(32)
    token_hash = _hash_reset_token(token)
    password_reset_tokens[token_hash] = {
        "email": email,
        "expires_at": datetime.utcnow() + timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES),
    }

    frontend_url = str(settings.FRONTEND_URL[0]).rstrip("/") if settings.FRONTEND_URL else "http://localhost:3000"
    reset_link = f"{frontend_url}/login?{urlencode({'resetToken': token, 'email': email})}"

    sent = send_password_reset_link(email, reset_link)
    if not sent:
        print(f"Password reset link for {email}: {reset_link}")

    message = "Password reset link sent to your email"
    if not sent:
        message = "Reset link generated. Check backend logs because SMTP is not configured."
    return {"ok": True, "message": message}

@router.post("/forgot-password")
def forgot_password(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    """
    Resets a user's password after validating the account email and reset token.
    """
    _clear_expired_reset_tokens()
    email = payload.email.strip().lower()
    token_hash = _hash_reset_token(payload.token)
    token_entry = password_reset_tokens.get(token_hash)
    if not token_entry or not hmac.compare_digest(token_entry["email"], email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset link"
        )

    db_user = crud_users.update_user_password(db=db, email=email, password=payload.password)
    if not db_user:
        password_reset_tokens.pop(token_hash, None)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found for this email"
        )
    password_reset_tokens.pop(token_hash, None)
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

