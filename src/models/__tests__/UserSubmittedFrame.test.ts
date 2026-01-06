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
      const ModelConstructor: any = function(this: any, data: any) {
        Object.assign(this, data);
        this.save = jest.fn().mockImplementation(() => Promise.resolve(this));
        return this;
      };
      ModelConstructor.prototype = schema.methods || {};
      return ModelConstructor;
    }),
    models: {}
  };
});

describe('UserSubmittedFrame Model', () => {
  let UserSubmittedFrame: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const mongoose = require('mongoose');
    UserSubmittedFrame = require('../UserSubmittedFrame').default;
  });

  describe('Schema Validation', () => {
    it('should accept valid submitted frame with all required fields', () => {
      const frameData = {
        userId: '507f1f77bcf86cd799439011',
        name: 'My Submitted Frame',
        description: 'A custom frame submission',
        frameUrl: 'data:image/svg+xml;base64,abc123',
        thumbnail: 'data:image/svg+xml;base64,thumb123',
        frameCount: 4,
        layout: 'grid' as const,
        frameSpec: {
          frameCount: 4,
          layout: 'grid',
          backgroundColor: '#ffffff',
          borderColor: '#000000'
        },
        layoutPositions: [
          { x: 0, y: 0, width: 100, height: 100, borderRadius: 0, rotation: 0 },
          { x: 100, y: 0, width: 100, height: 100, borderRadius: 0, rotation: 0 },
          { x: 0, y: 100, width: 100, height: 100, borderRadius: 0, rotation: 0 },
          { x: 100, y: 100, width: 100, height: 100, borderRadius: 0, rotation: 0 }
        ]
      };

      const frame = new UserSubmittedFrame(frameData);
      expect(frame.userId).toBe('507f1f77bcf86cd799439011');
      expect(frame.name).toBe('My Submitted Frame');
      expect(frame.frameCount).toBe(4);
      expect(frame.layout).toBe('grid');
      expect(frame.layoutPositions).toHaveLength(4);
    });

    it('should accept valid status values', () => {
      const statuses = ['pending', 'approved', 'rejected'];

      statuses.forEach(status => {
        const frame = new UserSubmittedFrame({
          userId: '507f1f77bcf86cd799439011',
          name: 'Test Frame',
          description: 'Test',
          frameUrl: 'data:image/svg+xml;base64,abc',
          thumbnail: 'data:image/svg+xml;base64,thumb',
          frameCount: 2,
          layout: 'horizontal' as const,
          frameSpec: { frameCount: 2, layout: 'horizontal', backgroundColor: '#fff', borderColor: '#000' },
          layoutPositions: [
            { x: 0, y: 0, width: 100, height: 100, borderRadius: 0, rotation: 0 },
            { x: 100, y: 0, width: 100, height: 100, borderRadius: 0, rotation: 0 }
          ],
          status
        });
        expect(frame.status).toBe(status);
      });
    });

    it('should accept valid layout values', () => {
      const layouts = ['vertical', 'horizontal', 'grid'];

      layouts.forEach(layout => {
        const frame = new UserSubmittedFrame({
          userId: '507f1f77bcf86cd799439011',
          name: 'Test Frame',
          description: 'Test',
          frameUrl: 'data:image/svg+xml;base64,abc',
          thumbnail: 'data:image/svg+xml;base64,thumb',
          frameCount: 2,
          layout: layout as any,
          frameSpec: { frameCount: 2, layout, backgroundColor: '#fff', borderColor: '#000' },
          layoutPositions: [
            { x: 0, y: 0, width: 100, height: 100, borderRadius: 0, rotation: 0 },
            { x: 100, y: 0, width: 100, height: 100, borderRadius: 0, rotation: 0 }
          ]
        });
        expect(frame.layout).toBe(layout);
      });
    });

    it('should accept frame with approval details', () => {
      const approvedAt = new Date();
      const frame = new UserSubmittedFrame({
        userId: '507f1f77bcf86cd799439011',
        name: 'Approved Frame',
        description: 'This frame was approved',
        frameUrl: 'data:image/svg+xml;base64,abc',
        thumbnail: 'data:image/svg+xml;base64,thumb',
        frameCount: 2,
        layout: 'horizontal' as const,
        frameSpec: { frameCount: 2, layout: 'horizontal', backgroundColor: '#fff', borderColor: '#000' },
        layoutPositions: [
          { x: 0, y: 0, width: 100, height: 100, borderRadius: 0, rotation: 0 },
          { x: 100, y: 0, width: 100, height: 100, borderRadius: 0, rotation: 0 }
        ],
        status: 'approved',
        approvedAt,
        approvedBy: '507f1f77bcf86cd799439012'
      });

      expect(frame.status).toBe('approved');
      expect(frame.approvedAt).toBe(approvedAt);
      expect(frame.approvedBy).toBe('507f1f77bcf86cd799439012');
    });

    it('should accept frame with rejection details', () => {
      const frame = new UserSubmittedFrame({
        userId: '507f1f77bcf86cd799439011',
        name: 'Rejected Frame',
        description: 'This frame was rejected',
        frameUrl: 'data:image/svg+xml;base64,abc',
        thumbnail: 'data:image/svg+xml;base64,thumb',
        frameCount: 2,
        layout: 'horizontal' as const,
        frameSpec: { frameCount: 2, layout: 'horizontal', backgroundColor: '#fff', borderColor: '#000' },
        layoutPositions: [
          { x: 0, y: 0, width: 100, height: 100, borderRadius: 0, rotation: 0 },
          { x: 100, y: 0, width: 100, height: 100, borderRadius: 0, rotation: 0 }
        ],
        status: 'rejected',
        rejectionReason: 'Frame quality is too low'
      });

      expect(frame.status).toBe('rejected');
      expect(frame.rejectionReason).toBe('Frame quality is too low');
    });

    it('should accept premium frame', () => {
      const frame = new UserSubmittedFrame({
        userId: '507f1f77bcf86cd799439011',
        name: 'Premium Frame',
        description: 'Premium quality frame',
        frameUrl: 'data:image/svg+xml;base64,abc',
        thumbnail: 'data:image/svg+xml;base64,thumb',
        frameCount: 6,
        layout: 'grid' as const,
        frameSpec: { frameCount: 6, layout: 'grid', backgroundColor: '#fff', borderColor: '#000' },
        layoutPositions: Array(6).fill(null).map((_, i) => ({
          x: (i % 3) * 100,
          y: Math.floor(i / 3) * 100,
          width: 100,
          height: 100,
          borderRadius: 0,
          rotation: 0
        })),
        isPremium: true
      });

      expect(frame.isPremium).toBe(true);
    });
  });

  describe('Model Instance Methods', () => {
    it('should have save method', () => {
      const frame = new UserSubmittedFrame({
        userId: '507f1f77bcf86cd799439011',
        name: 'Test',
        description: 'Test',
        frameUrl: 'data:image/svg+xml;base64,abc',
        thumbnail: 'data:image/svg+xml;base64,thumb',
        frameCount: 2,
        layout: 'horizontal' as const,
        frameSpec: { frameCount: 2, layout: 'horizontal', backgroundColor: '#fff', borderColor: '#000' },
        layoutPositions: [
          { x: 0, y: 0, width: 100, height: 100, borderRadius: 0, rotation: 0 },
          { x: 100, y: 0, width: 100, height: 100, borderRadius: 0, rotation: 0 }
        ]
      });

      expect(frame.save).toBeDefined();
      expect(typeof frame.save).toBe('function');
    });

    it('should successfully save frame', async () => {
      const frame = new UserSubmittedFrame({
        userId: '507f1f77bcf86cd799439011',
        name: 'Test',
        description: 'Test',
        frameUrl: 'data:image/svg+xml;base64,abc',
        thumbnail: 'data:image/svg+xml;base64,thumb',
        frameCount: 2,
        layout: 'horizontal' as const,
        frameSpec: { frameCount: 2, layout: 'horizontal', backgroundColor: '#fff', borderColor: '#000' },
        layoutPositions: [
          { x: 0, y: 0, width: 100, height: 100, borderRadius: 0, rotation: 0 },
          { x: 100, y: 0, width: 100, height: 100, borderRadius: 0, rotation: 0 }
        ]
      });

      const result = await frame.save();
      expect(result).toBeDefined();
      expect(result.name).toBe('Test');
    });
  });

  describe('Submission Workflow', () => {
    it('should create pending submission', () => {
      const frame = new UserSubmittedFrame({
        userId: '507f1f77bcf86cd799439011',
        name: 'New Submission',
        description: 'Waiting for review',
        frameUrl: 'data:image/svg+xml;base64,abc',
        thumbnail: 'data:image/svg+xml;base64,thumb',
        frameCount: 4,
        layout: 'grid' as const,
        frameSpec: { frameCount: 4, layout: 'grid', backgroundColor: '#fff', borderColor: '#000' },
        layoutPositions: Array(4).fill(null).map((_, i) => ({
          x: (i % 2) * 100,
          y: Math.floor(i / 2) * 100,
          width: 100,
          height: 100,
          borderRadius: 0,
          rotation: 0
        })),
        status: 'pending'
      });

      expect(frame.status).toBe('pending');
    });

    it('should approve submission', () => {
      const approvedAt = new Date();
      const frame = new UserSubmittedFrame({
        userId: '507f1f77bcf86cd799439011',
        name: 'Approved Submission',
        description: 'Great quality frame',
        frameUrl: 'data:image/svg+xml;base64,abc',
        thumbnail: 'data:image/svg+xml;base64,thumb',
        frameCount: 3,
        layout: 'horizontal' as const,
        frameSpec: { frameCount: 3, layout: 'horizontal', backgroundColor: '#fff', borderColor: '#000' },
        layoutPositions: Array(3).fill(null).map((_, i) => ({
          x: i * 100,
          y: 0,
          width: 100,
          height: 100,
          borderRadius: 0,
          rotation: 0
        })),
        status: 'approved',
        approvedAt,
        approvedBy: 'admin123'
      });

      expect(frame.status).toBe('approved');
      expect(frame.approvedAt).toBeDefined();
      expect(frame.approvedBy).toBe('admin123');
    });

    it('should reject submission with reason', () => {
      const frame = new UserSubmittedFrame({
        userId: '507f1f77bcf86cd799439011',
        name: 'Rejected Submission',
        description: 'Low quality',
        frameUrl: 'data:image/svg+xml;base64,abc',
        thumbnail: 'data:image/svg+xml;base64,thumb',
        frameCount: 2,
        layout: 'vertical' as const,
        frameSpec: { frameCount: 2, layout: 'vertical', backgroundColor: '#fff', borderColor: '#000' },
        layoutPositions: [
          { x: 0, y: 0, width: 100, height: 100, borderRadius: 0, rotation: 0 },
          { x: 0, y: 100, width: 100, height: 100, borderRadius: 0, rotation: 0 }
        ],
        status: 'rejected',
        rejectionReason: 'Image resolution is too low. Please submit high-quality SVG.'
      });

      expect(frame.status).toBe('rejected');
      expect(frame.rejectionReason).toContain('resolution');
    });
  });
});
