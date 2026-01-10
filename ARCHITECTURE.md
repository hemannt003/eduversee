# EDUverse Architecture

## System Overview

EDUverse is a full-stack gamified learning platform built with modern technologies and best practices for scalability and maintainability.

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis (optional)
- **Real-time**: Socket.io
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Rate Limiting**: express-rate-limit

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Notifications**: react-hot-toast
- **Real-time**: Socket.io Client

## Architecture Patterns

### Backend Architecture

```
src/
├── models/          # MongoDB schemas and models
├── controllers/     # Business logic and request handlers
├── routes/         # API route definitions
├── middleware/     # Authentication, error handling, rate limiting
├── utils/          # Helper functions (cache, token generation)
├── scripts/        # Database seeding scripts
└── server.ts       # Application entry point
```

### Frontend Architecture

```
client/src/
├── components/     # Reusable UI components
├── pages/          # Page components (routes)
├── store/          # State management (Zustand)
├── api/            # API client configuration
└── App.tsx         # Main application component
```

## Key Features Implementation

### 1. Authentication System
- JWT-based stateless authentication
- Password hashing with bcryptjs
- Protected routes with middleware
- Role-based access control (student, instructor, admin)

### 2. XP and Level System
- Dynamic level calculation: `level = floor(sqrt(xp / 100)) + 1`
- Automatic level-up detection
- Progress tracking with visual indicators
- Streak system for daily engagement

### 3. Course System
- Course creation and management
- Lesson progression tracking
- Enrollment system
- XP rewards for completion
- Category and difficulty filtering

### 4. Game Mechanics

#### Achievements
- Automatic achievement checking
- Multiple requirement types (XP, level, streak, friends)
- Rarity system (common, rare, epic, legendary)
- XP rewards for unlocking

#### Quests
- Daily, weekly, and special quests
- Automatic expiration
- Progress tracking
- Reward system (XP, badges)

#### Leaderboards
- Real-time ranking by XP or Level
- Cached for performance
- Pagination support

### 5. Social Systems

#### Friends
- Friend request system
- Bidirectional friendship
- Friend activity feed

#### Teams/Guilds
- Team creation and management
- Team XP and levels
- Member management
- Team leaderboards (future)

#### Activity Feed
- Real-time activity updates
- Friend activity aggregation
- Activity types: lesson completion, level up, achievements, etc.

### 6. Scalability Features

#### Caching Strategy
- Redis caching for:
  - Leaderboard data (1 minute TTL)
  - Course listings (5 minutes TTL)
  - User data (on-demand invalidation)
- Cache invalidation on updates

#### Rate Limiting
- General API: 100 requests per 15 minutes
- Authentication: 5 attempts per 15 minutes
- Course creation: 10 per hour

#### Database Optimization
- Strategic indexes on:
  - User: email, username, xp, level
  - Course: category, difficulty, isPublished
  - Activity: user, type, createdAt
- Efficient queries with pagination
- Population for related data

#### Real-time Updates
- WebSocket connections via Socket.io
- Room-based messaging
- Activity broadcasting
- Chat support (infrastructure ready)

## Data Flow

### User Registration Flow
1. User submits registration form
2. Backend validates input
3. Password is hashed
4. User document created
5. JWT token generated
6. Token returned to client
7. Client stores token and redirects

### Course Completion Flow
1. User completes lesson
2. Backend marks lesson as completed
3. XP added to user
4. Level recalculated
5. Achievement check triggered
6. Activity created
7. Real-time update broadcast
8. Cache invalidated

### Achievement Unlocking Flow
1. User action triggers achievement check
2. System evaluates all unmet achievements
3. Requirements checked against user stats
4. Achievements unlocked and added to user
5. XP rewards applied
6. Activity created
7. Notification sent (if real-time enabled)

## Security Considerations

1. **Password Security**
   - Bcrypt hashing with salt rounds
   - Minimum password length enforcement

2. **Authentication**
   - JWT tokens with expiration
   - Token stored securely on client
   - Protected routes with middleware

3. **Rate Limiting**
   - Prevents brute force attacks
   - API abuse prevention
   - Resource protection

4. **Input Validation**
   - Server-side validation
   - Sanitization of user input
   - Type checking with TypeScript

5. **CORS Configuration**
   - Restricted to allowed origins
   - Credentials support

## Performance Optimizations

1. **Database**
   - Indexed queries
   - Selective field projection
   - Efficient population
   - Pagination

2. **Caching**
   - Frequently accessed data cached
   - Smart cache invalidation
   - Reduced database load

3. **Frontend**
   - Code splitting with Vite
   - Lazy loading routes
   - Optimized re-renders

4. **API**
   - Response compression
   - Efficient serialization
   - Batch operations where possible

## Future Enhancements

1. **Real-time Chat**
   - Direct messaging
   - Team chat rooms
   - Notification system

2. **Advanced Analytics**
   - Learning progress tracking
   - Performance metrics
   - Personalized recommendations

3. **Content Management**
   - Rich text editor
   - Video lesson support
   - Interactive quizzes

4. **Monetization**
   - Premium courses
   - Subscription system
   - Payment integration

5. **Mobile App**
   - React Native version
   - Push notifications
   - Offline support

## Deployment Considerations

1. **Environment Variables**
   - Secure secret management
   - Environment-specific configs
   - Database connection strings

2. **Database**
   - MongoDB Atlas for production
   - Connection pooling
   - Backup strategy

3. **Caching**
   - Redis cluster for high availability
   - Cache warming strategies

4. **Monitoring**
   - Error tracking (Sentry)
   - Performance monitoring
   - Log aggregation

5. **Scaling**
   - Horizontal scaling with load balancer
   - Stateless application design
   - CDN for static assets
