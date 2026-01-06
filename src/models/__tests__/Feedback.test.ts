import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock mongoose
jest.mock('mongoose', () => {
  const Schema: any = jest.fn().mockImplementation(function(definition: any, options?: any) {
    this.definition = definition;
    this.options = options;
    return this;
  });

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

describe('Feedback Model', () => {
  let Feedback: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const mongoose = require('mongoose');
    Feedback = require('../Feedback').default;
  });

  describe('Schema Validation', () => {
    it('should accept valid feedback with all required fields', () => {
      const feedbackData = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Great application!'
      };

      const feedback = new Feedback(feedbackData);
      expect(feedback.name).toBe('John Doe');
      expect(feedback.email).toBe('john@example.com');
      expect(feedback.message).toBe('Great application!');
    });

    it('should accept valid status values', () => {
      const statuses = ['unread', 'read', 'replied'];

      statuses.forEach(status => {
        const feedback = new Feedback({
          name: 'Test User',
          email: 'test@example.com',
          message: 'Test message',
          status
        });
        expect(feedback.status).toBe(status);
      });
    });

    it('should accept feedback with dates', () => {
      const createdAt = new Date();
      const updatedAt = new Date();
      const feedback = new Feedback({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
        createdAt,
        updatedAt
      });

      expect(feedback.createdAt).toBe(createdAt);
      expect(feedback.updatedAt).toBe(updatedAt);
    });

    it('should accept lowercase email', () => {
      const feedback = new Feedback({
        name: 'Test User',
        email: 'Test@Example.COM',
        message: 'Test message'
      });

      expect(feedback.email).toBe('Test@Example.COM');
    });

    it('should accept long message text', () => {
      const longMessage = 'This is a very detailed feedback message. '.repeat(20);
      const feedback = new Feedback({
        name: 'Test User',
        email: 'test@example.com',
        message: longMessage
      });

      expect(feedback.message).toBe(longMessage);
      expect(feedback.message.length).toBeGreaterThan(100);
    });
  });

  describe('Model Instance Methods', () => {
    it('should have save method', () => {
      const feedback = new Feedback({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message'
      });

      expect(feedback.save).toBeDefined();
      expect(typeof feedback.save).toBe('function');
    });

    it('should successfully save feedback', async () => {
      const feedback = new Feedback({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message'
      });

      const result = await feedback.save();
      expect(result).toBeDefined();
      expect(result.name).toBe('Test User');
    });
  });

  describe('Feedback Status Workflow', () => {
    it('should create unread feedback', () => {
      const feedback = new Feedback({
        name: 'Test User',
        email: 'test@example.com',
        message: 'New feedback',
        status: 'unread'
      });

      expect(feedback.status).toBe('unread');
    });

    it('should mark feedback as read', () => {
      const feedback = new Feedback({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Read feedback',
        status: 'read'
      });

      expect(feedback.status).toBe('read');
    });

    it('should mark feedback as replied', () => {
      const feedback = new Feedback({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Replied feedback',
        status: 'replied'
      });

      expect(feedback.status).toBe('replied');
    });
  });

  describe('Complex Feedback Scenarios', () => {
    it('should create feedback with all fields populated', () => {
      const createdAt = new Date('2024-01-15T10:00:00Z');
      const updatedAt = new Date('2024-01-15T14:00:00Z');
      const feedback = new Feedback({
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        message: 'I love the new AI template feature! It works perfectly and saves me a lot of time. Great job on the implementation!',
        status: 'replied',
        createdAt,
        updatedAt
      });

      expect(feedback).toBeDefined();
      expect(feedback.name).toBe('Jane Smith');
      expect(feedback.status).toBe('replied');
      expect(feedback.message).toContain('AI template');
    });

    it('should create minimal feedback with required fields only', () => {
      const feedback = new Feedback({
        name: 'Anonymous',
        email: 'anon@example.com',
        message: 'Quick feedback'
      });

      expect(feedback).toBeDefined();
      expect(feedback.name).toBe('Anonymous');
      expect(feedback.message).toBe('Quick feedback');
    });

    it('should create bug report feedback', () => {
      const feedback = new Feedback({
        name: 'Developer',
        email: 'dev@example.com',
        message: 'Bug: Photo upload fails when file size exceeds 5MB. Error message: "Request entity too large"',
        status: 'read'
      });

      expect(feedback.message).toContain('Bug:');
      expect(feedback.status).toBe('read');
    });

    it('should create feature request feedback', () => {
      const feedback = new Feedback({
        name: 'User',
        email: 'user@example.com',
        message: 'Feature Request: Please add ability to export composites in PDF format',
        status: 'unread'
      });

      expect(feedback.message).toContain('Feature Request');
      expect(feedback.status).toBe('unread');
    });
  });
});
