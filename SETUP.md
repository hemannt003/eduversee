# EDUverse Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- Redis (optional, for caching and rate limiting)

## Installation Steps

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Environment Setup

Create a `.env` file in the root directory (or copy from `.env.example`):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/eduverse
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
REDIS_HOST=localhost
REDIS_PORT=6379
CLIENT_URL=http://localhost:5173
```

### 3. Start MongoDB

Make sure MongoDB is running:

```bash
# macOS (using Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Or run directly
mongod
```

### 4. Start Redis (Optional)

If you want to use caching and rate limiting:

```bash
# macOS (using Homebrew)
brew services start redis

# Linux
sudo systemctl start redis

# Or run directly
redis-server
```

### 5. Seed Initial Data

Populate the database with initial achievements, badges, and quests:

```bash
npm run seed
```

### 6. Start Development Servers

```bash
# Start both backend and frontend
npm run dev

# Or start them separately:
# Backend only
npm run dev:server

# Frontend only (in another terminal)
npm run dev:client
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Features Overview

### Core Features ✅
- User authentication (JWT-based)
- Course management system
- XP and level progression
- User dashboard

### Advanced Game Mechanics ✅
- Achievements system with automatic unlocking
- Badges collection
- Quest system (daily, weekly, special)
- Global leaderboards (by XP and Level)
- Streak tracking

### Social Systems ✅
- Friend system (send/accept requests)
- Teams/Guilds (create, join, team XP)
- Activity feed (real-time updates)
- User search functionality

### Scalability Features ✅
- Redis caching for frequently accessed data
- Rate limiting on API endpoints
- Database indexing for performance
- Optimized queries with pagination
- WebSocket support for real-time features

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Courses
- `GET /api/courses` - Get all courses (with filters)
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create course (instructor/admin)
- `PUT /api/courses/:id` - Update course
- `POST /api/courses/:id/enroll` - Enroll in course
- `POST /api/courses/lessons/:id/complete` - Complete lesson

### Game Mechanics
- `GET /api/game/leaderboard` - Get leaderboard
- `GET /api/game/achievements` - Get all achievements
- `POST /api/game/check-achievements` - Check and unlock achievements
- `GET /api/game/quests` - Get active quests
- `POST /api/game/quests/:id/complete` - Complete quest
- `GET /api/game/stats` - Get user stats

### Social
- `GET /api/social/friends` - Get friends and requests
- `POST /api/social/friends/request/:userId` - Send friend request
- `POST /api/social/friends/accept/:userId` - Accept friend request
- `POST /api/social/teams` - Create team
- `GET /api/social/teams/:id` - Get team details
- `POST /api/social/teams/:id/join` - Join team
- `GET /api/social/activity` - Get activity feed
- `GET /api/social/users/search` - Search users

## Database Models

- **User**: Authentication, XP, level, achievements, badges, friends, teams
- **Course**: Course content, instructor, enrolled students
- **Lesson**: Individual lessons within courses
- **Achievement**: Unlockable achievements with requirements
- **Badge**: Collectible badges
- **Quest**: Daily/weekly/special quests
- **Team**: User teams/guilds
- **Activity**: Activity feed entries

## Level System

Level is calculated using the formula:
```
level = floor(sqrt(xp / 100)) + 1
```

XP required for next level:
```
nextLevelXP = level² × 100
```

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Set production environment variables

3. Start the server:
```bash
npm start
```

4. Use a process manager like PM2:
```bash
pm2 start dist/server.js
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check MONGODB_URI in .env file
- Verify MongoDB port (default: 27017)

### Redis Connection Issues
- Redis is optional - the app will work without it
- Caching and rate limiting will be disabled if Redis is unavailable
- Check REDIS_HOST and REDIS_PORT in .env

### Port Already in Use
- Change PORT in .env file
- Or kill the process using the port

## Next Steps

- Add more course categories
- Implement real-time chat
- Add video lesson support
- Implement payment system
- Add analytics dashboard
- Create mobile app
