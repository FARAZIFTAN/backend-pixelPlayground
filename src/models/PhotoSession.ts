import { Schema, model, models, Document, Model } from 'mongoose';

export interface IPhotoSession extends Document {
  userId: string;
  templateId?: string;
  sessionName: string;
  status: 'active' | 'completed' | 'cancelled';
  capturedPhotos: string[]; // Array of CapturedPhoto IDs
  finalComposite?: string; // FinalComposite ID
  metadata: {
    deviceInfo?: string;
    location?: string;
    totalPhotos?: number;
    duration?: number; // in seconds
  };
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const photoSessionSchema = new Schema<IPhotoSession>(
  {
    userId: {
      type: String,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    templateId: {
      type: String,
      ref: 'Template',
      index: true,
    },
    sessionName: {
      type: String,
      required: [true, 'Session name is required'],
      trim: true,
      maxlength: [100, 'Session name cannot exceed 100 characters'],
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
      index: true,
    },
    capturedPhotos: [{
      type: String,
      ref: 'CapturedPhoto',
    }],
    finalComposite: {
      type: String,
      ref: 'FinalComposite',
    },
    metadata: {
      deviceInfo: {
        type: String,
        maxlength: [500, 'Device info cannot exceed 500 characters'],
      },
      location: {
        type: String,
        maxlength: [200, 'Location cannot exceed 200 characters'],
      },
      totalPhotos: {
        type: Number,
        default: 0,
      },
      duration: {
        type: Number,
        default: 0,
      },
    },
    startedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
photoSessionSchema.index({ userId: 1, status: 1 });
photoSessionSchema.index({ userId: 1, createdAt: -1 });

const PhotoSession = (models.PhotoSession || model<IPhotoSession>('PhotoSession', photoSessionSchema)) as Model<IPhotoSession>;

export default PhotoSession;
