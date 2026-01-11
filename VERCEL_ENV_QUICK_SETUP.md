# Quick Fix: Set VITE_API_URL in Vercel

## The Error You're Seeing

```
Backend connection failed. The API URL is set to localhost in production. 
Please configure VITE_API_URL in Vercel environment variables.
```

This means your frontend is deployed to Vercel but doesn't know where your backend is located.

## Quick Fix (5 Minutes)

### Step 1: Get Your Backend URL

First, you need your backend API URL. Examples:
- Railway: `https://eduverse-api.railway.app`
- Render: `https://eduverse-api.onrender.com`
- Heroku: `https://eduverse-api.herokuapp.com`
- Custom domain: `https://api.yourdomain.com`

**Important:** Add `/api` at the end!
- ✅ Correct: `https://eduverse-api.railway.app/api`
- ❌ Wrong: `https://eduverse-api.railway.app` (missing `/api`)

### Step 2: Set Environment Variable in Vercel

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Sign in if needed

2. **Select Your Project**
   - Click on your EDUverse project

3. **Navigate to Settings**
   - Click on **Settings** tab (top navigation)
   - Click on **Environment Variables** (left sidebar)

4. **Add New Variable**
   - Click **Add New** button
   - **Name:** `VITE_API_URL`
   - **Value:** `https://your-backend-url.com/api` (replace with your actual backend URL)
   - **Environments:** Select all three:
     - ☑️ Production
     - ☑️ Preview
     - ☑️ Development
   - Click **Save**

5. **Redeploy Your Application**
   - Go to **Deployments** tab
   - Click **...** (three dots) on the latest deployment
   - Click **Redeploy**
   - Or push a new commit to trigger auto-deploy

### Step 3: Verify It's Working

1. **Wait for deployment to complete** (usually 1-2 minutes)

2. **Open your deployed site**

3. **Open browser console** (F12 → Console tab)

4. **Look for:**
   ```
   🔗 API URL: https://your-backend-url.com/api (Production)
   ```
   If you see this, it's working! ✅

5. **Try to register/login** - it should work now

## Visual Guide

```
Vercel Dashboard
├── Your Project
    ├── Settings
        ├── Environment Variables
            └── Add New
                ├── Name: VITE_API_URL
                ├── Value: https://your-backend.com/api
                └── Environments: ☑️ Production ☑️ Preview ☑️ Development
```

## Common Mistakes

### ❌ Wrong Variable Name
- `API_URL` (missing `VITE_` prefix)
- `VITE_API` (missing `_URL`)
- ✅ Correct: `VITE_API_URL`

### ❌ Wrong URL Format
- `https://api.example.com` (missing `/api`)
- `https://api.example.com/api/` (trailing slash)
- ✅ Correct: `https://api.example.com/api`

### ❌ Not Redeploying
- Setting the variable but not redeploying
- ✅ Solution: Always redeploy after adding/changing environment variables

## Still Not Working?

### Check 1: Verify Variable is Set
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `VITE_API_URL` is listed
3. Check the value is correct

### Check 2: Check Deployment Logs
1. Go to Deployments → Latest Deployment → Build Logs
2. Look for any errors
3. Verify the build completed successfully

### Check 3: Test Backend Directly
```bash
# Test if backend is accessible
curl https://your-backend-url.com/api/health

# Should return:
# {"success":true,"message":"EDUverse API is running"}
```

### Check 4: Browser Console
1. Open deployed site
2. Press F12 → Console tab
3. Look for error messages
4. Check Network tab for failed requests

## Example: Complete Setup

**Backend deployed to Railway:**
```
Backend URL: https://eduverse-api.railway.app
```

**Set in Vercel:**
```
Variable Name: VITE_API_URL
Variable Value: https://eduverse-api.railway.app/api
Environments: Production, Preview, Development
```

**After redeploy, browser console should show:**
```
🔗 API URL: https://eduverse-api.railway.app/api (Production)
```

## Need Help?

If you're still having issues:
1. Check browser console for specific error messages
2. Verify backend is running and accessible
3. Test backend health endpoint with curl
4. Check Vercel deployment logs
5. Ensure CORS is configured on backend (CLIENT_URL set to your Vercel domain)

## Quick Checklist

- [ ] Backend is deployed and accessible
- [ ] Backend URL obtained (e.g., `https://api.example.com`)
- [ ] `VITE_API_URL` set in Vercel dashboard
- [ ] Value includes `/api` at the end
- [ ] All environments selected (Production, Preview, Development)
- [ ] Application redeployed after setting variable
- [ ] Browser console shows correct API URL
- [ ] Can register/login successfully
