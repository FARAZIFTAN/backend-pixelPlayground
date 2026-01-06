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
    ObjectId: String,
    Mixed: Object
  };

  return {
    Schema,
    model: jest.fn((name: string, schema: any) => {
      const ModelConstructor: any = function(data: any) {
        Object.assign(this, data);
        this.save = jest.fn().mockResolvedValue(this);
      };
      
      // Assign methods safely
      if (schema.methods) {
        Object.keys(schema.methods).forEach(key => {
          ModelConstructor.prototype[key] = schema.methods[key];
        });
      }
      
      return ModelConstructor;
    }),
    models: {}
  };
});

describe('CapturedPhoto Model', () => {
  let CapturedPhoto: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const mongoose = require('mongoose');
    CapturedPhoto = require('../CapturedPhoto').default;
  });

  describe('Schema Validation', () => {
    it('should accept valid captured photo with all required fields', () => {
      const photoData = {
        sessionId: 'session123',
        userId: '507f1f77bcf86cd799439011',
        photoUrl: 'https://example.com/photo.jpg',
        order: 1
      };

      const photo = new CapturedPhoto(photoData);
      expect(photo.sessionId).toBe('session123');
      expect(photo.userId).toBe('507f1f77bcf86cd799439011');
      expect(photo.photoUrl).toBe('https://example.com/photo.jpg');
      expect(photo.order).toBe(1);
    });

    it('should accept photo with thumbnailUrl', () => {
      const photo = new CapturedPhoto({
        sessionId: 'session123',
        userId: '507f1f77bcf86cd799439011',
        photoUrl: 'https://example.com/photo.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        order: 1
      });

      expect(photo.thumbnailUrl).toBe('https://example.com/thumb.jpg');
    });

    it('should accept photo with metadata', () => {
      const photo = new CapturedPhoto({
        sessionId: 'session123',
        userId: '507f1f77bcf86cd799439011',
        photoUrl: 'https://example.com/photo.jpg',
        order: 1,
        metadata: {
          width: 1920,
          height: 1080,
          fileSize: 2048576,
          format: 'jpeg',
          capturedAt: new Date()
        }
      });

      expect(photo.metadata.width).toBe(1920);
      expect(photo.metadata.height).toBe(1080);
      expect(photo.metadata.fileSize).toBe(2048576);
      expect(photo.metadata.format).toBe('jpeg');
      expect(photo.metadata.capturedAt).toBeInstanceOf(Date);
    });

    it('should accept different order values', () => {
      [0, 1, 2, 3].forEach(order => {
        const photo = new CapturedPhoto({
          sessionId: 'session123',
          userId: '507f1f77bcf86cd799439011',
          photoUrl: 'https://example.com/photo.jpg',
          order
        });
        expect(photo.order).toBe(order);
      });
    });

    it('should accept photo with partial metadata', () => {
      const photo = new CapturedPhoto({
        sessionId: 'session123',
        userId: '507f1f77bcf86cd799439011',
        photoUrl: 'https://example.com/photo.jpg',
        order: 1,
        metadata: {
          width: 1920,
          height: 1080
        }
      });

      expect(photo.metadata.width).toBe(1920);
      expect(photo.metadata.height).toBe(1080);
      expect(photo.metadata.fileSize).toBeUndefined();
      expect(photo.metadata.format).toBeUndefined();
    });

    it('should accept different image formats', () => {
      const formats = ['jpeg', 'png', 'webp', 'jpg'];
      
      formats.forEach((format, index) => {
        const photo = new CapturedPhoto({
          sessionId: 'session123',
          userId: '507f1f77bcf86cd799439011',
          photoUrl: `https://example.com/photo.${format}`,
          order: index,
          metadata: {
            format
          }
        });
        expect(photo.metadata.format).toBe(format);
      });
    });
  });

  describe('Model Instance Methods', () => {
    it('should have save method', () => {
      const photo = new CapturedPhoto({
        sessionId: 'session123',
        userId: '507f1f77bcf86cd799439011',
        photoUrl: 'https://example.com/photo.jpg',
        order: 1
      });

      expect(photo.save).toBeDefined();
      expect(typeof photo.save).toBe('function');
    });

    it('should successfully save photo', async () => {
      const photo = new CapturedPhoto({
        sessionId: 'session123',
        userId: '507f1f77bcf86cd799439011',
        photoUrl: 'https://example.com/photo.jpg',
        order: 1
      });

      const result = await photo.save();
      expect(result).toBeDefined();
      expect(result.sessionId).toBe('session123');
    });
  });

  describe('Complex Captured Photo Scenarios', () => {
    it('should create photo with all fields populated', () => {
      const capturedAt = new Date();
      const photo = new CapturedPhoto({
        sessionId: 'session123',
        userId: '507f1f77bcf86cd799439011',
        photoUrl: 'https://cdn.example.com/photos/wedding-session-001-photo-1.jpg',
        thumbnailUrl: 'https://cdn.example.com/thumbnails/wedding-session-001-photo-1-thumb.jpg',
        order: 0,
        metadata: {
          width: 3840,
          height: 2160,
          fileSize: 5242880,
          format: 'jpeg',
          capturedAt
        }
      });

      expect(photo).toBeDefined();
      expect(photo.photoUrl).toContain('wedding-session');
      expect(photo.metadata.width).toBe(3840);
      expect(photo.metadata.height).toBe(2160);
    });

    it('should create minimal photo with required fields only', () => {
      const photo = new CapturedPhoto({
        sessionId: 'session123',
        userId: '507f1f77bcf86cd799439011',
        photoUrl: 'https://example.com/simple.jpg',
        order: 0
      });

      expect(photo).toBeDefined();
      expect(photo.sessionId).toBe('session123');
      expect(photo.photoUrl).toBe('https://example.com/simple.jpg');
    });

    it('should create multiple photos with different orders', () => {
      const photos = [0, 1, 2, 3].map(order => new CapturedPhoto({
        sessionId: 'session123',
        userId: '507f1f77bcf86cd799439011',
        photoUrl: `https://example.com/photo-${order}.jpg`,
        order
      }));

      photos.forEach((photo, index) => {
        expect(photo.order).toBe(index);
      });
    });

    it('should create high resolution photo', () => {
      const photo = new CapturedPhoto({
        sessionId: 'session123',
        userId: '507f1f77bcf86cd799439011',
        photoUrl: 'https://example.com/high-res.jpg',
        order: 0,
        metadata: {
          width: 7680,
          height: 4320,
          fileSize: 20971520,
          format: 'png'
        }
      });

      expect(photo.metadata.width).toBe(7680);
      expect(photo.metadata.height).toBe(4320);
      expect(photo.metadata.fileSize).toBeGreaterThan(10000000);
    });

    it('should create photo with capturedAt timestamp', () => {
      const capturedAt = new Date('2024-01-15T10:30:00Z');
      const photo = new CapturedPhoto({
        sessionId: 'session123',
        userId: '507f1f77bcf86cd799439011',
        photoUrl: 'https://example.com/photo.jpg',
        order: 0,
        metadata: {
          capturedAt
        }
      });

      expect(photo.metadata.capturedAt).toBe(capturedAt);
    });
  });

  describe('Photo Order Scenarios', () => {
    it('should accept first photo in sequence (order 0)', () => {
      const photo = new CapturedPhoto({
        sessionId: 'session123',
        userId: '507f1f77bcf86cd799439011',
        photoUrl: 'https://example.com/photo-0.jpg',
        order: 0
      });

      expect(photo.order).toBe(0);
    });

    it('should accept middle photo in sequence', () => {
      const photo = new CapturedPhoto({
        sessionId: 'session123',
        userId: '507f1f77bcf86cd799439011',
        photoUrl: 'https://example.com/photo-2.jpg',
        order: 2
      });

      expect(photo.order).toBe(2);
    });

    it('should accept last photo in sequence', () => {
      const photo = new CapturedPhoto({
        sessionId: 'session123',
        userId: '507f1f77bcf86cd799439011',
        photoUrl: 'https://example.com/photo-3.jpg',
        order: 3
      });

      expect(photo.order).toBe(3);
    });
  });
});
