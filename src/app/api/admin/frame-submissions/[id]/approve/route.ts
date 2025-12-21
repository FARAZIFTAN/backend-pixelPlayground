import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import UserSubmittedFrame from '@/models/UserSubmittedFrame';
import Template from '@/models/Template';
import { verifyAuth } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';

/**
 * PATCH /api/admin/frame-submissions/[id]/approve
 * Admin approves a submitted frame
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
    const { isPremium } = body;

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
          error: `Cannot approve ${submission.status} submissions`,
        },
        { status: 400 }
      );
    }

    // Update submission status
    submission.status = 'approved';
    submission.isPremium = isPremium === true;
    submission.approvedAt = new Date();
    submission.approvedBy = auth.userId;
    await submission.save();

    // Create public template from approved submission
    const newTemplate = await (Template as any).create({
      name: submission.name,
      description: submission.description || '',
      frameUrl: submission.frameUrl,
      thumbnail: submission.thumbnail,
      frameCount: submission.frameCount,
      layoutPositions: submission.layoutPositions,
      isPremium: submission.isPremium,
      category: 'General',
      createdBy: submission.userId.toString(),
      visibility: 'public',
      isActive: true,
      isAIGenerated: false,
    });

    console.log(
      `✅ Frame approved by admin ${auth.userId}:`,
      submission._id
    );
    console.log(`✨ Created public template:`, newTemplate._id);

    return NextResponse.json({
      success: true,
      data: {
        submission,
        template: newTemplate,
      },
      message: `Frame approved as ${isPremium ? 'PREMIUM' : 'FREE'} template`,
    });
  } catch (error) {
    console.error('Error approving submission:', error);
    console.error('Error details:', error instanceof Error ? error.message : error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to approve submission',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
