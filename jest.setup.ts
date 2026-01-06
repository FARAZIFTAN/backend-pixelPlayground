/**
 * Jest Setup File
 * Global configuration and mocks for all tests
 */

// Suppress console logs in tests (optional)
global.console = {
  ...console,
  // Uncomment to suppress logs:
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Set test timeout
jest.setTimeout(10000); // 10 seconds

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';

// Global test utilities
global.mockDate = new Date('2026-01-05T00:00:00.000Z');
