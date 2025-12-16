import { Schema, model, models, Document } from 'mongoose';

export interface ILayoutPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius?: number; // opsional, px
  rotation?: number; // opsional, derajat
}

export type TemplateVisibility = 'public' | 'private';

export interface ITemplate extends Document {
  name: string;
  category: string;
  description?: string;
  tags?: string[];
  thumbnail: string;
  frameUrl: string;
  isPremium: boolean;
  frameCount: number;
  layoutPositions: ILayoutPosition[];
  isActive: boolean;
  createdBy?: string;
  visibility: TemplateVisibility;
  isAIGenerated: boolean;
  aiFrameSpec?: any;
  createdAt: Date;
  updatedAt: Date;
}

const layoutPositionSchema = new Schema<ILayoutPosition>(
  {
    x: {
      type: Number,
      required: true,
    },
    y: {
      type: Number,
      required: true,
    },
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    borderRadius: {
      type: Number,
      required: false,
      default: 0,
    },
    rotation: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  { _id: false }
);

const templateSchema = new Schema<ITemplate>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Template name cannot be more than 100 characters'],
    },
    category: {
      type: String,
      required: true,
      trim: true,
      enum: [
        'Birthday',
        'Wedding',
        'Education',
        'Artistic',
        'Corporate',
        'Baby',
        'Holiday',
        'Love',
        'General',
        'AI Generated',
      ],
      default: 'General',
    },
    description: {
      type: String,
      required: false,
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    tags: {
      type: [String],
      required: false,
      default: [],
    },
    thumbnail: {
      type: String,
      required: true,
    },
    frameUrl: {
      type: String,
      required: true,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    frameCount: {
      type: Number,
      required: true,
      min: [2, 'Frame count must be at least 2'],
      max: [4, 'Frame count cannot exceed 4'],
    },
    layoutPositions: {
      type: [layoutPositionSchema],
      required: true,
      validate: {
        validator: function (positions: ILayoutPosition[]) {
          return positions.length === this.frameCount;
        },
        message: 'Number of layout positions must match frameCount',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      index: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
      index: true,
    },
    isAIGenerated: {
      type: Boolean,
      default: false,
      index: true,
    },
    aiFrameSpec: {
      type: Schema.Types.Mixed,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
templateSchema.index({ category: 1, isActive: 1 });
templateSchema.index({ isPremium: 1, isActive: 1 });
templateSchema.index({ name: 'text' });
templateSchema.index({ visibility: 1, isAIGenerated: 1 });
templateSchema.index({ createdBy: 1, visibility: 1 });

const Template = models.Template || model<ITemplate>('Template', templateSchema);

export default Template;
