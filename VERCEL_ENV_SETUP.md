# Vercel Environment Variables Setup Guide

## Overview

This guide explains how to connect Vercel to your environment variables (not browser localStorage, but server-side environment variables).

## Environment Variables Needed

### Frontend (Vercel)
- `VITE_API_URL` - Your backend API URL

### Backend (Separate Service)
- `NODE_ENV` - Environment (production/development)
- `PORT` - Server port
- `MONGODB_URI` - MongoDB connection string
- `CLIENT_URL` - Frontend URL (your Vercel domain)
- `JWT_SECRET` - Secret key for JWT tokens
- `REDIS_URL` - Redis connection (optional)

## Setting Up Vercel Environment Variables

### Method 1: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project

2. **Navigate to Settings**
   - Click on your project
   - Go to **Settings** → **Environment Variables**

3. **Add Environment Variables**
   - Click **Add New**
   - Enter variable name: `VITE_API_URL`
   - Enter value: `https://your-backend-api.com/api`
   - Select environments: **Production**, **Preview**, **Development**
   - Click **Save**

4. **Redeploy**
   - After adding variables, go to **Deployments**
   - Click **...** on latest deployment → **Redeploy**
   - Or push a new commit to trigger auto-deploy

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Add environment variable
vercel env add VITE_API_URL

# Follow prompts:
# - Enter value: https://your-backend-api.com/api
# - Select environments: Production, Preview, Development

# Pull environment variables to local .env file
vercel env pull .env.local
```

### Method 3: Using .env File (Local Development Only)

For local development, create a `.env` file in the `client/` directory:

```bash
cd client
touch .env
```

Add to `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

**Important:** 
- `.env` files are for local development only
- Never commit `.env` files to git (they're in `.gitignore`)
- Vercel uses its own environment variables, not `.env` files

## Environment Variable Format

### Frontend Variables (Vite)
- **Must start with `VITE_`** to be exposed to client-side code
- Example: `VITE_API_URL`
- Access in code: `import.meta.env.VITE_API_URL`

### Backend Variables
- No prefix needed
- Example: `MONGODB_URI`, `JWT_SECRET`
- Access in code: `process.env.MONGODB_URI`

## Verification

### Check if Variables are Set

1. **In Vercel Dashboard:**
   - Settings → Environment Variables
   - Verify all variables are listed

2. **In Build Logs:**
   - Go to Deployments → [Latest] → Build Logs
   - Look for environment variable usage (they won't show values for security)

3. **In Application:**
   - Open browser console on deployed site
   - Check Network tab for API calls
   - Verify API URL matches your `VITE_API_URL`

## Common Issues

### Issue: Environment Variable Not Working

**Symptoms:**
- API calls fail
- Using default fallback URL
- Build succeeds but runtime fails

**Solutions:**
1. Verify variable name starts with `VITE_` for frontend
2. Check variable is set for correct environment (Production/Preview/Development)
3. Redeploy after adding/changing variables
4. Clear browser cache and hard refresh

### Issue: Variable Shows as Undefined

**Solutions:**
1. Ensure variable name is correct (case-sensitive)
2. Check variable is set for the environment you're using
3. Redeploy the application
4. Verify in build logs that variable is being used

### Issue: Local Development Not Working

**Solutions:**
1. Create `.env` file in `client/` directory
2. Add `VITE_API_URL=http://localhost:5000/api`
3. Restart dev server: `npm run dev`
4. Verify `.env` is in `.gitignore`

## Environment-Specific Configuration

### Production
```
VITE_API_URL=https://api.yourdomain.com/api
```

### Preview (Staging)
```
VITE_API_URL=https://staging-api.yourdomain.com/api
```

### Development (Local)
```
VITE_API_URL=http://localhost:5000/api
```

## Security Best Practices

1. **Never commit `.env` files**
   - Already in `.gitignore`
   - Use `.env.example` for documentation

2. **Use different values per environment**
   - Production: Production API
   - Preview: Staging API
   - Development: Local API

3. **Rotate secrets regularly**
   - Update JWT_SECRET periodically
   - Update API keys if compromised

4. **Use Vercel's environment variable encryption**
   - Variables are encrypted at rest
   - Only accessible during build/runtime

## Quick Setup Checklist

- [ ] Backend deployed and accessible
- [ ] Backend URL obtained
- [ ] Vercel project created
- [ ] `VITE_API_URL` added in Vercel dashboard
- [ ] Environment selected (Production/Preview/Development)
- [ ] Application redeployed
- [ ] API calls verified in browser console
- [ ] CORS configured on backend for Vercel domain

## Example: Complete Setup

1. **Backend deployed to Railway:**
   ```
   https://eduverse-api.railway.app
   ```

2. **Set in Vercel:**
   ```
   VITE_API_URL=https://eduverse-api.railway.app/api
   ```

3. **Frontend deployed to Vercel:**
   ```
   https://eduverse.vercel.app
   ```

4. **Set in Backend (Railway):**
   ```
   CLIENT_URL=https://eduverse.vercel.app
   ```

5. **Verify:**
   - Frontend makes API calls to Railway backend
   - Backend allows requests from Vercel domain
   - Everything works! ✅

## Troubleshooting

### Check Environment Variables in Code

Add temporary logging (remove after debugging):

```typescript
// In api.ts or authStore.ts
console.log('API URL:', import.meta.env.VITE_API_URL);
```

### Verify Build-Time vs Runtime

- `VITE_*` variables are embedded at **build time**
- Changes require **rebuild/redeploy**
- Not available at runtime like server-side env vars

### Test Locally with Production Build

```bash
cd client
npm run build
npm run preview
# Check if API calls work with production build
```

## Next Steps

1. Set up backend environment variables
2. Configure CORS on backend
3. Test API connectivity
4. Monitor deployment logs
5. Set up monitoring/analytics

Your Vercel deployment is now connected to your environment variables! 🚀
