-- 005_add_must_reset_password.sql
-- Adds a flag that forces a user to set a new password on their next login.
-- Set to TRUE when an admin provisions an account with a temporary password;
-- cleared once the user chooses their own password.
--
-- Safe to run multiple times (IF NOT EXISTS). On PostgreSQL 11+ adding a column
-- with a constant default is a metadata-only change (no table rewrite).
--
-- This is also applied automatically on backend startup (see app/db/migrate.py),
-- so a normal deploy needs no manual step. Run this by hand only as a fallback
-- if the app's DB role lacks DDL permission.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS must_reset_password BOOLEAN NOT NULL DEFAULT FALSE;
