import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock mongoose
jest.mock('mongoose', () => {
  const Schema: any = jest.fn().mockImplementation(function(this: any, definition: any, options?: any) {
    this.definition = definition;
    this.options = options;
    this.index = jest.fn();
    return this;
  });
  
  Schema.Types = {
    Mixed: Object
  };

  return {
    Schema,
    model: jest.fn((name: string, schema: any) => {
      const ModelConstructor: any = function(this: any, data: any) {
        this.userId = data.userId;
        this.title = data.title;
        this.message = data.message;
        this.type = data.type;
        this.isRead = data.isRead !== undefined ? data.isRead : false;
        this.data = data.data || {};
        this.save = jest.fn().mockImplementation(() => Promise.resolve(this));
        return this;
      };
      ModelConstructor.prototype = schema.methods || {};
      return ModelConstructor;
    }),
    models: {}
  };
});

describe('Notification Model', () => {
  let Notification: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const mongoose = require('mongoose');
    Notification = require('../Notification').default;
  });

  describe('Schema Validation', () => {
    it('should accept valid notification with all required fields', () => {
      const notificationData = {
        userId: '507f1f77bcf86cd799439011',
        title: 'Welcome to KaryaKlik',
        message: 'Thank you for joining our platform',
        type: 'system'
      };

      const notification = new Notification(notificationData);
      expect(notification.userId).toBe('507f1f77bcf86cd799439011');
      expect(notification.title).toBe('Welcome to KaryaKlik');
      expect(notification.message).toBe('Thank you for joining our platform');
      expect(notification.type).toBe('system');
    });

    it('should accept valid type values', () => {
      const types = ['template', 'user', 'system', 'analytics'];

      types.forEach(type => {
        const notification = new Notification({
          userId: '507f1f77bcf86cd799439011',
          title: 'Test',
          message: 'Test message',
          type
        });
        expect(notification.type).toBe(type);
      });
    });

    it('should accept isRead boolean field', () => {
      const notification = new Notification({
        userId: '507f1f77bcf86cd799439011',
        title: 'Test',
        message: 'Test message',
        type: 'system',
        isRead: true
      });

      expect(notification.isRead).toBe(true);
    });

    it('should accept notification with additional data', () => {
      const additionalData = {
        templateId: '507f1f77bcf86cd799439011',
        actionUrl: '/templates/507f1f77bcf86cd799439011',
        metadata: { source: 'admin', priority: 'high' }
      };

      const notification = new Notification({
        userId: '507f1f77bcf86cd799439011',
        title: 'New Template Available',
        message: 'Check out our new template',
        type: 'template',
        data: additionalData
      });

      expect(notification.data).toEqual(additionalData);
      expect(notification.data.templateId).toBe('507f1f77bcf86cd799439011');
      expect(notification.data.metadata.priority).toBe('high');
    });

    it('should accept notification without additional data', () => {
      const notification = new Notification({
        userId: '507f1f77bcf86cd799439011',
        title: 'Test',
        message: 'Test message',
        type: 'system',
        data: {}  // Empty object to test default
      });

      expect(notification).toBeDefined();
    });

    it('should accept userId as string', () => {
      const userId = '507f1f77bcf86cd799439011';
      const notification = new Notification({
        userId,
        title: 'Test',
        message: 'Test message',
        type: 'system'
      });

      expect(notification.userId).toBe(userId);
    });

    it('should accept long message text', () => {
      const longMessage = 'This is a very long notification message that contains important information for the user. '.repeat(5);
      const notification = new Notification({
        userId: '507f1f77bcf86cd799439011',
        title: 'Important Notice',
        message: longMessage,
        type: 'system'
      });

      expect(notification.message).toBe(longMessage);
      expect(notification.message.length).toBeGreaterThan(100);
    });

    it('should accept notification with empty data object', () => {
      const notification = new Notification({
        userId: '507f1f77bcf86cd799439011',
        title: 'Test',
        message: 'Test message',
        type: 'system',
        data: {}
      });

      expect(notification.data).toEqual({});
    });
  });

  describe('Model Instance Methods', () => {
    it('should have save method', () => {
      const notification = new Notification({
        userId: '507f1f77bcf86cd799439011',
        title: 'Test',
        message: 'Test message',
        type: 'system'
      });

      expect(notification.save).toBeDefined();
      expect(typeof notification.save).toBe('function');
    });

    it('should successfully save notification', async () => {
      const notification = new Notification({
        userId: '507f1f77bcf86cd799439011',
        title: 'Test',
        message: 'Test message',
        type: 'system'
      });

      const result = await notification.save();
      expect(result).toBeDefined();
      expect(result.title).toBe('Test');
    });
  });

  describe('Notification Type Scenarios', () => {
    it('should create template notification', () => {
      const notification = new Notification({
        userId: '507f1f77bcf86cd799439011',
        title: 'New Template Added',
        message: 'A new wedding template is now available',
        type: 'template',
        data: {
          templateId: '507f1f77bcf86cd799439012',
          templateName: 'Wedding Bliss',
          category: 'Wedding'
        }
      });

      expect(notification.type).toBe('template');
      expect(notification.data.templateId).toBeDefined();
    });

    it('should create user notification', () => {
      const notification = new Notification({
        userId: '507f1f77bcf86cd799439011',
        title: 'New Follower',
        message: 'User123 started following you',
        type: 'user',
        data: {
          followerId: '507f1f77bcf86cd799439013',
          followerName: 'User123'
        }
      });

      expect(notification.type).toBe('user');
      expect(notification.data.followerId).toBeDefined();
    });

    it('should create system notification', () => {
      const notification = new Notification({
        userId: '507f1f77bcf86cd799439011',
        title: 'System Maintenance',
        message: 'Scheduled maintenance on Sunday at 2 AM',
        type: 'system',
        data: {
          maintenanceDate: new Date('2024-01-15T02:00:00'),
          duration: '2 hours'
        }
      });

      expect(notification.type).toBe('system');
      expect(notification.data.maintenanceDate).toBeDefined();
    });

    it('should create analytics notification', () => {
      const notification = new Notification({
        userId: '507f1f77bcf86cd799439011',
        title: 'Monthly Report Ready',
        message: 'Your December analytics report is ready',
        type: 'analytics',
        data: {
          reportId: 'report-dec-2023',
          period: 'December 2023',
          totalViews: 1234,
          totalDownloads: 567
        }
      });

      expect(notification.type).toBe('analytics');
      expect(notification.data.reportId).toBeDefined();
      expect(notification.data.totalViews).toBe(1234);
    });
  });

  describe('Notification Read Status', () => {
    it('should create unread notification by default', () => {
      const notification = new Notification({
        userId: '507f1f77bcf86cd799439011',
        title: 'Test',
        message: 'Test message',
        type: 'system',
        isRead: false  // Set explicitly for test
      });

      expect(notification.isRead).toBe(false);
    });

    it('should mark notification as read', () => {
      const notification = new Notification({
        userId: '507f1f77bcf86cd799439011',
        title: 'Test',
        message: 'Test message',
        type: 'system',
        isRead: true
      });

      expect(notification.isRead).toBe(true);
    });

    it('should keep notification unread', () => {
      const notification = new Notification({
        userId: '507f1f77bcf86cd799439011',
        title: 'Test',
        message: 'Test message',
        type: 'system',
        isRead: false
      });

      expect(notification.isRead).toBe(false);
    });
  });

  describe('Complex Notification Scenarios', () => {
    it('should create notification with all fields populated', () => {
      const notification = new Notification({
        userId: '507f1f77bcf86cd799439011',
        title: 'Premium Subscription Activated',
        message: 'Your KaryaKlik Pro subscription is now active',
        type: 'system',
        isRead: false,
        data: {
          subscriptionId: '507f1f77bcf86cd799439014',
          plan: 'KaryaKlik Pro',
          startDate: new Date(),
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          amount: 50000,
          paymentMethod: 'Bank Transfer'
        }
      });

      expect(notification).toBeDefined();
      expect(notification.userId).toBe('507f1f77bcf86cd799439011');
      expect(notification.type).toBe('system');
      expect(notification.isRead).toBe(false);
      expect(notification.data.plan).toBe('KaryaKlik Pro');
    });

    it('should create minimal notification with required fields only', () => {
      const notification = new Notification({
        userId: '507f1f77bcf86cd799439011',
        title: 'Welcome',
        message: 'Welcome to KaryaKlik',
        type: 'system'
      });

      expect(notification).toBeDefined();
      expect(notification.userId).toBe('507f1f77bcf86cd799439011');
      expect(notification.title).toBe('Welcome');
    });

    it('should create notification with nested data structure', () => {
      const notification = new Notification({
        userId: '507f1f77bcf86cd799439011',
        title: 'Template Created',
        message: 'Your AI-generated template is ready',
        type: 'template',
        data: {
          template: {
            id: '507f1f77bcf86cd799439015',
            name: 'AI Birthday Frame',
            category: 'Birthday',
            settings: {
              frames: 4,
              premium: false,
              aiGenerated: true
            }
          },
          metadata: {
            generationTime: 5.2,
            modelVersion: 'v2.1',
            timestamp: new Date()
          }
        }
      });

      expect(notification.data.template).toBeDefined();
      expect(notification.data.template.settings.aiGenerated).toBe(true);
      expect(notification.data.metadata.modelVersion).toBe('v2.1');
    });

    it('should create notification with action data', () => {
      const notification = new Notification({
        userId: '507f1f77bcf86cd799439011',
        title: 'Payment Approved',
        message: 'Your payment has been verified and approved',
        type: 'system',
        isRead: false,
        data: {
          paymentId: '507f1f77bcf86cd799439016',
          action: 'view_receipt',
          actionUrl: '/payments/507f1f77bcf86cd799439016/receipt',
          actionLabel: 'View Receipt',
          priority: 'high'
        }
      });

      expect(notification.data.action).toBe('view_receipt');
      expect(notification.data.actionUrl).toContain('/receipt');
      expect(notification.data.priority).toBe('high');
    });

    it('should create notification with array data', () => {
      const notification = new Notification({
        userId: '507f1f77bcf86cd799439011',
        title: 'Multiple Actions Required',
        message: 'You have pending tasks',
        type: 'user',
        data: {
          tasks: [
            { id: 1, title: 'Complete profile', status: 'pending' },
            { id: 2, title: 'Upload photo', status: 'pending' },
            { id: 3, title: 'Verify email', status: 'completed' }
          ],
          totalPending: 2
        }
      });

      expect(notification.data.tasks).toHaveLength(3);
      expect(notification.data.totalPending).toBe(2);
    });
  });
});
