import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Photo from '@/models/Photo';
import { verifyAuth, unauthorizedResponse } from '@/middleware/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/photos/[id]/like - Toggle like on photo
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return unauthorizedResponse('Invalid or expired token');
    }

    await connectDB();

    // For now, just increment likes
    // In future, you could track which users liked which photos
    const photo = await (Photo as any).findByIdAndUpdate(
      params.id,
      { $inc: { likes: 1 } },
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
        message: 'Photo liked',
        data: {
          likes: photo.likes,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Like photo error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while liking the photo',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/photos/[id]/like - Unlike photo
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return unauthorizedResponse('Invalid or expired token');
    }

    await connectDB();

    const photo = await (Photo as any).findByIdAndUpdate(
      params.id,
      { $inc: { likes: -1 } },
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

    // Ensure likes don't go below 0
    if (photo.likes < 0) {
      photo.likes = 0;
      await photo.save();
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Photo unliked',
        data: {
          likes: photo.likes,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Unlike photo error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while unliking the photo',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
