import express from 'express';
import {
  getLeaderboard,
  getAchievements,
  checkAchievements,
  getQuests,
  completeQuest,
  getStats,
} from '../controllers/gameController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/leaderboard', getLeaderboard);
router.get('/achievements', protect, getAchievements);
router.post('/check-achievements', protect, checkAchievements);
router.get('/quests', protect, getQuests);
router.post('/quests/:id/complete', protect, completeQuest);
router.get('/stats', protect, getStats);

export default router;
