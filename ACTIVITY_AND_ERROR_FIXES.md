# Activity and Error Handling Fixes

## Bug 1: ObjectId Type Mismatch in Activity Creation ✅ FIXED

### Problem
The `acceptFriendRequest` function passed `senderUserId` (a plain string from `req.params.userId`) as the `user` field to `Activity.create()` on line 101. The Activity model expects a Mongoose ObjectId. While MongoDB may implicitly convert the string, this is inconsistent with line 93 which correctly passes `req.user!._id` (an ObjectId), and can cause type mismatch issues or unexpected behavior when querying or processing activities later.

### Impact
- Type inconsistency in Activity records
- Potential issues when querying activities by user
- Inconsistent data types in the database
- Possible runtime errors in type-strict environments

### Solution
Changed to use the already-created `senderUserIdObj` (ObjectId) instead of the string `senderUserId`:

```typescript
// Before (INCONSISTENT):
await Activity.create({
  user: senderUserId,  // ❌ String, not ObjectId
  type: 'friend_added',
  // ...
});

// After (CONSISTENT):
await Activity.create({
  user: senderUserIdObj,  // ✅ ObjectId, consistent with line 93
  type: 'friend_added',
  // ...
});
```

### Files Fixed
- `src/controllers/socialController.ts` - Line 101

---

## Bug 2: Incorrect Error Handling in getTeam ✅ FIXED

### Problem
The `getTeam` function threw a regular `Error` instead of `AppError` when a team is not found, and manually set the response status code before throwing. This pattern breaks the error handling middleware. Since `asyncHandler` catches the error and passes it to `errorHandler`, the manually-set status code is ignored, and the `Error` object lacks the `statusCode` property that `errorHandler` expects, resulting in a 500 response instead of 404.

### Impact
- Team not found errors returned 500 instead of 404
- API contract broken
- Inconsistent error handling compared to other functions
- Poor debugging experience

### Solution
Replaced with `AppError` to match the pattern used throughout the file:

```typescript
// Before (BROKEN):
if (!team) {
  res.status(404);
  throw new Error('Team not found');  // ❌ Returns 500
}

// After (FIXED):
if (!team) {
  throw new AppError('Team not found', 404);  // ✅ Returns 404
}
```

### Files Fixed
- `src/controllers/socialController.ts` - Line 179

---

## Summary

### Bugs Fixed
1. ✅ Bug 1: ObjectId type mismatch in Activity creation
2. ✅ Bug 2: Incorrect error handling in getTeam function

### Files Modified
- `src/controllers/socialController.ts` - 2 fixes

### Impact
- Consistent ObjectId usage in Activity records
- Correct HTTP status codes for all errors
- Consistent error handling pattern throughout the codebase

## Testing Recommendations

### Bug 1 Testing
1. Accept a friend request
2. Verify both Activity records are created correctly
3. Query activities by user and verify they work
4. Check database to ensure consistent ObjectId types

### Bug 2 Testing
1. Request a non-existent team: `GET /api/social/teams/invalid-id`
2. Verify response is 404, not 500
3. Verify error message is correct
4. Compare with other "not found" errors to ensure consistency
