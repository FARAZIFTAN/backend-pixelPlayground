import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { IUserRepository, userRepository } from '@/repositories/UserRepository';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
  };
}

export interface AuthResult {
  user: any;
  isValid: boolean;
  userId: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  isPremium: boolean;
}

/**
 * Middleware to verify JWT token from Authorization header
 * Also checks if user is deleted or inactive
 * Now supports dependency injection for better testability
 * Usage: const auth = await verifyAuth(request);
 */
export async function verifyAuth(
  request: NextRequest,
  userRepo?: IUserRepository
): Promise<AuthResult | null> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[AUTH] No authorization header or invalid format');
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

    if (!decoded) {
      console.log('[AUTH] Token verification failed');
      return null;
    }

    console.log('[AUTH] Token decoded:', {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    });

    // Use injected repository or default
    const repo = userRepo || userRepository;
    
    // Check if user still exists and is active, and get isPremium
    await connectDB();
    const user = await repo.findById(decoded.userId, 'isDeleted isActive isPremium role');
    
    if (!user || user.isDeleted || !user.isActive) {
      console.log('[AUTH] User not found, deleted, or inactive');
      return null;
    }

    // Use role from database if available, otherwise from token
    const userRole = user.role || decoded.role || 'user';
    console.log('[AUTH] Final role:', userRole, '(from DB:', user.role, ', from token:', decoded.role, ')');

    return {
      user,
      isValid: true,
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: userRole,
      isPremium: user.isPremium || false,
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

/**
 * Helper function to create unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
  return NextResponse.json(
    { success: false, message },
    { status: 401 }
  );
}
