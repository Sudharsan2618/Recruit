"""Application configuration using Pydantic Settings."""

from pydantic_settings import BaseSettings
from typing import Optional


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
    POSTGRES_HOST: str = "dpg-ctlpcvrqf0us7389o680-a.singapore-postgres.render.com"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "admin"
    POSTGRES_PASSWORD: str = "kbOZpYYBZLfoeQRlBFajBfxi8A2JwPwk"
    POSTGRES_DB: str = "Recruit"

    # ── GCP Cloud Storage ──
    GCS_BUCKET_NAME: str = "recruitlms-assets"
    GCS_PROJECT_ID: str = "gen-lang-client-0881077280"
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = "gen-lang-client-0881077280-8aa1d2a2fbc9.json"

    # ── Frontend (CORS) ──
    FRONTEND_URL: str = "http://localhost:3000"

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
