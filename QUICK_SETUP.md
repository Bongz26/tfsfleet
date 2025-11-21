# Quick Setup Guide for Supabase

## ✅ Database Connection is Working!

Your database is now connected. You just need to create the missing tables.

## Step 1: Create Required Tables

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: `uucjdcbtpunfsyuixsmc`
3. Click on **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy and paste the entire contents of `database/migrations/SUPABASE_SETUP.sql`
6. Click **Run** (or press Ctrl+Enter)

This will create:
- ✅ `driver_vehicle_assignments` - Links drivers to vehicles
- ✅ `trips` - Trip records
- ✅ `fuel_purchases` - Fuel purchase records
- ✅ `maintenance_notes` - Maintenance records
- ✅ `vehicle_odometer` - Odometer tracking

## Step 2: Assign Vehicles to Drivers

After creating the tables, assign vehicles to drivers:

1. In Supabase **SQL Editor**, run:

```sql
-- Example: Assign vehicle ID 5 to driver ID 12
-- Replace with your actual driver and vehicle IDs
INSERT INTO driver_vehicle_assignments (driver_id, vehicle_id, active)
VALUES (12, 5, true);
```

To find your driver and vehicle IDs:
```sql
-- List all drivers
SELECT id, name FROM drivers WHERE active = true;

-- List all vehicles
SELECT id, reg_number FROM vehicles WHERE available = true;
```

## Step 3: Disable TEST_MODE

Update your `backend/.env` file:

```env
TEST_MODE=false
```

## Step 4: Restart Server

Restart your backend server. You should now see:
```
✅ Database connected successfully
✅ Database pool created successfully
```

## Step 5: Test the API

1. Visit: `http://localhost:5000/api/health`
2. Visit: `http://localhost:5000/api/test-db`
3. Try login: `http://localhost:5000/api/auth/login` (POST with `{"driver_id": 12}`)

## Troubleshooting

**If you see "relation does not exist" errors:**
- Make sure you ran the SQL from `SUPABASE_SETUP.sql` in Supabase SQL Editor
- Check that all tables were created successfully

**If drivers can't see vehicles:**
- Make sure you've assigned vehicles to drivers in `driver_vehicle_assignments` table
- Check that both driver and vehicle have `active = true` / `available = true`

**If TEST_MODE is still showing:**
- Check your `backend/.env` file has `TEST_MODE=false`
- Restart the server

