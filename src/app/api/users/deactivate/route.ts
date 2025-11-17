import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth, unauthorizedResponse } from '@/middleware/auth';

// PUT /api/users/deactivate - Deactivate user account
export async function PUT(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return unauthorizedResponse('Invalid or expired token');
    }

    await connectDB();

    const body = await request.json();
    const { password } = body;

    // Require password confirmation for security
    if (!password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Password is required to deactivate account',
        },
        { status: 400 }
      );
    }

    const user = await (User as any).findById(authUser.userId);
    
    if (!user || user.isDeleted) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid password',
        },
        { status: 401 }
      );
    }

    // Check if already deactivated
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: 'Account is already deactivated',
        },
        { status: 400 }
      );
    }

    // Deactivate account
    user.isActive = false;
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Account deactivated successfully. You can contact support to reactivate.',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Deactivate account error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while deactivating account',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
