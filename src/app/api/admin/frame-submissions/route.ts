import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import UserSubmittedFrame from '@/models/UserSubmittedFrame';
import Template from '@/models/Template';
import { verifyAuth } from '@/middleware/auth';

/**
 * GET /api/admin/frame-submissions
 * Get pending frame submissions (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin role
    const admin = await (User as any).findById(auth.userId);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending';

    const submissions = await (UserSubmittedFrame as any).find({ status })
      .populate('userId', 'name email isPremium')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: submissions,
      count: submissions.length,
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
