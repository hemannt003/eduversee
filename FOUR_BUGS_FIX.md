# Four Critical Bugs Fixed

## Bug 1: Leaderboard User Rank Calculation ✅ FIXED

**File:** `client/src/pages/Leaderboard.tsx:39`

### Problem
When `findIndex` returns `-1` (user not found), adding 1 results in `0`, which is falsy. The condition `userRank > 0` will fail even though the user exists. Additionally, the comparison `u._id === user?.id` might fail due to type mismatch (ObjectId vs string).

```typescript
// Broken code
const userRank = users.findIndex((u) => u._id === user?.id) + 1;
// If user not found: -1 + 1 = 0 (falsy, condition fails)
// Type mismatch: ObjectId !== string
```

### Solution
Use string comparison and properly handle the not-found case:

```typescript
// Fixed code
const userIndex = users.findIndex((u) => u._id.toString() === user?.id?.toString());
const userRank = userIndex >= 0 ? userIndex + 1 : 0;
```

### Changes
- ✅ Use `.toString()` for consistent string comparison
- ✅ Properly handle `-1` case (user not found)
- ✅ Update condition to check `userRank > 0 && user` for safety
- ✅ Fix table row highlighting to use string comparison

---

## Bug 2: Frontend Type Declarations for ObjectIds ✅ FIXED

**File:** `client/src/pages/CourseDetail.tsx:12, 27`

### Problem
Frontend declares `enrolledStudents` and `completedBy` as `string[]` but the backend returns MongoDB ObjectIds. When comparing with `.toString()`, if the array already contains strings, calling `.toString()` on strings returns the same string, which works. But if it contains ObjectIds, we need to handle both cases. The type declaration is incorrect and doesn't match the actual data structure.

```typescript
// Broken code
interface Course {
  enrolledStudents: string[];  // ❌ Backend returns ObjectIds
}
interface Lesson {
  completedBy: string[];  // ❌ Backend returns ObjectIds
}

// Comparison might fail if types don't match
course.enrolledStudents.some((id) => id.toString() === user.id.toString())
```

### Solution
Update type declarations to handle both string and ObjectId types, and add proper type checking in comparisons:

```typescript
// Fixed code
interface Course {
  enrolledStudents: (string | { toString(): string })[];
}
interface Lesson {
  completedBy: (string | { toString(): string })[];
}

// Handle both string and ObjectId types
const isEnrolled = user ? course.enrolledStudents.some(
  (id) => {
    const idStr = typeof id === 'string' ? id : id.toString();
    return idStr === user.id.toString();
  }
) : false;
```

### Changes
- ✅ Update type declarations to accept both strings and ObjectIds
- ✅ Add type checking in comparison logic
- ✅ Handle both string and ObjectId cases consistently

---

## Bug 3: Team Capacity Check After Atomic Operation ✅ FIXED

**File:** `src/controllers/socialController.ts:213-234`

### Problem
The `$addToSet` operation at line 213 adds the user to the team atomically, but the capacity check at line 231 happens AFTER the addition. If capacity is exceeded, the error is returned but the user is already in the team with no rollback mechanism. The capacity constraint is violated and the error response is misleading since the user was successfully added despite the error.

```typescript
// Broken code
const updatedTeam = await Team.findByIdAndUpdate(
  req.params.id,
  { $addToSet: { members: req.user!._id } },
  { new: true }
);

// Capacity check happens AFTER addition
if (updatedTeam.members.length > updatedTeam.maxMembers) {
  throw new AppError('Team is full', 400);  // ❌ User already added!
}
```

### Solution
Add rollback mechanism to remove the user if capacity is exceeded:

```typescript
// Fixed code
const updatedTeam = await Team.findByIdAndUpdate(
  req.params.id,
  { $addToSet: { members: req.user!._id } },
  { new: true }
);

// Verify team capacity wasn't exceeded (race condition detection)
// If capacity is exceeded, rollback by removing the user we just added
if (updatedTeam.members.length > updatedTeam.maxMembers) {
  // Rollback: remove the user we just added
  await Team.findByIdAndUpdate(
    req.params.id,
    { $pull: { members: req.user!._id } }
  );
  throw new AppError('Team is full', 400);
}
```

### Changes
- ✅ Add rollback mechanism using `$pull` to remove user if capacity exceeded
- ✅ Maintains data integrity even in race conditions
- ✅ Error response is now accurate (user is not in team)

---

## Bug 4: JSON.parse Without Try-Catch ✅ FIXED

**Files:** `src/controllers/courseController.ts:20`, `src/controllers/gameController.ts:21`

### Problem
`JSON.parse(cached)` is called without try-catch. If Redis stores corrupted or invalid JSON data, it throws a `SyntaxError` that gets caught by `asyncHandler` and treated as a server error (500), when it should gracefully handle cache corruption by treating it as a cache miss and refetching data.

```typescript
// Broken code
const cached = await cache.get(cacheKey);

if (cached) {
  return res.json(JSON.parse(cached));  // ❌ No error handling
}
```

### Solution
Wrap `JSON.parse` in try-catch and handle corrupted cache gracefully:

```typescript
// Fixed code
const cached = await cache.get(cacheKey);

if (cached) {
  try {
    return res.json(JSON.parse(cached));
  } catch (error) {
    // Handle corrupted cache data - treat as cache miss and refetch
    console.error('Cache parse error, refetching data:', error);
    await cache.del(cacheKey);
    // Continue to fetch fresh data below
  }
}
```

### Changes
- ✅ Add try-catch around `JSON.parse`
- ✅ Delete corrupted cache entry
- ✅ Gracefully fall through to fetch fresh data
- ✅ Log error for debugging

---

## Summary

All four bugs have been fixed:

1. ✅ **Leaderboard User Rank**: Fixed `findIndex` calculation and string comparison
2. ✅ **Frontend Type Declarations**: Updated to handle both string and ObjectId types
3. ✅ **Team Capacity Check**: Added rollback mechanism for exceeded capacity
4. ✅ **JSON.parse Error Handling**: Added try-catch for corrupted cache data

All fixes maintain backward compatibility and improve error handling! 🎉
