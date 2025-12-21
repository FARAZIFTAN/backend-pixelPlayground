import { NextRequest, NextResponse } from 'next/server';
import UserSubmittedFrame from '@/models/UserSubmittedFrame';
import { verifyAuth } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * GET /api/user-submissions/frames/[id]
 * GET specific submission
 */
export async function GET(
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

    const submission = await (UserSubmittedFrame as any).findById(params.id).lean();

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (submission.userId.toString() !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: submission,
    });
  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch submission',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user-submissions/frames/[id]
 * Delete pending submission (only owner can delete pending submissions)
 */
export async function DELETE(
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

    const submission = await (UserSubmittedFrame as any).findById(params.id);

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (submission.userId.toString() !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Can only delete pending submissions
    if (submission.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete ${submission.status} submissions`,
        },
        { status: 400 }
      );
    }

    await (UserSubmittedFrame as any).deleteOne({ _id: params.id });

    console.log('✅ Frame submission deleted:', params.id);

    return NextResponse.json({
      success: true,
      message: 'Submission deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting submission:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete submission',
      },
      { status: 500 }
    );
  }
}
