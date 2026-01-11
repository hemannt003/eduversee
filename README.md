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

## API Documentation

See `/api-docs` endpoint for detailed API documentation.
