-- Create driver-vehicle assignment table
-- This tracks which driver is currently using which vehicle (auto-assigned when they use it)
-- Drivers can use any available vehicle - this just tracks current usage
CREATE TABLE IF NOT EXISTS driver_vehicle_assignments (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE,
    notes TEXT
);

-- Unique constraint: Only one active assignment per driver at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_dva_driver_active 
ON driver_vehicle_assignments(driver_id) 
WHERE active = TRUE;

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_dva_driver_id ON driver_vehicle_assignments(driver_id) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_dva_vehicle_id ON driver_vehicle_assignments(vehicle_id) WHERE active = TRUE;

