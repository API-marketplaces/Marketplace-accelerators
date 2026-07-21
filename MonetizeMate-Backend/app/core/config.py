import os
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/monetize_mate")
    # DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://ApiIntegrationPostgresAdmin:PgAdmin%4012345@postgresazureinternal.postgres.database.azure.com:5432/monetize_mate?sslmode=require")
    # UPLOAD_DIRECTORY: str = "uploads"
    UPLOAD_DIRECTORY: str = os.getenv("UPLOAD_DIRECTORY", "/home/data/uploads")
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "250"))
    MODEL_STORAGE_DIR: str = "trained_ml_models"
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    FRONTEND_URL: List[str] = Field(default=["http://localhost:3000"])
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "")
    SUPPORT_EMAIL: str = os.getenv("SUPPORT_EMAIL", os.getenv("SMTP_FROM_EMAIL", ""))
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("PASSWORD_RESET_TOKEN_EXPIRE_MINUTES", "15"))
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@monetizemate.com")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "Admin@12345")
    ADMIN_NAME: str = os.getenv("ADMIN_NAME", "MonetizeMate Admin")

    # Azure service principal credentials (optional).
    # When all three are provided, the /api-sources/test-connection endpoint
    # will also call the Azure ARM REST API to confirm the APIM service is active.
    AZURE_TENANT_ID: str = os.getenv("AZURE_TENANT_ID", "")
    AZURE_CLIENT_ID: str = os.getenv("AZURE_CLIENT_ID", "")
    AZURE_CLIENT_SECRET: str = os.getenv("AZURE_CLIENT_SECRET", "")

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

