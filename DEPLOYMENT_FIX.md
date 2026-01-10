# Deployment Error Fixes

## Common Deployment Issues and Solutions

### Issue 1: Vercel Configuration Conflict

**Problem:** Two `vercel.json` files (root and client) can cause conflicts.

**Solution:** 
- **Option A (Recommended):** Set root directory to `client` in Vercel dashboard and use `client/vercel.json`
- **Option B:** Use root `vercel.json` with proper build configuration

### Issue 2: Build Command Failures

**Common Errors:**
- `npm install` fails
- TypeScript compilation errors
- Missing dependencies

**Solutions:**
1. Ensure all dependencies are in `client/package.json`
2. Check Node.js version (Vercel uses Node 18.x by default)
3. Verify TypeScript configuration

### Issue 3: Environment Variables

**Problem:** `VITE_API_URL` not set or incorrect format.

**Solution:**
- Set `VITE_API_URL` in Vercel dashboard: Settings > Environment Variables
- Format: `https://your-api-domain.com/api` (must include `/api`)
- Redeploy after adding/changing environment variables

### Issue 4: Routing Issues (404 on refresh)

**Problem:** SPA routes return 404 on direct access or refresh.

**Solution:** Ensure `vercel.json` has the rewrite rule:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Issue 5: Build Output Directory

**Problem:** Vercel can't find build output.

**Solution:**
- Verify `outputDirectory` is set to `dist` in `vercel.json`
- Check that `vite.config.ts` outputs to `dist` directory

## Recommended Deployment Steps

### For Vercel Dashboard:

1. **Import Project**
   - Go to vercel.com/dashboard
   - Click "Add New Project"
   - Import GitHub repository

2. **Configure Settings**
   - **Root Directory:** `client`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

3. **Environment Variables**
   - Add `VITE_API_URL` with your backend API URL
   - Format: `https://your-api.com/api`

4. **Deploy**
   - Click "Deploy"
   - Monitor build logs

### For Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Navigate to client directory
cd client

# Deploy
vercel

# Set environment variable
vercel env add VITE_API_URL production

# Production deploy
vercel --prod
```

## Troubleshooting Commands

### Test Build Locally:
```bash
cd client
npm install
npm run build
```

### Check for TypeScript Errors:
```bash
cd client
npx tsc --noEmit
```

### Verify Environment Variables:
```bash
# In client directory
echo $VITE_API_URL
```

## Fixed Configuration Files

### Root `vercel.json`
- Updated to use Vercel v2 API
- Proper build configuration for client directory

### Client `vercel.json`
- Added cache headers for assets
- Proper SPA routing configuration

## Next Steps

1. **Set Root Directory in Vercel:**
   - Go to Project Settings > General
   - Set Root Directory to `client`
   - Save

2. **Add Environment Variables:**
   - Go to Settings > Environment Variables
   - Add `VITE_API_URL` with your backend URL

3. **Redeploy:**
   - Trigger a new deployment
   - Check build logs for errors

4. **Test:**
   - Visit deployment URL
   - Test authentication
   - Verify API calls work

## Common Error Messages and Fixes

### "Build Command Failed"
- Check `client/package.json` has all dependencies
- Verify Node.js version compatibility
- Check build logs for specific error

### "Module Not Found"
- Run `npm install` in client directory
- Check `package.json` dependencies
- Verify import paths are correct

### "Environment Variable Not Found"
- Ensure variable name is `VITE_API_URL` (with `VITE_` prefix)
- Check variable is set for correct environment (production/preview)
- Redeploy after adding variables

### "404 on Routes"
- Verify `vercel.json` has rewrite rule
- Check `outputDirectory` is correct
- Ensure SPA routing is configured
