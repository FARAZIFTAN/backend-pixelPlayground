import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PhotoSession from '@/models/PhotoSession';
import CapturedPhoto from '@/models/CapturedPhoto';
import { verifyToken } from '@/lib/jwt';

// GET /api/sessions/[id] - Get session details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get session
    const session = await PhotoSession.findOne({
      _id: params.id,
      userId: decoded.userId,
    })
      .select('-__v')
      .lean();

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    // Get captured photos
    const photos = await CapturedPhoto.find({
      sessionId: params.id,
    })
      .sort({ order: 1 })
      .select('-__v')
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: {
          session,
          photos,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Get session error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while fetching session',
      },
      { status: 500 }
    );
  }
}

// PATCH /api/sessions/[id] - Update session
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { status, sessionName, metadata } = body;

    // Find session
    const session = await PhotoSession.findOne({
      _id: params.id,
      userId: decoded.userId,
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    // Update fields
    if (sessionName) session.sessionName = sessionName;
    if (status) {
      session.status = status;
      if (status === 'completed') {
        session.completedAt = new Date();
      }
    }
    if (metadata) {
      session.metadata = { ...session.metadata, ...metadata };
    }

    await session.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Session updated successfully',
        data: session,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Update session error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while updating session',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[id] - Delete session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    await connectDB();

    // Delete session
    const session = await PhotoSession.findOneAndDelete({
      _id: params.id,
      userId: decoded.userId,
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    // Delete associated photos
    await CapturedPhoto.deleteMany({ sessionId: params.id });

    return NextResponse.json(
      {
        success: true,
        message: 'Session deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Delete session error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while deleting session',
      },
      { status: 500 }
    );
  }
}
