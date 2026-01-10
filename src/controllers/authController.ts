import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import { generateToken } from '../utils/generateToken';
import { asyncHandler } from '../middleware/errorHandler';
import { cache } from '../utils/cache';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { username, email, password } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ $or: [{ email }, { username }] });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password,
  });

  if (user) {
    const token = generateToken(user._id.toString());
    
    // Clear cache
    await cache.clearPattern('leaderboard:*');
    
    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          xp: user.xp,
          level: user.level,
          avatar: user.avatar,
        },
      },
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Update last active date for streak tracking
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastActive = new Date(user.lastActiveDate);
  lastActive.setHours(0, 0, 0, 0);

  if (today.getTime() > lastActive.getTime()) {
    const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff === 1) {
      user.streak += 1;
    } else if (daysDiff > 1) {
      user.streak = 1;
    }
    user.lastActiveDate = new Date();
    await user.save();
  }

  const token = generateToken(user._id.toString());

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        avatar: user.avatar,
      },
    },
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!._id)
    .populate('achievements', 'name icon')
    .populate('badges', 'name icon rarity')
    .populate('friends', 'username avatar level xp')
    .populate('teamId', 'name avatar level');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({
    success: true,
    data: user,
  });
});
