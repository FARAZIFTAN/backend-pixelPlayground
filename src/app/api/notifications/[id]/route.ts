import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { verifyAuth } from '@/middleware/auth';
import { Types } from 'mongoose';

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id: notificationId } = await params;

    if (!notificationId || !Types.ObjectId.isValid(notificationId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid notification ID' },
        { status: 400 }
      );
    }

    // Delete notification (only if it belongs to the user)
    // @ts-ignore - Mongoose types
    const notification = await Notification.findOneAndDelete({
      _id: new Types.ObjectId(notificationId),
      userId: userId,
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, message: 'Notification not found or already deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Notification deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete notification error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete notification',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/:id
 * Get a single notification
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id: notificationId } = await params;

    if (!notificationId || !Types.ObjectId.isValid(notificationId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid notification ID' },
        { status: 400 }
      );
    }

    // @ts-ignore - Mongoose types
    const notification = await Notification.findOne({
      _id: new Types.ObjectId(notificationId),
      userId: userId,
    }).lean();

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
    console.error('Get notification error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch notification',
      },
      { status: 500 }
    );
  }
}
