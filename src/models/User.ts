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
  addXP(amount: number): void;
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

// Add XP and update level
UserSchema.methods.addXP = function (amount: number): void {
  this.xp += amount;
  const newLevel = this.calculateLevel();
  if (newLevel > this.level) {
    this.level = newLevel;
  }
};

// Compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
