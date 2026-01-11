import { Types } from 'mongoose';

// Mock Notification model
const mockNotificationSave = jest.fn();
const mockNotificationFindOne = jest.fn();
const mockNotificationFind = jest.fn();
const mockNotificationCountDocuments = jest.fn();
const mockNotificationFindOneAndUpdate = jest.fn();
const mockNotificationFindOneAndDelete = jest.fn();
const mockNotificationUpdateMany = jest.fn();
const mockNotificationInsertMany = jest.fn();

jest.mock('@/models/Notification', () => {
  return jest.fn().mockImplementation((data) => ({
    ...data,
    save: mockNotificationSave,
  }));
});

const MockNotification = require('@/models/Notification');
MockNotification.findOne = mockNotificationFindOne;
MockNotification.find = mockNotificationFind;
MockNotification.countDocuments = mockNotificationCountDocuments;
MockNotification.findOneAndUpdate = mockNotificationFindOneAndUpdate;
MockNotification.findOneAndDelete = mockNotificationFindOneAndDelete;
MockNotification.updateMany = mockNotificationUpdateMany;
MockNotification.insertMany = mockNotificationInsertMany;

// Mock User model
const mockUserFind = jest.fn();
jest.mock('@/models/User', () => ({
  find: mockUserFind,
}));

// Import service after mocks
import { notificationService } from '../notificationService';

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const userId = new Types.ObjectId().toString();
      const params = {
        userId,
        title: 'Test Notification',
        message: 'This is a test message',
        type: 'system' as const,
        data: { key: 'value' },
      };

      mockNotificationSave.mockResolvedValue({
        _id: new Types.ObjectId(),
        ...params,
      });

      const result = await notificationService.createNotification(params);

      expect(mockNotificationSave).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should create notification without optional data', async () => {
      const userId = new Types.ObjectId().toString();
      const params = {
        userId,
        title: 'Test',
        message: 'Message',
        type: 'user' as const,
      };

      mockNotificationSave.mockResolvedValue({
        _id: new Types.ObjectId(),
        ...params,
        data: {},
      });

      const result = await notificationService.createNotification(params);

      expect(mockNotificationSave).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw error when save fails', async () => {
      const params = {
        userId: new Types.ObjectId().toString(),
        title: 'Test',
        message: 'Message',
        type: 'system' as const,
      };

      mockNotificationSave.mockRejectedValue(new Error('Database error'));

      await expect(notificationService.createNotification(params)).rejects.toThrow('Database error');
    });

    it('should handle template type notification', async () => {
      const params = {
        userId: new Types.ObjectId().toString(),
        title: 'New Template',
        message: 'A new template is available',
        type: 'template' as const,
      };

      mockNotificationSave.mockResolvedValue({
        _id: new Types.ObjectId(),
        ...params,
      });

      const result = await notificationService.createNotification(params);
      expect(result).toBeDefined();
    });

    it('should handle analytics type notification', async () => {
      const params = {
        userId: new Types.ObjectId().toString(),
        title: 'Analytics Update',
        message: 'Your analytics are ready',
        type: 'analytics' as const,
      };

      mockNotificationSave.mockResolvedValue({
        _id: new Types.ObjectId(),
        ...params,
      });

      const result = await notificationService.createNotification(params);
      expect(result).toBeDefined();
    });
  });

  describe('notifyAllAdmins', () => {
    it('should create notifications for all admins', async () => {
      const adminIds = [
        { _id: new Types.ObjectId() },
        { _id: new Types.ObjectId() },
      ];

      mockUserFind.mockReturnValue({
        select: jest.fn().mockResolvedValue(adminIds),
      });
      mockNotificationFindOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });
      mockNotificationInsertMany.mockResolvedValue([]);

      const result = await notificationService.notifyAllAdmins(
        'Admin Notification',
        'Message for admins',
        'system',
        { extra: 'data' }
      );

      expect(mockUserFind).toHaveBeenCalledWith({ role: 'admin' });
      expect(mockNotificationInsertMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no admins found', async () => {
      mockUserFind.mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      const result = await notificationService.notifyAllAdmins(
        'Title',
        'Message',
        'system'
      );

      expect(result).toEqual([]);
    });

    it('should skip duplicate notifications within 10 seconds', async () => {
      mockUserFind.mockReturnValue({
        select: jest.fn().mockResolvedValue([{ _id: new Types.ObjectId() }]),
      });
      mockNotificationFindOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'existing' }),
      });

      const result = await notificationService.notifyAllAdmins(
        'Duplicate Title',
        'Duplicate Message',
        'system'
      );

      expect(result).toEqual([]);
      expect(mockNotificationInsertMany).not.toHaveBeenCalled();
    });

    it('should handle error when notifying admins fails', async () => {
      mockUserFind.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('DB Error')),
      });

      await expect(
        notificationService.notifyAllAdmins('Title', 'Message', 'system')
      ).rejects.toThrow('DB Error');
    });

    it('should work without optional data parameter', async () => {
      const adminIds = [{ _id: new Types.ObjectId() }];

      mockUserFind.mockReturnValue({
        select: jest.fn().mockResolvedValue(adminIds),
      });
      mockNotificationFindOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });
      mockNotificationInsertMany.mockResolvedValue([]);

      const result = await notificationService.notifyAllAdmins(
        'Title',
        'Message',
        'user'
      );

      expect(result).toHaveLength(1);
    });
  });

  describe('getNotifications', () => {
    it('should get notifications with default pagination', async () => {
      const userId = new Types.ObjectId().toString();
      const mockNotifications = [
        { _id: new Types.ObjectId(), title: 'Notification 1' },
        { _id: new Types.ObjectId(), title: 'Notification 2' },
      ];

      mockNotificationFind.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockNotifications),
            }),
          }),
        }),
      });
      mockNotificationCountDocuments.mockResolvedValue(5);

      const result = await notificationService.getNotifications(userId);

      expect(result.notifications).toHaveLength(2);
      expect(result.unreadCount).toBe(5);
    });

    it('should get notifications with custom pagination', async () => {
      const userId = new Types.ObjectId().toString();

      mockNotificationFind.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      mockNotificationCountDocuments.mockResolvedValue(0);

      const result = await notificationService.getNotifications(userId, 20, 10);

      expect(result.notifications).toEqual([]);
      expect(result.unreadCount).toBe(0);
    });

    it('should handle error when getting notifications', async () => {
      mockNotificationFind.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              lean: jest.fn().mockRejectedValue(new Error('Find error')),
            }),
          }),
        }),
      });

      await expect(
        notificationService.getNotifications('userId')
      ).rejects.toThrow('Find error');
    });

    it('should accept ObjectId as userId', async () => {
      const userId = new Types.ObjectId();

      mockNotificationFind.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      mockNotificationCountDocuments.mockResolvedValue(0);

      const result = await notificationService.getNotifications(userId);

      expect(result).toBeDefined();
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();
      const mockNotification = { _id: notificationId, isRead: true };

      mockNotificationFindOneAndUpdate.mockResolvedValue(mockNotification);

      const result = await notificationService.markAsRead(notificationId, userId);

      expect(mockNotificationFindOneAndUpdate).toHaveBeenCalled();
      expect(result).toEqual(mockNotification);
    });

    it('should return null if notification not found', async () => {
      const notificationId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();
      mockNotificationFindOneAndUpdate.mockResolvedValue(null);

      const result = await notificationService.markAsRead(notificationId, userId);

      expect(result).toBeNull();
    });

    it('should handle error when marking as read', async () => {
      const notificationId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();
      mockNotificationFindOneAndUpdate.mockRejectedValue(new Error('Update error'));

      await expect(
        notificationService.markAsRead(notificationId, userId)
      ).rejects.toThrow('Update error');
    });

    it('should accept ObjectId types', async () => {
      const notificationId = new Types.ObjectId();
      const userId = new Types.ObjectId();

      mockNotificationFindOneAndUpdate.mockResolvedValue({ isRead: true });

      const result = await notificationService.markAsRead(notificationId, userId);

      expect(result).toBeDefined();
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      const userId = new Types.ObjectId().toString();
      const mockResult = { modifiedCount: 5, matchedCount: 5 };

      mockNotificationUpdateMany.mockResolvedValue(mockResult);

      const result = await notificationService.markAllAsRead(userId);

      expect(mockNotificationUpdateMany).toHaveBeenCalledWith(
        { userId, isRead: false },
        { isRead: true }
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle zero notifications to update', async () => {
      mockNotificationUpdateMany.mockResolvedValue({ modifiedCount: 0, matchedCount: 0 });

      const result = await notificationService.markAllAsRead('userId');

      expect(result.modifiedCount).toBe(0);
    });

    it('should handle error when marking all as read', async () => {
      mockNotificationUpdateMany.mockRejectedValue(new Error('Update many error'));

      await expect(
        notificationService.markAllAsRead('userId')
      ).rejects.toThrow('Update many error');
    });

    it('should accept ObjectId as userId', async () => {
      const userId = new Types.ObjectId();

      mockNotificationUpdateMany.mockResolvedValue({ modifiedCount: 1 });

      const result = await notificationService.markAllAsRead(userId);

      expect(result).toBeDefined();
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification successfully', async () => {
      const notificationId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();
      const mockNotification = { _id: notificationId };

      mockNotificationFindOneAndDelete.mockResolvedValue(mockNotification);

      const result = await notificationService.deleteNotification(notificationId, userId);

      expect(mockNotificationFindOneAndDelete).toHaveBeenCalled();
      expect(result).toEqual(mockNotification);
    });

    it('should return null if notification not found', async () => {
      const notificationId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();
      mockNotificationFindOneAndDelete.mockResolvedValue(null);

      const result = await notificationService.deleteNotification(notificationId, userId);

      expect(result).toBeNull();
    });

    it('should handle error when deleting', async () => {
      const notificationId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();
      mockNotificationFindOneAndDelete.mockRejectedValue(new Error('Delete error'));

      await expect(
        notificationService.deleteNotification(notificationId, userId)
      ).rejects.toThrow('Delete error');
    });

    it('should accept ObjectId types', async () => {
      const notificationId = new Types.ObjectId();
      const userId = new Types.ObjectId();

      mockNotificationFindOneAndDelete.mockResolvedValue({ deleted: true });

      const result = await notificationService.deleteNotification(notificationId, userId);

      expect(result).toBeDefined();
    });
  });
});
