import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Feedback from '@/models/Feedback';
import { Types } from 'mongoose';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { status } = await req.json();
    const feedbackId = params.id;

    if (!Types.ObjectId.isValid(feedbackId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid feedback ID' },
        { status: 400 }
      );
    }

    const feedback = await Feedback.findByIdAndUpdate(
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
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const feedbackId = params.id;

    if (!Types.ObjectId.isValid(feedbackId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid feedback ID' },
        { status: 400 }
      );
    }

    const feedback = await Feedback.findByIdAndDelete(feedbackId).lean();

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
