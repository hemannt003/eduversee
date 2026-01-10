import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import Achievement from '../models/Achievement';
import Badge from '../models/Badge';
import Quest from '../models/Quest';
import Activity from '../models/Activity';
import { asyncHandler } from '../middleware/errorHandler';
import { cache } from '../utils/cache';

// @desc    Get leaderboard
// @route   GET /api/game/leaderboard
// @access  Public
export const getLeaderboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type = 'xp', limit = 100 } = req.query;
  
  const cacheKey = `leaderboard:${type}:${limit}`;
  const cached = await cache.get(cacheKey);
  
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  const sortField = type === 'level' ? { level: -1, xp: -1 } : { xp: -1 };

  const users = await User.find()
    .select('username avatar xp level')
    .sort(sortField)
    .limit(Number(limit));

  const result = {
    success: true,
    data: users,
  };

  await cache.set(cacheKey, JSON.stringify(result), 60); // Cache for 1 minute

  res.json(result);
});

// @desc    Get user achievements
// @route   GET /api/game/achievements
// @access  Private
export const getAchievements = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!._id).populate('achievements');
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  const allAchievements = await Achievement.find();
  
  const userAchievementIds = new Set(
    user.achievements.map((a: any) => a._id.toString())
  );

  const achievements = allAchievements.map((achievement) => ({
    ...achievement.toObject(),
    unlocked: userAchievementIds.has(achievement._id.toString()),
  }));

  res.json({
    success: true,
    data: achievements,
  });
});

// @desc    Check and unlock achievements
// @route   POST /api/game/check-achievements
// @access  Private
export const checkAchievements = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const achievements = await Achievement.find({
    _id: { $nin: user.achievements },
  });

  const unlocked: any[] = [];

  for (const achievement of achievements) {
    let shouldUnlock = false;

    switch (achievement.requirement.type) {
      case 'xp':
        shouldUnlock = user.xp >= achievement.requirement.value;
        break;
      case 'level':
        shouldUnlock = user.level >= achievement.requirement.value;
        break;
      case 'streak':
        shouldUnlock = user.streak >= achievement.requirement.value;
        break;
      case 'courses_completed':
        // This would require tracking completed courses
        break;
      case 'friends':
        shouldUnlock = user.friends.length >= achievement.requirement.value;
        break;
    }

    if (shouldUnlock) {
      user.achievements.push(achievement._id);
      user.addXP(achievement.xpReward);
      unlocked.push(achievement);

      await Activity.create({
        user: user._id,
        type: 'achievement_unlocked',
        title: 'Achievement Unlocked!',
        description: `You unlocked: ${achievement.name}`,
        metadata: { achievementId: achievement._id, achievementName: achievement.name },
      });
    }
  }

  if (unlocked.length > 0) {
    await user.save();
    await cache.clearPattern('leaderboard:*');
    await cache.del(`user:${user._id}`);
  }

  res.json({
    success: true,
    data: { unlocked },
  });
});

// @desc    Get active quests
// @route   GET /api/game/quests
// @access  Private
export const getQuests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const now = new Date();
  
  const quests = await Quest.find({
    isActive: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: now } },
    ],
  }).sort({ type: 1, createdAt: -1 });

  const user = await User.findById(req.user!._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const completedQuestIds = new Set(
    quests
      .filter((q) => q.completedBy.some((id) => id.toString() === user._id.toString()))
      .map((q) => q._id.toString())
  );

  const questsWithStatus = quests.map((quest) => ({
    ...quest.toObject(),
    completed: completedQuestIds.has(quest._id.toString()),
  }));

  res.json({
    success: true,
    data: questsWithStatus,
  });
});

// @desc    Complete quest
// @route   POST /api/game/quests/:id/complete
// @access  Private
export const completeQuest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const quest = await Quest.findById(req.params.id);

  if (!quest || !quest.isActive) {
    res.status(404);
    throw new Error('Quest not found or inactive');
  }

  if (quest.completedBy.some((id) => id.toString() === req.user!._id.toString())) {
    res.status(400);
    throw new Error('Quest already completed');
  }

  const user = await User.findById(req.user!._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Add rewards
  user.addXP(quest.rewards.xp);
  if (quest.rewards.badges && quest.rewards.badges.length > 0) {
    user.badges.push(...quest.rewards.badges);
  }

  quest.completedBy.push(user._id);
  await quest.save();
  await user.save();

  await Activity.create({
    user: user._id,
    type: 'quest_completed',
    title: 'Quest Completed!',
    description: `You completed: ${quest.title}`,
    metadata: { questId: quest._id, questTitle: quest.title, xp: quest.rewards.xp },
  });

  await cache.clearPattern('leaderboard:*');
  await cache.del(`user:${user._id}`);

  res.json({
    success: true,
    data: {
      quest,
      xpEarned: quest.rewards.xp,
      newLevel: user.level,
    },
  });
});

// @desc    Get user stats
// @route   GET /api/game/stats
// @access  Private
export const getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!._id)
    .populate('achievements', 'name icon rarity')
    .populate('badges', 'name icon rarity')
    .populate('friends', 'username avatar level');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const xpToNextLevel = (level: number) => {
    const nextLevelXP = Math.pow(level, 2) * 100;
    const currentLevelXP = Math.pow(level - 1, 2) * 100;
    return nextLevelXP - currentLevelXP;
  };

  const currentLevelXP = Math.pow(user.level - 1, 2) * 100;
  const progressXP = user.xp - currentLevelXP;
  const neededXP = xpToNextLevel(user.level);

  res.json({
    success: true,
    data: {
      user: {
        username: user.username,
        avatar: user.avatar,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        progressXP,
        neededXP,
        progressPercent: Math.round((progressXP / neededXP) * 100),
      },
      achievements: user.achievements,
      badges: user.badges,
      friends: user.friends,
    },
  });
});
