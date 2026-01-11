# Frontend-Backend Connection Guide

This guide explains how to connect the EDUverse frontend (React/Vite) with the backend (Node.js/Express).

## Quick Setup

### For Local Development

1. **Backend Setup:**
   ```bash
   # In the root directory
   npm install
   # Create .env file in root
   cp .env.example .env
   # Edit .env and set:
   # MONGODB_URI=your_mongodb_connection_string
   # CLIENT_URL=http://localhost:5173
   # JWT_SECRET=your_secret_key
   # PORT=5000
   npm run dev:server
   ```

2. **Frontend Setup:**
   ```bash
   # In the client directory
   cd client
   npm install
   # Create .env file in client directory
   cp .env.example .env
   # Edit .env and set:
   # VITE_API_URL=http://localhost:5000/api
   npm run dev
   ```

### For Production Deployment

1. **Deploy Backend First:**
   - Deploy to Railway, Render, Heroku, or similar
   - Get your backend URL (e.g., `https://eduverse-api.railway.app`)
   - Set environment variables in your backend hosting service

2. **Deploy Frontend:**
   - Deploy to Vercel
   - Set `VITE_API_URL` in Vercel dashboard to your backend URL
   - Update backend `CLIENT_URL` to your Vercel frontend URL

## Environment Variables

### Backend Environment Variables

Create a `.env` file in the **root directory**:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/eduverse
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eduverse?retryWrites=true&w=majority

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173
# For production:
# CLIENT_URL=https://your-frontend.vercel.app

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Optional: Redis (if using caching)
# REDIS_URL=redis://localhost:6379
```

### Frontend Environment Variables

Create a `.env` file in the **client directory**:

```env
# Backend API URL
VITE_API_URL=http://localhost:5000/api
# For production:
# VITE_API_URL=https://your-backend-api.com/api
```

**Important:** 
- Frontend variables must start with `VITE_` to be accessible in client-side code
- The API URL should include `/api` at the end
- No trailing slash after `/api`

## Connection Flow

```
Frontend (React)          Backend (Express)
     |                          |
     |  HTTP Request            |
     |  (with Authorization)    |
     |------------------------->|
     |                          |
     |  JSON Response           |
     |  (with data/token)       |
     |<-------------------------|
     |                          |
```

## API Configuration

### Frontend (`client/src/api/api.ts`)

The frontend uses Axios with:
- Base URL from `VITE_API_URL` environment variable
- Automatic token injection from localStorage
- Error handling interceptors
- 15-second timeout

### Backend (`src/server.ts`)

The backend:
- Listens on port 5000 (or `PORT` env variable)
- CORS configured to allow `CLIENT_URL`
- API routes under `/api/*`
- WebSocket support for real-time features

## Testing the Connection

### 1. Start Backend

```bash
# In root directory
npm run dev:server
```

You should see:
```
MongoDB Connected: ...
Server running in development mode on port 5000
```

### 2. Start Frontend

```bash
# In client directory
cd client
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### 3. Test API Connection

Open browser console (F12) and check:
- Look for: `🔗 API URL: http://localhost:5000/api`
- Try to register/login
- Check Network tab for API requests

### 4. Test Health Endpoint

```bash
# Test backend health
curl http://localhost:5000/api/health

# Should return:
# {"success":true,"message":"EDUverse API is running"}
```

## Common Issues and Solutions

### Issue 1: CORS Errors

**Error:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution:**
1. Check `CLIENT_URL` in backend `.env` matches your frontend URL
2. For local dev: `CLIENT_URL=http://localhost:5173`
3. Restart backend after changing `.env`

### Issue 2: Connection Refused

**Error:** `ERR_CONNECTION_REFUSED` or `Unable to connect to server`

**Solution:**
1. Verify backend is running: `curl http://localhost:5000/api/health`
2. Check `VITE_API_URL` in frontend `.env` is correct
3. Ensure no firewall blocking port 5000
4. Check backend logs for errors

### Issue 3: 404 Not Found

**Error:** `404 Route /api/auth/login not found`

**Solution:**
1. Verify API URL includes `/api`: `http://localhost:5000/api`
2. Check backend routes are mounted correctly
3. Verify backend is running and routes are registered

### Issue 4: Environment Variables Not Working

**Error:** Using default localhost URL in production

**Solution:**
1. **Local:** Create `.env` file in `client/` directory
2. **Vercel:** Set `VITE_API_URL` in Vercel Dashboard → Settings → Environment Variables
3. **Important:** Restart dev server after changing `.env` files
4. **Important:** Redeploy after changing Vercel environment variables

## Production Deployment

### Step 1: Deploy Backend

1. Choose hosting: Railway, Render, Heroku, etc.
2. Set environment variables:
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=your_production_mongodb_uri
   CLIENT_URL=https://your-frontend.vercel.app
   JWT_SECRET=your_production_secret
   ```
3. Deploy and get backend URL (e.g., `https://api.eduverse.railway.app`)

### Step 2: Deploy Frontend

1. Deploy to Vercel
2. Set environment variable in Vercel:
   - Name: `VITE_API_URL`
   - Value: `https://api.eduverse.railway.app/api`
   - Environments: Production, Preview, Development
3. Redeploy frontend

### Step 3: Update Backend CORS

1. Update backend `CLIENT_URL` to your Vercel URL
2. Redeploy backend

## Verification Checklist

### Local Development
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] MongoDB connected
- [ ] Backend `.env` has `CLIENT_URL=http://localhost:5173`
- [ ] Frontend `.env` has `VITE_API_URL=http://localhost:5000/api`
- [ ] Browser console shows: `🔗 API URL: http://localhost:5000/api`
- [ ] Can register/login successfully
- [ ] No CORS errors in console

### Production
- [ ] Backend deployed and accessible
- [ ] Frontend deployed to Vercel
- [ ] `VITE_API_URL` set in Vercel (production backend URL)
- [ ] `CLIENT_URL` set in backend (Vercel frontend URL)
- [ ] CORS configured correctly
- [ ] API calls work from deployed frontend
- [ ] No console errors

## API Endpoints

The backend exposes these endpoints:

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses/:id/enroll` - Enroll in course
- `POST /api/lessons/:id/complete` - Complete lesson
- `GET /api/game/quests` - Get quests
- `POST /api/game/quests/:id/complete` - Complete quest
- `GET /api/game/achievements` - Get achievements
- `GET /api/social/friends` - Get friends list
- `GET /api/health` - Health check

All protected routes require `Authorization: Bearer <token>` header.

## WebSocket Connection

For real-time features (chat, notifications), the frontend connects via Socket.io:

```typescript
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
```

The WebSocket URL should be the backend URL without `/api`.

## Next Steps

1. **Test locally** - Ensure everything works in development
2. **Deploy backend** - Choose a hosting service
3. **Deploy frontend** - Deploy to Vercel
4. **Configure environment variables** - Set in both services
5. **Test production** - Verify API calls work
6. **Monitor** - Check logs for any connection issues

## Support

If you encounter issues:
1. Check browser console for errors
2. Check backend logs
3. Verify environment variables are set correctly
4. Test backend health endpoint
5. Review CORS configuration
6. Check network tab for failed requests
