import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
  startSpan: jest.fn((options, callback) => callback({ setStatus: jest.fn() })),
}));

import { 
  AppError, 
  logError, 
  logWarning, 
  logInfo, 
  catchAsync,
  setUserContext,
  clearUserContext,
  addBreadcrumb,
  startTransaction,
  withPerformanceMonitoring
} from '../errorHandler';
import * as Sentry from '@sentry/nextjs';

describe('Error Handler', () => {
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;
  let consoleInfoSpy: any;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleInfoSpy.mockRestore();
  });

  describe('AppError', () => {
    it('should create AppError with default values', () => {
      const error = new AppError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });

    it('should create AppError with custom status code', () => {
      const error = new AppError('Not found', 404);

      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(true);
    });

    it('should create AppError with custom operational flag', () => {
      const error = new AppError('Critical error', 500, false);

      expect(error.isOperational).toBe(false);
    });

    it('should have stack trace', () => {
      const error = new AppError('Stack test');

      expect(error.stack).toBeDefined();
    });

    it('should be instance of Error', () => {
      const error = new AppError('Test');

      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('logError', () => {
    it('should log error with context', () => {
      const error = new Error('Context error');
      logError(error, { context: 'Test Context' });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error occurred:',
        expect.objectContaining({
          message: 'Context error',
          context: { context: 'Test Context' }
        })
      );
      expect(Sentry.captureException).toHaveBeenCalledWith(error, expect.any(Object));
    });

    it('should log error with context', () => {
      const error = new Error('Context error');
      logError(error, { userId: '123' });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error occurred:',
        expect.objectContaining({
          message: 'Context error',
          context: { userId: '123' }
        })
      );
      expect(Sentry.captureException).toHaveBeenCalledWith(error, expect.any(Object));
    });

    it('should log error without context', () => {
      const error = new Error('No context error');
      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('should log AppError', () => {
      const error = new AppError('App error', 400);
      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('logWarning', () => {
    it('should log warning with message', () => {
      logWarning('Warning message');

      expect(consoleWarnSpy).toHaveBeenCalledWith('Warning:', 'Warning message', undefined);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'Warning message',
        expect.objectContaining({ level: 'warning' })
      );
    });

    it('should log warning with context', () => {
      const context = { feature: 'test' };
      logWarning('Test warning', context);

      expect(consoleWarnSpy).toHaveBeenCalledWith('Warning:', 'Test warning', context);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'Test warning',
        expect.objectContaining({
          level: 'warning',
          extra: context
        })
      );
    });
  });

  describe('logInfo', () => {
    it('should log info message', () => {
      logInfo('Info message');

      expect(consoleInfoSpy).toHaveBeenCalledWith('Info:', 'Info message', undefined);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'Info message',
        expect.objectContaining({ level: 'info' })
      );
    });

    it('should log info with context', () => {
      const context = { action: 'test' };
      logInfo('Test info', context);

      expect(consoleInfoSpy).toHaveBeenCalledWith('Info:', 'Test info', context);
    });
  });

  describe('catchAsync', () => {
    it('should catch and rethrow errors', async () => {
      const asyncFn = async () => {
        throw new Error('Async error');
      };

      const wrappedFn = catchAsync(asyncFn);

      await expect(wrappedFn()).rejects.toThrow('Async error');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should return result on success', async () => {
      const asyncFn = async (value: number) => value * 2;

      const wrappedFn = catchAsync(asyncFn);
      const result = await wrappedFn(5);

      expect(result).toBe(10);
    });

    it('should preserve function signature', async () => {
      const asyncFn = async (a: number, b: string) => `${a}-${b}`;

      const wrappedFn = catchAsync(asyncFn);
      const result = await wrappedFn(42, 'test');

      expect(result).toBe('42-test');
    });

    it('should log errors to Sentry', async () => {
      const asyncFn = async () => {
        throw new AppError('Test error', 400);
      };

      const wrappedFn = catchAsync(asyncFn);

      await expect(wrappedFn()).rejects.toThrow('Test error');
      expect(Sentry.captureException).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should work with AppError and log to Sentry', () => {
      const error = new AppError('Integration error', 404);
      
      logError(error, { route: '/api/test' });

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('should log different severity levels', () => {
      logError(new Error('Error level'));
      logWarning('Warning level');
      logInfo('Info level');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it('should handle async functions with catchAsync', async () => {
      const successFn = catchAsync(async (x: number) => x + 1);
      const result = await successFn(5);
      expect(result).toBe(6);

      const errorFn = catchAsync(async () => {
        throw new Error('Fail');
      });

      await expect(errorFn()).rejects.toThrow('Fail');
      expect(Sentry.captureException).toHaveBeenCalled();
    });
  });

  describe('setUserContext', () => {
    it('should set user context with all fields', () => {
      setUserContext({
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User'
      });

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'user123',
        email: 'test@example.com',
        username: 'Test User'
      });
    });

    it('should set user context without name', () => {
      setUserContext({
        id: 'user456',
        email: 'another@example.com'
      });

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'user456',
        email: 'another@example.com',
        username: undefined
      });
    });
  });

  describe('clearUserContext', () => {
    it('should clear user context', () => {
      clearUserContext();

      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe('addBreadcrumb', () => {
    it('should add breadcrumb with message and category', () => {
      addBreadcrumb('User clicked button', 'ui');

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'User clicked button',
        category: 'ui',
        level: 'info',
        data: undefined
      });
    });

    it('should add breadcrumb with data', () => {
      const data = { buttonId: 'submit', page: 'checkout' };
      addBreadcrumb('Form submitted', 'form', data);

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'Form submitted',
        category: 'form',
        level: 'info',
        data
      });
    });

    it('should add navigation breadcrumb', () => {
      addBreadcrumb('Navigated to dashboard', 'navigation', { from: '/home', to: '/dashboard' });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'Navigated to dashboard',
        category: 'navigation',
        level: 'info',
        data: { from: '/home', to: '/dashboard' }
      });
    });
  });

  describe('startTransaction', () => {
    it('should start transaction and execute callback', () => {
      const callback = jest.fn((span) => {
        expect(span).toBeDefined();
        return 'result';
      });

      const result = startTransaction('test-transaction', 'test-op', callback);

      expect(Sentry.startSpan).toHaveBeenCalledWith(
        { name: 'test-transaction', op: 'test-op' },
        callback
      );
      expect(callback).toHaveBeenCalled();
      expect(result).toBe('result');
    });

    it('should pass span to callback', () => {
      let capturedSpan: any = null;
      
      startTransaction('transaction', 'operation', (span) => {
        capturedSpan = span;
        return 'done';
      });

      expect(capturedSpan).toBeDefined();
      expect(capturedSpan.setStatus).toBeDefined();
    });

    it('should return callback result', () => {
      const result = startTransaction('calc', 'compute', () => {
        return 42;
      });

      expect(result).toBe(42);
    });
  });

  describe('withPerformanceMonitoring', () => {
    it('should monitor successful async function', async () => {
      const asyncFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'success';
      };

      const result = await withPerformanceMonitoring('test-perf', 'test-op', asyncFn);

      expect(result).toBe('success');
      expect(Sentry.startSpan).toHaveBeenCalledWith(
        { name: 'test-perf', op: 'test-op' },
        expect.any(Function)
      );
    });

    it('should set ok status on success', async () => {
      const setStatusMock = jest.fn();
      (Sentry.startSpan as jest.Mock).mockImplementationOnce((options, callback) => {
        return callback({ setStatus: setStatusMock });
      });

      await withPerformanceMonitoring('success-perf', 'op', async () => 'ok');

      expect(setStatusMock).toHaveBeenCalledWith('ok');
    });

    it('should handle errors and set error status', async () => {
      const setStatusMock = jest.fn();
      (Sentry.startSpan as jest.Mock).mockImplementationOnce((options, callback) => {
        return callback({ setStatus: setStatusMock });
      });

      const errorFn = async () => {
        throw new Error('Performance test error');
      };

      await expect(
        withPerformanceMonitoring('error-perf', 'op', errorFn)
      ).rejects.toThrow('Performance test error');

      expect(setStatusMock).toHaveBeenCalledWith('internal_error');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log error with transaction context', async () => {
      const setStatusMock = jest.fn();
      (Sentry.startSpan as jest.Mock).mockImplementationOnce((options, callback) => {
        return callback({ setStatus: setStatusMock });
      });

      const errorFn = async () => {
        throw new AppError('Context error', 500);
      };

      await expect(
        withPerformanceMonitoring('context-test', 'database', errorFn)
      ).rejects.toThrow('Context error');

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(AppError),
        expect.objectContaining({
          extra: expect.objectContaining({
            transaction: 'context-test',
            operation: 'database'
          })
        })
      );
    });

    it('should rethrow error after logging', async () => {
      const errorFn = async () => {
        throw new Error('Must rethrow');
      };

      await expect(
        withPerformanceMonitoring('rethrow-test', 'op', errorFn)
      ).rejects.toThrow('Must rethrow');
    });

    it('should work with different return types', async () => {
      const numberFn = async () => 42;
      const objectFn = async () => ({ data: 'test' });
      const arrayFn = async () => [1, 2, 3];

      const numberResult = await withPerformanceMonitoring('num', 'op', numberFn);
      const objectResult = await withPerformanceMonitoring('obj', 'op', objectFn);
      const arrayResult = await withPerformanceMonitoring('arr', 'op', arrayFn);

      expect(numberResult).toBe(42);
      expect(objectResult).toEqual({ data: 'test' });
      expect(arrayResult).toEqual([1, 2, 3]);
    });
  });
});
