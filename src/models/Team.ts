import mongoose, { Document, Schema } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  description: string;
  leader: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  xp: number;
  level: number;
  avatar?: string;
  maxMembers: number;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: [50, 'Team name cannot exceed 50 characters'],
      index: true,
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    leader: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    xp: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    avatar: {
      type: String,
      default: '',
    },
    maxMembers: {
      type: Number,
      default: 20,
    },
  },
  {
    timestamps: true,
  }
);

TeamSchema.index({ xp: -1 });
TeamSchema.index({ level: -1, xp: -1 });

export default mongoose.model<ITeam>('Team', TeamSchema);
