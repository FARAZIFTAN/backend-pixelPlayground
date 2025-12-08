import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import PhotoSession from '@/models/PhotoSession';
import FinalComposite from '@/models/FinalComposite';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import { verifyAdmin } from '@/middleware/admin';

// GET /api/users/:id - Get user detail with statistics
export async function GET(
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

    // Get user
    // @ts-ignore
    const user = await User.findById(id)
      .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires')
      .lean()
      .exec();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get user statistics
    // @ts-ignore
    const totalSessions = await PhotoSession.countDocuments({ userId: id });
    // @ts-ignore
    const totalComposites = await FinalComposite.countDocuments({ userId: id });
    // @ts-ignore
    const totalEvents = await AnalyticsEvent.countDocuments({ userId: id });

    // Get recent sessions
    // @ts-ignore
    const recentSessions = await PhotoSession.find({ userId: id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('sessionName status startedAt completedAt')
      .lean()
      .exec();

    // Get recent composites
    // @ts-ignore
    const recentComposites = await FinalComposite.find({ userId: id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('templateId compositeUrl thumbnailUrl createdAt likes views')
      .lean()
      .exec();

    // Get total views and likes
    // @ts-ignore
    const compositeStats = await FinalComposite.aggregate([
      { $match: { userId: id } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: '$likes' },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        user,
        statistics: {
          totalSessions,
          totalComposites,
          totalEvents,
          totalViews: compositeStats[0]?.totalViews || 0,
          totalLikes: compositeStats[0]?.totalLikes || 0,
        },
        recentSessions,
        recentComposites,
      },
    });
  } catch (error) {
    console.error('Error fetching user detail:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user detail' },
      { status: 500 }
    );
  }
}

// PATCH /api/users/:id - Update user role
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
    const { role } = await request.json();

    // Validate role
    if (!['user', 'admin'].includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Invalid role' },
        { status: 400 }
      );
    }

    // Update user role
    // @ts-ignore - Mongoose types can be complex
    const user = await User.findByIdAndUpdate(
      id,
      { role },
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
      message: 'User role updated successfully',
      data: { user },
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update user role' },
      { status: 500 }
    );
  }
}
