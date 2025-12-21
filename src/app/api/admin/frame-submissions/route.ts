import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import UserSubmittedFrame from '@/models/UserSubmittedFrame';
import Template from '@/models/Template';
import { verifyAuth } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';

/**
 * GET /api/admin/frame-submissions
 * Get pending frame submissions (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin role
    if (auth.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const skip = parseInt(url.searchParams.get('skip') || '0');

    // Optimized query with limit and minimal population
    const submissions = await (UserSubmittedFrame as any)
      .find({ status })
      .select('name description thumbnail frameUrl layoutPositions frameCount status createdAt userId isPremium')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()
      .exec();

    const total = await (UserSubmittedFrame as any).countDocuments({ status });

    return NextResponse.json({
      success: true,
      data: submissions,
      count: submissions.length,
      total,
      hasMore: total > skip + submissions.length,
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch submissions',
      },
      { status: 500 }
    );
  }
}
