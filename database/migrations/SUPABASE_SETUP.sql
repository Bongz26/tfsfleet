-- Supabase Database Setup for Fleet Management
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. Create driver_vehicle_assignments table
-- ============================================
-- This table tracks which driver is currently using which vehicle
-- Drivers can use any available vehicle - assignments are auto-created when they use a vehicle
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

-- Indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_dva_driver_id ON driver_vehicle_assignments(driver_id) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_dva_vehicle_id ON driver_vehicle_assignments(vehicle_id) WHERE active = TRUE;

-- ============================================
-- 2. Create trips table (if it doesn't exist)
-- ============================================
CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
    start_odometer INTEGER,
    end_odometer INTEGER NOT NULL,
    distance INTEGER GENERATED ALWAYS AS (end_odometer - COALESCE(start_odometer, 0)) STORED,
    purpose TEXT,
    fuel_used DECIMAL(8,2),
    fuel_cost DECIMAL(10,2),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (end_odometer >= COALESCE(start_odometer, 0))
);

-- Indexes for trips
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at);

-- ============================================
-- 3. Create fuel_purchases table
-- ============================================
CREATE TABLE IF NOT EXISTS fuel_purchases (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
    liters DECIMAL(10,2) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    receipt_number VARCHAR(50),
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    odometer_reading INTEGER,
    station_name VARCHAR(100),
    notes TEXT,
    receipt_slip_path VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fuel_purchases
CREATE INDEX IF NOT EXISTS idx_fuel_purchases_vehicle_id ON fuel_purchases(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_purchases_purchase_date ON fuel_purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_fuel_purchases_receipt_slip ON fuel_purchases(receipt_slip_path) WHERE receipt_slip_path IS NOT NULL;

-- ============================================
-- 4. Create maintenance_notes table
-- ============================================
CREATE TABLE IF NOT EXISTS maintenance_notes (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    maintenance_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    cost DECIMAL(10,2),
    service_date TIMESTAMPTZ,
    odometer_reading INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for maintenance_notes
CREATE INDEX IF NOT EXISTS idx_maintenance_notes_vehicle_id ON maintenance_notes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_notes_status ON maintenance_notes(status);

-- ============================================
-- 5. Create vehicle_odometer tracking table
-- ============================================
CREATE TABLE IF NOT EXISTS vehicle_odometer (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    odometer_reading INTEGER NOT NULL,
    recorded_at TIMESTAMP DEFAULT NOW(),
    recorded_by INTEGER REFERENCES drivers(id),
    notes TEXT
);

-- Index for odometer tracking
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

-- ============================================
-- 6. Example: Assign a vehicle to a driver
-- ============================================
-- Replace driver_id and vehicle_id with actual IDs from your database
-- Example:
-- INSERT INTO driver_vehicle_assignments (driver_id, vehicle_id, active)
-- VALUES (1, 5, true);

