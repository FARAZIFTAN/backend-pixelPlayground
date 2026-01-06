import rateLimit from 'express-rate-limit';
import { NextResponse } from 'next/server';

/**
 * Rate Limiter Middleware for API Protection
 * Prevents abuse and DDoS attacks
 */

// Time constants (in milliseconds)
const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

/**
 * Create standardized rate limit error handler
 */
const createRateLimitHandler = (customMessage: string) => (req: any, res: any) => {
  res.status(429).json({
    success: false,
    message: customMessage,
    retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
  });
};

// General API rate limiter - 100 requests per 15 minutes
export const generalLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many requests from this IP, please try again later'),
});

// Strict rate limiter for authentication endpoints - 5 requests per 15 minutes
export const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
  },
  skipSuccessfulRequests: true,
  handler: createRateLimitHandler('Too many authentication attempts from this IP, please try again later'),
});

// Upload rate limiter - 20 uploads per hour
export const uploadLimiter = rateLimit({
  windowMs: ONE_HOUR,
  max: 20,
  message: {
    success: false,
    message: 'Too many upload requests, please try again after 1 hour',
  },
  handler: createRateLimitHandler('Upload limit exceeded, please try again later'),
});

// AI generation rate limiter - 30 requests per hour
export const aiLimiter = rateLimit({
  windowMs: ONE_HOUR,
  max: 30,
  message: {
    success: false,
    message: 'AI generation limit exceeded, please try again after 1 hour',
  },
  handler: createRateLimitHandler('Too many AI generation requests, please try again later'),
});

// Payment rate limiter - 10 requests per hour
export const paymentLimiter = rateLimit({
  windowMs: ONE_HOUR,
  max: 10,
  message: {
    success: false,
    message: 'Too many payment requests, please try again after 1 hour',
  },
  handler: createRateLimitHandler('Payment request limit exceeded, please contact support if you need assistance'),
});

// Strict limiter for sensitive operations - 3 requests per hour
export const strictLimiter = rateLimit({
  windowMs: ONE_HOUR,
  max: 3,
  message: {
    success: false,
    message: 'Too many requests for this sensitive operation',
  },
  handler: createRateLimitHandler('Rate limit exceeded for this operation, please try again later'),
});

/**
 * Next.js compatible rate limiter wrapper
 * Converts Express rate limiter to Next.js middleware
 */
export function createRateLimiter(limiter: any) {
  return async (req: any) => {
    return new Promise((resolve, reject) => {
      limiter(req, {
        status: (code: number) => ({
          json: (body: any) => reject(
            NextResponse.json(body, { status: code })
          ),
        }),
      }, () => resolve(true));
    });
  };
}
