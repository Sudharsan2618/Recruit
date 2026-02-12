-- Add onboarding_completed and phone_verified columns to users table
-- These columns track whether a user has completed the onboarding wizard

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Update existing users to mark onboarding as completed (they're already set up)
UPDATE users SET onboarding_completed = TRUE WHERE status = 'active';
