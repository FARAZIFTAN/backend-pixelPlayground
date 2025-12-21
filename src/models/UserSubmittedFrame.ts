import { Schema, model, models, Document } from 'mongoose';

export interface IUserSubmittedFrame extends Document {
  userId: string;
  name: string;
  description: string;
  frameUrl: string; // base64 SVG
  thumbnail: string; // base64 SVG
  frameCount: number;
  layout: 'vertical' | 'horizontal' | 'grid';
  frameSpec: {
    frameCount: number;
    layout: string;
    backgroundColor: string;
    borderColor: string;
    gradientFrom?: string;
    gradientTo?: string;
  };
  layoutPositions: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    borderRadius: number;
    rotation: number;
  }>;
  status: 'pending' | 'approved' | 'rejected';
  isPremium: boolean;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  approvedBy?: string; // Admin user who approved
}

const userSubmittedFrameSchema = new Schema<IUserSubmittedFrame>(
  {
    userId: {
      type: String,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Frame name is required'],
      trim: true,
      maxlength: [100, 'Frame name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    frameUrl: {
      type: String,
      required: [true, 'Frame URL is required'],
    },
    thumbnail: {
      type: String,
      required: [true, 'Thumbnail is required'],
    },
    frameCount: {
      type: Number,
      required: [true, 'Frame count is required'],
      min: 1,
      max: 9,
    },
    layout: {
      type: String,
      enum: ['vertical', 'horizontal', 'grid'],
      required: [true, 'Layout is required'],
    },
    frameSpec: {
      type: Object,
      required: [true, 'Frame spec is required'],
    },
    layoutPositions: {
      type: [Object],
      required: [true, 'Layout positions are required'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    rejectionReason: {
      type: String,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      type: String,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSubmittedFrameSchema.index({ userId: 1, status: 1 });
userSubmittedFrameSchema.index({ status: 1, createdAt: -1 });
userSubmittedFrameSchema.index({ approvedBy: 1 });

const UserSubmittedFrame = models.UserSubmittedFrame || model<IUserSubmittedFrame>('UserSubmittedFrame', userSubmittedFrameSchema);

export default UserSubmittedFrame;
