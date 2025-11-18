import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PhotoSession from '@/models/PhotoSession';
import CapturedPhoto from '@/models/CapturedPhoto';
import { verifyToken } from '@/lib/jwt';

// GET /api/sessions - List all sessions for authenticated user
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
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build query
    const query: Record<string, unknown> = { userId: decoded.userId };
    if (status) query.status = status;

    // Get sessions
    const sessions = await PhotoSession.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('-__v')
      .lean();

    // Get total count
    const total = await PhotoSession.countDocuments(query);

    return NextResponse.json(
      {
        success: true,
        data: {
          sessions,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while fetching sessions',
      },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Create new photo session
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
    const { sessionName, templateId, metadata } = body;

    // Validation
    if (!sessionName) {
      return NextResponse.json(
        { success: false, message: 'Session name is required' },
        { status: 400 }
      );
    }

    // Create session
    const session = await PhotoSession.create({
      userId: decoded.userId,
      sessionName,
      templateId: templateId || undefined,
      status: 'active',
      metadata: {
        deviceInfo: metadata?.deviceInfo,
        location: metadata?.location,
        totalPhotos: 0,
        duration: 0,
      },
      startedAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Session created successfully',
        data: session,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Create session error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while creating session',
      },
      { status: 500 }
    );
  }
}
