import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import Achievement from '../models/Achievement';
import Badge from '../models/Badge';
import Quest from '../models/Quest';
import Activity from '../models/Activity';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { cache } from '../utils/cache';

// Helper function to validate and normalize pagination limit
const validateLimit = (limit: any, defaultLimit: number = 100, minLimit: number = 1, maxLimit: number = 100): number => {
  const parsed = Number(limit);
  if (isNaN(parsed) || parsed <= 0) {
    return defaultLimit;
  }
  return Math.max(minLimit, Math.min(parsed, maxLimit));
};

// @desc    Get leaderboard
// @route   GET /api/game/leaderboard
// @access  Public
export const getLeaderboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type = 'xp', limit = 100 } = req.query;
  
  // Validate and normalize limit to prevent DoS attacks
  const validatedLimit = validateLimit(limit, 100, 1, 100);
  
  const cacheKey = `leaderboard:${type}:${validatedLimit}`;
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

  const sortField = type === 'level' ? { level: -1, xp: -1 } : { xp: -1 };

  const users = await User.find()
    .select('username avatar xp level')
    .sort(sortField)
    .limit(validatedLimit);

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
    throw new AppError('User not found', 404);
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
  // Fetch user initially
  let user = await User.findById(req.user!._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const unlocked: any[] = [];

  // Continue checking achievements until no new ones are unlocked
  // This handles cases where unlocking one achievement makes the user eligible for another
  let hasNewUnlocks = true;
  let iterations = 0;
  const maxIterations = 10; // Prevent infinite loops

  while (hasNewUnlocks && iterations < maxIterations) {
    iterations++;
    hasNewUnlocks = false;

    // Fetch achievements that user hasn't unlocked yet
    const achievements = await Achievement.find({
      _id: { $nin: user.achievements },
    });

    // If no achievements to check, break
    if (achievements.length === 0) {
      break;
    }

    for (const achievement of achievements) {
      let shouldUnlock = false;

      // Re-fetch user to get latest stats (XP, level, etc.) for accurate checks
      // This ensures we check against the most up-to-date user data after previous unlocks
      user = await User.findById(req.user!._id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

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
        // Use atomic operation to prevent race conditions (duplicate achievement unlocks)
        const originalAchievementsLength = user.achievements.length;
        const updatedUser = await User.findByIdAndUpdate(
          req.user!._id,
          {
            $addToSet: { achievements: achievement._id },
          },
          { new: true }
        );

        if (!updatedUser) {
          throw new AppError('User not found', 404);
        }

        // Verify achievement was added (check if array length increased)
        if (updatedUser.achievements.length === originalAchievementsLength) {
          // Achievement already unlocked, skip
          continue;
        }

        // Award XP using the updated user object
        const actualXPEarned = updatedUser.addXP(achievement.xpReward);
        await updatedUser.save();

        // Update local user reference to reflect changes for next iteration
        user = updatedUser;
        hasNewUnlocks = true;

        unlocked.push(achievement);

        await Activity.create({
          user: user._id,
          type: 'achievement_unlocked',
          title: 'Achievement Unlocked!',
          description: `You unlocked: ${achievement.name}`,
          metadata: { achievementId: achievement._id, achievementName: achievement.name, xp: actualXPEarned },
        });
      }
    }
  }

  if (unlocked.length > 0) {
    await cache.clearPattern('leaderboard:*');
    await cache.del(`user:${req.user!._id}`);
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
    throw new AppError('User not found', 404);
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
    throw new AppError('Quest not found or inactive', 404);
  }

  // Check if already completed before atomic operation
  if (quest.completedBy.some((id) => id.toString() === req.user!._id.toString())) {
    throw new AppError('Quest already completed', 400);
  }

  const user = await User.findById(req.user!._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Use atomic operation to prevent TOCTOU race condition
  const updatedQuest = await Quest.findByIdAndUpdate(
    req.params.id,
    {
      $addToSet: { completedBy: user._id },
    },
    { new: true }
  );

  if (!updatedQuest || !updatedQuest.isActive) {
    throw new AppError('Quest not found or inactive', 404);
  }

  // Verify completion succeeded (check if array length increased)
  // This handles edge case where concurrent request completed quest between check and update
  if (updatedQuest.completedBy.length === quest.completedBy.length) {
    throw new AppError('Quest already completed', 400);
  }

  // Add rewards
  const actualXPEarned = user.addXP(updatedQuest.rewards.xp);
  
  // Use atomic operation to add badges (prevent duplicates)
  if (updatedQuest.rewards.badges && updatedQuest.rewards.badges.length > 0) {
    await User.findByIdAndUpdate(
      req.user!._id,
      {
        $addToSet: { badges: { $each: updatedQuest.rewards.badges } },
      }
    );
  }

  await user.save();

  // Create activity with actual XP earned (after multipliers)
  await Activity.create({
    user: user._id,
    type: 'quest_completed',
    title: 'Quest Completed!',
    description: `You completed: ${updatedQuest.title}`,
    metadata: { questId: updatedQuest._id, questTitle: updatedQuest.title, xp: actualXPEarned },
  });

  await cache.clearPattern('leaderboard:*');
  await cache.del(`user:${user._id}`);

  res.json({
    success: true,
    data: {
      quest: updatedQuest,
      xpEarned: actualXPEarned, // Return actual XP earned after multipliers
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
    throw new AppError('User not found', 404);
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
