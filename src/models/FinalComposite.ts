import { Schema, model, models, Document, Model } from 'mongoose';

export interface IFinalComposite extends Document {
  sessionId: string;
  userId: string;
  templateId?: string;
  compositeUrl: string;
  thumbnailUrl?: string;
  isPublic: boolean;
  likes: number;
  views: number;
  metadata: {
    width?: number;
    height?: number;
    fileSize?: number;
    format?: string;
    photosUsed?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const finalCompositeSchema = new Schema<IFinalComposite>(
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
    templateId: {
      type: String,
      ref: 'Template',
      index: true,
    },
    compositeUrl: {
      type: String,
      required: [true, 'Composite URL is required'],
      maxlength: [500, 'Composite URL cannot exceed 500 characters'],
    },
    thumbnailUrl: {
      type: String,
      maxlength: [500, 'Thumbnail URL cannot exceed 500 characters'],
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    likes: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    metadata: {
      width: Number,
      height: Number,
      fileSize: Number,
      format: String,
      photosUsed: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
finalCompositeSchema.index({ userId: 1, createdAt: -1 });
finalCompositeSchema.index({ isPublic: 1, likes: -1 });
finalCompositeSchema.index({ isPublic: 1, views: -1 });

const FinalComposite = (models.FinalComposite || model<IFinalComposite>('FinalComposite', finalCompositeSchema)) as Model<IFinalComposite>;

export default FinalComposite;
