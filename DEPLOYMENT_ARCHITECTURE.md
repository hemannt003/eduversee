# Deployment Architecture

## Overview

EDUverse uses a **separated frontend/backend architecture**:

- **Frontend (Vite + React)**: Deployed to Vercel (static hosting)
- **Backend (Express + Node.js)**: Must be deployed separately to a service that supports long-running Node.js servers

## Why Separate Deployment?

### Vercel Limitations
- Vercel's free tier only supports:
  - Static site hosting (frontend)
  - Serverless functions (short-lived, event-driven)
- Vercel **does NOT support**:
  - Long-running Node.js servers
  - Persistent WebSocket connections (Socket.io)
  - Background processes
  - Database connections that need to stay alive

### Backend Requirements
The EDUverse backend requires:
- Long-running Express server
- WebSocket support (Socket.io for real-time features)
- MongoDB connection pooling
- Redis caching
- Persistent connections

## Deployment Configuration

### Frontend (Vercel)
- **Location**: `client/` directory
- **Configuration**: `vercel.json` (root) or `client/vercel.json`
- **Build**: Vite production build
- **Output**: Static files in `client/dist/`
- **Status**: ✅ Configured correctly

### Backend (Separate Service)
- **Location**: `src/` directory
- **Entry Point**: `src/server.ts`
- **Requirements**: 
  - Node.js runtime
  - MongoDB database
  - Redis (optional, for caching)
- **Deployment Options**:
  - Railway (recommended)
  - Render
  - Heroku
  - DigitalOcean App Platform
  - AWS EC2 / ECS
  - Google Cloud Run

## Environment Variables

### Frontend (Vercel)
Set in Vercel Dashboard → Settings → Environment Variables:
```
VITE_API_URL=https://your-backend-url.com/api
```

### Backend (Separate Service)
Set in your backend hosting service:
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://...
CLIENT_URL=https://your-frontend-url.vercel.app
REDIS_URL=redis://... (optional)
JWT_SECRET=your-secret-key
```

## Deployment Steps

### 1. Deploy Frontend to Vercel

1. Connect repository to Vercel
2. Set Root Directory to `.` (root) or `client`
3. Vercel will automatically:
   - Detect `vercel.json`
   - Build the frontend
   - Deploy static files

### 2. Deploy Backend Separately

#### Option A: Railway (Recommended)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add MongoDB service
railway add mongodb

# Deploy
railway up
```

#### Option B: Render
1. Create new Web Service
2. Connect GitHub repository
3. Set:
   - Build Command: `npm install && npm run build:server`
   - Start Command: `npm start`
   - Environment: Node
4. Add environment variables
5. Deploy

#### Option C: Heroku
```bash
# Install Heroku CLI
heroku create your-app-name

# Add MongoDB addon
heroku addons:create mongolab

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set CLIENT_URL=https://your-frontend.vercel.app

# Deploy
git push heroku main
```

### 3. Connect Frontend to Backend

1. Get your backend URL (e.g., `https://api.eduverse.railway.app`)
2. Set `VITE_API_URL` in Vercel dashboard
3. Update backend `CLIENT_URL` to your Vercel frontend URL
4. Redeploy both services

## CORS Configuration

Ensure backend allows frontend domain:

```typescript
// src/server.ts
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
```

## Verification Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to separate service
- [ ] `VITE_API_URL` set in Vercel
- [ ] `CLIENT_URL` set in backend
- [ ] CORS configured correctly
- [ ] MongoDB connection working
- [ ] Frontend can make API calls to backend
- [ ] WebSocket connections working (if applicable)

## Current Configuration Status

✅ **Frontend (Vercel)**: Correctly configured
- `vercel.json` builds only the client
- No backend code included in Vercel build
- Static file serving configured

⚠️ **Backend**: Needs separate deployment
- Cannot run on Vercel
- Must deploy to Railway, Render, Heroku, etc.
- See deployment steps above

## Troubleshooting

### Frontend can't connect to backend
- Check `VITE_API_URL` is set correctly
- Verify backend is running
- Check CORS configuration
- Verify backend URL is accessible

### Backend deployment fails
- Check Node.js version compatibility
- Verify all environment variables are set
- Check MongoDB connection string
- Review deployment logs

### WebSocket not working
- Verify backend supports WebSocket
- Check firewall/network settings
- Ensure backend service supports persistent connections
