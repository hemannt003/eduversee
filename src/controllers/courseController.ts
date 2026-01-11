import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Course from '../models/Course';
import Lesson from '../models/Lesson';
import User from '../models/User';
import Activity from '../models/Activity';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { cache } from '../utils/cache';

// Helper function to validate and normalize pagination limit
const validateLimit = (limit: any, defaultLimit: number = 10, minLimit: number = 1, maxLimit: number = 100): number => {
  const parsed = Number(limit);
  if (isNaN(parsed) || parsed <= 0) {
    return defaultLimit;
  }
  return Math.max(minLimit, Math.min(parsed, maxLimit));
};

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
export const getCourses = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { category, difficulty, search, page = 1, limit = 10 } = req.query;
  
  // Validate and normalize pagination parameters
  const validatedLimit = validateLimit(limit, 10, 1, 100);
  const validatedPage = Math.max(1, Number(page) || 1);
  
  const cacheKey = `courses:${category || 'all'}:${difficulty || 'all'}:${search || ''}:${validatedPage}:${validatedLimit}`;
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

  const query: any = { isPublished: true };

  if (category) {
    query.category = category;
  }

  if (difficulty) {
    query.difficulty = difficulty;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }

  const courses = await Course.find(query)
    .populate('instructor', 'username avatar')
    .select('-lessons')
    .limit(validatedLimit)
    .skip((validatedPage - 1) * validatedLimit)
    .sort({ createdAt: -1 });

  const total = await Course.countDocuments(query);

  const result = {
    success: true,
    data: courses,
    pagination: {
      page: validatedPage,
      limit: validatedLimit,
      total,
      pages: total > 0 ? Math.ceil(total / validatedLimit) : 0,
    },
  };

  await cache.set(cacheKey, JSON.stringify(result), 300); // Cache for 5 minutes

  res.json(result);
});

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
export const getCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
  const course = await Course.findById(req.params.id)
    .populate('instructor', 'username avatar level')
    .populate({
      path: 'lessons',
      select: 'title order xpReward',
      options: { sort: { order: 1 } },
    });

  if (!course) {
    throw new AppError('Course not found', 404);
  }

  res.json({
    success: true,
    data: course,
  });
});

// @desc    Create course
// @route   POST /api/courses
// @access  Private (Instructor/Admin)
export const createCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Filter req.body to only allow safe fields (prevent privilege escalation)
  const allowedFields = ['title', 'description', 'category', 'difficulty', 'tags', 'xpReward', 'thumbnail', 'isPublished'];
  const courseData: any = {
    instructor: req.user!._id, // Always set to current user
    enrolledStudents: [], // Always start empty
    lessons: [], // Always start empty
  };

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      courseData[field] = req.body[field];
    }
  }

  const course = await Course.create(courseData);

  // Clear cache
  await cache.clearPattern('courses:*');

  res.status(201).json({
    success: true,
    data: course,
  });
});

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Instructor/Admin)
export const updateCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    throw new AppError('Course not found', 404);
  }

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

  // Check if course was deleted between authorization check and update
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  // Clear cache
  await cache.clearPattern('courses:*');

  res.json({
    success: true,
    data: course,
  });
});

// @desc    Enroll in course
// @route   POST /api/courses/:id/enroll
// @access  Private
export const enrollCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    throw new AppError('Course not found', 404);
  }

  // Check if already enrolled before atomic operation
  if (course.enrolledStudents.some((id) => id.toString() === req.user!._id.toString())) {
    throw new AppError('Already enrolled in this course', 400);
  }

  // Re-read course right before atomic operation to get fresh state
  // This helps detect if a concurrent request enrolled the user between our initial read and the atomic update
  const courseBeforeUpdate = await Course.findById(req.params.id);
  if (!courseBeforeUpdate) {
    throw new AppError('Course not found', 404);
  }

  // Check again with fresh data - if user was enrolled by concurrent request, abort
  if (courseBeforeUpdate.enrolledStudents.some((id) => id.toString() === req.user!._id.toString())) {
    throw new AppError('Already enrolled in this course', 400);
  }

  const lengthBeforeUpdate = courseBeforeUpdate.enrolledStudents.length;

  // Use atomic operation to prevent TOCTOU race condition
  const updatedCourse = await Course.findByIdAndUpdate(
    req.params.id,
    {
      $addToSet: { enrolledStudents: req.user!._id },
    },
    { new: true }
  );

  if (!updatedCourse) {
    throw new AppError('Course not found', 404);
  }

  // Verify enrollment succeeded by checking:
  // 1. User is actually in the updated array (operation succeeded)
  // 2. Array length increased (our $addToSet actually added the user)
  const isEnrolledAfter = updatedCourse.enrolledStudents.some(
    (id) => id.toString() === req.user!._id.toString()
  );
  const lengthAfterUpdate = updatedCourse.enrolledStudents.length;
  
  // Check 1: User must be in updated array (operation must have succeeded)
  if (!isEnrolledAfter) {
    throw new AppError('Failed to enroll in course', 500);
  }
  
  // Check 2: If length didn't increase, $addToSet was a no-op
  // This means a concurrent request enrolled the user between our re-read and the atomic update
  // (very narrow window, but possible)
  if (lengthAfterUpdate === lengthBeforeUpdate) {
    throw new AppError('Already enrolled in this course', 400);
  }

  // Create activity
  await Activity.create({
    user: req.user!._id,
    type: 'course_enrolled',
    title: 'Course Enrolled',
    description: `You enrolled in ${updatedCourse.title}`,
    metadata: { courseId: updatedCourse._id, courseTitle: updatedCourse.title },
  });

  res.json({
    success: true,
    data: updatedCourse,
  });
});

// @desc    Complete lesson
// @route   POST /api/lessons/:id/complete
// @access  Private
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
  if (lesson.completedBy.some((id) => id.toString() === req.user!._id.toString())) {
    throw new AppError('Lesson already completed', 400);
  }

  // Use atomic operation to prevent TOCTOU race condition
  const updatedLesson = await Lesson.findByIdAndUpdate(
    req.params.id,
    {
      $addToSet: { completedBy: req.user!._id },
    },
    { new: true }
  );

  if (!updatedLesson) {
    throw new AppError('Lesson not found', 404);
  }

  // Verify completion succeeded (check if array length increased)
  // This handles edge case where concurrent request completed lesson between check and update
  if (updatedLesson.completedBy.length === lesson.completedBy.length) {
    throw new AppError('Lesson already completed', 400);
  }

  // Re-fetch user immediately before XP calculation to get fresh streak/teamId
  // This prevents race condition where concurrent requests modify user between initial fetch and XP calculation
  const user = await User.findById(req.user!._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const oldLevel = user.level;
  const actualXPEarned = user.addXP(updatedLesson.xpReward);
  
  // Check for level up before saving
  if (user.level > oldLevel) {
    await Activity.create({
      user: user._id,
      type: 'level_up',
      title: 'Level Up!',
      description: `You reached level ${user.level}`,
      metadata: { level: user.level },
    });
  }
  
  await user.save();

  // Create activity with actual XP earned (after multipliers)
  await Activity.create({
    user: user._id,
    type: 'lesson_completed',
    title: 'Lesson Completed',
    description: `You completed ${updatedLesson.title}`,
    metadata: { lessonId: updatedLesson._id, lessonTitle: updatedLesson.title, xp: actualXPEarned },
  });

  // Clear cache
  await cache.clearPattern('leaderboard:*');
  await cache.del(`user:${user._id}`);

  res.json({
    success: true,
    data: {
      lesson: updatedLesson,
      xpEarned: actualXPEarned, // Return actual XP earned after multipliers
      newLevel: user.level,
    },
  });
});
