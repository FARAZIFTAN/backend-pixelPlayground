import Notification from '@/models/Notification';
import User from '@/models/User';
import { Types } from 'mongoose';

interface CreateNotificationParams {
  userId: string | Types.ObjectId;
  title: string;
  message: string;
  type: 'template' | 'user' | 'system' | 'analytics';
  data?: Record<string, any>;
}

export const notificationService = {
  /**
   * Create a notification for a user
   */
  async createNotification({
    userId,
    title,
    message,
    type,
    data = {},
  }: CreateNotificationParams) {
    try {
      const notification = new Notification({
        userId: new Types.ObjectId(userId),
        title,
        message,
        type,
        data,
      });

      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  /**
   * Create notification for all admins
   * Includes deduplication to prevent duplicate notifications within 10 seconds
   */
  async notifyAllAdmins(
    title: string,
    message: string,
    type: 'template' | 'user' | 'system' | 'analytics',
    data?: Record<string, any>
  ) {
    try {
      // @ts-ignore - Mongoose types
      const admins = await User.find({ role: 'admin' }).select('_id');
      
      if (admins.length === 0) {
        return [];
      }

      const now = new Date();
      const tenSecondsAgo = new Date(now.getTime() - 10000);

      // Check if similar notification was created recently to prevent duplicates
      // @ts-ignore - Mongoose types
      const recentNotifications = await Notification.findOne({
        title,
        message,
        type,
        createdAt: { $gte: tenSecondsAgo },
      }).lean();

      if (recentNotifications) {
        console.log('[NOTIFICATION] Duplicate notification detected, skipping creation');
        return [];
      }

      const notifications = admins.map((admin) => ({
        userId: admin._id,
        title,
        message,
        type,
        data: data || {},
        isRead: false,
        createdAt: now,
        updatedAt: now,
      }));

      if (notifications.length > 0) {
        // @ts-ignore - Mongoose types
        await Notification.insertMany(notifications);
        console.log(`[NOTIFICATION] Created ${notifications.length} notifications for admins`);
      }

      return notifications;
    } catch (error) {
      console.error('Error notifying admins:', error);
      throw error;
    }
  },

  /**
   * Get notifications for a user
   */
  async getNotifications(
    userId: string | Types.ObjectId,
    limit = 10,
    skip = 0
  ) {
    try {
      // @ts-ignore - Mongoose types
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      // @ts-ignore - Mongoose types
      const unreadCount = await Notification.countDocuments({
        userId,
        isRead: false,
      });

      return {
        notifications,
        unreadCount,
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string | Types.ObjectId, userId: string | Types.ObjectId) {
    try {
      // @ts-ignore - Mongoose types
      const notification = await Notification.findOneAndUpdate(
        {
          _id: new Types.ObjectId(notificationId),
          userId: new Types.ObjectId(userId),
        },
        { isRead: true },
        { new: true }
      );

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string | Types.ObjectId) {
    try {
      // @ts-ignore - Mongoose types
      const result = await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );

      return result;
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(
    notificationId: string | Types.ObjectId,
    userId: string | Types.ObjectId
  ) {
    try {
      // @ts-ignore - Mongoose types
      const notification = await Notification.findOneAndDelete({
        _id: new Types.ObjectId(notificationId),
        userId: new Types.ObjectId(userId),
      });

      return notification;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },
};
