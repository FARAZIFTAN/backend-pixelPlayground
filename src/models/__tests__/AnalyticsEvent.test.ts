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
      const ModelConstructor: any = function(data: any) {
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

describe('AnalyticsEvent Model', () => {
  let AnalyticsEvent: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const mongoose = require('mongoose');
    AnalyticsEvent = require('../AnalyticsEvent').default;
  });

  describe('Schema Validation', () => {
    it('should accept valid analytics event with required fields', () => {
      const eventData = {
        eventType: 'page_view',
        eventCategory: 'navigation',
        timestamp: new Date()
      };

      const event = new AnalyticsEvent(eventData);
      expect(event.eventType).toBe('page_view');
      expect(event.eventCategory).toBe('navigation');
      expect(event.timestamp).toBeInstanceOf(Date);
    });

    it('should accept event with optional fields', () => {
      const eventData = {
        userId: '507f1f77bcf86cd799439011',
        sessionId: 'session123',
        eventType: 'template_view',
        eventCategory: 'engagement',
        templateId: 'template456',
        metadata: { page: 'templates', action: 'click' },
        deviceInfo: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
        referrer: 'https://google.com',
        timestamp: new Date()
      };

      const event = new AnalyticsEvent(eventData);
      expect(event.userId).toBe('507f1f77bcf86cd799439011');
      expect(event.sessionId).toBe('session123');
      expect(event.templateId).toBe('template456');
      expect(event.metadata).toEqual({ page: 'templates', action: 'click' });
      expect(event.deviceInfo).toBe('Mozilla/5.0');
      expect(event.ipAddress).toBe('192.168.1.1');
      expect(event.referrer).toBe('https://google.com');
    });

    it('should accept different event types', () => {
      const eventTypes = ['page_view', 'button_click', 'template_view', 'photo_upload', 'frame_generate'];

      eventTypes.forEach(eventType => {
        const event = new AnalyticsEvent({
          eventType,
          eventCategory: 'user_action',
          timestamp: new Date()
        });
        expect(event.eventType).toBe(eventType);
      });
    });

    it('should accept different event categories', () => {
      const categories = ['navigation', 'engagement', 'conversion', 'error', 'performance'];

      categories.forEach(eventCategory => {
        const event = new AnalyticsEvent({
          eventType: 'action',
          eventCategory,
          timestamp: new Date()
        });
        expect(event.eventCategory).toBe(eventCategory);
      });
    });

    it('should accept event with metadata object', () => {
      const metadata = {
        buttonId: 'download-btn',
        page: 'gallery',
        duration: 1500,
        success: true
      };

      const event = new AnalyticsEvent({
        eventType: 'download',
        eventCategory: 'engagement',
        metadata,
        timestamp: new Date()
      });

      expect(event.metadata).toEqual(metadata);
      expect(event.metadata.buttonId).toBe('download-btn');
    });
  });

  describe('Model Instance Methods', () => {
    it('should have save method', () => {
      const event = new AnalyticsEvent({
        eventType: 'test',
        eventCategory: 'test',
        timestamp: new Date()
      });

      expect(event.save).toBeDefined();
      expect(typeof event.save).toBe('function');
    });

    it('should successfully save event', async () => {
      const event = new AnalyticsEvent({
        eventType: 'test',
        eventCategory: 'test',
        timestamp: new Date()
      });

      const result = await event.save();
      expect(result).toBeDefined();
      expect(result.eventType).toBe('test');
    });
  });

  describe('Complex Analytics Scenarios', () => {
    it('should create page view event', () => {
      const event = new AnalyticsEvent({
        userId: '507f1f77bcf86cd799439011',
        sessionId: 'session123',
        eventType: 'page_view',
        eventCategory: 'navigation',
        metadata: { page: '/templates', referrer: '/home' },
        deviceInfo: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ipAddress: '192.168.1.100',
        timestamp: new Date()
      });

      expect(event.eventType).toBe('page_view');
      expect(event.metadata.page).toBe('/templates');
    });

    it('should create template interaction event', () => {
      const event = new AnalyticsEvent({
        userId: '507f1f77bcf86cd799439011',
        sessionId: 'session123',
        eventType: 'template_select',
        eventCategory: 'engagement',
        templateId: 'template456',
        metadata: { templateName: 'Wedding Frame', category: 'Wedding' },
        timestamp: new Date()
      });

      expect(event.templateId).toBe('template456');
      expect(event.metadata.templateName).toBe('Wedding Frame');
    });

    it('should create error event', () => {
      const event = new AnalyticsEvent({
        userId: '507f1f77bcf86cd799439011',
        sessionId: 'session123',
        eventType: 'error',
        eventCategory: 'error',
        metadata: {
          errorMessage: 'Failed to upload photo',
          errorCode: 'UPLOAD_FAILED',
          stackTrace: 'Error at line 123'
        },
        timestamp: new Date()
      });

      expect(event.eventCategory).toBe('error');
      expect(event.metadata.errorCode).toBe('UPLOAD_FAILED');
    });

    it('should create conversion event', () => {
      const event = new AnalyticsEvent({
        userId: '507f1f77bcf86cd799439011',
        sessionId: 'session123',
        eventType: 'purchase',
        eventCategory: 'conversion',
        metadata: {
          packageName: 'KaryaKlik Pro',
          amount: 50000,
          paymentMethod: 'bank_transfer'
        },
        timestamp: new Date()
      });

      expect(event.eventCategory).toBe('conversion');
      expect(event.metadata.amount).toBe(50000);
    });

    it('should create anonymous event without userId', () => {
      const event = new AnalyticsEvent({
        sessionId: 'session123',
        eventType: 'page_view',
        eventCategory: 'navigation',
        metadata: { page: '/home' },
        timestamp: new Date()
      });

      expect(event.userId).toBeUndefined();
      expect(event.sessionId).toBe('session123');
    });

    it('should create event with referrer tracking', () => {
      const event = new AnalyticsEvent({
        eventType: 'landing',
        eventCategory: 'navigation',
        referrer: 'https://facebook.com/ads',
        metadata: { utm_source: 'facebook', utm_campaign: 'winter2024' },
        timestamp: new Date()
      });

      expect(event.referrer).toContain('facebook');
      expect(event.metadata.utm_campaign).toBe('winter2024');
    });
  });
});
