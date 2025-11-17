import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Photo from '@/models/Photo';

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/photos/[id]/view - Increment photo views
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const photo = await (Photo as any).findByIdAndUpdate(
      params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!photo) {
      return NextResponse.json(
        {
          success: false,
          message: 'Photo not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'View count updated',
        data: {
          views: photo.views,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Increment view error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while updating view count',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
