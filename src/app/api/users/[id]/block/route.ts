import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAdmin } from '@/middleware/admin';

// POST /api/users/:id/block - Block/Unblock user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // Verify admin access
    const authResult = await verifyAdmin(request);
    if (!authResult || typeof authResult === 'string') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const { isActive } = await request.json();

    // Validate input
    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'isActive must be a boolean' },
        { status: 400 }
      );
    }

    // Update user active status
    // @ts-ignore
    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires').exec();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `User ${isActive ? 'unblocked' : 'blocked'} successfully`,
      data: { user },
    });
  } catch (error) {
    console.error('Error blocking/unblocking user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update user status' },
      { status: 500 }
    );
  }
}
