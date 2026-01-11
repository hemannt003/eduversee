# Troubleshooting Registration and Login Issues

## Common Issues After Deployment

### Issue: "Registration failed" or "Login failed" Error

This error can occur for several reasons. Follow these steps to diagnose:

## 1. Check API URL Configuration

**Problem:** The frontend cannot connect to the backend API.

**Solution:**
1. Verify `VITE_API_URL` is set in Vercel:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Check if `VITE_API_URL` is set to your backend URL (e.g., `https://your-backend-api.com/api`)
   - Ensure it's set for Production, Preview, and Development environments

2. Verify the backend URL is correct:
   - Should be the full URL including protocol: `https://your-backend.com/api`
   - Should NOT include trailing slash: `https://your-backend.com/api` ✅ (not `/api/`)

3. Check browser console:
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for "API URL:" log message (in development)
   - Check Network tab for failed requests

## 2. Check Backend Status

**Problem:** Backend is not running or not accessible.

**Solution:**
1. Verify backend is deployed and running:
   - Check your backend hosting service (Railway, Render, Heroku, etc.)
   - Ensure the backend service is active and not sleeping
   - Test backend directly: `curl https://your-backend-api.com/api/auth/register` (should return an error, not connection refused)

2. Check backend logs:
   - Look for errors in backend logs
   - Verify MongoDB connection is working
   - Check if backend is receiving requests

## 3. Check CORS Configuration

**Problem:** Browser blocks requests due to CORS policy.

**Solution:**
1. Verify backend CORS settings:
   - Check `src/server.ts` or your CORS configuration
   - Ensure `CLIENT_URL` environment variable is set to your Vercel frontend URL
   - Example: `CLIENT_URL=https://your-app.vercel.app`

2. Check browser console for CORS errors:
   - Look for "CORS policy" errors in console
   - These indicate backend CORS is not configured correctly

## 4. Check Network Connectivity

**Problem:** Network errors prevent connection to backend.

**Solution:**
1. Check browser Network tab:
   - Open DevTools → Network tab
   - Try to register/login
   - Look for failed requests (red status)
   - Check request URL and response

2. Common network errors:
   - **Failed to fetch**: Backend URL incorrect or backend down
   - **Timeout**: Backend not responding (check timeout settings)
   - **CORS error**: Backend CORS not configured

## 5. Check Error Messages

The improved error handling now provides specific error messages:

- **"Unable to connect to server"**: Network error, backend not reachable
- **"Invalid response from server"**: Backend returned unexpected format
- **"Missing token or user data"**: Backend response missing required fields
- **"Username is required"**: Validation error from backend
- **"User already exists"**: User with that email/username already registered

## 6. Verify Environment Variables

**Backend Environment Variables (Required):**
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://...
CLIENT_URL=https://your-frontend.vercel.app
JWT_SECRET=your-secret-key
```

**Frontend Environment Variables (Vercel):**
```
VITE_API_URL=https://your-backend-api.com/api
```

## 7. Test Backend Directly

Test if backend is working:

```bash
# Test registration endpoint
curl -X POST https://your-backend-api.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"test123"}'

# Should return JSON response, not connection error
```

## 8. Check Browser Console

Open browser DevTools (F12) and check:

1. **Console Tab:**
   - Look for error messages
   - Check "API URL:" log (development mode)
   - Look for JavaScript errors

2. **Network Tab:**
   - Filter by "XHR" or "Fetch"
   - Try to register/login
   - Check failed requests:
     - Click on failed request
     - Check "Headers" tab for request URL
     - Check "Response" tab for error message
     - Check "Preview" tab for JSON response

## Quick Checklist

- [ ] `VITE_API_URL` is set in Vercel environment variables
- [ ] Backend is deployed and running
- [ ] Backend URL is correct (full URL with protocol)
- [ ] `CLIENT_URL` is set in backend environment variables
- [ ] Backend CORS is configured correctly
- [ ] MongoDB connection is working
- [ ] No CORS errors in browser console
- [ ] Network requests are reaching the backend
- [ ] Backend is returning proper JSON responses

## Still Having Issues?

1. **Check browser console** for specific error messages
2. **Check backend logs** for server-side errors
3. **Test backend directly** with curl or Postman
4. **Verify environment variables** are set correctly
5. **Check network tab** to see actual request/response

## Common Error Messages and Solutions

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Registration failed" | Generic error, check console | See specific error in browser console |
| "Unable to connect to server" | Network error | Check backend URL and status |
| "Invalid credentials" | Wrong email/password | Use correct credentials |
| "User already exists" | Email/username taken | Use different email/username |
| "Username is required" | Validation error | Fill all required fields |
| CORS error | Backend CORS not configured | Set CLIENT_URL in backend |

## Debug Mode

In development, the API URL is logged to console. Check browser console for:
```
API URL: https://your-backend-api.com/api
```

If you see `http://localhost:5000/api` in production, `VITE_API_URL` is not set correctly in Vercel.
