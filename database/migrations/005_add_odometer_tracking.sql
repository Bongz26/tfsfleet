-- Add odometer tracking table since vehicles table doesn't have current_odometer
CREATE TABLE IF NOT EXISTS vehicle_odometer (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    odometer_reading INTEGER NOT NULL,
    recorded_at TIMESTAMP DEFAULT NOW(),
    recorded_by INTEGER REFERENCES drivers(id),
    notes TEXT,
    UNIQUE(vehicle_id, odometer_reading, recorded_at)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_vo_vehicle_id ON vehicle_odometer(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vo_recorded_at ON vehicle_odometer(recorded_at DESC);

-- Function to get current odometer for a vehicle
CREATE OR REPLACE FUNCTION get_current_odometer(vehicle_id_param INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT odometer_reading 
        FROM vehicle_odometer 
        WHERE vehicle_id = vehicle_id_param 
        ORDER BY recorded_at DESC 
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql;

