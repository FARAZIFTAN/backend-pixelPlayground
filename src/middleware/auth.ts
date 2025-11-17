import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
  };
}

/**
 * Middleware to verify JWT token from Authorization header
 * Also checks if user is deleted or inactive
 * Usage: const user = await verifyAuth(request);
 */
export async function verifyAuth(
  request: NextRequest
): Promise<{ userId: string; email: string; name: string; role: 'user' | 'admin' } | null> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

    if (!decoded) {
      return null;
    }

    // Check if user still exists and is active
    await connectDB();
    const user = await (User as any).findById(decoded.userId).select('isDeleted isActive');
    
    if (!user || user.isDeleted || !user.isActive) {
      return null;
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role || 'user',
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
