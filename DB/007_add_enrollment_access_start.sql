-- 007_add_enrollment_access_start.sql
-- Admin-controlled course access with a start/end window.
-- `expires_at` (already present) is the access END; this adds the access START.
-- When both are NULL the enrollment grants immediate, open-ended access.
--
-- Idempotent; also applied on backend startup (app/db/migrate.py).

ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS access_starts_at TIMESTAMP;
