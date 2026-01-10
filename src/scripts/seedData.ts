import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Achievement from '../models/Achievement';
import Badge from '../models/Badge';
import Quest from '../models/Quest';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduverse');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Achievement.deleteMany({});
    await Badge.deleteMany({});
    await Quest.deleteMany({});

    // Create achievements
    const achievements = await Achievement.insertMany([
      {
        name: 'First Steps',
        description: 'Reach level 5',
        icon: '👶',
        xpReward: 50,
        category: 'learning',
        requirement: { type: 'level', value: 5 },
        rarity: 'common',
      },
      {
        name: 'Rising Star',
        description: 'Reach level 10',
        icon: '⭐',
        xpReward: 100,
        category: 'learning',
        requirement: { type: 'level', value: 10 },
        rarity: 'rare',
      },
      {
        name: 'XP Master',
        description: 'Earn 10,000 XP',
        icon: '💎',
        xpReward: 200,
        category: 'learning',
        requirement: { type: 'xp', value: 10000 },
        rarity: 'epic',
      },
      {
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
        xpReward: 150,
        category: 'streak',
        requirement: { type: 'streak', value: 7 },
        rarity: 'rare',
      },
      {
        name: 'Social Butterfly',
        description: 'Add 10 friends',
        icon: '🦋',
        xpReward: 100,
        category: 'social',
        requirement: { type: 'friends', value: 10 },
        rarity: 'rare',
      },
    ]);

    // Create badges
    const badges = await Badge.insertMany([
      {
        name: 'Quick Learner',
        description: 'Complete 5 lessons in one day',
        icon: '⚡',
        category: 'learning',
        rarity: 'common',
      },
      {
        name: 'Dedicated Student',
        description: 'Complete 50 lessons',
        icon: '📚',
        category: 'learning',
        rarity: 'epic',
      },
      {
        name: 'Team Player',
        description: 'Join a team',
        icon: '👥',
        category: 'social',
        rarity: 'common',
      },
    ]);

    // Create daily quest
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    await Quest.create({
      title: 'Daily Learning',
      description: 'Complete 3 lessons today',
      type: 'daily',
      requirements: { type: 'lessons_completed', target: 3 },
      rewards: { xp: 100 },
      expiresAt: tomorrow,
      isActive: true,
    });

    console.log('Seed data created successfully!');
    console.log(`Created ${achievements.length} achievements`);
    console.log(`Created ${badges.length} badges`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
