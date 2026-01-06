import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock mongoose
jest.mock('mongoose', () => {
  const Schema: any = jest.fn().mockImplementation(function(definition: any, options?: any) {
    this.definition = definition;
    this.options = options;
    this.index = jest.fn();
    this.statics = {};
    this.methods = {};
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
        this.save = jest.fn(async () => this);
        
        // Add instance methods
        if (schema.methods) {
          Object.keys(schema.methods).forEach(methodName => {
            this[methodName] = schema.methods[methodName].bind(this);
          });
        }
        return this;
      };
      
      // Add static methods
      if (schema.statics) {
        Object.keys(schema.statics).forEach(staticName => {
          ModelConstructor[staticName] = schema.statics[staticName];
        });
      }
      
      return ModelConstructor;
    }),
    models: {}
  };
});

describe('UsageLimit Model', () => {
  let UsageLimit: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const mongoose = require('mongoose');
    UsageLimit = require('../UsageLimit').default;
  });

  describe('Schema Validation', () => {
    it('should accept valid usage limit with all required fields', () => {
      const usageData = {
        userId: '507f1f77bcf86cd799439011',
        date: '2024-01-15',
        aiGenerationCount: 0,
        aiGenerationLimit: 0,
        frameUploadCount: 0,
        frameUploadLimit: 0,
        packageType: 'free'
      };

      const usage = new UsageLimit(usageData);
      expect(usage.userId).toBe('507f1f77bcf86cd799439011');
      expect(usage.date).toBe('2024-01-15');
      expect(usage.aiGenerationCount).toBe(0);
      expect(usage.aiGenerationLimit).toBe(0);
      expect(usage.frameUploadCount).toBe(0);
      expect(usage.frameUploadLimit).toBe(0);
      expect(usage.packageType).toBe('free');
    });

    it('should accept valid packageType values', () => {
      const packageTypes = ['free', 'pro'];

      packageTypes.forEach(packageType => {
        const usage = new UsageLimit({
          userId: '507f1f77bcf86cd799439011',
          date: '2024-01-15',
          aiGenerationCount: 0,
          aiGenerationLimit: 0,
          frameUploadCount: 0,
          frameUploadLimit: 0,
          packageType
        });
        expect(usage.packageType).toBe(packageType);
      });
    });

    it('should accept free user with zero limits', () => {
      const usage = new UsageLimit({
        userId: '507f1f77bcf86cd799439011',
        date: '2024-01-15',
        aiGenerationCount: 0,
        aiGenerationLimit: 0,
        frameUploadCount: 0,
        frameUploadLimit: 0,
        packageType: 'free'
      });

      expect(usage.packageType).toBe('free');
      expect(usage.aiGenerationLimit).toBe(0);
      expect(usage.frameUploadLimit).toBe(0);
    });

    it('should accept pro user with high limits', () => {
      const usage = new UsageLimit({
        userId: '507f1f77bcf86cd799439011',
        date: '2024-01-15',
        aiGenerationCount: 5,
        aiGenerationLimit: 999999,
        frameUploadCount: 3,
        frameUploadLimit: 999999,
        packageType: 'pro'
      });

      expect(usage.packageType).toBe('pro');
      expect(usage.aiGenerationLimit).toBe(999999);
      expect(usage.frameUploadLimit).toBe(999999);
      expect(usage.aiGenerationCount).toBe(5);
      expect(usage.frameUploadCount).toBe(3);
    });

    it('should accept usage with non-zero counts', () => {
      const usage = new UsageLimit({
        userId: '507f1f77bcf86cd799439011',
        date: '2024-01-15',
        aiGenerationCount: 10,
        aiGenerationLimit: 999999,
        frameUploadCount: 5,
        frameUploadLimit: 999999,
        packageType: 'pro'
      });

      expect(usage.aiGenerationCount).toBe(10);
      expect(usage.frameUploadCount).toBe(5);
    });
  });

  describe('Model Instance Methods', () => {
    it('should have save method', () => {
      const usage = new UsageLimit({
        userId: '507f1f77bcf86cd799439011',
        date: '2024-01-15',
        aiGenerationCount: 0,
        aiGenerationLimit: 0,
        frameUploadCount: 0,
        frameUploadLimit: 0,
        packageType: 'free'
      });

      expect(usage.save).toBeDefined();
      expect(typeof usage.save).toBe('function');
    });

    it('should successfully save usage limit', async () => {
      const usage = new UsageLimit({
        userId: '507f1f77bcf86cd799439011',
        date: '2024-01-15',
        aiGenerationCount: 0,
        aiGenerationLimit: 0,
        frameUploadCount: 0,
        frameUploadLimit: 0,
        packageType: 'free'
      });

      const result = await usage.save();
      expect(result).toBeDefined();
      expect(result.userId).toBe('507f1f77bcf86cd799439011');
    });
  });

  describe('Usage Scenarios', () => {
    it('should create free user daily limit', () => {
      const usage = new UsageLimit({
        userId: '507f1f77bcf86cd799439011',
        date: '2024-01-15',
        aiGenerationCount: 0,
        aiGenerationLimit: 0,
        frameUploadCount: 0,
        frameUploadLimit: 0,
        packageType: 'free'
      });

      expect(usage.packageType).toBe('free');
      expect(usage.aiGenerationLimit).toBe(0);
      expect(usage.frameUploadLimit).toBe(0);
    });

    it('should create pro user daily limit', () => {
      const usage = new UsageLimit({
        userId: '507f1f77bcf86cd799439011',
        date: '2024-01-15',
        aiGenerationCount: 0,
        aiGenerationLimit: 999999,
        frameUploadCount: 0,
        frameUploadLimit: 999999,
        packageType: 'pro'
      });

      expect(usage.packageType).toBe('pro');
      expect(usage.aiGenerationLimit).toBe(999999);
      expect(usage.frameUploadLimit).toBe(999999);
    });

    it('should track AI generation usage', () => {
      const usage = new UsageLimit({
        userId: '507f1f77bcf86cd799439011',
        date: '2024-01-15',
        aiGenerationCount: 15,
        aiGenerationLimit: 999999,
        frameUploadCount: 0,
        frameUploadLimit: 999999,
        packageType: 'pro'
      });

      expect(usage.aiGenerationCount).toBe(15);
      expect(usage.aiGenerationCount).toBeLessThan(usage.aiGenerationLimit);
    });

    it('should track frame upload usage', () => {
      const usage = new UsageLimit({
        userId: '507f1f77bcf86cd799439011',
        date: '2024-01-15',
        aiGenerationCount: 0,
        aiGenerationLimit: 999999,
        frameUploadCount: 8,
        frameUploadLimit: 999999,
        packageType: 'pro'
      });

      expect(usage.frameUploadCount).toBe(8);
      expect(usage.frameUploadCount).toBeLessThan(usage.frameUploadLimit);
    });
  });

  describe('Complex Usage Scenarios', () => {
    it('should create usage limit with all fields populated', () => {
      const usage = new UsageLimit({
        userId: '507f1f77bcf86cd799439011',
        date: '2024-01-15',
        aiGenerationCount: 25,
        aiGenerationLimit: 999999,
        frameUploadCount: 10,
        frameUploadLimit: 999999,
        packageType: 'pro'
      });

      expect(usage).toBeDefined();
      expect(usage.aiGenerationCount).toBe(25);
      expect(usage.frameUploadCount).toBe(10);
      expect(usage.packageType).toBe('pro');
    });

    it('should create minimal usage limit for free user', () => {
      const usage = new UsageLimit({
        userId: '507f1f77bcf86cd799439011',
        date: '2024-01-15',
        aiGenerationCount: 0,
        aiGenerationLimit: 0,
        frameUploadCount: 0,
        frameUploadLimit: 0,
        packageType: 'free'
      });

      expect(usage).toBeDefined();
      expect(usage.packageType).toBe('free');
      expect(usage.aiGenerationCount).toBe(0);
    });

    it('should create usage at limit boundary', () => {
      const usage = new UsageLimit({
        userId: '507f1f77bcf86cd799439011',
        date: '2024-01-15',
        aiGenerationCount: 999999,
        aiGenerationLimit: 999999,
        frameUploadCount: 999999,
        frameUploadLimit: 999999,
        packageType: 'pro'
      });

      expect(usage.aiGenerationCount).toBe(usage.aiGenerationLimit);
      expect(usage.frameUploadCount).toBe(usage.frameUploadLimit);
    });

    it('should create usage for different dates', () => {
      const dates = ['2024-01-15', '2024-01-16', '2024-01-17'];
      
      dates.forEach(date => {
        const usage = new UsageLimit({
          userId: '507f1f77bcf86cd799439011',
          date,
          aiGenerationCount: 0,
          aiGenerationLimit: 999999,
          frameUploadCount: 0,
          frameUploadLimit: 999999,
          packageType: 'pro'
        });
        expect(usage.date).toBe(date);
      });
    });
  });

  describe('Static Methods', () => {
    describe('getOrCreateToday', () => {
      it('should create new usage limit if not exists', async () => {

        const userId = '507f1f77bcf86cd799439011';
        UsageLimit.findOne = jest.fn().mockResolvedValue(null);
        UsageLimit.create = jest.fn().mockImplementation(() => Promise.resolve({
          userId,
          date: new Date().toISOString().split('T')[0],
          aiGenerationCount: 0,
          aiGenerationLimit: 0,
          frameUploadCount: 0,
          frameUploadLimit: 0,
          packageType: 'free'
        }));

        const result = await UsageLimit.getOrCreateToday(userId, 'free');

        expect(UsageLimit.findOne).toHaveBeenCalledWith({
          userId,
          date: expect.any(String)
        });
        expect(UsageLimit.create).toHaveBeenCalled();
        expect(result.packageType).toBe('free');
      });

      it('should return existing usage limit for today', async () => {
        const userId = '507f1f77bcf86cd799439011';
        const existingUsage: any = {
          userId,
          date: new Date().toISOString().split('T')[0],
          aiGenerationCount: 5,
          aiGenerationLimit: 999999,
          frameUploadCount: 2,
          frameUploadLimit: 999999,
          packageType: 'pro'
        };
        existingUsage.save = jest.fn().mockResolvedValue(existingUsage as any);
        
        UsageLimit.findOne = jest.fn().mockResolvedValue(existingUsage as any);

        const result = await UsageLimit.getOrCreateToday(userId, 'pro');

        expect(UsageLimit.findOne).toHaveBeenCalled();
        expect(result.aiGenerationCount).toBe(5);
        expect(result.packageType).toBe('pro');
      });

      it('should update limits when package type changes', async () => {
        const userId = '507f1f77bcf86cd799439011';
        const existingUsage: any = {
          userId,
          date: new Date().toISOString().split('T')[0],
          aiGenerationCount: 0,
          aiGenerationLimit: 0,
          frameUploadCount: 0,
          frameUploadLimit: 0,
          packageType: 'free'
        };
        existingUsage.save = jest.fn().mockResolvedValue(existingUsage);
        
        UsageLimit.findOne = jest.fn().mockResolvedValue(existingUsage);

        const result = await UsageLimit.getOrCreateToday(userId, 'pro');

        expect(result.packageType).toBe('pro');
        expect(result.aiGenerationLimit).toBe(999999);
        expect(result.frameUploadLimit).toBe(999999);
        expect(existingUsage.save).toHaveBeenCalled();
      });

      it('should create free user with zero limits', async () => {

  const userId = '507f1f77bcf86cd799439011';
  UsageLimit.findOne = jest.fn().mockResolvedValue(null);
  UsageLimit.create = jest.fn().mockImplementation((data) => Promise.resolve(data));

        await UsageLimit.getOrCreateToday(userId, 'free');

        expect(UsageLimit.create).toHaveBeenCalledWith(
          expect.objectContaining({
            aiGenerationLimit: 0,
            frameUploadLimit: 0,
            packageType: 'free'
          })
        );
      });

      it('should create pro user with unlimited limits', async () => {

  const userId = '507f1f77bcf86cd799439011';
  UsageLimit.findOne = jest.fn().mockResolvedValue(null as unknown as any);
  UsageLimit.create = jest.fn().mockImplementation((data) => Promise.resolve(data));

        await UsageLimit.getOrCreateToday(userId, 'pro');

        expect(UsageLimit.create).toHaveBeenCalledWith(
          expect.objectContaining({
            aiGenerationLimit: 999999,
            frameUploadLimit: 999999,
            packageType: 'pro'
          })
        );
      });
    });
  });

  describe('Instance Methods', () => {
    describe('incrementAIGeneration', () => {
      it('should increment AI generation count when under limit', async () => {
        const usage = new UsageLimit({
          userId: '507f1f77bcf86cd799439011',
          date: '2024-01-15',
          aiGenerationCount: 5,
          aiGenerationLimit: 10,
          frameUploadCount: 0,
          frameUploadLimit: 0,
          packageType: 'pro'
        });

        await usage.incrementAIGeneration();

        expect(usage.aiGenerationCount).toBe(6);
        expect(usage.save).toHaveBeenCalled();
      });

      it('should throw error when AI generation limit reached', async () => {
        const usage = new UsageLimit({
          userId: '507f1f77bcf86cd799439011',
          date: '2024-01-15',
          aiGenerationCount: 10,
          aiGenerationLimit: 10,
          frameUploadCount: 0,
          frameUploadLimit: 0,
          packageType: 'pro'
        });

        await expect(usage.incrementAIGeneration()).rejects.toThrow('Daily AI generation limit reached');
        expect(usage.aiGenerationCount).toBe(10);
      });

      it('should throw error when AI generation exceeds limit', async () => {
        const usage = new UsageLimit({
          userId: '507f1f77bcf86cd799439011',
          date: '2024-01-15',
          aiGenerationCount: 15,
          aiGenerationLimit: 10,
          frameUploadCount: 0,
          frameUploadLimit: 0,
          packageType: 'pro'
        });

        await expect(usage.incrementAIGeneration()).rejects.toThrow('Daily AI generation limit reached');
      });

      it('should increment from zero', async () => {
        const usage = new UsageLimit({
          userId: '507f1f77bcf86cd799439011',
          date: '2024-01-15',
          aiGenerationCount: 0,
          aiGenerationLimit: 999999,
          frameUploadCount: 0,
          frameUploadLimit: 0,
          packageType: 'pro'
        });

        await usage.incrementAIGeneration();

        expect(usage.aiGenerationCount).toBe(1);
      });
    });

    describe('incrementFrameUpload', () => {
      it('should increment frame upload count when under limit', async () => {
        const usage = new UsageLimit({
          userId: '507f1f77bcf86cd799439011',
          date: '2024-01-15',
          aiGenerationCount: 0,
          aiGenerationLimit: 0,
          frameUploadCount: 3,
          frameUploadLimit: 10,
          packageType: 'pro'
        });

        await usage.incrementFrameUpload();

        expect(usage.frameUploadCount).toBe(4);
        expect(usage.save).toHaveBeenCalled();
      });

      it('should throw error when frame upload limit reached', async () => {
        const usage = new UsageLimit({
          userId: '507f1f77bcf86cd799439011',
          date: '2024-01-15',
          aiGenerationCount: 0,
          aiGenerationLimit: 0,
          frameUploadCount: 10,
          frameUploadLimit: 10,
          packageType: 'pro'
        });

        await expect(usage.incrementFrameUpload()).rejects.toThrow('Daily frame upload limit reached');
        expect(usage.frameUploadCount).toBe(10);
      });

      it('should throw error when frame upload exceeds limit', async () => {
        const usage = new UsageLimit({
          userId: '507f1f77bcf86cd799439011',
          date: '2024-01-15',
          aiGenerationCount: 0,
          aiGenerationLimit: 0,
          frameUploadCount: 20,
          frameUploadLimit: 10,
          packageType: 'pro'
        });

        await expect(usage.incrementFrameUpload()).rejects.toThrow('Daily frame upload limit reached');
      });

      it('should increment from zero', async () => {
        const usage = new UsageLimit({
          userId: '507f1f77bcf86cd799439011',
          date: '2024-01-15',
          aiGenerationCount: 0,
          aiGenerationLimit: 0,
          frameUploadCount: 0,
          frameUploadLimit: 999999,
          packageType: 'pro'
        });

        await usage.incrementFrameUpload();

        expect(usage.frameUploadCount).toBe(1);
      });
    });
  });
});
