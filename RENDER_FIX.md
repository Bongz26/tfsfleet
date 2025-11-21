# Fix for "vite: Permission denied" Error on Render

If you're getting the error `sh: 1: vite: Permission denied` when deploying the frontend to Render, here's how to fix it:

## Solution 1: Update Build Command in Render Dashboard

1. Go to your frontend service in Render Dashboard
2. Go to **Settings** → **Build & Deploy**
3. Update the **Build Command** to:
   ```
   cd frontend && npm install && npx vite build
   ```
4. Save and redeploy

## Solution 2: Use npm run (if Solution 1 doesn't work)

Try this build command instead:
```
cd frontend && npm install && npm run build
```

## Solution 3: Ensure node_modules/.bin is in PATH

If the above don't work, the issue might be that `node_modules/.bin` isn't in the PATH. Try:

```
cd frontend && npm install && PATH=$PATH:./node_modules/.bin && vite build
```

## Why This Happens

The error occurs because:
- Vite is installed as a devDependency
- The `vite` binary is in `node_modules/.bin/vite`
- Sometimes the PATH doesn't include `node_modules/.bin` in the build environment
- Using `npx` ensures it finds and executes vite correctly

## Recommended Fix

**Use `npx vite build`** in your build command - this is the most reliable solution:

```
cd frontend && npm install && npx vite build
```

After updating, commit and push to trigger a new deployment, or manually redeploy from Render dashboard.

