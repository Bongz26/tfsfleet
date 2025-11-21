# How to Get Your Supabase Connection String

## Step-by-Step Instructions

### 1. Go to Supabase Dashboard
- Visit: https://supabase.com/dashboard
- Login and select your project: `uucjdcbtpunfsyuixsmc`

### 2. Get Connection String
1. Click on **Settings** (gear icon) in the left sidebar
2. Click on **Database** in the settings menu
3. Scroll down to **Connection string** section
4. You'll see different connection modes:
   - **URI** - Full connection string
   - **JDBC** - Java format
   - **Golang** - Go format
   - **Python** - Python format
   - **Node.js** - Node.js format (this is what we need!)

### 3. Copy the Connection String
- Click on the **Node.js** tab
- You'll see something like:
  ```javascript
  postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
  ```
- OR for direct connection (port 5432):
  ```javascript
  postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
  ```

### 4. Important Notes

**For Connection Pooling (Port 6543):**
- Use this for production/scaling
- Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
- Add `?pgbouncer=true` parameter

**For Direct Connection (Port 5432):**
- Use this for migrations and direct access
- Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
- More reliable for our use case

### 5. Get Your Database Password
If you don't know your password:
1. In **Settings** → **Database**
2. Find **Database password** section
3. Click **Reset database password**
4. Copy the new password (save it securely!)

### 6. Update Your .env File

Replace `[YOUR-PASSWORD]` in the connection string with your actual password:

```env
DATABASE_URL=postgresql://postgres:[YOUR-ACTUAL-PASSWORD]@db.uucjdcbtpunfsyuixsmc.supabase.co:5432/postgres
```

**OR if using connection pooling:**

```env
DATABASE_URL=postgresql://postgres.uucjdcbtpunfsyuixsmc:[YOUR-ACTUAL-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 7. Common Issues

**Issue: ENOTFOUND error**
- The hostname in your connection string is wrong
- Make sure you copied the EXACT string from Supabase dashboard
- Don't manually construct it - copy it directly

**Issue: Authentication failed**
- Your password is incorrect
- Reset your database password in Supabase dashboard
- Make sure there are no extra spaces in the connection string

**Issue: Connection timeout**
- Check your firewall/network
- Supabase might have IP restrictions (check Database settings)

### 8. Test Your Connection

After updating `.env`, restart your server and check:
- Backend terminal should show: `✅ Database connected successfully`
- Visit: `http://localhost:5000/api/test-db` to verify connection

