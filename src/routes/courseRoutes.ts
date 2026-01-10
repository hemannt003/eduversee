import express from 'express';
import {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  enrollCourse,
  completeLesson,
} from '../controllers/courseController';
import { protect, authorize } from '../middleware/auth';
import { courseCreationLimiter } from '../middleware/rateLimiter';

const router = express.Router();

router.get('/', getCourses);
// More specific routes must come before wildcard routes
router.post('/lessons/:id/complete', protect, completeLesson);
router.get('/:id', getCourse);
router.post('/', protect, authorize('instructor', 'admin'), courseCreationLimiter, createCourse);
router.put('/:id', protect, authorize('instructor', 'admin'), updateCourse);
router.post('/:id/enroll', protect, enrollCourse);

export default router;
