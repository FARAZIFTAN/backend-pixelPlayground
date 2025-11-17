import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth, unauthorizedResponse } from '@/middleware/auth';

// GET /api/users/login-history - Get user's login history
export async function GET(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return unauthorizedResponse('Invalid or expired token');
    }

    await connectDB();

    const user = await (User as any).findById(authUser.userId).select('loginHistory lastLogin');
    
    if (!user || user.isDeleted) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Login history retrieved successfully',
        data: {
          lastLogin: user.lastLogin,
          loginHistory: user.loginHistory || [],
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get login history error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while retrieving login history',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
