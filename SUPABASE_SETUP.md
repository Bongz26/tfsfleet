# Supabase Database Setup Guide

## Getting Your Supabase Connection Details

### Step 1: Get Database Connection String

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `uucjdcbtpunfsyuixsmc`
3. Go to **Settings** → **Database**
4. Scroll down to **Connection string**
5. Select **URI** mode
6. Copy the connection string (it will look like):
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   OR for direct connection:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### Step 2: Get Database Password

If you don't have your database password:
1. Go to **Settings** → **Database**
2. Under **Database password**, click **Reset database password**
3. Save the new password securely

### Step 3: Configure Your .env File

Create or update `backend/.env` with:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Connection (Option 1 - Recommended)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.uucjdcbtpunfsyuixsmc.supabase.co:5432/postgres

# OR use individual parameters (Option 2)
# DB_HOST=db.uucjdcbtpunfsyuixsmc.supabase.co
# DB_USER=postgres
# DB_PASSWORD=[YOUR-DATABASE-PASSWORD]
# DB_NAME=postgres
# DB_PORT=5432
# DB_SSL=true

# Supabase API
SUPABASE_URL=https://uucjdcbtpunfsyuixsmc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1Y2pkY2J0cHVuZnN5dWl4c21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODE0MzIsImV4cCI6MjA3ODM1NzQzMn0.2Pfe6Z4mhkJn5d1HlnDd8ACMpydNO1a_CSw_qQvYQsI

# JWT Secret
JWT_SECRET=your-secret-key-change-in-production

# Disable test mode
TEST_MODE=false
```

### Step 4: Important Notes

1. **Replace `[YOUR-PASSWORD]`** with your actual Supabase database password
2. **Use port 5432** for direct connection (not 6543 which is for connection pooling)
3. **SSL is required** - The config automatically enables SSL for Supabase
4. **Connection String Format**: 
   - Direct: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   - Pooled: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

### Step 5: Test Connection

After setting up your `.env` file, restart your backend server:

```bash
cd backend
npm run dev
```

You should see:
```
✅ Database connected successfully
```

If you see connection errors, check:
- Password is correct
- Connection string format is correct
- SSL is enabled (automatic in our config)
- Your IP is allowed in Supabase (check Database settings)

## Running Migrations

After connecting, run your database migrations:

1. Connect to Supabase SQL Editor
2. Run the migration files from `database/migrations/`:
   - `001_add_fuel_and_maintenance.sql`
   - `002_make_start_odometer_optional.sql`
   - `003_add_receipt_slip_to_fuel_purchases.sql`
   - `004_create_driver_vehicle_assignments.sql`
   - `005_add_odometer_tracking.sql`

Or use the Supabase SQL Editor to run them directly.

