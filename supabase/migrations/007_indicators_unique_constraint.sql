-- Add unique constraint to indicators table to support safe batch upserts
-- This facilitates preventing duplicate records for the same hospital, name, and reference date
ALTER TABLE indicators
ADD CONSTRAINT indicators_hospital_name_date_unique UNIQUE (hospital_id, name, reference_date);
-- Add comment to explain the constraint
COMMENT ON CONSTRAINT indicators_hospital_name_date_unique ON indicators IS 'Ensures that a hospital cannot have duplicate indicators with the same name on the same date. Essential for upsert operations.';