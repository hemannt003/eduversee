# Complete Lesson Error Handling Fix

## Bug: Inconsistent Error Handling in completeLesson ✅ FIXED

### Problem
The `completeLesson` function retrieved the user and wrapped modifications in an `if (user)` check. If the user record was null (edge case where user is deleted after authentication), the response was still sent with `newLevel: undefined`, providing an inconsistent response structure. The function should throw an error if the user is not found, similar to the `completeQuest` function, to ensure response consistency and proper error handling.

### Impact
- Inconsistent response structure when user is null
- `newLevel: undefined` in response instead of proper error
- Lesson marked as completed even if user doesn't exist
- Inconsistent error handling compared to `completeQuest`
- Poor API contract - clients can't distinguish between success and failure

### Solution
Changed from conditional check to error throwing, matching the pattern in `completeQuest`:

```typescript
// Before (INCONSISTENT):
const user = await User.findById(req.user!._id);
if (user) {
  // ... all logic here
}
res.json({
  success: true,
  data: {
    lesson,
    xpEarned: lesson.xpReward,
    newLevel: user?.level,  // ❌ Could be undefined
  },
});

// After (CONSISTENT):
const user = await User.findById(req.user!._id);
if (!user) {
  throw new AppError('User not found', 404);  // ✅ Proper error
}
// ... all logic here (no conditional wrapper)
res.json({
  success: true,
  data: {
    lesson,
    xpEarned: lesson.xpReward,
    newLevel: user.level,  // ✅ Always defined
  },
});
```

### Benefits
1. **Consistent Error Handling**: Matches `completeQuest` pattern
2. **Proper HTTP Status**: Returns 404 instead of 200 with undefined
3. **Response Consistency**: `newLevel` is always defined in successful responses
4. **Data Integrity**: Lesson is not marked as completed if user doesn't exist
5. **Better API Contract**: Clear distinction between success and error

### Files Fixed
- `src/controllers/courseController.ts` - Lines 183-223

### Comparison with completeQuest
Both functions now follow the same pattern:
- Check if user exists
- Throw `AppError` with 404 if not found
- Continue with user operations (no conditional wrapper)
- Return consistent response structure
