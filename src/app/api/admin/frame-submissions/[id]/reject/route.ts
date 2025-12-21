import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import UserSubmittedFrame from '@/models/UserSubmittedFrame';
import { verifyAuth } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';

/**
 * PATCH /api/admin/frame-submissions/[id]/reject
 * Admin rejects a submitted frame
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json();
    const { rejectionReason } = body;

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rejection reason is required',
        },
        { status: 400 }
      );
    }

    const submission = await (UserSubmittedFrame as any).findById(params.id);
    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      );
    }

    if (submission.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot reject ${submission.status} submissions`,
        },
        { status: 400 }
      );
    }

    // Update submission status
    submission.status = 'rejected';
    submission.rejectionReason = rejectionReason.trim();
    submission.approvedAt = new Date();
    submission.approvedBy = auth.userId;
    await submission.save();

    console.log(`❌ Frame rejected by admin ${auth.userId}:`, submission._id);

    return NextResponse.json({
      success: true,
      data: submission,
      message: 'Frame submission rejected',
    });
  } catch (error) {
    console.error('Error rejecting submission:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reject submission',
      },
      { status: 500 }
    );
  }
}
