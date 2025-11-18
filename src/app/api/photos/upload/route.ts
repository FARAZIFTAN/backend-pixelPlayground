import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CapturedPhoto from '@/models/CapturedPhoto';
import PhotoSession from '@/models/PhotoSession';
import { verifyToken } from '@/lib/jwt';

// POST /api/photos/upload - Upload captured photo
export async function POST(request: NextRequest) {
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
    const { sessionId, photoUrl, thumbnailUrl, order, metadata } = body;

    // Validation
    if (!sessionId || !photoUrl) {
      return NextResponse.json(
        { success: false, message: 'Session ID and photo URL are required' },
        { status: 400 }
      );
    }

    // Verify session belongs to user
    const session = await PhotoSession.findOne({
      _id: sessionId,
      userId: decoded.userId,
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    // Create captured photo
    const photo = await CapturedPhoto.create({
      sessionId,
      userId: decoded.userId,
      photoUrl,
      thumbnailUrl: thumbnailUrl || undefined,
      order: order || 0,
      metadata: {
        width: metadata?.width,
        height: metadata?.height,
        fileSize: metadata?.fileSize,
        format: metadata?.format,
        capturedAt: new Date(),
      },
    });

    // Update session
    session.capturedPhotos.push(photo._id.toString());
    if (session.metadata) {
      session.metadata.totalPhotos = session.capturedPhotos.length;
    }
    await session.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Photo uploaded successfully',
        data: photo,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Upload photo error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while uploading photo',
      },
      { status: 500 }
    );
  }
}

// GET /api/photos/upload?sessionId=xxx - Get photos for session
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Verify session belongs to user
    const session = await PhotoSession.findOne({
      _id: sessionId,
      userId: decoded.userId,
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    // Get photos
    const photos = await CapturedPhoto.find({
      sessionId,
      userId: decoded.userId,
    })
      .sort({ order: 1 })
      .select('-__v')
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: photos,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Get photos error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while fetching photos',
      },
      { status: 500 }
    );
  }
}
