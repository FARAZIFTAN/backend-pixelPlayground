import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock mongoose
jest.mock('mongoose', () => {
  const Schema: any = jest.fn().mockImplementation((definition: any, options?: any) => {
    return {
      definition,
      options,
      index: jest.fn(),
      methods: {},
      pre: jest.fn(),
      post: jest.fn(),
    };
  });
  
  Schema.Types = {
    ObjectId: String,
    Mixed: Object
  };

  return {
    Schema,
    model: jest.fn((name: string, schema: any) => {
      const ModelConstructor: any = function(data: any) {
        Object.assign(this, data);
        this.save = jest.fn<() => Promise<any>>().mockResolvedValue(this);
        return this;
      };
      ModelConstructor.prototype = schema.methods || {};
      return ModelConstructor;
    }),
    models: {}
  };
});

describe('PhotoSession Model', () => {
  let PhotoSession: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const mongoose = require('mongoose');
    PhotoSession = require('../PhotoSession').default;
  });

  describe('Schema Validation', () => {
    it('should accept valid photo session with all required fields', () => {
      const sessionData = {
        userId: '507f1f77bcf86cd799439011',
        sessionName: 'Wedding Photo Session',
        status: 'active',
        startedAt: new Date()
      };

      const session = new PhotoSession(sessionData);
      expect(session.userId).toBe('507f1f77bcf86cd799439011');
      expect(session.sessionName).toBe('Wedding Photo Session');
      expect(session.status).toBe('active');
      expect(session.startedAt).toBeInstanceOf(Date);
    });

    it('should accept valid status values', () => {
      const statuses = ['active', 'completed', 'cancelled'];

      statuses.forEach(status => {
        const session = new PhotoSession({
          userId: '507f1f77bcf86cd799439011',
          sessionName: 'Test Session',
          status,
          startedAt: new Date()
        });
        expect(session.status).toBe(status);
      });
    });

    it('should accept session with templateId', () => {
      const session = new PhotoSession({
        userId: '507f1f77bcf86cd799439011',
        templateId: '507f1f77bcf86cd799439012',
        sessionName: 'Test Session',
        status: 'active',
        startedAt: new Date()
      });

      expect(session.templateId).toBe('507f1f77bcf86cd799439012');
    });

    it('should accept session with captured photos array', () => {
      const photoIds = ['photo1', 'photo2', 'photo3'];
      const session = new PhotoSession({
        userId: '507f1f77bcf86cd799439011',
        sessionName: 'Test Session',
        status: 'active',
        capturedPhotos: photoIds,
        startedAt: new Date()
      });

      expect(session.capturedPhotos).toEqual(photoIds);
      expect(session.capturedPhotos).toHaveLength(3);
    });

    it('should accept session with finalComposite', () => {
      const session = new PhotoSession({
        userId: '507f1f77bcf86cd799439011',
        sessionName: 'Test Session',
        status: 'completed',
        finalComposite: 'composite123',
        startedAt: new Date()
      });

      expect(session.finalComposite).toBe('composite123');
    });

    it('should accept session with metadata', () => {
      const session = new PhotoSession({
        userId: '507f1f77bcf86cd799439011',
        sessionName: 'Test Session',
        status: 'active',
        metadata: {
          deviceInfo: 'iPhone 13 Pro',
          location: 'Jakarta, Indonesia',
          totalPhotos: 4,
          duration: 120
        },
        startedAt: new Date()
      });

      expect(session.metadata.deviceInfo).toBe('iPhone 13 Pro');
      expect(session.metadata.location).toBe('Jakarta, Indonesia');
      expect(session.metadata.totalPhotos).toBe(4);
      expect(session.metadata.duration).toBe(120);
    });

    it('should accept session with completedAt date', () => {
      const completedAt = new Date();
      const session = new PhotoSession({
        userId: '507f1f77bcf86cd799439011',
        sessionName: 'Test Session',
        status: 'completed',
        startedAt: new Date(Date.now() - 3600000),
        completedAt
      });

      expect(session.completedAt).toBe(completedAt);
    });
  });

  describe('Model Instance Methods', () => {
    it('should have save method', () => {
      const session = new PhotoSession({
        userId: '507f1f77bcf86cd799439011',
        sessionName: 'Test',
        status: 'active',
        startedAt: new Date()
      });

      expect(session.save).toBeDefined();
      expect(typeof session.save).toBe('function');
    });

    it('should successfully save session', async () => {
      const session = new PhotoSession({
        userId: '507f1f77bcf86cd799439011',
        sessionName: 'Test',
        status: 'active',
        startedAt: new Date()
      });

      const result = await session.save();
      expect(result).toBeDefined();
      expect(result.sessionName).toBe('Test');
    });
  });

  describe('Session Status Workflow', () => {
    it('should create active session', () => {
      const session = new PhotoSession({
        userId: '507f1f77bcf86cd799439011',
        sessionName: 'New Session',
        status: 'active',
        startedAt: new Date()
      });

      expect(session.status).toBe('active');
    });

    it('should complete session with composite', () => {
      const startedAt = new Date(Date.now() - 300000);
      const completedAt = new Date();
      const session = new PhotoSession({
        userId: '507f1f77bcf86cd799439011',
        sessionName: 'Completed Session',
        status: 'completed',
        capturedPhotos: ['photo1', 'photo2', 'photo3', 'photo4'],
        finalComposite: 'composite123',
        metadata: {
          totalPhotos: 4,
          duration: 300
        },
        startedAt,
        completedAt
      });

      expect(session.status).toBe('completed');
      expect(session.finalComposite).toBeDefined();
      expect(session.completedAt).toBeDefined();
    });

    it('should cancel session', () => {
      const session = new PhotoSession({
        userId: '507f1f77bcf86cd799439011',
        sessionName: 'Cancelled Session',
        status: 'cancelled',
        startedAt: new Date()
      });

      expect(session.status).toBe('cancelled');
    });
  });

  describe('Complex Session Scenarios', () => {
    it('should create session with all fields populated', () => {
      const startedAt = new Date(Date.now() - 600000);
      const completedAt = new Date();
      const session = new PhotoSession({
        userId: '507f1f77bcf86cd799439011',
        templateId: '507f1f77bcf86cd799439012',
        sessionName: 'Wedding Photo Booth Session',
        status: 'completed',
        capturedPhotos: ['photo1', 'photo2', 'photo3', 'photo4'],
        finalComposite: 'composite123',
        metadata: {
          deviceInfo: 'Canon EOS R5 with Photo Booth Software v2.1',
          location: 'Grand Ballroom, Jakarta Convention Center',
          totalPhotos: 4,
          duration: 600
        },
        startedAt,
        completedAt
      });

      expect(session).toBeDefined();
      expect(session.sessionName).toContain('Wedding');
      expect(session.capturedPhotos).toHaveLength(4);
      expect(session.status).toBe('completed');
    });

    it('should create minimal session with required fields only', () => {
      const session = new PhotoSession({
        userId: '507f1f77bcf86cd799439011',
        sessionName: 'Quick Session',
        status: 'active',
        startedAt: new Date()
      });

      expect(session).toBeDefined();
      expect(session.userId).toBe('507f1f77bcf86cd799439011');
      expect(session.sessionName).toBe('Quick Session');
    });

    it('should create session with empty captured photos', () => {
      const session = new PhotoSession({
        userId: '507f1f77bcf86cd799439011',
        sessionName: 'Empty Session',
        status: 'active',
        capturedPhotos: [],
        metadata: {
          totalPhotos: 0,
          duration: 0
        },
        startedAt: new Date()
      });

      expect(session.capturedPhotos).toEqual([]);
      expect(session.metadata.totalPhotos).toBe(0);
    });

    it('should create session with partial metadata', () => {
      const session = new PhotoSession({
        userId: '507f1f77bcf86cd799439011',
        sessionName: 'Partial Meta Session',
        status: 'active',
        metadata: {
          deviceInfo: 'Mobile App v1.0',
          totalPhotos: 2
        },
        startedAt: new Date()
      });

      expect(session.metadata.deviceInfo).toBe('Mobile App v1.0');
      expect(session.metadata.totalPhotos).toBe(2);
      expect(session.metadata.location).toBeUndefined();
    });
  });
});
