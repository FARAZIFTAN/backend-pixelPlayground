import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Feedback from '@/models/Feedback';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { name, email, message } = await req.json();

    // Validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create feedback
    const feedback = new Feedback({
      name,
      email,
      message,
      status: 'unread',
    });

    await feedback.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Feedback submitted successfully',
        data: { feedback },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get all feedback
    const feedbacks = await (Feedback as any).find().sort({ createdAt: -1 }).lean();

    return NextResponse.json(
      {
        success: true,
        data: { feedbacks },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch feedback error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}
