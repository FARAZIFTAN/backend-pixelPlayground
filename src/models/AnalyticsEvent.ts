import { Schema, model, models, Document, Model } from 'mongoose';

export interface IAnalyticsEvent extends Document {
  userId?: string;
  sessionId?: string;
  eventType: string;
  eventCategory: string;
  templateId?: string;
  metadata?: Record<string, any>;
  deviceInfo?: string;
  ipAddress?: string;
  referrer?: string;
  timestamp: Date;
  createdAt: Date;
}

const analyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    userId: {
      type: String,
      ref: 'User',
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      index: true,
      maxlength: [50, 'Event type cannot exceed 50 characters'],
    },
    eventCategory: {
      type: String,
      required: [true, 'Event category is required'],
      index: true,
      maxlength: [50, 'Event category cannot exceed 50 characters'],
    },
    templateId: {
      type: String,
      ref: 'Template',
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    deviceInfo: {
      type: String,
      maxlength: [500, 'Device info cannot exceed 500 characters'],
    },
    ipAddress: {
      type: String,
      maxlength: [50, 'IP address cannot exceed 50 characters'],
    },
    referrer: {
      type: String,
      maxlength: [255, 'Referrer cannot exceed 255 characters'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
analyticsEventSchema.index({ eventCategory: 1, timestamp: -1 });
analyticsEventSchema.index({ eventType: 1, timestamp: -1 });
analyticsEventSchema.index({ userId: 1, timestamp: -1 });
analyticsEventSchema.index({ templateId: 1, timestamp: -1 });

// TTL index - automatically delete events older than 90 days
analyticsEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

const AnalyticsEvent = (models.AnalyticsEvent || model<IAnalyticsEvent>('AnalyticsEvent', analyticsEventSchema)) as Model<IAnalyticsEvent>;

export default AnalyticsEvent;
