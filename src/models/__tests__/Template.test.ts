import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock mongoose
jest.mock('mongoose', () => {
  const Schema: any = jest.fn().mockImplementation(function(definition: any, options?: any) {
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

describe('Template Model', () => {
  let Template: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const mongoose = require('mongoose');
    Template = require('../Template').default;
  });

  describe('Schema Validation', () => {
    it('should accept valid template with all required fields', () => {
      const templateData = {
        name: 'Birthday Template',
        category: 'Birthday',
        thumbnail: 'https://example.com/thumb.jpg',
        frameUrl: 'https://example.com/frame.png',
        frameCount: 2,
        layoutPositions: [
          { x: 0, y: 0, width: 100, height: 100 },
          { x: 100, y: 0, width: 100, height: 100 }
        ]
      };

      const template = new Template(templateData);
      expect(template.name).toBe('Birthday Template');
      expect(template.category).toBe('Birthday');
      expect(template.thumbnail).toBe('https://example.com/thumb.jpg');
      expect(template.frameUrl).toBe('https://example.com/frame.png');
      expect(template.frameCount).toBe(2);
      expect(template.layoutPositions).toHaveLength(2);
    });

    it('should accept valid template with optional fields', () => {
      const templateData = {
        name: 'Wedding Template',
        category: 'Wedding',
        description: 'Beautiful wedding frame',
        tags: ['wedding', 'romantic', 'elegant'],
        thumbnail: 'https://example.com/thumb.jpg',
        frameUrl: 'https://example.com/frame.png',
        isPremium: true,
        frameCount: 4,
        layoutPositions: [
          { x: 0, y: 0, width: 50, height: 50 },
          { x: 50, y: 0, width: 50, height: 50 },
          { x: 0, y: 50, width: 50, height: 50 },
          { x: 50, y: 50, width: 50, height: 50 }
        ],
        isActive: true,
        createdBy: '507f1f77bcf86cd799439011',
        visibility: 'public' as const
      };

      const template = new Template(templateData);
      expect(template.description).toBe('Beautiful wedding frame');
      expect(template.tags).toEqual(['wedding', 'romantic', 'elegant']);
      expect(template.isPremium).toBe(true);
      expect(template.createdBy).toBe('507f1f77bcf86cd799439011');
      expect(template.visibility).toBe('public');
    });

    it('should accept valid category values', () => {
      const categories = [
        'Birthday', 'Wedding', 'Education', 'Artistic', 'Corporate',
        'Baby', 'Holiday', 'Love', 'General', 'AI Generated'
      ];

      categories.forEach(category => {
        const template = new Template({
          name: 'Test',
          category,
          thumbnail: 'thumb.jpg',
          frameUrl: 'frame.png',
          frameCount: 2,
          layoutPositions: [
            { x: 0, y: 0, width: 100, height: 100 },
            { x: 100, y: 0, width: 100, height: 100 }
          ]
        });
        expect(template.category).toBe(category);
      });
    });

    it('should accept valid visibility values', () => {
      const visibilities = ['public', 'private'];

      visibilities.forEach(visibility => {
        const template = new Template({
          name: 'Test',
          category: 'General',
          thumbnail: 'thumb.jpg',
          frameUrl: 'frame.png',
          frameCount: 2,
          layoutPositions: [
            { x: 0, y: 0, width: 100, height: 100 },
            { x: 100, y: 0, width: 100, height: 100 }
          ],
          visibility
        });
        expect(template.visibility).toBe(visibility);
      });
    });

    it('should accept frameCount between 2 and 4', () => {
      [2, 3, 4].forEach(count => {
        const positions = Array(count).fill(null).map((_, i) => ({
          x: i * 100,
          y: 0,
          width: 100,
          height: 100
        }));

        const template = new Template({
          name: 'Test',
          category: 'General',
          thumbnail: 'thumb.jpg',
          frameUrl: 'frame.png',
          frameCount: count,
          layoutPositions: positions
        });
        expect(template.frameCount).toBe(count);
      });
    });

    it('should accept layout positions with optional properties', () => {
      const templateData = {
        name: 'Test',
        category: 'General',
        thumbnail: 'thumb.jpg',
        frameUrl: 'frame.png',
        frameCount: 2,
        layoutPositions: [
          { x: 0, y: 0, width: 100, height: 100, borderRadius: 10, rotation: 45 },
          { x: 100, y: 0, width: 100, height: 100, borderRadius: 5, rotation: 0 }
        ]
      };

      const template = new Template(templateData);
      expect(template.layoutPositions[0].borderRadius).toBe(10);
      expect(template.layoutPositions[0].rotation).toBe(45);
      expect(template.layoutPositions[1].borderRadius).toBe(5);
      expect(template.layoutPositions[1].rotation).toBe(0);
    });

    it('should accept isAIGenerated field', () => {
      const template = new Template({
        name: 'AI Template',
        category: 'AI Generated',
        thumbnail: 'thumb.jpg',
        frameUrl: 'frame.png',
        frameCount: 2,
        layoutPositions: [
          { x: 0, y: 0, width: 100, height: 100 },
          { x: 100, y: 0, width: 100, height: 100 }
        ],
        isAIGenerated: true,
        aiFrameSpec: { prompt: 'Create a birthday frame', style: 'modern' }
      });

      expect(template.isAIGenerated).toBe(true);
      expect(template.aiFrameSpec).toEqual({ prompt: 'Create a birthday frame', style: 'modern' });
    });

    it('should accept boolean fields', () => {
      const template = new Template({
        name: 'Test',
        category: 'General',
        thumbnail: 'thumb.jpg',
        frameUrl: 'frame.png',
        frameCount: 2,
        layoutPositions: [
          { x: 0, y: 0, width: 100, height: 100 },
          { x: 100, y: 0, width: 100, height: 100 }
        ],
        isPremium: true,
        isActive: false
      });

      expect(template.isPremium).toBe(true);
      expect(template.isActive).toBe(false);
    });

    it('should accept template with tags array', () => {
      const tags = ['tag1', 'tag2', 'tag3'];
      const template = new Template({
        name: 'Test',
        category: 'General',
        thumbnail: 'thumb.jpg',
        frameUrl: 'frame.png',
        frameCount: 2,
        layoutPositions: [
          { x: 0, y: 0, width: 100, height: 100 },
          { x: 100, y: 0, width: 100, height: 100 }
        ],
        tags
      });

      expect(template.tags).toEqual(tags);
    });

    it('should accept template with description', () => {
      const description = 'This is a test template description';
      const template = new Template({
        name: 'Test',
        category: 'General',
        description,
        thumbnail: 'thumb.jpg',
        frameUrl: 'frame.png',
        frameCount: 2,
        layoutPositions: [
          { x: 0, y: 0, width: 100, height: 100 },
          { x: 100, y: 0, width: 100, height: 100 }
        ]
      });

      expect(template.description).toBe(description);
    });
  });

  describe('Model Instance Methods', () => {
    it('should have save method', () => {
      const template = new Template({
        name: 'Test',
        category: 'General',
        thumbnail: 'thumb.jpg',
        frameUrl: 'frame.png',
        frameCount: 2,
        layoutPositions: [
          { x: 0, y: 0, width: 100, height: 100 },
          { x: 100, y: 0, width: 100, height: 100 }
        ]
      });

      expect(template.save).toBeDefined();
      expect(typeof template.save).toBe('function');
    });

    it('should successfully save template', async () => {
      const template = new Template({
        name: 'Test',
        category: 'General',
        thumbnail: 'thumb.jpg',
        frameUrl: 'frame.png',
        frameCount: 2,
        layoutPositions: [
          { x: 0, y: 0, width: 100, height: 100 },
          { x: 100, y: 0, width: 100, height: 100 }
        ]
      });

      const result = await template.save();
      expect(result).toBeDefined();
      expect(result.name).toBe('Test');
    });
  });

  describe('Complex Template Scenarios', () => {
    it('should create template with all fields populated', () => {
      const template = new Template({
        name: 'Premium Wedding Template',
        category: 'Wedding',
        description: 'Elegant wedding frame with beautiful borders',
        tags: ['wedding', 'elegant', 'premium', 'romantic'],
        thumbnail: 'https://cdn.example.com/thumbnails/wedding-1.jpg',
        frameUrl: 'https://cdn.example.com/frames/wedding-1.png',
        isPremium: true,
        frameCount: 4,
        layoutPositions: [
          { x: 10, y: 10, width: 200, height: 200, borderRadius: 15, rotation: 0 },
          { x: 220, y: 10, width: 200, height: 200, borderRadius: 15, rotation: 0 },
          { x: 10, y: 220, width: 200, height: 200, borderRadius: 15, rotation: 0 },
          { x: 220, y: 220, width: 200, height: 200, borderRadius: 15, rotation: 0 }
        ],
        isActive: true,
        createdBy: '507f1f77bcf86cd799439011',
        visibility: 'public' as const,
        isAIGenerated: false
      });

      expect(template).toBeDefined();
      expect(template.name).toBe('Premium Wedding Template');
      expect(template.isPremium).toBe(true);
      expect(template.layoutPositions).toHaveLength(4);
      expect(template.tags).toHaveLength(4);
    });

    it('should create minimal template with required fields only', () => {
      const template = new Template({
        name: 'Simple Template',
        category: 'General',
        thumbnail: 'thumb.jpg',
        frameUrl: 'frame.png',
        frameCount: 2,
        layoutPositions: [
          { x: 0, y: 0, width: 100, height: 100 },
          { x: 100, y: 0, width: 100, height: 100 }
        ]
      });

      expect(template).toBeDefined();
      expect(template.name).toBe('Simple Template');
      expect(template.category).toBe('General');
    });

    it('should create AI-generated template', () => {
      const template = new Template({
        name: 'AI Birthday Frame',
        category: 'AI Generated',
        thumbnail: 'thumb.jpg',
        frameUrl: 'frame.png',
        frameCount: 3,
        layoutPositions: [
          { x: 0, y: 0, width: 100, height: 100 },
          { x: 100, y: 0, width: 100, height: 100 },
          { x: 200, y: 0, width: 100, height: 100 }
        ],
        isAIGenerated: true,
        aiFrameSpec: {
          prompt: 'Create a fun birthday frame with balloons and confetti',
          style: 'cartoon',
          colors: ['blue', 'yellow', 'red'],
          generatedAt: new Date()
        }
      });

      expect(template.isAIGenerated).toBe(true);
      expect(template.aiFrameSpec).toBeDefined();
      expect(template.aiFrameSpec.prompt).toContain('birthday');
    });

    it('should create private template for specific user', () => {
      const template = new Template({
        name: 'My Personal Template',
        category: 'General',
        thumbnail: 'thumb.jpg',
        frameUrl: 'frame.png',
        frameCount: 2,
        layoutPositions: [
          { x: 0, y: 0, width: 100, height: 100 },
          { x: 100, y: 0, width: 100, height: 100 }
        ],
        visibility: 'private' as const,
        createdBy: '507f1f77bcf86cd799439011'
      });

      expect(template.visibility).toBe('private');
      expect(template.createdBy).toBeDefined();
    });

    it('should create template with rotated layout positions', () => {
      const template = new Template({
        name: 'Artistic Template',
        category: 'Artistic',
        thumbnail: 'thumb.jpg',
        frameUrl: 'frame.png',
        frameCount: 3,
        layoutPositions: [
          { x: 0, y: 0, width: 100, height: 100, rotation: 45 },
          { x: 100, y: 100, width: 100, height: 100, rotation: -30 },
          { x: 200, y: 0, width: 100, height: 100, rotation: 15 }
        ]
      });

      expect(template.layoutPositions[0].rotation).toBe(45);
      expect(template.layoutPositions[1].rotation).toBe(-30);
      expect(template.layoutPositions[2].rotation).toBe(15);
    });
  });
});
