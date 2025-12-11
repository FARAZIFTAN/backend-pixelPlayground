import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import dbConnect from '@/lib/mongodb';
import Photo from '@/models/Photo';

/**
 * POST /api/gallery/[id]/like
 * Like a photo (increment likes counter)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Optional: verify token if you want to track who liked
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    let userId: string | null = null;
    
    if (token) {
      try {
        const decoded = verifyToken(token);
        userId = decoded.userId;
      } catch {
        // Continue without userId if token invalid
      }
    }

    // Find photo (must be public to be liked)
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

    // Increment likes
    photo.likes += 1;
    await photo.save();

    return NextResponse.json({
      success: true,
      message: 'Photo liked',
      data: {
        photoId: photo._id,
        likes: photo.likes,
      },
    });
  } catch (error) {
    console.error('Like photo error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to like photo',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/gallery/[id]/like
 * Unlike a photo (decrement likes counter)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Find photo
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

    // Decrement likes (don't go below 0)
    if (photo.likes > 0) {
      photo.likes -= 1;
      await photo.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Photo unliked',
      data: {
        photoId: photo._id,
        likes: photo.likes,
      },
    });
  } catch (error) {
    console.error('Unlike photo error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to unlike photo',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
