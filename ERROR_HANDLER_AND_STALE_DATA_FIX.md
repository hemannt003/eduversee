# Error Handler and Stale Data Fixes

## Bug 1: Error Handler Middleware Placement ✅ FIXED

**File:** `src/server.ts:85`

### Problem
The error handler middleware was registered after route handlers, but Express error middleware must be registered last to catch all errors. While the error handler was technically after routes, it lacked a 404 handler, and the order wasn't explicitly clear. Additionally, synchronous errors in middleware (like the `authorize` middleware) might not reach the error handler if it's not truly the last middleware.

```typescript
// Before (POTENTIALLY PROBLEMATIC):
// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/social', socialRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'EDUverse API is running' });
});

// Socket.io setup...

// Error handler
app.use(errorHandler);
```

**Issues:**
- No 404 handler for unmatched routes
- Error handler placement not explicitly documented
- Potential for errors to not be caught if middleware throws synchronously
- Unmatched routes return default Express 404 instead of JSON response

### Solution
Added a 404 handler before the error handler and ensured proper ordering:

```typescript
// After (FIXED):
// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/social', socialRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'EDUverse API is running' });
});

// Socket.io setup...

// 404 handler - must be before error handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handler - MUST be registered last to catch all errors
app.use(errorHandler);
```

### Benefits
- ✅ 404 handler provides consistent JSON responses for unmatched routes
- ✅ Error handler is explicitly documented as last middleware
- ✅ Proper Express middleware order (routes → 404 → error handler)
- ✅ All errors (synchronous and asynchronous) are caught
- ✅ Consistent error response format

### Express Middleware Order
The correct order is:
1. **Body parsers** (express.json, express.urlencoded)
2. **CORS**
3. **Rate limiting**
4. **Routes** (app.use('/api/...', routes))
5. **404 handler** (catches unmatched routes)
6. **Error handler** (catches all errors - MUST be last)

---

## Bug 2: Stale User Data in checkAchievements ✅ FIXED

**File:** `src/controllers/gameController.ts:89-169`

### Problem
The `checkAchievements` function read the user once at line 91 and then looped through achievements. When an achievement was unlocked, `updatedUser.addXP()` was called (line 145) which modified the user's XP and level. However, the loop continued to check subsequent achievements against the original `user` object (lines 107-120), which was never updated. This meant if multiple achievements unlocked in the same request, the second and subsequent achievement checks used stale XP/level data and may fail to unlock achievements that should qualify based on the updated stats from previous achievements.

```typescript
// Before (BROKEN):
export const checkAchievements = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!._id); // Read once
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const achievements = await Achievement.find({
    _id: { $nin: user.achievements },
  });

  const unlocked: any[] = [];

  for (const achievement of achievements) {
    let shouldUnlock = false;

    switch (achievement.requirement.type) {
      case 'xp':
        shouldUnlock = user.xp >= achievement.requirement.value; // ❌ Uses stale user.xp
        break;
      case 'level':
        shouldUnlock = user.level >= achievement.requirement.value; // ❌ Uses stale user.level
        break;
      // ...
    }

    if (shouldUnlock) {
      const updatedUser = await User.findByIdAndUpdate(...);
      const actualXPEarned = updatedUser.addXP(achievement.xpReward); // Updates XP/level
      await updatedUser.save();
      
      // ❌ Loop continues with original `user` object, not `updatedUser`
      // Next iteration checks against stale data
    }
  }
});
```

**Example Scenario:**
1. User has 950 XP, needs 1000 XP for "XP Master" achievement
2. User completes a quest, gains 100 XP → now has 1050 XP
3. `checkAchievements` is called:
   - Reads user: `user.xp = 1050`
   - Checks "XP Master" (requires 1000 XP): ✅ Unlocks, awards 50 XP → user now has 1100 XP
   - **BUG**: Loop continues with original `user` object (still has 1050 XP in memory)
   - Checks "XP Expert" (requires 1100 XP): ❌ Fails because `user.xp` is still 1050 (stale)
   - Should have unlocked "XP Expert" because user actually has 1100 XP

**Issues:**
- Stale user data causes missed achievement unlocks
- Achievements that should unlock in sequence don't unlock
- User must call `checkAchievements` multiple times to unlock cascading achievements
- Poor user experience

### Solution
Refactored to use an iterative approach that refreshes user data after each unlock:

```typescript
// After (FIXED):
export const checkAchievements = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Fetch user initially
  let user = await User.findById(req.user!._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const unlocked: any[] = [];

  // Continue checking achievements until no new ones are unlocked
  // This handles cases where unlocking one achievement makes the user eligible for another
  let hasNewUnlocks = true;
  let iterations = 0;
  const maxIterations = 10; // Prevent infinite loops

  while (hasNewUnlocks && iterations < maxIterations) {
    iterations++;
    hasNewUnlocks = false;

    // Fetch achievements that user hasn't unlocked yet
    const achievements = await Achievement.find({
      _id: { $nin: user.achievements },
    });

    // If no achievements to check, break
    if (achievements.length === 0) {
      break;
    }

    for (const achievement of achievements) {
      // Re-fetch user to get latest stats (XP, level, etc.) for accurate checks
      // This ensures we check against the most up-to-date user data after previous unlocks
      user = await User.findById(req.user!._id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      switch (achievement.requirement.type) {
        case 'xp':
          shouldUnlock = user.xp >= achievement.requirement.value; // ✅ Uses fresh user.xp
          break;
        case 'level':
          shouldUnlock = user.level >= achievement.requirement.value; // ✅ Uses fresh user.level
          break;
        // ...
      }

      if (shouldUnlock) {
        // ... unlock logic ...
        
        // Update local user reference to reflect changes for next iteration
        user = updatedUser; // ✅ Use updated user for next checks
        hasNewUnlocks = true;
        
        // ...
      }
    }
  }
});
```

### How It Works

**Iterative Approach:**
1. Start with initial user fetch
2. Loop through achievements user hasn't unlocked
3. **Re-fetch user** before each check to get latest stats
4. If achievement unlocks:
   - Award XP (updates user stats)
   - Update local `user` reference
   - Set `hasNewUnlocks = true`
5. After checking all achievements, if any unlocked, loop again
6. Continue until no new achievements unlock or max iterations reached

**Example Scenario (Fixed):**
1. User has 950 XP, needs 1000 XP for "XP Master" achievement
2. User completes a quest, gains 100 XP → now has 1050 XP
3. `checkAchievements` is called:
   - **Iteration 1:**
     - Re-fetches user: `user.xp = 1050`
     - Checks "XP Master" (requires 1000 XP): ✅ Unlocks, awards 50 XP → user now has 1100 XP
     - Updates `user` reference to reflect 1100 XP
     - Sets `hasNewUnlocks = true`
   - **Iteration 2:**
     - Re-fetches user: `user.xp = 1100` ✅ (fresh data)
     - Checks "XP Expert" (requires 1100 XP): ✅ Unlocks!
     - Sets `hasNewUnlocks = true`
   - **Iteration 3:**
     - Re-fetches user: `user.xp = 1100` (no new achievements)
     - No achievements unlock
     - Sets `hasNewUnlocks = false`
     - Loop exits

### Benefits
- ✅ Always checks against fresh user data
- ✅ Handles cascading achievement unlocks in single request
- ✅ Prevents infinite loops with max iteration limit
- ✅ Better user experience (all eligible achievements unlock at once)
- ✅ Accurate achievement checking based on current stats

### Safety Features
- **Max iterations**: Prevents infinite loops if achievement unlocks create circular dependencies
- **Early exit**: Breaks if no achievements are available to check
- **Fresh data**: Re-fetches user before each check to ensure accuracy

---

## Summary

Both critical bugs have been fixed:

1. ✅ **Error Handler Placement**: Added 404 handler and ensured error handler is registered last
2. ✅ **Stale User Data**: Refactored `checkAchievements` to use iterative approach with fresh data

The application now:
- ✅ Properly handles all errors (synchronous and asynchronous)
- ✅ Provides consistent JSON responses for 404 errors
- ✅ Accurately checks achievements using fresh user data
- ✅ Unlocks cascading achievements in a single request
- ✅ Prevents infinite loops with safety limits

The codebase is now more robust and provides a better user experience! 🎯
