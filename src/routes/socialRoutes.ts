import express from 'express';
import {
  sendFriendRequest,
  acceptFriendRequest,
  getFriends,
  createTeam,
  getTeam,
  joinTeam,
  getActivityFeed,
  searchUsers,
} from '../controllers/socialController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/friends', protect, getFriends);
router.post('/friends/request/:userId', protect, sendFriendRequest);
router.post('/friends/accept/:userId', protect, acceptFriendRequest);

router.post('/teams', protect, createTeam);
router.get('/teams/:id', protect, getTeam);
router.post('/teams/:id/join', protect, joinTeam);

router.get('/activity', protect, getActivityFeed);
router.get('/users/search', protect, searchUsers);

export default router;
