import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AnalyticsEvent from '@/models/AnalyticsEvent';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      userId,
      sessionId,
      eventType,
      eventCategory,
      templateId,
      metadata,
    } = body;

    // Validation
    if (!eventType || !eventCategory) {
      return NextResponse.json(
        {
          success: false,
          message: 'Event type and category are required',
        },
        { status: 400 }
      );
    }

    // Get device info and IP
    const deviceInfo = request.headers.get('user-agent') || 'unknown';
    const ipAddress = 
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'unknown';
    const referrer = request.headers.get('referer') || '';

    // Create analytics event
    const eventDoc = new AnalyticsEvent({
      userId,
      sessionId,
      eventType,
      eventCategory,
      templateId,
      metadata,
      deviceInfo,
      ipAddress,
      referrer,
      timestamp: new Date(),
    });
    await eventDoc.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Event tracked successfully',
        data: {
          eventId: eventDoc._id,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Track event error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to track event',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
