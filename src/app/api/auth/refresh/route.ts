import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth } from '@/middleware/auth';
import { generateToken } from '@/lib/jwt';

// POST /api/auth/refresh - Refresh JWT token
export async function POST(request: NextRequest) {
  try {
    // Verify current token
    const authUser = await verifyAuth(request);
    
    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired token',
        },
        { status: 401 }
      );
    }

    await connectDB();

    // Get user from database
    const user = await (User as any).findById(authUser.userId).select('-password');

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    // Generate new token
    const newToken = generateToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: newToken,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Token refresh error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while refreshing token',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
