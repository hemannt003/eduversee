# EDUverse - Gamified Learning Platform

A comprehensive gamified learning platform with advanced game mechanics, social systems, and scalability features.

## Features

### Core Features
- User authentication (JWT-based)
- Course management system
- XP and level progression
- User dashboard

### Advanced Game Mechanics
- Achievements and badges
- Quest system
- Leaderboards
- Daily challenges
- Streak tracking

### Social Systems
- Friend system
- Teams/Guilds
- Real-time chat
- Activity feed
- Social leaderboards

### Scalability Features
- Redis caching
- Rate limiting
- Database indexing
- Optimized queries
- Real-time updates via WebSocket

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React, TypeScript, Vite
- **Database**: MongoDB with Mongoose
- **Caching**: Redis
- **Real-time**: Socket.io
- **Authentication**: JWT

## Setup

1. Install dependencies:
```bash
npm install
cd client && npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start MongoDB and Redis:
```bash
# MongoDB
mongod

# Redis
redis-server
```

4. Run development server:
```bash
npm run dev
```

## Deployment

**Important**: This application uses a separated frontend/backend architecture:

- **Frontend**: Deployed to Vercel (static hosting)
- **Backend**: Must be deployed separately to Railway, Render, Heroku, or similar service

Vercel's free tier only supports static sites and serverless functions, not long-running Node.js servers. The Express backend with WebSocket support requires a service that supports persistent connections.

See [DEPLOYMENT_ARCHITECTURE.md](./DEPLOYMENT_ARCHITECTURE.md) for detailed deployment instructions.

## Environment Variables

### Local Development

1. Copy the example environment file:
   ```bash
   cd client
   cp .env.example .env
   ```

2. Edit `.env` with your local backend URL:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

### Vercel Deployment

**⚠️ IMPORTANT:** If you see the error "Backend connection failed. The API URL is set to localhost in production", you need to set `VITE_API_URL` in Vercel.

**Quick Fix:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → **Settings** → **Environment Variables**
2. Click **Add New**
3. **Name:** `VITE_API_URL`
4. **Value:** `https://your-backend-url.com/api` (your actual backend URL with `/api`)
5. **Environments:** Select all (Production, Preview, Development)
6. Click **Save**
7. **Redeploy** your application (Deployments → ... → Redeploy)

**See [VERCEL_ENV_QUICK_SETUP.md](./VERCEL_ENV_QUICK_SETUP.md) for step-by-step guide with screenshots.**

For detailed setup, see [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md).

## API Documentation

See `/api-docs` endpoint for detailed API documentation.
