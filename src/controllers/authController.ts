import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import { generateToken } from '../utils/generateToken';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { cache } from '../utils/cache';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { username, email, password } = req.body;

  // Validate input
  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    throw new AppError('Username is required', 400);
  }

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    throw new AppError('Email is required', 400);
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    throw new AppError('Password is required', 400);
  }

  // Validate password length
  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  // Sanitize and normalize inputs
  const sanitizedUsername = username.trim();
  const sanitizedEmail = email.trim().toLowerCase();

  // Validate username length
  if (sanitizedUsername.length < 3) {
    throw new AppError('Username must be at least 3 characters', 400);
  }

  if (sanitizedUsername.length > 30) {
    throw new AppError('Username cannot exceed 30 characters', 400);
  }

  // Validate email format
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(sanitizedEmail)) {
    throw new AppError('Please provide a valid email', 400);
  }

  // Check if user exists (using sanitized values)
  const userExists = await User.findOne({ 
    $or: [{ email: sanitizedEmail }, { username: sanitizedUsername }] 
  });

  if (userExists) {
    throw new AppError('User already exists', 400);
  }

  // Create user with sanitized values
  // User.create() either returns a user document or throws an error - never returns null
  const user = await User.create({
    username: sanitizedUsername,
    email: sanitizedEmail,
    password,
  });

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
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    throw new AppError('Please provide email and password', 400);
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    throw new AppError('Please provide email and password', 400);
  }

  // Normalize email (lowercase and trim) to match User model schema
  // User model has lowercase: true, so we need to query with lowercase email
  const normalizedEmail = email.trim().toLowerCase();

  // Check for user with normalized email
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid credentials', 401);
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
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: user,
  });
});
