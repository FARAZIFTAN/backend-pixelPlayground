import { Schema, model, models, Document, Model } from 'mongoose';

export interface IPhoto extends Document {
  userId: string;
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  isPublic: boolean;
  templateId?: string;
  views: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

const photoSchema = new Schema<IPhoto>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    imageUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    templateId: {
      type: String,
      index: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
photoSchema.index({ userId: 1, createdAt: -1 });
photoSchema.index({ isPublic: 1, createdAt: -1 });
photoSchema.index({ templateId: 1, createdAt: -1 });

const Photo = (models.Photo || model<IPhoto>('Photo', photoSchema)) as Model<IPhoto>;

export default Photo;