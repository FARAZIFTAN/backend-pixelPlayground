import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import FinalComposite from '@/models/FinalComposite';
import { verifyAdmin } from '@/middleware/admin';

// Force dynamic rendering because we rely on request headers for auth
export const dynamic = 'force-dynamic';

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

    // Get total composites (final images created)
    // @ts-ignore - Mongoose types can be complex
    const totalComposites = await FinalComposite.countDocuments({});

    // Get total users
    // @ts-ignore - Mongoose types can be complex
    const totalUsers = await User.countDocuments({
      isDeleted: false,
    });

    // Get active users (users who logged in in the last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // @ts-ignore - Mongoose types can be complex
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: oneDayAgo },
      isDeleted: false,
    });

    // Get total views (sum of views from all composites)
    // @ts-ignore - Mongoose types can be complex
    const totalViews = await FinalComposite.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
        },
      },
    ]);

    // Get today's composites count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // @ts-ignore - Mongoose types can be complex
    const todayComposites = await FinalComposite.countDocuments({
      createdAt: { $gte: today },
    });

    // Get this week's new composites
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    // @ts-ignore - Mongoose types can be complex
    const weekComposites = await FinalComposite.countDocuments({
      createdAt: { $gte: weekAgo },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalTemplates: totalComposites,
        totalPhotos: totalUsers,
        activeUsers,
        totalDownloads: totalViews[0]?.totalViews || 0,
        todayPhotos: todayComposites,
        weekTemplates: weekComposites,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
