"""Application configuration using Pydantic Settings."""

from pydantic_settings import BaseSettings
from typing import Optional
from dotenv import load_dotenv
import os
load_dotenv()


class Settings(BaseSettings):
    # ── App ──
    APP_NAME: str = "RecruitLMS"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # ── Security ──
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # ── PostgreSQL ──
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST")
    POSTGRES_PORT: int = os.getenv("POSTGRES_PORT")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB")

    # ── GCP Cloud Storage ──
    GCS_BUCKET_NAME: str = os.getenv("GCS_BUCKET_NAME")
    GCS_PROJECT_ID: str = os.getenv("GCS_PROJECT_ID")
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL")
    # ── MongoDB (Learning Analytics & xAPI) ──
    MONGODB_URL: str = os.getenv("MONGODB_URL")
    MONGODB_DB: str = os.getenv("MONGODB_DB")

    # ── Frontend (CORS) ──
    FRONTEND_URL: str = os.getenv("FRONTEND_URL")

    # ── Razorpay (Payment Gateway) ──
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "")

    # ── Novu (Notification System) ──
    NOVU_API_KEY: str = os.getenv("NOVU_API_KEY", "")

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def SYNC_DATABASE_URL(self) -> str:
        """Synchronous URL for Alembic migrations and seed scripts."""
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
