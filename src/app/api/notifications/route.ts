import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { verifyAuth } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verify auth
    const authResult = await verifyAuth(request);
    if (!authResult || typeof authResult === 'string') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Build filter
    const filter: any = { userId };
    if (unreadOnly) {
      filter.isRead = false;
    }

    // Get notifications
    // @ts-ignore - Mongoose types can be complex
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()
      .exec();

    // Get unread count
    // @ts-ignore - Mongoose types can be complex
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    return NextResponse.json(
      {
        success: true,
        data: {
          notifications,
          unreadCount,
          limit,
          skip,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch notifications',
      },
      { status: 500 }
    );
  }
}
