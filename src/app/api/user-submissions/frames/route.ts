import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import UserSubmittedFrame from '@/models/UserSubmittedFrame';
import { verifyAuth } from '@/middleware/auth';

/**
 * POST /api/user-submissions/frames
 * User PRO submits a frame for admin approval
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is premium
    const user = await (User as any).findById(auth.userId);
    if (!user || !user.isPremium) {
      return NextResponse.json(
        { success: false, error: 'Only premium users can submit frames' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      frameUrl,
      thumbnail,
      frameCount,
      layout,
      frameSpec,
      layoutPositions,
    } = body;

    // Validation
    if (!name || !frameUrl || !thumbnail || !frameCount || !layout || !layoutPositions) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create submitted frame
    const submittedFrame = await (UserSubmittedFrame as any).create({
      userId: auth.userId,
      name: name.trim(),
      description: description?.trim() || '',
      frameUrl,
      thumbnail,
      frameCount,
      layout,
      frameSpec,
      layoutPositions,
      status: 'pending',
    });

    console.log('✅ Frame submitted for approval:', submittedFrame._id);

    return NextResponse.json({
      success: true,
      data: submittedFrame,
      message: 'Frame submitted successfully! Awaiting admin approval.',
    });
  } catch (error) {
    console.error('Frame submission error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit frame',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user-submissions/frames
 * Get user's submitted frames
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

    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    const query: any = { userId: auth.userId };
    if (status) {
      query.status = status;
    }

    const submissions = await (UserSubmittedFrame as any).find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: submissions,
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
