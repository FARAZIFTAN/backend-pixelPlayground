import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { generateToken, verifyToken, decodeToken, JWTPayload } from '../jwt';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

describe('JWT Utilities', () => {
  let jwt: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jwt = require('jsonwebtoken');
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
      (jwt.sign as any) = jest.fn().mockReturnValue(mockToken);

      const payload: JWTPayload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      };

      const token = generateToken(payload);

      expect(token).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        expect.any(String),
        expect.objectContaining({ expiresIn: expect.any(String) })
      );
    });

    it('should generate token for admin user', () => {
      const mockToken = 'admin.token.signature';
      (jwt.sign as any) = jest.fn().mockReturnValue(mockToken);

      const payload: JWTPayload = {
        userId: '507f1f77bcf86cd799439012',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin'
      };

      const token = generateToken(payload);

      expect(token).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalled();
    });

    it('should include all payload fields', () => {
      (jwt.sign as any) = jest.fn().mockReturnValue('token');

      const payload: JWTPayload = {
        userId: '123',
        email: 'user@test.com',
        name: 'John Doe',
        role: 'user'
      };

      generateToken(payload);

      const callArgs = (jwt.sign as any).mock.calls[0];
      expect(callArgs[0]).toEqual(payload);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token successfully', () => {
      const mockPayload: JWTPayload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      };
      (jwt.verify as any) = jest.fn().mockReturnValue(mockPayload);

      const result = verifyToken('valid.token.here');

      expect(result).toEqual(mockPayload);
      expect(jwt.verify).toHaveBeenCalledWith('valid.token.here', expect.any(String));
    });

    it('should return null for invalid token', () => {
      (jwt.verify as any) = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {}) as any;

      const result = verifyToken('invalid.token');

      expect(result).toBeNull();
      expect(consoleError).toHaveBeenCalledWith('JWT Verification Error:', expect.any(Error));
      
      consoleError.mockRestore();
    });

    it('should return null for expired token', () => {
      (jwt.verify as any) = jest.fn().mockImplementation(() => {
        const error: any = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {}) as any;

      const result = verifyToken('expired.token');

      expect(result).toBeNull();
      
      consoleError.mockRestore();
    });

    it('should return null for malformed token', () => {
      (jwt.verify as any) = jest.fn().mockImplementation(() => {
        const error: any = new Error('jwt malformed');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {}) as any;

      const result = verifyToken('malformed.token');

      expect(result).toBeNull();
      
      consoleError.mockRestore();
    });

    it('should verify admin token', () => {
      const mockPayload: JWTPayload = {
        userId: '507f1f77bcf86cd799439012',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'admin'
      };
      (jwt.verify as any) = jest.fn().mockReturnValue(mockPayload);

      const result = verifyToken('admin.token');

      expect(result).toEqual(mockPayload);
      expect(result?.role).toBe('admin');
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const mockPayload: JWTPayload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      };
      (jwt.decode as any) = jest.fn().mockReturnValue(mockPayload);

      const result = decodeToken('some.token.here');

      expect(result).toEqual(mockPayload);
      expect(jwt.decode).toHaveBeenCalledWith('some.token.here');
    });

    it('should return null for invalid token format', () => {
      (jwt.decode as any) = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = decodeToken('invalid');

      expect(result).toBeNull();
    });

    it('should decode expired token without throwing error', () => {
      const mockPayload: JWTPayload = {
        userId: '123',
        email: 'old@example.com',
        name: 'Old User',
        role: 'user'
      };
      (jwt.decode as any) = jest.fn().mockReturnValue(mockPayload);

      const result = decodeToken('expired.token');

      expect(result).toEqual(mockPayload);
    });

    it('should decode admin token', () => {
      const mockPayload: JWTPayload = {
        userId: '456',
        email: 'admin@test.com',
        name: 'Admin',
        role: 'admin'
      };
      (jwt.decode as any) = jest.fn().mockReturnValue(mockPayload);

      const result = decodeToken('admin.token');

      expect(result).toEqual(mockPayload);
      expect(result?.role).toBe('admin');
    });

    it('should handle null return from jwt.decode', () => {
      (jwt.decode as any) = jest.fn().mockReturnValue(null);

      const result = decodeToken('token');

      expect(result).toBeNull();
    });
  });

  describe('Integration scenarios', () => {
    it('should generate and verify token for same payload', () => {
      const payload: JWTPayload = {
        userId: '789',
        email: 'integration@test.com',
        name: 'Integration Test',
        role: 'user'
      };

      const mockToken = 'generated.token.signature';
      (jwt.sign as any) = jest.fn().mockReturnValue(mockToken);
      (jwt.verify as any) = jest.fn().mockReturnValue(payload);

      const token = generateToken(payload);
      const verified = verifyToken(token);

      expect(verified).toEqual(payload);
    });

    it('should decode token that fails verification', () => {
      const payload: JWTPayload = {
        userId: '999',
        email: 'fail@test.com',
        name: 'Fail Test',
        role: 'user'
      };

      (jwt.verify as any) = jest.fn().mockImplementation(() => {
        throw new Error('Signature invalid');
      });
      (jwt.decode as any) = jest.fn().mockReturnValue(payload);

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {}) as any;

      const verified = verifyToken('tampered.token');
      const decoded = decodeToken('tampered.token');

      expect(verified).toBeNull();
      expect(decoded).toEqual(payload);
      
      consoleError.mockRestore();
    });
  });
});
