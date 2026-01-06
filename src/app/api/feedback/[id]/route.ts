import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Feedback from '@/models/Feedback';
import User from '@/models/User';
import { verifyAuth } from '@/middleware/auth';
import { Types } from 'mongoose';

// Helper to verify admin
async function verifyAdmin(req: NextRequest) {
  const authUser = await verifyAuth(req);
  if (!authUser) return null;
  
  const user = await (User as any).findById(authUser.userId);
  if (!user || user.role !== 'admin') return null;
  
  return authUser;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Verify admin access
    const authUser = await verifyAdmin(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { status } = await req.json();
    const { id: feedbackId } = await params;

    if (!Types.ObjectId.isValid(feedbackId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid feedback ID' },
        { status: 400 }
      );
    }

    const feedback = await (Feedback as any).findByIdAndUpdate(
      feedbackId,
      {
        status,
        updatedAt: new Date(),
      },
      { new: true }
    ).lean();

    if (!feedback) {
      return NextResponse.json(
        { success: false, message: 'Feedback not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Feedback updated successfully',
        data: { feedback },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update feedback error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update feedback' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Verify admin access
    const authUser = await verifyAdmin(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id: feedbackId } = await params;

    if (!Types.ObjectId.isValid(feedbackId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid feedback ID' },
        { status: 400 }
      );
    }

    const feedback = await (Feedback as any).findByIdAndDelete(feedbackId).lean();

    if (!feedback) {
      return NextResponse.json(
        { success: false, message: 'Feedback not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Feedback deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete feedback error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete feedback' },
      { status: 500 }
    );
  }
}
