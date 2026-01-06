import * as Sentry from '@sentry/nextjs';

/**
 * Error Handler Utility
 * Centralized error handling with Sentry integration
 */

interface ErrorContext {
  [key: string]: any;
}

interface UserContext {
  id: string;
  email: string;
  name?: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Log error to Sentry and console
 */
export function logError(error: Error | AppError, context?: ErrorContext): void {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    context,
  });

  Sentry.captureException(error, {
    extra: context,
    level: 'error',
  });
}

/**
 * Handle async route errors
 */
export function catchAsync<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error as Error);
      throw error;
    }
  }) as T;
}

/**
 * Log warning to Sentry
 */
export function logWarning(message: string, context?: ErrorContext): void {
  console.warn('Warning:', message, context);
  
  Sentry.captureMessage(message, {
    level: 'warning',
    extra: context,
  });
}

/**
 * Log info to Sentry
 */
export function logInfo(message: string, context?: ErrorContext): void {
  console.info('Info:', message, context);
  
  Sentry.captureMessage(message, {
    level: 'info',
    extra: context,
  });
}

/**
 * Set user context for Sentry
 */
export function setUserContext(user: UserContext): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
}

/**
 * Clear user context
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb to Sentry
 */
export function addBreadcrumb(message: string, category: string, data?: ErrorContext): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
  });
}

/**
 * Start Sentry transaction/span
 */
export function startTransaction<T>(name: string, op: string, callback: (span: any) => T): T {
  return Sentry.startSpan({ name, op }, callback);
}

/**
 * Monitor async function performance with Sentry
 */
export async function withPerformanceMonitoring<T>(
  name: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return startTransaction(name, operation, async (span) => {
    try {
      const result = await fn();
      span.setStatus('ok');
      return result;
    } catch (error) {
      span.setStatus('internal_error');
      logError(error as Error, { transaction: name, operation });
      throw error;
    }
  });
}
