import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { verifyAuth } from '@/middleware/auth';
import { Types } from 'mongoose';

export async function PATCH(request: NextRequest) {
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
    const body = await request.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all as read for this user
      // @ts-ignore - Mongoose types can be complex
      await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );

      return NextResponse.json(
        {
          success: true,
          message: 'All notifications marked as read',
        },
        { status: 200 }
      );
    }

    if (!notificationId) {
      return NextResponse.json(
        { success: false, message: 'notificationId is required' },
        { status: 400 }
      );
    }

    // Mark specific notification as read
    // @ts-ignore - Mongoose types can be complex
    const notification = await Notification.findOneAndUpdate(
      { _id: new Types.ObjectId(notificationId), userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json(
        { success: false, message: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: notification,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Mark notification as read error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to mark notification as read',
      },
      { status: 500 }
    );
  }
}
