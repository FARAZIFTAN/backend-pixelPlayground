import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import PhotoSession from '@/models/PhotoSession';
import FinalComposite from '@/models/FinalComposite';
import User from '@/models/User';
import { verifyAdmin } from '@/middleware/admin';

// GET /api/users/:id/activities - Get user activities
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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Check if user exists
    // @ts-ignore
    const user = await User.findById(id).select('name email').lean().exec();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Combine activities from multiple sources
    const activities = [];

    // Get analytics events
    // @ts-ignore
    const events = await AnalyticsEvent.find({ userId: id })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean()
      .exec();

    events.forEach((event: any) => {
      activities.push({
        type: 'event',
        action: event.eventType,
        category: event.eventCategory,
        description: `${event.eventCategory}: ${event.eventType}`,
        timestamp: event.timestamp,
        metadata: event.metadata,
      });
    });

    // Get photo sessions
    // @ts-ignore
    const sessions = await PhotoSession.find({ userId: id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      .exec();

    sessions.forEach((session: any) => {
      activities.push({
        type: 'session',
        action: session.status === 'completed' ? 'completed_session' : 'created_session',
        description: `${session.status === 'completed' ? 'Completed' : 'Created'} photo session: ${session.sessionName}`,
        timestamp: session.status === 'completed' && session.completedAt ? session.completedAt : session.createdAt,
        metadata: {
          sessionId: session._id,
          sessionName: session.sessionName,
          status: session.status,
        },
      });
    });

    // Get composites
    // @ts-ignore
    const composites = await FinalComposite.find({ userId: id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      .exec();

    composites.forEach((composite: any) => {
      activities.push({
        type: 'composite',
        action: 'created_composite',
        description: `Created composite with ${composite.templateId || 'custom'} template`,
        timestamp: composite.createdAt,
        metadata: {
          compositeId: composite._id,
          templateId: composite.templateId,
          views: composite.views,
          likes: composite.likes,
        },
      });
    });

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Paginate
    const paginatedActivities = activities.slice(skip, skip + limit);
    const total = activities.length;

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        activities: paginatedActivities,
        pagination: {
          total,
          limit,
          skip,
          hasMore: skip + limit < total,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user activities' },
      { status: 500 }
    );
  }
}
