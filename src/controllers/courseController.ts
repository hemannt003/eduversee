import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Course from '../models/Course';
import Lesson from '../models/Lesson';
import User from '../models/User';
import Activity from '../models/Activity';
import { asyncHandler } from '../middleware/errorHandler';
import { cache } from '../utils/cache';

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
export const getCourses = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { category, difficulty, search, page = 1, limit = 10 } = req.query;
  
  const cacheKey = `courses:${category || 'all'}:${difficulty || 'all'}:${search || ''}:${page}:${limit}`;
  const cached = await cache.get(cacheKey);
  
  if (cached) {
    return res.json(JSON.parse(cached));
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
      { tags: { $in: [new RegExp(search as string, 'i')] } },
    ];
  }

  const courses = await Course.find(query)
    .populate('instructor', 'username avatar')
    .select('-lessons')
    .limit(Number(limit) * 1)
    .skip((Number(page) - 1) * Number(limit))
    .sort({ createdAt: -1 });

  const total = await Course.countDocuments(query);

  const result = {
    success: true,
    data: courses,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
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
    res.status(404);
    throw new Error('Course not found');
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
  req.body.instructor = req.user!._id;

  const course = await Course.create(req.body);

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
    res.status(404);
    throw new Error('Course not found');
  }

  // Make sure user is course owner or admin
  if (course.instructor.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this course');
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

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
    res.status(404);
    throw new Error('Course not found');
  }

  if (course.enrolledStudents.includes(req.user!._id)) {
    res.status(400);
    throw new Error('Already enrolled in this course');
  }

  course.enrolledStudents.push(req.user!._id);
  await course.save();

  // Create activity
  await Activity.create({
    user: req.user!._id,
    type: 'course_enrolled',
    title: 'Course Enrolled',
    description: `You enrolled in ${course.title}`,
    metadata: { courseId: course._id, courseTitle: course.title },
  });

  res.json({
    success: true,
    data: course,
  });
});

// @desc    Complete lesson
// @route   POST /api/lessons/:id/complete
// @access  Private
export const completeLesson = asyncHandler(async (req: AuthRequest, res: Response) => {
  const lesson = await Lesson.findById(req.params.id);

  if (!lesson) {
    res.status(404);
    throw new Error('Lesson not found');
  }

  if (lesson.completedBy.includes(req.user!._id)) {
    res.status(400);
    throw new Error('Lesson already completed');
  }

  lesson.completedBy.push(req.user!._id);
  await lesson.save();

  // Add XP to user
  const user = await User.findById(req.user!._id);
  if (user) {
    user.addXP(lesson.xpReward);
    await user.save();

    // Check for level up
    const oldLevel = user.level;
    const newLevel = user.calculateLevel();
    if (newLevel > oldLevel) {
      await Activity.create({
        user: user._id,
        type: 'level_up',
        title: 'Level Up!',
        description: `You reached level ${newLevel}`,
        metadata: { level: newLevel },
      });
    }

    // Create activity
    await Activity.create({
      user: user._id,
      type: 'lesson_completed',
      title: 'Lesson Completed',
      description: `You completed ${lesson.title}`,
      metadata: { lessonId: lesson._id, lessonTitle: lesson.title, xp: lesson.xpReward },
    });

    // Clear cache
    await cache.clearPattern('leaderboard:*');
    await cache.del(`user:${user._id}`);
  }

  res.json({
    success: true,
    data: {
      lesson,
      xpEarned: lesson.xpReward,
      newLevel: user?.level,
    },
  });
});
