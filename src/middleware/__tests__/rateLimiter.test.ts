import { describe, it, expect, jest } from '@jest/globals';

// Mock express-rate-limit dengan proper default export
const mockRateLimit = jest.fn((options) => {
  // Return a middleware function that exposes its options
  const middleware = jest.fn((req: any, res: any, next: any) => next()) as any;
  middleware.options = options;
  return middleware;
});

jest.mock('express-rate-limit', () => mockRateLimit);

import { 
  generalLimiter, 
  authLimiter, 
  uploadLimiter, 
  aiLimiter, 
  paymentLimiter, 
  strictLimiter,
  createRateLimiter
} from '../rateLimiter';

describe('Rate Limiter', () => {
  describe('generalLimiter', () => {
    it('should be configured with correct window duration', () => {
      const options = (generalLimiter as any).options;
      expect(options.windowMs).toBe(15 * 60 * 1000);
    });

    it('should be configured with max 100 requests', () => {
      const options = (generalLimiter as any).options;
      expect(options.max).toBe(100);
    });

    it('should have error message', () => {
      const options = (generalLimiter as any).options;
      expect(options.message).toBeDefined();
      expect(options.message.success).toBe(false);
    });

    it('should have standard headers enabled', () => {
      const options = (generalLimiter as any).options;
      expect(options.standardHeaders).toBe(true);
    });

    it('should have legacy headers disabled', () => {
      const options = (generalLimiter as any).options;
      expect(options.legacyHeaders).toBe(false);
    });
  });

  describe('authLimiter', () => {
    it('should have 15 minute window', () => {
      const options = (authLimiter as any).options;
      expect(options.windowMs).toBe(15 * 60 * 1000);
    });

    it('should have strict limit of 5 requests', () => {
      const options = (authLimiter as any).options;
      expect(options.max).toBe(5);
    });

    it('should skip successful requests', () => {
      const options = (authLimiter as any).options;
      expect(options.skipSuccessfulRequests).toBe(true);
    });

    it('should have custom handler', () => {
      const options = (authLimiter as any).options;
      expect(options.handler).toBeDefined();
      expect(typeof options.handler).toBe('function');
    });
  });

  describe('uploadLimiter', () => {
    it('should have 1 hour window', () => {
      const options = (uploadLimiter as any).options;
      expect(options.windowMs).toBe(60 * 60 * 1000);
    });

    it('should allow 20 uploads per hour', () => {
      const options = (uploadLimiter as any).options;
      expect(options.max).toBe(20);
    });
  });

  describe('aiLimiter', () => {
    it('should have 1 hour window', () => {
      const options = (aiLimiter as any).options;
      expect(options.windowMs).toBe(60 * 60 * 1000);
    });

    it('should allow 30 AI requests per hour', () => {
      const options = (aiLimiter as any).options;
      expect(options.max).toBe(30);
    });
  });

  describe('paymentLimiter', () => {
    it('should have 1 hour window', () => {
      const options = (paymentLimiter as any).options;
      expect(options.windowMs).toBe(60 * 60 * 1000);
    });

    it('should allow 10 payment requests per hour', () => {
      const options = (paymentLimiter as any).options;
      expect(options.max).toBe(10);
    });
  });

  describe('strictLimiter', () => {
    it('should have 1 hour window', () => {
      const options = (strictLimiter as any).options;
      expect(options.windowMs).toBe(60 * 60 * 1000);
    });

    it('should have very strict limit of 3 requests', () => {
      const options = (strictLimiter as any).options;
      expect(options.max).toBe(3);
    });
  });

  describe('Configuration validation', () => {
    it('should have all limiters configured', () => {
      expect(generalLimiter).toBeDefined();
      expect(authLimiter).toBeDefined();
      expect(uploadLimiter).toBeDefined();
      expect(aiLimiter).toBeDefined();
      expect(paymentLimiter).toBeDefined();
      expect(strictLimiter).toBeDefined();
    });

    it('should have error messages with success: false', () => {
      const limiters = [generalLimiter, authLimiter, uploadLimiter, aiLimiter, paymentLimiter, strictLimiter];
      limiters.forEach(limiter => {
        const options = (limiter as any).options;
        if (options.message && typeof options.message === 'object') {
          expect(options.message.success).toBe(false);
        }
      });
    });

    it('should have custom handlers for all limiters', () => {
      const limiters = [generalLimiter, authLimiter, uploadLimiter, aiLimiter, paymentLimiter, strictLimiter];
      limiters.forEach(limiter => {
        const options = (limiter as any).options;
        expect(options.handler).toBeDefined();
        expect(typeof options.handler).toBe('function');
      });
    });
  });

  describe('Rate Limit Handlers', () => {
    it('should call handler with 429 status when rate limited', () => {
      const options = (generalLimiter as any).options;
      const mockReq = { 
        rateLimit: { 
          resetTime: Date.now() + 900000 
        } 
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      options.handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
          retryAfter: expect.any(Number)
        })
      );
    });

    it('should calculate retryAfter correctly', () => {
      const options = (authLimiter as any).options;
      const resetTime = Date.now() + 600000; // 10 minutes from now
      const mockReq = { 
        rateLimit: { resetTime } 
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      options.handler(mockReq, mockRes);

      const jsonCall = mockRes.json.mock.calls[0][0];
      expect(jsonCall.retryAfter).toBeGreaterThan(0);
      expect(jsonCall.retryAfter).toBeLessThanOrEqual(Math.ceil(resetTime / 1000));
    });

    it('should include custom message for upload limiter', () => {
      const options = (uploadLimiter as any).options;
      const mockReq = { 
        rateLimit: { resetTime: Date.now() + 3600000 } 
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      options.handler(mockReq, mockRes);

      const jsonCall = mockRes.json.mock.calls[0][0];
      expect(jsonCall.message).toContain('Upload limit exceeded');
    });

    it('should include custom message for AI limiter', () => {
      const options = (aiLimiter as any).options;
      const mockReq = { 
        rateLimit: { resetTime: Date.now() + 3600000 } 
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      options.handler(mockReq, mockRes);

      const jsonCall = mockRes.json.mock.calls[0][0];
      expect(jsonCall.message).toContain('AI generation');
    });

    it('should include custom message for payment limiter', () => {
      const options = (paymentLimiter as any).options;
      const mockReq = { 
        rateLimit: { resetTime: Date.now() + 3600000 } 
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      options.handler(mockReq, mockRes);

      const jsonCall = mockRes.json.mock.calls[0][0];
      expect(jsonCall.message).toContain('Payment request limit');
    });

    it('should include custom message for strict limiter', () => {
      const options = (strictLimiter as any).options;
      const mockReq = { 
        rateLimit: { resetTime: Date.now() + 3600000 } 
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      options.handler(mockReq, mockRes);

      const jsonCall = mockRes.json.mock.calls[0][0];
      expect(jsonCall.message).toContain('Rate limit exceeded');
    });
  });

  describe('createRateLimiter', () => {
    it('should create Next.js compatible rate limiter', async () => {
      const mockLimiter = jest.fn((req, res, next) => next());
      const nextRateLimiter = createRateLimiter(mockLimiter);
      
      const mockReq = { ip: '127.0.0.1' };
      
      const result = await nextRateLimiter(mockReq);
      
      expect(result).toBe(true);
      expect(mockLimiter).toHaveBeenCalled();
    });

    it('should handle rate limit exceeded', async () => {
      const mockLimiter = jest.fn((req, res, next) => {
        res.status(429).json({
          success: false,
          message: 'Rate limit exceeded'
        });
      });
      const nextRateLimiter = createRateLimiter(mockLimiter);
      
      const mockReq = { ip: '127.0.0.1' };
      
      try {
        await nextRateLimiter(mockReq);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error).toBeDefined();
        expect(mockLimiter).toHaveBeenCalled();
      }
    });

    it('should pass request to limiter', async () => {
      const mockLimiter = jest.fn((req, res, next) => {
        expect(req.testProp).toBe('test-value');
        next();
      });
      const nextRateLimiter = createRateLimiter(mockLimiter);
      
      const mockReq = { ip: '127.0.0.1', testProp: 'test-value' };
      
      await nextRateLimiter(mockReq);
      
      expect(mockLimiter).toHaveBeenCalledWith(
        mockReq,
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should resolve with true when not rate limited', async () => {
      const mockLimiter = jest.fn((req, res, next) => next());
      const nextRateLimiter = createRateLimiter(mockLimiter);
      
      const result = await nextRateLimiter({});
      
      expect(result).toBe(true);
    });

    it('should provide proper response object', async () => {
      let capturedRes: any = null;
      const mockLimiter = jest.fn((req, res, next) => {
        capturedRes = res;
        next();
      });
      const nextRateLimiter = createRateLimiter(mockLimiter);
      
      await nextRateLimiter({});
      
      expect(capturedRes).toBeDefined();
      expect(capturedRes.status).toBeDefined();
      expect(typeof capturedRes.status).toBe('function');
    });
  });
});
