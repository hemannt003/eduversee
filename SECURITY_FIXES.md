# Security Fixes: Privilege Escalation and Authorization Bypass

## Bug 1: Privilege Escalation in updateCourse ✅ FIXED

**File:** `src/controllers/courseController.ts:140`

### Problem
The `updateCourse` function performs authorization checks to ensure only the course owner or admin can update a course (lines 135-138), but then passes the entire unfiltered `req.body` to `findByIdAndUpdate` (line 140). A malicious user can include an `instructor` field in their request body to change the course ownership to themselves or any other user, completely bypassing the authorization check. This allows privilege escalation and unauthorized modification of course ownership.

```typescript
// Broken code
// Make sure user is course owner or admin
if (course.instructor.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
  throw new AppError('Not authorized to update this course', 403);
}

// ❌ Passes entire req.body - attacker can include instructor field
course = await Course.findByIdAndUpdate(req.params.id, req.body, {
  new: true,
  runValidators: true,
});
```

**Security Issues:**
- Attacker can change `instructor` field to take ownership
- Attacker can modify `_id`, `createdAt`, `updatedAt` (if present in body)
- Privilege escalation vulnerability
- Unauthorized course ownership transfer
- Bypasses authorization checks

### Solution
Filter out sensitive fields and only allow modification of safe fields:

```typescript
// Fixed code
// Make sure user is course owner or admin
if (course.instructor.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
  throw new AppError('Not authorized to update this course', 403);
}

// Filter out sensitive fields that should not be modified via this endpoint
// Prevent privilege escalation by removing instructor, _id, and other protected fields
const allowedFields = ['title', 'description', 'category', 'difficulty', 'tags', 'xpReward', 'isPublished', 'lessons'];
const updateData: any = {};

for (const field of allowedFields) {
  if (req.body[field] !== undefined) {
    updateData[field] = req.body[field];
  }
}

// Ensure instructor field is never changed (use original course instructor)
updateData.instructor = course.instructor;

course = await Course.findByIdAndUpdate(req.params.id, updateData, {
  new: true,
  runValidators: true,
});
```

### Changes
- ✅ Whitelist approach: Only allow specific safe fields
- ✅ Explicitly preserve `instructor` from original course
- ✅ Prevents modification of `_id`, `createdAt`, `updatedAt`
- ✅ Prevents privilege escalation
- ✅ Maintains authorization integrity

### Security Benefits
- ✅ Prevents privilege escalation attacks
- ✅ Prevents unauthorized course ownership transfer
- ✅ Maintains authorization checks integrity
- ✅ Follows principle of least privilege
- ✅ Whitelist approach is more secure than blacklist

---

## Bug 2: Authorization Bypass in completeLesson ✅ FIXED

**File:** `src/controllers/courseController.ts:239-249`

### Problem
The `completeLesson` function allows any authenticated user to complete any lesson without verifying that they are enrolled in the course. The lesson has a `courseId` field that should be used to fetch the parent course and verify the user is in `enrolledStudents` before marking the lesson as complete. This allows users to earn XP and level up by completing lessons from courses they haven't enrolled in, bypassing the enrollment system entirely.

```typescript
// Broken code
export const completeLesson = asyncHandler(async (req: AuthRequest, res: Response) => {
  const lesson = await Lesson.findById(req.params.id);
  
  if (!lesson) {
    throw new AppError('Lesson not found', 404);
  }
  
  // ❌ No enrollment check - any user can complete any lesson
  // Check if already completed before atomic operation
  if (lesson.completedBy.some(...)) {
    throw new AppError('Lesson already completed', 400);
  }
  
  // ... completes lesson and awards XP
});
```

**Security Issues:**
- Users can complete lessons without enrolling
- Users can earn XP from courses they haven't enrolled in
- Bypasses enrollment system
- Unfair progression advantage
- Violates business logic

### Solution
Verify user enrollment before allowing lesson completion:

```typescript
// Fixed code
export const completeLesson = asyncHandler(async (req: AuthRequest, res: Response) => {
  const lesson = await Lesson.findById(req.params.id);
  
  if (!lesson) {
    throw new AppError('Lesson not found', 404);
  }
  
  // Verify user is enrolled in the course before allowing lesson completion
  const course = await Course.findById(lesson.courseId);
  if (!course) {
    throw new AppError('Course not found', 404);
  }
  
  // Check if user is enrolled in the course
  const isEnrolled = course.enrolledStudents.some(
    (id) => id.toString() === req.user!._id.toString()
  );
  if (!isEnrolled) {
    throw new AppError('You must be enrolled in this course to complete lessons', 403);
  }
  
  // Check if already completed before atomic operation
  if (lesson.completedBy.some(...)) {
    throw new AppError('Lesson already completed', 400);
  }
  
  // ... rest of completion logic
});
```

### Changes
- ✅ Fetch parent course using `lesson.courseId`
- ✅ Verify user is in `course.enrolledStudents`
- ✅ Throw 403 error if not enrolled
- ✅ Enforces enrollment requirement
- ✅ Maintains business logic integrity

### Security Benefits
- ✅ Prevents unauthorized lesson completion
- ✅ Enforces enrollment requirement
- ✅ Prevents XP farming from unenrolled courses
- ✅ Maintains fair progression system
- ✅ Protects business logic

---

## Summary

Both critical security vulnerabilities have been fixed:

1. ✅ **Privilege Escalation**: `updateCourse` now filters sensitive fields and prevents ownership transfer
2. ✅ **Authorization Bypass**: `completeLesson` now verifies enrollment before allowing completion

The application is now more secure and maintains proper authorization checks! 🔒
