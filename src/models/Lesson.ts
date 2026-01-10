import mongoose, { Document, Schema } from 'mongoose';

export interface ILesson extends Document {
  title: string;
  content: string;
  courseId: mongoose.Types.ObjectId;
  order: number;
  xpReward: number;
  completedBy: mongoose.Types.ObjectId[];
  quiz?: {
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      xpReward: number;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new Schema<ILesson>(
  {
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Lesson content is required'],
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    order: {
      type: Number,
      required: true,
    },
    xpReward: {
      type: Number,
      default: 50,
    },
    completedBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    quiz: {
      questions: [{
        question: {
          type: String,
          required: true,
        },
        options: [{
          type: String,
          required: true,
        }],
        correctAnswer: {
          type: Number,
          required: true,
        },
        xpReward: {
          type: Number,
          default: 10,
        },
      }],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
LessonSchema.index({ courseId: 1, order: 1 });

export default mongoose.model<ILesson>('Lesson', LessonSchema);
