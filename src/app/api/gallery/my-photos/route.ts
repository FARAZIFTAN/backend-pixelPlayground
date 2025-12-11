import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import dbConnect from '@/lib/mongodb';
import Photo from '@/models/Photo';

/**
 * GET /api/gallery/my-photos
 * Get user's own photos (private gallery)
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    const userId = decoded.userId;

    // Query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // createdAt, views, likes
    const order = searchParams.get('order') === 'asc' ? 1 : -1;
    const visibility = searchParams.get('visibility'); // 'public', 'private', or all

    const skip = (page - 1) * limit;

    // Build query
    const query: any = { userId };
    
    if (visibility === 'public') {
      query.isPublic = true;
    } else if (visibility === 'private') {
      query.isPublic = false;
    }

    // Get photos
    const photos = await Photo.find(query)
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Photo.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        photos,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get my photos error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch photos',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
