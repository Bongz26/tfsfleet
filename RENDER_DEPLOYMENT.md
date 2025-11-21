# Deploying Fleet Management App to Render

This guide will help you deploy both the backend and frontend to Render.

## Prerequisites

1. GitHub repository with your code pushed
2. Supabase database set up and connection string ready
3. Render account (free tier works)

## Step 1: Deploy Backend Service

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service**:
   - **Name**: `fleet-management-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free (or choose a paid plan)

5. **Add Environment Variables**:
   - `NODE_ENV` = `production`
   - `PORT` = `10000` (Render sets this automatically, but good to have)
   - `DATABASE_URL` = Your Supabase connection string (from Supabase dashboard)
   - `JWT_SECRET` = Generate a secure random string (you can use: `openssl rand -base64 32`)
   - `TEST_MODE` = `false`
   - `SKIP_DB` = `false`

6. **Click "Create Web Service"**

7. **Wait for deployment** - Render will build and deploy your backend

8. **Note the backend URL** - It will be something like: `https://fleet-management-backend.onrender.com`

## Step 2: Deploy Frontend Service

1. **In Render Dashboard, click "New +" → "Static Site"**
2. **Connect the same GitHub repository**
3. **Configure the service**:
   - **Name**: `fleet-management-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   
   **Note**: If you get "vite: Permission denied" error, try this build command instead:
   `cd frontend && npm install && npx vite build`

4. **Add Environment Variables**:
   - `VITE_API_URL` = Your backend URL from Step 1 (e.g., `https://fleet-management-backend.onrender.com/api`)

5. **Click "Create Static Site"**

6. **Wait for deployment** - Render will build and deploy your frontend

7. **Note the frontend URL** - It will be something like: `https://fleet-management-frontend.onrender.com`

## Step 3: Update CORS Settings

After deployment, you may need to update CORS in your backend to allow your frontend URL:

1. Go to your backend service in Render
2. Add environment variable:
   - `FRONTEND_URL` = Your frontend URL (e.g., `https://fleet-management-frontend.onrender.com`)

3. The backend already has CORS configured, but if you need to restrict it, update `backend/server.js`

## Step 4: Verify Deployment

1. **Test Backend**: Visit `https://your-backend-url.onrender.com/api/test-db`
   - Should return database connection status

2. **Test Frontend**: Visit your frontend URL
   - Should load the login page
   - Try logging in to verify API connection

## Important Notes

### Database Migrations
- Make sure you've run the SQL migrations in Supabase (from `database/migrations/SUPABASE_SETUP.sql`)
- The backend will work without tables, but you need them for full functionality

### File Uploads
- File uploads (receipt slips) are stored locally on the server
- On Render's free tier, files are stored in `/tmp` which gets cleared on restart
- For production, consider using:
  - AWS S3
  - Cloudinary
  - Supabase Storage

### Environment Variables Summary

**Backend:**
- `DATABASE_URL` - Supabase connection string
- `JWT_SECRET` - Secret for JWT tokens
- `PORT` - Port number (Render sets this automatically)
- `NODE_ENV` - Set to `production`

**Frontend:**
- `VITE_API_URL` - Backend API URL (e.g., `https://your-backend.onrender.com/api`)

## Troubleshooting

### Backend won't start
- Check logs in Render dashboard
- Verify `DATABASE_URL` is correct
- Make sure `PORT` is set (Render sets it automatically, but check)

### Frontend can't connect to backend
- Verify `VITE_API_URL` is set correctly
- Check CORS settings in backend
- Check browser console for errors

### Database connection errors
- Verify Supabase connection string is correct
- Check that SSL is enabled (already configured in code)
- Make sure Supabase database is accessible from Render's IPs

## Using render.yaml (Alternative Method)

If you prefer, you can use the `render.yaml` file included in the repository:

1. In Render Dashboard, go to "New +" → "Blueprint"
2. Connect your GitHub repository
3. Render will automatically detect `render.yaml` and create services
4. You'll still need to set `DATABASE_URL` and `JWT_SECRET` manually

## Next Steps

- Set up custom domains (if needed)
- Configure auto-deploy on git push
- Set up monitoring and alerts
- Consider upgrading to paid plan for better performance

