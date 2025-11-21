-- Core Tables
CREATE TABLE drivers (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE vehicles (
  id UUID PRIMARY KEY, 
  registration VARCHAR(20),
  make VARCHAR(50),
  model VARCHAR(50),
  year INTEGER,
  current_odometer INTEGER
);

CREATE TABLE trips (
  id UUID PRIMARY KEY,
  driver_id UUID REFERENCES drivers(id),
  vehicle_id UUID REFERENCES vehicles(id),
  start_odometer INTEGER,
  end_odometer INTEGER,
  distance INTEGER GENERATED ALWAYS AS (end_odometer - start_odometer) STORED,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  purpose TEXT,
  fuel_liters DECIMAL(5,2),
  fuel_cost DECIMAL(8,2),
  status VARCHAR(20) DEFAULT 'pending',
  sync_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'synced', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);