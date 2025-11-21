# ⚡ QUICK FIX for Render Deployment

## The Problem
You're getting: `sh: 1: vite: Permission denied`

## The Solution (2 Steps)

### Step 1: Update Build Command in Render Dashboard

1. **Go to Render Dashboard** → Your Frontend Service
2. **Click "Settings"** (gear icon)
3. **Scroll to "Build & Deploy"** section
4. **Find "Build Command"** field
5. **Replace the current command with:**
   ```
   cd frontend && npm install && npx vite build
   ```
6. **Click "Save Changes"** at the bottom
7. **Go to "Manual Deploy"** → **"Deploy latest commit"**

### Step 2: Verify It Works

After deployment, check the build logs. You should see:
```
> fleet-frontend@1.0.0 build
> npx vite build
```

Instead of the error.

## Alternative: If Step 1 Doesn't Work

Try this build command instead:
```
cd frontend && npm install && PATH=$PATH:./node_modules/.bin && npx vite build
```

## Why This Works

- `npx` finds and executes `vite` from `node_modules/.bin`
- It works even if the PATH doesn't include `node_modules/.bin`
- This is the standard way to run local binaries in CI/CD environments

## Still Having Issues?

1. Make sure you're updating the **Frontend Static Site** service, not the backend
2. The build command should be exactly: `cd frontend && npm install && npx vite build`
3. After saving, manually trigger a new deployment

