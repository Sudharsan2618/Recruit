"""Lightweight, idempotent schema migrations applied on app startup.

This project has no migration framework (schema lives in DB/*.sql). To make
deploys self-contained, we apply small, safe, idempotent DDL here during the
FastAPI lifespan — before the app serves traffic — so a code deploy that needs
a new column/type/table does not depend on a separate manual DB step.

Every statement MUST be idempotent (IF NOT EXISTS). Each runs in its own
AUTOCOMMIT connection: DDL is individually atomic, and `ALTER TYPE ... ADD
VALUE` cannot run inside a transaction block that also uses the new value.
On PostgreSQL 12+ adding an enum value and adding a column with a constant
default are both cheap, metadata-only operations.
"""

import logging

from sqlalchemy import text

from app.db.postgres import engine

logger = logging.getLogger(__name__)

# Idempotent DDL statements, applied in order on every startup.
_MIGRATIONS = [
    # 005 — force password reset on first login for admin-provisioned accounts.
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS must_reset_password BOOLEAN NOT NULL DEFAULT FALSE",

    # 006 — assignment (coding exercise) lesson type + tables.
    "ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'assignment'",
    """
    CREATE TABLE IF NOT EXISTS assignments (
        assignment_id SERIAL PRIMARY KEY,
        lesson_id INTEGER NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        instructions TEXT,
        language VARCHAR(30) NOT NULL DEFAULT 'python',
        total_questions INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_assignments_lesson ON assignments(lesson_id)",
    """
    CREATE TABLE IF NOT EXISTS assignment_questions (
        question_id SERIAL PRIMARY KEY,
        assignment_id INTEGER NOT NULL REFERENCES assignments(assignment_id) ON DELETE CASCADE,
        title VARCHAR(255),
        problem_statement TEXT NOT NULL,
        starter_code TEXT,
        expected_output TEXT,
        sample_input TEXT,
        solution_code TEXT,
        solution_explanation TEXT,
        language VARCHAR(30) NOT NULL DEFAULT 'python',
        points INTEGER DEFAULT 10,
        order_index INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_assignment_questions_assignment ON assignment_questions(assignment_id)",
]


async def ensure_schema() -> None:
    """Apply idempotent startup migrations. Never raises — logs and continues."""
    for stmt in _MIGRATIONS:
        label = " ".join(stmt.split())[:70]
        try:
            # AUTOCOMMIT: each DDL stands alone; required for ALTER TYPE ADD VALUE.
            async with engine.connect() as conn:
                conn = await conn.execution_options(isolation_level="AUTOCOMMIT")
                await conn.execute(text(stmt))
            logger.info("[MIGRATE] ok: %s", label)
        except Exception as e:  # pragma: no cover - defensive
            logger.error("[MIGRATE] FAILED: %s -- %s", label, e)
