import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Template from '@/models/Template';
import FinalComposite from '@/models/FinalComposite';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import { verifyAdmin } from '@/middleware/admin';

// GET /api/templates/:id/stats - Get template statistics
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

    // Get template
    // @ts-ignore
    const template = await Template.findById(id).lean().exec();

    if (!template) {
      return NextResponse.json(
        { success: false, message: 'Template not found' },
        { status: 404 }
      );
    }

    // Get usage statistics
    // @ts-ignore
    const totalUsage = await FinalComposite.countDocuments({ templateId: id });

    // Get total views and likes
    // @ts-ignore
    const compositeStats = await FinalComposite.aggregate([
      { $match: { templateId: id } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: '$likes' },
        },
      },
    ]);

    // Get usage over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // @ts-ignore
    const usageOverTime = await FinalComposite.aggregate([
      {
        $match: {
          templateId: id,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
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

    // Get recent composites using this template
    // @ts-ignore
    const recentComposites = await FinalComposite.find({ templateId: id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('userId compositeUrl thumbnailUrl createdAt views likes')
      .lean()
      .exec();

    // Get analytics events for this template
    // @ts-ignore
    const analyticsEvents = await AnalyticsEvent.countDocuments({
      templateId: id,
    });

    // Calculate average rating (if likes can be considered as rating)
    const avgLikes = compositeStats[0]?.totalLikes
      ? (compositeStats[0].totalLikes / totalUsage).toFixed(2)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        template: {
          id: template._id,
          name: template.name,
          category: template.category,
          thumbnail: template.thumbnail,
          isActive: template.isActive,
          isPremium: template.isPremium,
          createdAt: template.createdAt,
        },
        statistics: {
          totalUsage,
          totalViews: compositeStats[0]?.totalViews || 0,
          totalLikes: compositeStats[0]?.totalLikes || 0,
          averageLikes: avgLikes,
          analyticsEvents,
        },
        usageOverTime,
        recentComposites,
      },
    });
  } catch (error) {
    console.error('Error fetching template statistics:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch template statistics' },
      { status: 500 }
    );
  }
}
