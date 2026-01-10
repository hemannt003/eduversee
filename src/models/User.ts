import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  avatar?: string;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: Date;
  achievements: mongoose.Types.ObjectId[];
  badges: mongoose.Types.ObjectId[];
  friends: mongoose.Types.ObjectId[];
  friendRequests: {
    sent: mongoose.Types.ObjectId[];
    received: mongoose.Types.ObjectId[];
  };
  teamId?: mongoose.Types.ObjectId;
  role: 'student' | 'instructor' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  calculateLevel(): number;
  calculateXPMultiplier(): number;
  addXP(amount: number): number; // Returns actual XP earned after multipliers
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    xp: {
      type: Number,
      default: 0,
      index: true,
    },
    level: {
      type: Number,
      default: 1,
      index: true,
    },
    streak: {
      type: Number,
      default: 0,
    },
    lastActiveDate: {
      type: Date,
      default: Date.now,
    },
    achievements: [{
      type: Schema.Types.ObjectId,
      ref: 'Achievement',
    }],
    badges: [{
      type: Schema.Types.ObjectId,
      ref: 'Badge',
    }],
    friends: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    friendRequests: {
      sent: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
      }],
      received: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
      }],
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
    },
    role: {
      type: String,
      enum: ['student', 'instructor', 'admin'],
      default: 'student',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
UserSchema.index({ xp: -1 });
UserSchema.index({ level: -1, xp: -1 });
UserSchema.index({ 'friendRequests.received': 1 });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Calculate level based on XP
UserSchema.methods.calculateLevel = function (): number {
  // Level formula: level = floor(sqrt(xp / 100)) + 1
  return Math.floor(Math.sqrt(this.xp / 100)) + 1;
};

// Calculate XP multiplier based on active bonuses
UserSchema.methods.calculateXPMultiplier = function (): number {
  let multiplier = 1.0;

  // Streak bonus: 1% per day of streak, capped at 50% (50 days)
  if (this.streak > 0) {
    const streakBonus = Math.min(this.streak * 0.01, 0.5);
    multiplier += streakBonus;
  }

  // Guild/Team bonus: 10% if user is in a team
  if (this.teamId) {
    multiplier += 0.1;
  }

  // Event bonus: Can be added later when event system is implemented
  // For now, this is a placeholder for future expansion
  // multiplier += eventBonus;

  return multiplier;
};

// Add XP with multipliers and update level
// Returns the actual XP earned after multipliers are applied
UserSchema.methods.addXP = function (amount: number): number {
  // Apply multipliers (streak, guild, event bonuses)
  const multiplier = this.calculateXPMultiplier();
  const finalXP = Math.floor(amount * multiplier);
  
  this.xp += finalXP;
  const newLevel = this.calculateLevel();
  if (newLevel > this.level) {
    this.level = newLevel;
  }
  
  return finalXP; // Return actual XP earned for accurate reporting
};

// Compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
