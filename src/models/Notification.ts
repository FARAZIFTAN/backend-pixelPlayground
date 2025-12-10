import mongoose from 'mongoose';

export interface INotification extends mongoose.Document {
  userId: mongoose.Schema.Types.ObjectId;
  title: string;
  message: string;
  type: 'template' | 'user' | 'system' | 'analytics';
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['template', 'user', 'system', 'analytics'],
      default: 'system',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
