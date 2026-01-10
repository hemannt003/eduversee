import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import Team from '../models/Team';
import Activity from '../models/Activity';
import { asyncHandler } from '../middleware/errorHandler';
import { cache } from '../utils/cache';

// @desc    Send friend request
// @route   POST /api/social/friends/request/:userId
// @access  Private
export const sendFriendRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const targetUserId = req.params.userId;
  const currentUser = await User.findById(req.user!._id);

  if (targetUserId === req.user!._id.toString()) {
    res.status(400);
    throw new Error('Cannot send friend request to yourself');
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    res.status(404);
    throw new Error('User not found');
  }

  const targetUserIdObj = new mongoose.Types.ObjectId(targetUserId);
  const currentUserIdObj = req.user!._id;

  if (currentUser!.friends.some((id) => id.toString() === targetUserId)) {
    res.status(400);
    throw new Error('Already friends');
  }

  if (currentUser!.friendRequests.sent.some((id) => id.toString() === targetUserId)) {
    res.status(400);
    throw new Error('Friend request already sent');
  }

  currentUser!.friendRequests.sent.push(targetUserIdObj);
  targetUser.friendRequests.received.push(currentUserIdObj);
  
  await currentUser!.save();
  await targetUser.save();

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

  if (!senderUser) {
    res.status(404);
    throw new Error('User not found');
  }

  const senderUserIdObj = new mongoose.Types.ObjectId(senderUserId);
  const currentUserIdObj = req.user!._id;

  if (!currentUser!.friendRequests.received.some((id) => id.toString() === senderUserId)) {
    res.status(400);
    throw new Error('No pending friend request from this user');
  }

  // Add to friends list
  currentUser!.friends.push(senderUserIdObj);
  senderUser.friends.push(currentUserIdObj);

  // Remove from requests
  currentUser!.friendRequests.received = currentUser!.friendRequests.received.filter(
    (id) => id.toString() !== senderUserId
  );
  senderUser.friendRequests.sent = senderUser.friendRequests.sent.filter(
    (id) => id.toString() !== req.user!._id.toString()
  );

  await currentUser!.save();
  await senderUser.save();

  // Create activities
  await Activity.create({
    user: req.user!._id,
    type: 'friend_added',
    title: 'New Friend!',
    description: `You are now friends with ${senderUser.username}`,
    metadata: { friendId: senderUserId, friendUsername: senderUser.username },
  });

  await Activity.create({
    user: senderUserId,
    type: 'friend_added',
    title: 'New Friend!',
    description: `You are now friends with ${currentUser!.username}`,
    metadata: { friendId: req.user!._id, friendUsername: currentUser!.username },
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

  res.json({
    success: true,
    data: {
      friends: user!.friends,
      sentRequests: user!.friendRequests.sent,
      receivedRequests: user!.friendRequests.received,
    },
  });
});

// @desc    Create team
// @route   POST /api/social/teams
// @access  Private
export const createTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, maxMembers } = req.body;

  const existingTeam = await Team.findOne({ name });
  if (existingTeam) {
    res.status(400);
    throw new Error('Team name already exists');
  }

  const team = await Team.create({
    name,
    description,
    leader: req.user!._id,
    members: [req.user!._id],
    maxMembers: maxMembers || 20,
  });

  // Add user to team
  const user = await User.findById(req.user!._id);
  user!.teamId = team._id;
  await user!.save();

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
    res.status(404);
    throw new Error('Team not found');
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
    res.status(404);
    throw new Error('Team not found');
  }

  if (team.members.length >= team.maxMembers) {
    res.status(400);
    throw new Error('Team is full');
  }

  if (team.members.includes(req.user!._id)) {
    res.status(400);
    throw new Error('Already a member of this team');
  }

  team.members.push(req.user!._id);
  await team.save();

  const user = await User.findById(req.user!._id);
  user!.teamId = team._id;
  await user!.save();

  res.json({
    success: true,
    data: team,
  });
});

// @desc    Get activity feed
// @route   GET /api/social/activity
// @access  Private
export const getActivityFeed = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20 } = req.query;
  
  const user = await User.findById(req.user!._id);
  const friendIds = user!.friends.map((f: any) => f.toString());
  
  // Get activities from user and friends
  const activities = await Activity.find({
    $or: [
      { user: req.user!._id },
      { user: { $in: friendIds } },
    ],
  })
    .populate('user', 'username avatar')
    .sort({ createdAt: -1 })
    .limit(Number(limit) * 1)
    .skip((Number(page) - 1) * Number(limit));

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
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// @desc    Search users
// @route   GET /api/social/users/search
// @access  Private
export const searchUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { q, limit = 20 } = req.query;

  if (!q || (q as string).length < 2) {
    res.status(400);
    throw new Error('Search query must be at least 2 characters');
  }

  const users = await User.find({
    $or: [
      { username: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ],
    _id: { $ne: req.user!._id },
  })
    .select('username avatar level xp')
    .limit(Number(limit));

  res.json({
    success: true,
    data: users,
  });
});
