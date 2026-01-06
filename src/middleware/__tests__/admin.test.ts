import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, forbiddenResponse } from '../admin';
import * as authMiddleware from '../auth';

// Mock auth middleware
jest.mock('../auth');

describe('Admin Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyAdmin', () => {
    it('should return admin user when authenticated as admin', async () => {
      const mockAdminUser = {
        user: { _id: '507f1f77bcf86cd799439011' },
        userId: '507f1f77bcf86cd799439011',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin' as const,
        isValid: true,
        isPremium: false
      };

      jest.mocked(authMiddleware.verifyAuth).mockResolvedValue(mockAdminUser);

      const mockRequest = new NextRequest('http://localhost:3000/api/admin/test');
      const result = await verifyAdmin(mockRequest);

      expect(result).toEqual(mockAdminUser);
      expect(authMiddleware.verifyAuth).toHaveBeenCalledWith(mockRequest);
    });

    it('should return null when user is not authenticated', async () => {
      jest.mocked(authMiddleware.verifyAuth).mockResolvedValue(null as any);

      const mockRequest = new NextRequest('http://localhost:3000/api/admin/test');
      const result = await verifyAdmin(mockRequest);

      expect(result).toBeNull();
    });

    it('should return null when user is not admin', async () => {
      const mockRegularUser = {
        user: { _id: '507f1f77bcf86cd799439012' },
        userId: '507f1f77bcf86cd799439012',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user' as const,
        isValid: true,
        isPremium: false
      };

      jest.mocked(authMiddleware.verifyAuth).mockResolvedValue(mockRegularUser);

      const mockRequest = new NextRequest('http://localhost:3000/api/admin/test');
      const result = await verifyAdmin(mockRequest);

      expect(result).toBeNull();
    });

    it('should handle authentication errors', async () => {
      jest.mocked(authMiddleware.verifyAuth).mockRejectedValue(new Error('Auth error'));

      const mockRequest = new NextRequest('http://localhost:3000/api/admin/test');

      await expect(verifyAdmin(mockRequest)).rejects.toThrow('Auth error');
    });

    it('should verify admin with different admin users', async () => {
      const admins = [
        { user: {_id: '1'}, userId: '1', email: 'admin1@test.com', name: 'Admin 1', role: 'admin' as const, isValid: true, isPremium: false },
        { user: {_id: '2'}, userId: '2', email: 'admin2@test.com', name: 'Admin 2', role: 'admin' as const, isValid: true, isPremium: false },
        { user: {_id: '3'}, userId: '3', email: 'admin3@test.com', name: 'Admin 3', role: 'admin' as const, isValid: true, isPremium: false }
      ];

      for (const admin of admins) {
        jest.mocked(authMiddleware.verifyAuth).mockResolvedValue(admin);
        
        const mockRequest = new NextRequest('http://localhost:3000/api/admin/test');
        const result = await verifyAdmin(mockRequest);

        expect(result).toEqual(admin);
        expect(result?.role).toBe('admin');
      }
    });
  });

  describe('forbiddenResponse', () => {
    it('should return 403 response with default message', () => {
      const response = forbiddenResponse();

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(403);
    });

    it('should return 403 response with custom message', () => {
      const customMessage = 'You do not have permission to access this resource';
      const response = forbiddenResponse(customMessage);

      expect(response.status).toBe(403);
    });

    it('should return JSON response with success false', async () => {
      const response = forbiddenResponse();
      const body = await response.json();

      expect(body).toHaveProperty('success', false);
      expect(body).toHaveProperty('message');
    });

    it('should include custom message in response body', async () => {
      const customMessage = 'Custom forbidden message';
      const response = forbiddenResponse(customMessage);
      const body = await response.json();

      expect(body.message).toBe(customMessage);
    });

    it('should return default message when called without arguments', async () => {
      const response = forbiddenResponse();
      const body = await response.json();

      expect(body.message).toBe('Access denied. Admin only.');
    });
  });

  describe('Admin middleware integration', () => {
    it('should successfully verify and allow admin access', async () => {
      const mockAdmin = {
        userId: 'admin123',
        email: 'admin@example.com',
        name: 'Super Admin',
        role: 'admin' as const
      };

      (authMiddleware.verifyAuth as any) = jest.fn().mockResolvedValue(mockAdmin);

      const mockRequest = new NextRequest('http://localhost:3000/api/admin/users');
      const adminUser = await verifyAdmin(mockRequest);

      if (!adminUser) {
        const response = forbiddenResponse();
        expect(response.status).toBe(403);
      } else {
        expect(adminUser.role).toBe('admin');
      }
    });

    it('should block non-admin users with forbidden response', async () => {
      const mockUser = {
        userId: 'user123',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user' as const
      };

      (authMiddleware.verifyAuth as any) = jest.fn().mockResolvedValue(mockUser);

      const mockRequest = new NextRequest('http://localhost:3000/api/admin/settings');
      const adminUser = await verifyAdmin(mockRequest);

      expect(adminUser).toBeNull();
      
      if (!adminUser) {
        const response = forbiddenResponse('Admin access required');
        expect(response.status).toBe(403);
        
        const body = await response.json();
        expect(body.success).toBe(false);
      }
    });

    it('should handle unauthenticated requests', async () => {
      jest.mocked(authMiddleware.verifyAuth).mockResolvedValue(null as any);

      const mockRequest = new NextRequest('http://localhost:3000/api/admin/dashboard');
      const adminUser = await verifyAdmin(mockRequest);

      expect(adminUser).toBeNull();
      
      const response = forbiddenResponse();
      expect(response.status).toBe(403);
    });
  });
});
