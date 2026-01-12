# Backend URL Troubleshooting Guide

## Common Backend URL Issues and Solutions

### Issue 1: URL Format Problems

**Symptoms:**
- API calls fail with 404 errors
- CORS errors
- Connection refused errors

**Common Mistakes:**

1. **Missing `/api` suffix:**
   - ❌ Wrong: `https://api.example.com`
   - ✅ Correct: `https://api.example.com/api`

2. **Trailing slash:**
   - ❌ Wrong: `https://api.example.com/api/`
   - ✅ Correct: `https://api.example.com/api`

3. **Wrong protocol:**
   - ❌ Wrong: `http://api.example.com/api` (in production, should be https)
   - ✅ Correct: `https://api.example.com/api`

4. **Extra path segments:**
   - ❌ Wrong: `https://api.example.com/api/v1`
   - ✅ Correct: `https://api.example.com/api` (unless your backend uses `/api/v1`)

**Solution:**
The code now automatically normalizes URLs:
- Removes trailing slashes
- Ensures `/api` is at the end
- Validates URL format
- Falls back to localhost if invalid

### Issue 2: Environment Variable Not Set

**Error Message:**
```
⚠️ WARNING: API URL is set to localhost in production!
```

**Solution:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Settings → Environment Variables
3. Add `VITE_API_URL` with your backend URL
4. Redeploy

See [VERCEL_ENV_QUICK_SETUP.md](./VERCEL_ENV_QUICK_SETUP.md) for detailed steps.

### Issue 3: Backend Not Accessible

**Symptoms:**
- Network errors
- Timeout errors
- Connection refused

**Checklist:**
- [ ] Backend is deployed and running
- [ ] Backend URL is correct and accessible
- [ ] Test backend directly: `curl https://your-backend.com/api/health`
- [ ] Check backend logs for errors
- [ ] Verify backend is not sleeping (free tier services may sleep)

### Issue 4: CORS Errors

**Error:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution:**
1. Check backend `CLIENT_URL` environment variable
2. Ensure it matches your Vercel frontend URL
3. Example: `CLIENT_URL=https://your-app.vercel.app`
4. Restart backend after changing `CLIENT_URL`

### Issue 5: Mixed Content (HTTP/HTTPS)

**Error:**
```
Mixed Content: The page was loaded over HTTPS, but requested an insecure resource
```

**Solution:**
- Always use `https://` in production
- Never use `http://` for production backend URLs
- Ensure backend supports HTTPS

## URL Validation

The application now automatically:
- ✅ Normalizes URLs (removes trailing slashes)
- ✅ Ensures `/api` suffix is present
- ✅ Validates URL format
- ✅ Provides helpful error messages
- ✅ Falls back gracefully on invalid URLs

## Testing Your Backend URL

### Method 1: Health Check
```bash
curl https://your-backend-url.com/api/health

# Should return:
# {"success":true,"message":"EDUverse API is running"}
```

### Method 2: Browser Console
1. Open your deployed site
2. Press F12 → Console tab
3. Look for: `🔗 API URL: https://your-backend-url.com/api (Production)`
4. If you see localhost, `VITE_API_URL` is not set correctly

### Method 3: Network Tab
1. Open browser DevTools → Network tab
2. Try to register/login
3. Check the failed request
4. Look at the request URL - it should be your backend URL, not localhost

## Quick Fix Checklist

- [ ] Backend is deployed and running
- [ ] Backend URL is accessible (test with curl)
- [ ] `VITE_API_URL` is set in Vercel
- [ ] URL includes `/api` at the end
- [ ] URL uses `https://` (not `http://`)
- [ ] No trailing slash after `/api`
- [ ] Application redeployed after setting variable
- [ ] Backend `CLIENT_URL` matches Vercel frontend URL
- [ ] CORS is configured correctly

## Examples

### Correct URLs
```
✅ https://eduverse-api.railway.app/api
✅ https://api.eduverse.com/api
✅ http://localhost:5000/api (local development only)
```

### Incorrect URLs
```
❌ https://eduverse-api.railway.app (missing /api)
❌ https://eduverse-api.railway.app/api/ (trailing slash)
❌ http://eduverse-api.railway.app/api (http in production)
❌ eduverse-api.railway.app/api (missing protocol)
```

## Still Having Issues?

1. **Check browser console** for specific error messages
2. **Check Vercel build logs** for environment variable issues
3. **Test backend directly** with curl or Postman
4. **Verify environment variables** are set correctly
5. **Check network tab** to see actual request URLs
6. **Review backend logs** for connection attempts
