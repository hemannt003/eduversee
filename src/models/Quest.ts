import mongoose, { Document, Schema } from 'mongoose';

export interface IQuest extends Document {
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  requirements: {
    type: string;
    target: number;
  };
  rewards: {
    xp: number;
    badges?: mongoose.Types.ObjectId[];
  };
  expiresAt?: Date;
  completedBy: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
}

const QuestSchema = new Schema<IQuest>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['daily', 'weekly', 'special'],
      required: true,
      index: true,
    },
    requirements: {
      type: {
        type: String,
        required: true,
      },
      target: {
        type: Number,
        required: true,
      },
    },
    rewards: {
      xp: {
        type: Number,
        default: 0,
      },
      badges: [{
        type: Schema.Types.ObjectId,
        ref: 'Badge',
      }],
    },
    expiresAt: {
      type: Date,
    },
    completedBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

QuestSchema.index({ type: 1, isActive: 1, expiresAt: 1 });

export default mongoose.model<IQuest>('Quest', QuestSchema);
