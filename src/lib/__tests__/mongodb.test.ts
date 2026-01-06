import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Set environment variable before importing
process.env.MONGODB_URI = 'mongodb://testuser:testpass@localhost:27017/testdb';

// Create mock functions
const mockConnect = jest.fn<(uri: string, options: any) => Promise<any>>();

// Mock mongoose module
jest.mock('mongoose', () => ({
  default: {
    connect: mockConnect,
  },
  connect: mockConnect,
}));

// Import after mocking
import mongoose from 'mongoose';

// Mock console methods
let consoleLogSpy: any;
let consoleErrorSpy: any;

describe('MongoDB Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules(); // Reset module cache
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Reset global mongoose cache
    (global as any).mongoose = { conn: null, promise: null };
    
    // Reset mock implementation to default
    mockConnect.mockImplementation(() => Promise.resolve({} as any));
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('connectDB', () => {
    it('should connect to MongoDB successfully', async () => {
      const mockMongoose = { connection: 'connected' };
      mockConnect.mockResolvedValueOnce(mockMongoose);

      const { default: connectDB } = await import('../mongodb');
      const result = await connectDB();

      expect(mockConnect).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('MongoDB Connected'));
    });

    it('should reuse existing connection', async () => {
      const mockMongoose = { connection: 'connected' };
      mockConnect.mockResolvedValue(mockMongoose);

      const { default: connectDB } = await import('../mongodb');
      
      // First call
      await connectDB();
      // Second call should reuse
      await connectDB();

      // Should only connect once
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      mockConnect.mockRejectedValueOnce(error);

      const { default: connectDB } = await import('../mongodb');

      await expect(connectDB()).rejects.toThrow('Connection failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('MongoDB Connection Error'), error);
    });

    it('should log connection details', async () => {
      const mockMongoose = { connection: 'connected' };
      mockConnect.mockResolvedValueOnce(mockMongoose);

      const { default: connectDB } = await import('../mongodb');
      await connectDB();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Connected to:'), expect.any(String));
    });

    it('should use correct connection options', async () => {
      const mockMongoose = { connection: 'connected' };
      mockConnect.mockResolvedValueOnce(mockMongoose);

      const { default: connectDB } = await import('../mongodb');
      await connectDB();

      expect(mockConnect).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          bufferCommands: false,
          serverSelectionTimeoutMS: 15000,
          family: 4
        })
      );
    });

    it('should reset promise on error', async () => {
      const error = new Error('First error');
      mockConnect.mockRejectedValueOnce(error);
      
      const { default: connectDB } = await import('../mongodb');
      
      try {
        await connectDB();
      } catch (e) {
        // Error expected
      }

      // Should allow retry
      mockConnect.mockResolvedValueOnce({ connection: 'connected' });
      const result = await connectDB();
      
      expect(result).toBeDefined();
    });
  });
});
