import mongoose, { Document, Schema } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  description: string;
  instructor: mongoose.Types.ObjectId;
  category: string;
  lessons: mongoose.Types.ObjectId[];
  enrolledStudents: mongoose.Types.ObjectId[];
  xpReward: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  thumbnail?: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    lessons: [{
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
    }],
    enrolledStudents: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    xpReward: {
      type: Number,
      default: 100,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
      index: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    thumbnail: {
      type: String,
      default: '',
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
CourseSchema.index({ category: 1, isPublished: 1 });
CourseSchema.index({ instructor: 1, isPublished: 1 });
CourseSchema.index({ tags: 1 });

export default mongoose.model<ICourse>('Course', CourseSchema);
