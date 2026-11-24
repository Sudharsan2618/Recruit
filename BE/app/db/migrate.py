"""Lightweight, idempotent schema migrations applied on app startup.

This project has no migration framework (schema lives in DB/*.sql). To make
deploys self-contained, we apply small, safe, idempotent DDL here during the
FastAPI lifespan — before the app serves traffic — so a code deploy that needs
a new column does not depend on a separate manual DB step.

Every statement MUST be idempotent (IF NOT EXISTS / IF EXISTS) and cheap. On
PostgreSQL 11+ adding a column with a constant default is metadata-only.
"""

import logging

from sqlalchemy import text

from app.db.postgres import engine

logger = logging.getLogger(__name__)

# Idempotent DDL statements, applied in order on every startup.
_MIGRATIONS = [
    # 005 — force password reset on first login for admin-provisioned accounts.
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS must_reset_password BOOLEAN NOT NULL DEFAULT FALSE",
]


async def ensure_schema() -> None:
    """Apply idempotent startup migrations. Never raises — logs and continues."""
    for stmt in _MIGRATIONS:
        try:
            async with engine.begin() as conn:
                await conn.execute(text(stmt))
            logger.info("[MIGRATE] ok: %s", stmt.split(" ADD COLUMN")[0])
        except Exception as e:  # pragma: no cover - defensive
            logger.error("[MIGRATE] FAILED: %s -- %s", stmt, e)
