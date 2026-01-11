import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import Team from '../models/Team';
import Activity from '../models/Activity';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { cache } from '../utils/cache';

// @desc    Send friend request
// @route   POST /api/social/friends/request/:userId
// @access  Private
export const sendFriendRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const targetUserId = req.params.userId;
  const currentUser = await User.findById(req.user!._id);

  if (!currentUser) {
    throw new AppError('User not found', 404);
  }

  if (targetUserId === req.user!._id.toString()) {
    throw new AppError('Cannot send friend request to yourself', 400);
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new AppError('User not found', 404);
  }

  const targetUserIdObj = new mongoose.Types.ObjectId(targetUserId);
  const currentUserIdObj = req.user!._id;

  if (currentUser.friends.some((id) => id.toString() === targetUserId)) {
    throw new AppError('Already friends', 400);
  }

  if (currentUser.friendRequests.sent.some((id) => id.toString() === targetUserId)) {
    throw new AppError('Friend request already sent', 400);
  }

  // Use atomic operations to prevent race conditions
  const originalSentLength = currentUser.friendRequests.sent.length;
  const updatedCurrentUser = await User.findByIdAndUpdate(
    req.user!._id,
    {
      $addToSet: { 'friendRequests.sent': targetUserIdObj },
    },
    { new: true }
  );

  if (!updatedCurrentUser) {
    throw new AppError('User not found', 404);
  }

  // Verify request was added (check if array length increased)
  if (updatedCurrentUser.friendRequests.sent.length === originalSentLength) {
    throw new AppError('Friend request already sent', 400);
  }

  // Add to target user's received requests atomically
  await User.findByIdAndUpdate(
    targetUserId,
    {
      $addToSet: { 'friendRequests.received': currentUserIdObj },
    }
  );

  res.json({
    success: true,
    message: 'Friend request sent',
  });
});

// @desc    Accept friend request
// @route   POST /api/social/friends/accept/:userId
// @access  Private
export const acceptFriendRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const senderUserId = req.params.userId;
  const currentUser = await User.findById(req.user!._id);
  const senderUser = await User.findById(senderUserId);

  if (!currentUser) {
    throw new AppError('Current user not found', 404);
  }

  if (!senderUser) {
    throw new AppError('User not found', 404);
  }

  const senderUserIdObj = new mongoose.Types.ObjectId(senderUserId);
  const currentUserIdObj = req.user!._id;

  if (!currentUser.friendRequests.received.some((id) => id.toString() === senderUserId)) {
    throw new AppError('No pending friend request from this user', 400);
  }

  // Use atomic operations to prevent race conditions
  // Add to friends list atomically
  const originalCurrentFriendsLength = currentUser.friends.length;
  const updatedCurrentUser = await User.findByIdAndUpdate(
    req.user!._id,
    {
      $addToSet: { friends: senderUserIdObj },
      $pull: { 'friendRequests.received': senderUserIdObj },
    },
    { new: true }
  );

  if (!updatedCurrentUser) {
    throw new AppError('Current user not found', 404);
  }

  // Verify friend was added (check if array length increased)
  if (updatedCurrentUser.friends.length === originalCurrentFriendsLength) {
    throw new AppError('Already friends with this user', 400);
  }

  // Add to sender's friends list and remove from sent requests atomically
  // Verify the update succeeded to prevent one-way friendship inconsistency
  const updatedSenderUser = await User.findByIdAndUpdate(
    senderUserId,
    {
      $addToSet: { friends: currentUserIdObj },
      $pull: { 'friendRequests.sent': currentUserIdObj },
    },
    { new: true }
  );

  if (!updatedSenderUser) {
    // If sender user was deleted or update failed, rollback the current user's changes
    // to prevent one-way friendship inconsistency
    await User.findByIdAndUpdate(
      req.user!._id,
      {
        $pull: { friends: senderUserIdObj },
        $addToSet: { 'friendRequests.received': senderUserIdObj },
      }
    );
    throw new AppError('Failed to update sender user. Friend request acceptance was rolled back.', 500);
  }

  // Verify friend was added to sender's list (check if array length increased)
  const originalSenderFriendsLength = senderUser.friends.length;
  if (updatedSenderUser.friends.length === originalSenderFriendsLength) {
    // Friend already existed in sender's list, but we still need to ensure consistency
    // This shouldn't happen in normal flow, but handle it gracefully
    // No rollback needed as both users already have each other as friends
  }

  // Create activities
  await Activity.create({
    user: req.user!._id,
    type: 'friend_added',
    title: 'New Friend!',
    description: `You are now friends with ${senderUser.username}`,
    metadata: { friendId: senderUserId, friendUsername: senderUser.username },
  });

  await Activity.create({
    user: senderUserIdObj,
    type: 'friend_added',
    title: 'New Friend!',
    description: `You are now friends with ${currentUser.username}`,
    metadata: { friendId: req.user!._id, friendUsername: currentUser.username },
  });

  res.json({
    success: true,
    message: 'Friend request accepted',
  });
});

// @desc    Get friends
// @route   GET /api/social/friends
// @access  Private
export const getFriends = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!._id)
    .populate('friends', 'username avatar level xp streak')
    .populate('friendRequests.sent', 'username avatar')
    .populate('friendRequests.received', 'username avatar');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: {
      friends: user.friends,
      sentRequests: user.friendRequests.sent,
      receivedRequests: user.friendRequests.received,
    },
  });
});

// @desc    Create team
// @route   POST /api/social/teams
// @access  Private
export const createTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Filter req.body to only allow safe fields (prevent privilege escalation)
  const { name, description, maxMembers } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new AppError('Team name is required', 400);
  }

  // Validate maxMembers if provided
  const validatedMaxMembers = maxMembers 
    ? Math.max(2, Math.min(Number(maxMembers) || 20, 100)) // Between 2 and 100
    : 20;

  const existingTeam = await Team.findOne({ name: name.trim() });
  if (existingTeam) {
    throw new AppError('Team name already exists', 400);
  }

  // Attempt to create team
  // Handle TOCTOU race condition: if two requests try to create the same team name
  // simultaneously, MongoDB's unique constraint will catch the duplicate
  let team;
  try {
    team = await Team.create({
      name: name.trim(),
      description: description ? String(description).trim() : '',
      leader: req.user!._id, // Always set to current user
      members: [req.user!._id], // Always start with creator
      maxMembers: validatedMaxMembers,
      xp: 0, // Always start at 0
      level: 1, // Always start at 1
    });
  } catch (error: any) {
    // MongoDB duplicate key error (E11000) occurs when unique constraint is violated
    // This handles the race condition where two requests create the same team name
    if (error.code === 11000 || error.code === 11001) {
      throw new AppError('Team name already exists', 400);
    }
    // Re-throw other errors
    throw error;
  }

  // Add user to team
  const user = await User.findById(req.user!._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  user.teamId = team._id;
  await user.save();

  res.status(201).json({
    success: true,
    data: team,
  });
});

// @desc    Get team
// @route   GET /api/social/teams/:id
// @access  Private
export const getTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const team = await Team.findById(req.params.id)
    .populate('leader', 'username avatar level')
    .populate('members', 'username avatar level xp');

  if (!team) {
    throw new AppError('Team not found', 404);
  }

  res.json({
    success: true,
    data: team,
  });
});

// @desc    Join team
// @route   POST /api/social/teams/:id/join
// @access  Private
export const joinTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const team = await Team.findById(req.params.id);
  if (!team) {
    throw new AppError('Team not found', 404);
  }

  // Check if already a member before atomic operation
  if (team.members.some((id) => id.toString() === req.user!._id.toString())) {
    throw new AppError('Already a member of this team', 400);
  }

  // Check team capacity before atomic operation
  if (team.members.length >= team.maxMembers) {
    throw new AppError('Team is full', 400);
  }

  // Use atomic operation to prevent TOCTOU race condition
  // Use $addToSet to prevent duplicates and check length in update condition
  const originalLength = team.members.length;
  const updatedTeam = await Team.findByIdAndUpdate(
    req.params.id,
    {
      $addToSet: { members: req.user!._id },
    },
    { new: true }
  );

  if (!updatedTeam) {
    throw new AppError('Team not found', 404);
  }

  // Verify membership succeeded (check if array length increased)
  // This handles edge case where concurrent request joined team between check and update
  if (updatedTeam.members.length === originalLength) {
    // Array length didn't increase, meaning $addToSet was a no-op
    // This happens when a concurrent request joined the team between our check and update
    throw new AppError('Already a member of this team', 400);
  }

  // Verify team capacity wasn't exceeded (race condition detection)
  // If capacity is exceeded, rollback by removing the user we just added
  if (updatedTeam.members.length > updatedTeam.maxMembers) {
    // Rollback: remove the user we just added
    await Team.findByIdAndUpdate(
      req.params.id,
      {
        $pull: { members: req.user!._id },
      }
    );
    throw new AppError('Team is full', 400);
  }

  const user = await User.findById(req.user!._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  user.teamId = updatedTeam._id;
  await user.save();

  res.json({
    success: true,
    data: updatedTeam,
  });
});

// Helper function to validate and normalize pagination limit
const validateLimit = (limit: any, defaultLimit: number = 20, minLimit: number = 1, maxLimit: number = 100): number => {
  const parsed = Number(limit);
  if (isNaN(parsed) || parsed <= 0) {
    return defaultLimit;
  }
  return Math.max(minLimit, Math.min(parsed, maxLimit));
};

// @desc    Get activity feed
// @route   GET /api/social/activity
// @access  Private
export const getActivityFeed = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20 } = req.query;
  
  // Validate and normalize pagination parameters
  const validatedLimit = validateLimit(limit, 20, 1, 100);
  const validatedPage = Math.max(1, Number(page) || 1);
  
  const user = await User.findById(req.user!._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  // Use ObjectIds directly instead of converting to strings
  // MongoDB $in query expects ObjectIds, not string representations
  const friendIds = user.friends.map((f: any) => f);
  
  // Get activities from user and friends
  const activities = await Activity.find({
    $or: [
      { user: req.user!._id },
      { user: { $in: friendIds } },
    ],
  })
    .populate('user', 'username avatar')
    .sort({ createdAt: -1 })
    .limit(validatedLimit)
    .skip((validatedPage - 1) * validatedLimit);

  const total = await Activity.countDocuments({
    $or: [
      { user: req.user!._id },
      { user: { $in: friendIds } },
    ],
  });

  res.json({
    success: true,
    data: activities,
    pagination: {
      page: validatedPage,
      limit: validatedLimit,
      total,
      pages: total > 0 ? Math.ceil(total / validatedLimit) : 0,
    },
  });
});

// @desc    Search users
// @route   GET /api/social/users/search
// @access  Private
export const searchUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { q, limit = 20 } = req.query;

  if (!q || (q as string).length < 2) {
    throw new AppError('Search query must be at least 2 characters', 400);
  }

  // Validate and normalize limit to prevent DoS attacks
  const validatedLimit = validateLimit(limit, 20, 1, 100);

  const users = await User.find({
    $or: [
      { username: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ],
    _id: { $ne: req.user!._id },
  })
    .select('username avatar level xp')
    .limit(validatedLimit);

  res.json({
    success: true,
    data: users,
  });
});
