import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Template from '@/models/Template';
import { verifyToken } from '@/lib/jwt';
import mongoose from 'mongoose';

// This route needs to read request headers (auth token) so force dynamic
export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/my-frames
 * Mengambil semua AI-generated frames milik user yang sedang login
 * 
 * Query Parameters:
 * - limit: number (default: 100) - Jumlah maksimal frames yang diambil
 * - sortBy: 'newest' | 'oldest' | 'name' (default: 'newest')
 * 
 * Response:
 * {
 *   success: true,
 *   frames: Template[],
 *   count: number
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to access your AI frames.' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || typeof decoded === 'string') {
      return NextResponse.json(
        { error: 'Invalid or expired token. Please login again.' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200); // Max 200
    const sortBy = searchParams.get('sortBy') || 'newest';

    // Connect to database
    await connectDB();

    // Build sort criteria
    let sortCriteria: any = { createdAt: -1 }; // Default: newest first
    if (sortBy === 'oldest') {
      sortCriteria = { createdAt: 1 };
    } else if (sortBy === 'name') {
      sortCriteria = { name: 1 };
    }

    // Fetch AI frames created by this user
    // Filter: isAIGenerated = true AND createdBy = userId
    // isActive defaults to true if field doesn't exist (for backward compatibility)
    const frames = await (Template as any)
      .find({
        createdBy: new mongoose.Types.ObjectId(userId),
        isAIGenerated: true,
        $or: [
          { isActive: true },
          { isActive: { $exists: false } }
        ]
      })
      .sort(sortCriteria)
      .limit(limit)
      .select(
        'name description thumbnail frameUrl frameCount category tags visibility isAIGenerated aiFrameSpec createdAt updatedAt'
      )
      .lean();

    // Log successful fetch for monitoring
    console.log(`✅ Fetched AI frames for user:`, {
      userId: userId,
      frameCount: frames.length,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        frames: frames,
        count: frames.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Error fetching AI frames:', error);

    // Handle specific errors
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return NextResponse.json(
        { error: 'Database error. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch AI frames',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
