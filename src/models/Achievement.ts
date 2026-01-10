import mongoose, { Document, Schema } from 'mongoose';

export interface IAchievement extends Document {
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  category: 'learning' | 'social' | 'streak' | 'special';
  requirement: {
    type: string;
    value: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  createdAt: Date;
}

const AchievementSchema = new Schema<IAchievement>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    xpReward: {
      type: Number,
      default: 50,
    },
    category: {
      type: String,
      enum: ['learning', 'social', 'streak', 'special'],
      required: true,
      index: true,
    },
    requirement: {
      type: {
        type: String,
        required: true,
      },
      value: {
        type: Number,
        required: true,
      },
    },
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      default: 'common',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IAchievement>('Achievement', AchievementSchema);
