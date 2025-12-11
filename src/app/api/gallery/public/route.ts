import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Photo from '@/models/Photo';
import { verifyToken } from '@/lib/jwt';

/**
 * GET /api/gallery/public
 * Browse all public photos (Explore/Discovery page)
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // createdAt, views, likes
    const order = searchParams.get('order') === 'asc' ? 1 : -1;
    const templateId = searchParams.get('templateId'); // Filter by template

    const skip = (page - 1) * limit;

    // Build query - only public photos
    const query: any = { isPublic: true };
    
    if (templateId) {
      query.templateId = templateId;
    }

    // Get photos
    const photos = await Photo.find(query)
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit)
      .select('-userId') // Don't expose userId in public gallery
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
    console.error('Get public gallery error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch public gallery',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
