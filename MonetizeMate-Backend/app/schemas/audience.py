from typing import Optional
from pydantic import BaseModel, EmailStr, Field

# --- UserBase: Common fields shared across multiple user schemas ---
# This is a good practice for reusability.
class AudienceBase(BaseModel):
    """
    Base schema for user-related data, containing common attributes.
    """
    email: EmailStr = Field(..., example="jane.doe@example.com", description="User's unique email address.")
    name: str = Field(..., min_length=1, max_length=100, example="Jane Doe", description="Full name of the user.")
    is_active: Optional[bool] = Field(True, description="Indicates if the user account is active.")

# --- UserCreate: Schema for creating a new user ---
# Inherits from UserBase and adds the 'password' field.
class AudienceCreate(AudienceBase):
    """
    Schema for creating a new user. Includes sensitive password information.
    """
    password: str = Field(..., min_length=8, example="SecureP@ssw0rd!", description="User's plain text password (will be hashed).")

# --- UserInDB: Schema for a user stored in the database ---
# This would typically be used internally, not directly exposed via API.
# It includes the hashed password.
class AudienceInDB(AudienceBase):
    """
    Schema representing a user as stored in the database.
    Includes the hashed password.
    """
    id: Optional[int] = Field(None, description="Unique identifier for the user.")
    hashed_password: str = Field(..., description="User's hashed password.")

    # Pydantic's ORM mode allows direct mapping from SQLAlchemy models
    # to Pydantic models.
    class Config:
        from_attributes = True # Pydantic v2: use from_attributes, Pydantic v1: use orm_mode = True

# --- UserResponse (or UserOut): Schema for returning user data via API ---
# Inherits from UserBase and adds the 'id', but EXCLUDES sensitive info like hashed_password.
class AudienceResponse(AudienceBase):
    """
    Schema for returning user data through the API.
    Excludes sensitive information like the hashed password.
    """
    id: int = Field(..., description="Unique identifier for the user.")

    # Pydantic's ORM mode is crucial here for converting SQLAlchemy model instances
    # into Pydantic model instances for API responses.
    class Config:
        from_attributes = True # Pydantic v2: use from_attributes, Pydantic v1: use orm_mode = True

# You might also have a schema for updating a user if needed:
class AudienceUpdate(BaseModel):
    """
    Schema for updating existing user information. All fields are optional.
    """
    email: Optional[EmailStr] = Field(None, example="jane.updated@example.com", description="New email address.")
    name: Optional[str] = Field(None, min_length=1, max_length=100, example="Jane D.", description="New full name.")
    is_active: Optional[bool] = Field(None, description="Update active status.")
    password: Optional[str] = Field(None, min_length=8, description="New plain text password.")

class PasswordResetLinkRequest(BaseModel):
    """
    Schema for requesting a secure reset link before resetting a password.
    """
    email: EmailStr = Field(..., example="jane.doe@example.com", description="Email address of the user.")

class PasswordResetRequest(BaseModel):
    """
    Schema for resetting a password from the forgot-password flow after reset-link verification.
    """
    email: EmailStr = Field(..., example="jane.doe@example.com", description="Email address of the user.")
    password: str = Field(..., min_length=8, example="NewSecureP@ssw0rd!", description="New password.")
    token: str = Field(..., min_length=32, example="secure-reset-token", description="One-time password reset token sent by email.")

class Token(BaseModel):
    """
    Schema for an OAuth2 token response.
    """
    access_token: str = Field(..., example="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", description="The JWT access token.")
    token_type: str = Field("bearer", example="bearer", description="The type of the token, typically 'bearer'.")

class TokenData(BaseModel):
    """
    Schema for data expected to be inside a token (e.g., username).
    """
    email: Optional[str] = Field(None, example="audience@example.com", description="The email of the audience associated with the token.")
