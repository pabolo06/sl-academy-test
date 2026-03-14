-- Add consent_timestamp to profiles table for GDPR compliance
-- This tracks when users accepted the privacy policy and terms of service

ALTER TABLE profiles
ADD COLUMN consent_timestamp TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN profiles.consent_timestamp IS 'Timestamp when user accepted privacy policy and terms of service (GDPR compliance)';
