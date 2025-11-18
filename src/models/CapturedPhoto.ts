import { Schema, model, models, Document, Model } from 'mongoose';

export interface ICapturedPhoto extends Document {
  sessionId: string;
  userId: string;
  photoUrl: string;
  thumbnailUrl?: string;
  order: number;
  metadata: {
    width?: number;
    height?: number;
    fileSize?: number;
    format?: string;
    capturedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const capturedPhotoSchema = new Schema<ICapturedPhoto>(
  {
    sessionId: {
      type: String,
      ref: 'PhotoSession',
      required: [true, 'Session ID is required'],
      index: true,
    },
    userId: {
      type: String,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    photoUrl: {
      type: String,
      required: [true, 'Photo URL is required'],
      maxlength: [500, 'Photo URL cannot exceed 500 characters'],
    },
    thumbnailUrl: {
      type: String,
      maxlength: [500, 'Thumbnail URL cannot exceed 500 characters'],
    },
    order: {
      type: Number,
      required: [true, 'Order is required'],
      default: 0,
    },
    metadata: {
      width: Number,
      height: Number,
      fileSize: Number,
      format: String,
      capturedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
capturedPhotoSchema.index({ sessionId: 1, order: 1 });
capturedPhotoSchema.index({ userId: 1, createdAt: -1 });

const CapturedPhoto = (models.CapturedPhoto || model<ICapturedPhoto>('CapturedPhoto', capturedPhotoSchema)) as Model<ICapturedPhoto>;

export default CapturedPhoto;
