import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserGeneratedFrame from '@/models/UserGeneratedFrame';
import User from '@/models/User';
import UsageLimit from '@/models/UsageLimit';
import { Types } from 'mongoose';
import { verifyAuth } from '@/middleware/auth';

interface FrameCreatePayload {
  name: string;
  description?: string;
  frameUrl: string;
  thumbnail: string;
  frameCount: number;
  layoutPositions: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    borderRadius?: number;
    rotation?: number;
  }>;
  frameSpec?: any;
}

// GET - Ambil semua frame milik user yang login
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const frames = await (UserGeneratedFrame as any).find({ userId: user.userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: frames,
    });
  } catch (error) {
    console.error('[GET /api/user-frames] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch frames' },
      { status: 500 }
    );
  }
}

// POST - Buat frame baru
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get user details to check premium status
    const userDoc = await User.findById(user.userId);
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Determine package type
    let packageType: 'free' | 'pro' = 'free';
    if (userDoc.isPremium && userDoc.premiumExpiresAt && userDoc.premiumExpiresAt > new Date()) {
      // User has active premium
      packageType = 'pro';
    }

    // Check usage limit
    try {
      const usageLimit = await UsageLimit.getOrCreateToday(user.userId, packageType);
      await usageLimit.incrementFrameUpload();
    } catch (error: any) {
      console.error('Usage limit exceeded:', error.message);
      return NextResponse.json(
        { 
          error: 'Daily frame upload limit reached',
          message: error.message,
          packageType,
          upgradeUrl: '/upgrade-pro'
        },
        { status: 429 } // Too Many Requests
      );
    }

    const body: FrameCreatePayload = await request.json();

    // Validasi required fields
    if (!body.name || !body.frameUrl || !body.thumbnail || !body.frameCount) {
      return NextResponse.json(
        { error: 'Missing required fields: name, frameUrl, thumbnail, frameCount' },
        { status: 400 }
      );
    }

    // Validasi frameCount
    if (body.frameCount < 2 || body.frameCount > 6) {
      return NextResponse.json(
        { error: 'Frame count must be between 2 and 6' },
        { status: 400 }
      );
    }

    // Validasi layoutPositions
    if (!body.layoutPositions || body.layoutPositions.length !== body.frameCount) {
      return NextResponse.json(
        { error: 'Layout positions count must match frame count' },
        { status: 400 }
      );
    }

    const newFrame = new UserGeneratedFrame({
      name: body.name,
      description: body.description,
      userId: user.userId,
      frameUrl: body.frameUrl,
      thumbnail: body.thumbnail,
      frameCount: body.frameCount,
      layoutPositions: body.layoutPositions,
      frameSpec: body.frameSpec,
      isActive: true,
      isFavorite: false,
      usageCount: 0,
    });

    await newFrame.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Frame created successfully',
        data: newFrame,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/user-frames] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create frame' },
      { status: 500 }
    );
  }
}
