import { Schema, model, models, Document } from 'mongoose';
import { ILayoutPosition } from './Template';

export interface IUserGeneratedFrame extends Document {
  name: string;
  description?: string;
  userId: string; // Referensi ke User yang membuat frame
  thumbnail: string; // SVG atau image URL
  frameUrl: string; // SVG frame
  frameCount: number; // 2-6
  layoutPositions: ILayoutPosition[];
  frameSpec?: {
    frameCount: number;
    layout: 'vertical' | 'horizontal' | 'grid';
    backgroundColor: string;
    borderColor: string;
    gradientFrom?: string;
    gradientTo?: string;
  };
  isActive: boolean;
  isFavorite: boolean;
  usageCount: number; // Berapa kali frame ini digunakan
  createdAt: Date;
  updatedAt: Date;
}

const userGeneratedFrameSchema = new Schema<IUserGeneratedFrame>(
  {
    name: {
      type: String,
      required: [true, 'Frame name is required'],
      trim: true,
      maxlength: [100, 'Frame name cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: false,
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    frameUrl: {
      type: String,
      required: true,
    },
    frameCount: {
      type: Number,
      required: true,
      min: 2,
      max: 6,
    },
    layoutPositions: {
      type: [
        {
          x: { type: Number, required: true },
          y: { type: Number, required: true },
          width: { type: Number, required: true },
          height: { type: Number, required: true },
          borderRadius: { type: Number, default: 0 },
          rotation: { type: Number, default: 0 },
        },
      ],
      required: true,
    },
    frameSpec: {
      type: {
        frameCount: Number,
        layout: { type: String, enum: ['vertical', 'horizontal', 'grid'] },
        backgroundColor: String,
        borderColor: String,
        gradientFrom: String,
        gradientTo: String,
      },
      required: false,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    isFavorite: {
      type: Boolean,
      required: true,
      default: false,
    },
    usageCount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index untuk query berdasarkan user
userGeneratedFrameSchema.index({ userId: 1, createdAt: -1 });

export default models.UserGeneratedFrame ||
  model<IUserGeneratedFrame>('UserGeneratedFrame', userGeneratedFrameSchema);
