-- Fuel Purchases table
CREATE TABLE IF NOT EXISTS fuel_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    liters DECIMAL(10,2) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    receipt_number VARCHAR(50),
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    odometer_reading INTEGER,
    station_name VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance Notes table
CREATE TABLE IF NOT EXISTS maintenance_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    maintenance_type VARCHAR(50), -- e.g., 'oil_change', 'repair', 'inspection', 'warning'
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, scheduled
    cost DECIMAL(10,2),
    service_date TIMESTAMPTZ,
    odometer_reading INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fuel_purchases_vehicle_id ON fuel_purchases(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_purchases_purchase_date ON fuel_purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_notes_vehicle_id ON maintenance_notes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_notes_status ON maintenance_notes(status);

