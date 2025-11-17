import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Photo from '@/models/Photo';

// GET /api/photos/public - Get public photos for Explore page
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const templateId = searchParams.get('templateId');
    const sortBy = searchParams.get('sortBy') || 'recent'; // recent, popular, views
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { isPublic: true };
    
    if (templateId) {
      query.templateId = templateId;
    }

    // Build sort
    let sort: any = {};
    switch (sortBy) {
      case 'popular':
        sort = { likes: -1, views: -1, createdAt: -1 };
        break;
      case 'views':
        sort = { views: -1, createdAt: -1 };
        break;
      case 'recent':
      default:
        sort = { createdAt: -1 };
        break;
    }

    // Fetch public photos with user info
    const photos = await (Photo as any)
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name')
      .lean();

    // Get total count for pagination
    const total = await (Photo as any).countDocuments(query);

    return NextResponse.json(
      {
        success: true,
        message: 'Public photos retrieved successfully',
        data: {
          photos,
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
  } catch (error: any) {
    console.error('Get public photos error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while retrieving public photos',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
