import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Photo from '@/models/Photo';

/**
 * POST /api/gallery/[id]/view
 * Increment view counter for a photo
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Find photo (must be public to be viewed)
    const photo = await Photo.findOne({
      _id: params.id,
      isPublic: true,
    });

    if (!photo) {
      return NextResponse.json(
        { success: false, message: 'Photo not found or not public' },
        { status: 404 }
      );
    }

    // Increment views
    photo.views += 1;
    await photo.save();

    return NextResponse.json({
      success: true,
      data: {
        photoId: photo._id,
        views: photo.views,
      },
    });
  } catch (error) {
    console.error('Increment view error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to increment view',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
