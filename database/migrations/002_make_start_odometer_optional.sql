-- Make start_odometer optional (nullable) for real-world scenarios
-- where drivers might forget to record it
ALTER TABLE trips ALTER COLUMN start_odometer DROP NOT NULL;

-- Update the distance calculation to handle NULL start_odometer
-- (Distance will be NULL if start_odometer is NULL)
-- The existing GENERATED column will handle this automatically

-- Update the check constraint to allow NULL start_odometer
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_end_odometer_check;
ALTER TABLE trips ADD CONSTRAINT trips_end_odometer_check 
  CHECK (start_odometer IS NULL OR end_odometer >= start_odometer);

