from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from passlib.hash import pbkdf2_sha256
from sqlalchemy.orm import Session
from hashlib import sha256

# Local imports from the application's modules
from app.database.database import get_db
from app.crud import audiences as crud_users
from app.schemas.audience import AudienceResponse
from app.core.config import settings

# Password hashing context: prefer bcrypt_sha256 (pre-hashes long passwords),
# but keep bcrypt in the list so existing bcrypt hashes still verify.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# OAuth2PasswordBearer for handling token authentication
# tokenUrl points to the endpoint where clients can obtain a token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/token")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    # prefer CryptContext verification, fallback to pbkdf2_sha256
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return pbkdf2_sha256.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a plain password using pbkdf2_sha256."""
    return pbkdf2_sha256.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Creates a JWT access token.
    - `data`: Payload to be encoded in the token.
    - `expires_delta`: Optional timedelta for token expiration.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    # Encode the JWT token
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def authenticate_user(db: Session, email: str, password: str):
    """
    Authenticates a user by email and password.
    - Retrieves the user from the database.
    - Verifies the provided password against the stored hashed password.
    """
    user = crud_users.get_user_by_email(db, email=email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Dependency to get the current authenticated user from a JWT token.
    - Decodes and validates the token.
    - Retrieves the user from the database based on the token's subject (email).
    - Raises HTTPException if the token is invalid or user not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the JWT token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError as e:
        print(f"JWT Error: {e}")  # Debugging
        raise credentials_exception
    # Retrieve the user from the database
    user = crud_users.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    # Return the user as a UserPublic schema model
    return AudienceResponse.model_validate(user)

