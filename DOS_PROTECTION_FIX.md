# DoS Protection Fix: Limit Validation

## Bug: Missing Limit Validation in getLeaderboard and searchUsers ✅ FIXED

**Files:** `src/controllers/gameController.ts:36`, `src/controllers/socialController.ts:332`

### Problem
The `getLeaderboard` and `searchUsers` endpoints accept a `limit` query parameter and directly pass it to MongoDB's `limit()` method without validation. An attacker can pass arbitrarily large values (e.g., `limit=999999999`), causing the database to attempt loading massive result sets into memory, leading to denial of service. The `getCourses` endpoint properly validates this with a `validateLimit()` helper that enforces bounds, but these endpoints lack equivalent protections.

```typescript
// Broken code - getLeaderboard
export const getLeaderboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type = 'xp', limit = 100 } = req.query;
  
  const users = await User.find()
    .select('username avatar xp level')
    .sort(sortField)
    .limit(Number(limit));  // ❌ No validation - vulnerable to DoS
});

// Broken code - searchUsers
export const searchUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { q, limit = 20 } = req.query;
  
  const users = await User.find({...})
    .limit(Number(limit));  // ❌ No validation - vulnerable to DoS
});
```

**Security Issues:**
- No maximum limit enforcement
- Attacker can pass `limit=999999999` to exhaust server memory
- Database attempts to load massive result sets
- Denial of Service (DoS) vulnerability
- Inconsistent with other endpoints that use `validateLimit()`

### Solution
Add `validateLimit()` helper function and apply validation to both endpoints:

```typescript
// Fixed code - getLeaderboard
// Helper function to validate and normalize pagination limit
const validateLimit = (limit: any, defaultLimit: number = 100, minLimit: number = 1, maxLimit: number = 100): number => {
  const parsed = Number(limit);
  if (isNaN(parsed) || parsed <= 0) {
    return defaultLimit;
  }
  return Math.max(minLimit, Math.min(parsed, maxLimit));
};

export const getLeaderboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type = 'xp', limit = 100 } = req.query;
  
  // Validate and normalize limit to prevent DoS attacks
  const validatedLimit = validateLimit(limit, 100, 1, 100);
  
  const cacheKey = `leaderboard:${type}:${validatedLimit}`;
  // ... cache logic ...
  
  const users = await User.find()
    .select('username avatar xp level')
    .sort(sortField)
    .limit(validatedLimit);  // ✅ Validated - safe from DoS
});

// Fixed code - searchUsers
export const searchUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { q, limit = 20 } = req.query;
  
  // Validate and normalize limit to prevent DoS attacks
  const validatedLimit = validateLimit(limit, 20, 1, 100);
  
  const users = await User.find({...})
    .limit(validatedLimit);  // ✅ Validated - safe from DoS
});
```

### Changes

**getLeaderboard:**
- ✅ Added `validateLimit()` helper function
- ✅ Validates limit is between 1 and 100
- ✅ Uses validated limit in cache key
- ✅ Uses validated limit in MongoDB query
- ✅ Prevents DoS attacks from large limit values

**searchUsers:**
- ✅ Uses existing `validateLimit()` helper (already in file)
- ✅ Validates limit is between 1 and 100
- ✅ Uses validated limit in MongoDB query
- ✅ Prevents DoS attacks from large limit values

### Security Benefits
- ✅ Prevents DoS attacks via large limit values
- ✅ Enforces maximum limit of 100 records
- ✅ Enforces minimum limit of 1 record
- ✅ Handles invalid/negative values gracefully
- ✅ Consistent with other endpoints (`getCourses`, `getActivityFeed`)
- ✅ Protects database from memory exhaustion

### Attack Scenarios Prevented

**Before (Vulnerable):**
```bash
# Attacker can exhaust server memory
GET /api/game/leaderboard?limit=999999999
GET /api/social/users/search?q=test&limit=999999999
```

**After (Protected):**
```bash
# Large limits are automatically capped at 100
GET /api/game/leaderboard?limit=999999999  # → limit=100
GET /api/social/users/search?q=test&limit=999999999  # → limit=100
```

---

## Summary

Both endpoints are now protected against DoS attacks:

1. ✅ **getLeaderboard**: Added `validateLimit()` helper and validation
2. ✅ **searchUsers**: Added validation using existing `validateLimit()` helper

All endpoints now consistently validate limit parameters, preventing DoS attacks and ensuring system stability! 🔒
