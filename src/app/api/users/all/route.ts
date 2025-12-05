import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAdmin } from '@/middleware/admin';

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    const role = searchParams.get('role');

    // Build filter
    const filter: any = { isDeleted: false };
    if (role && role !== 'all') {
      filter.role = role;
    }

    // Get total count
    // @ts-ignore - Mongoose types can be complex
    const total = await User.countDocuments(filter);

    // Get users
    // @ts-ignore - Mongoose types can be complex
    const users = await User.find(filter)
      .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires -loginHistory')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()
      .exec();

    return NextResponse.json({
      success: true,
      data: {
        users,
        total,
        limit,
        skip,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
