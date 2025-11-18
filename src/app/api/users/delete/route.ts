import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Photo from '@/models/Photo';
import { verifyAuth, unauthorizedResponse } from '@/middleware/auth';

// DELETE /api/users/delete - Soft delete user account
export async function DELETE(request: NextRequest) {
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
          message: 'Password is required to delete account',
        },
        { status: 400 }
      );
    }

    const user = await (User as any).findById(authUser.userId).select('+password');
    
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

    // Soft delete user account
    user.isDeleted = true;
    user.isActive = false;
    user.deletedAt = new Date();
    await user.save();

    // Also mark all user's photos as deleted (optional - depends on business logic)
    await (Photo as any).updateMany(
      { userId: authUser.userId },
      { 
        $set: { 
          isPublic: false // Hide photos from public gallery
        } 
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Account deleted successfully. Your data will be permanently removed after 30 days.',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete account error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while deleting account',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
