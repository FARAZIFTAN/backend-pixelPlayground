import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAdmin } from '@/middleware/admin';

// PATCH /api/users/:id/premium - Toggle premium status
export async function PATCH(
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
    const { isPremium, expiresInDays = 30 } = await request.json();

    // Validate input
    if (typeof isPremium !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'isPremium must be a boolean' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = { isPremium };

    // Set expiration date if upgrading to premium
    if (isPremium) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiresInDays);
      updateData.premiumExpiresAt = expiryDate;
    } else {
      // Remove expiration if downgrading to free
      updateData.premiumExpiresAt = null;
    }

    // Update user premium status
    // @ts-ignore
    const user = await User.findByIdAndUpdate(
      id,
      updateData,
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
      message: `User ${isPremium ? 'upgraded to premium' : 'downgraded to free'} successfully`,
      data: { user },
    });
  } catch (error) {
    console.error('Error updating premium status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update premium status' },
      { status: 500 }
    );
  }
}
