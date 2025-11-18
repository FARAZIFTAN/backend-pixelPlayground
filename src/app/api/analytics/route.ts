import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import { verifyAdmin, forbiddenResponse } from '@/middleware/admin';
import type { FilterQuery } from 'mongoose';
import type { IAnalyticsEvent } from '@/models/AnalyticsEvent';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const admin = await verifyAdmin(request);
    
    if (!admin) {
      return forbiddenResponse('Admin access only');
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const eventCategory = searchParams.get('eventCategory');
    const eventType = searchParams.get('eventType');

    // Build query
    const query: FilterQuery<IAnalyticsEvent> = {};
    
    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.timestamp = { $gte: thirtyDaysAgo };
    }

    if (eventCategory) query.eventCategory = eventCategory;
    if (eventType) query.eventType = eventType;

    // Get overview statistics
    const totalEvents = await AnalyticsEvent.countDocuments(query);
    
    // Unique users count
    const uniqueUsers = await AnalyticsEvent.distinct('userId', query);
    
    // Unique sessions count
    const uniqueSessions = await AnalyticsEvent.distinct('sessionId', query);

    // Events by category
    const eventsByCategory = await AnalyticsEvent.aggregate([
      { $match: query },
      { 
        $group: { 
          _id: '$eventCategory', 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } },
    ]);

    // Events by type
    const eventsByType = await AnalyticsEvent.aggregate([
      { $match: query },
      { 
        $group: { 
          _id: '$eventType', 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } },
    ]);

    // Events over time (daily)
    const eventsOverTime = await AnalyticsEvent.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day',
            },
          },
          count: 1,
          _id: 0,
        },
      },
      { $sort: { date: 1 } },
    ]);

    // Top templates
    const topTemplates = await AnalyticsEvent.aggregate([
      { 
        $match: { 
          ...query, 
          templateId: { $exists: true, $ne: null } 
        } 
      },
      { 
        $group: { 
          _id: '$templateId', 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Device breakdown
    const deviceBreakdown = await AnalyticsEvent.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $cond: [
              { $regexMatch: { input: '$deviceInfo', regex: /mobile/i } },
              'Mobile',
              'Desktop',
            ],
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Recent events
    const recentEvents = await AnalyticsEvent.find(query)
      .sort({ timestamp: -1 })
      .limit(50)
      .select('-__v')
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: {
          overview: {
            totalEvents,
            uniqueUsers: uniqueUsers.length,
            uniqueSessions: uniqueSessions.length,
          },
          eventsByCategory,
          eventsByType,
          eventsOverTime,
          topTemplates,
          deviceBreakdown,
          recentEvents,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get analytics error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch analytics data',
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
