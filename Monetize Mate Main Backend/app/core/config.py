import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://ApiIntegrationPostgresAdmin:PgAdmin%4012345@postgresazureinternal.postgres.database.azure.com:5432/monetize_mate?sslmode=require")
    UPLOAD_DIRECTORY: str = "uploads"
    MODEL_STORAGE_DIR: str = "trained_ml_models"
    GROQ_API_KEY: str = ""  # ← add this line

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()