import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import dbConnect from '@/lib/mongodb';
import Photo from '@/models/Photo';

/**
 * PATCH /api/gallery/[id]/toggle-visibility
 * Toggle photo between public and private
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }
    const userId = decoded.userId;

    // Find photo and verify ownership
    const photo = await Photo.findOne({
      _id: params.id,
      userId,
    });

    if (!photo) {
      return NextResponse.json(
        { success: false, message: 'Photo not found or unauthorized' },
        { status: 404 }
      );
    }

    // Toggle visibility
    photo.isPublic = !photo.isPublic;
    await photo.save();

    return NextResponse.json({
      success: true,
      message: `Photo is now ${photo.isPublic ? 'public' : 'private'}`,
      data: {
        photoId: photo._id,
        isPublic: photo.isPublic,
      },
    });
  } catch (error) {
    console.error('Toggle photo visibility error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update photo visibility',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/gallery/[id]/toggle-visibility
 * Set specific visibility (public/private)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // 1. Cek jika decoded kosong (token palsu/expired)
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // 2. Jika lolos, baru aman ambil userId
    const userId = decoded.userId;

    const body = await req.json();
    const { isPublic } = body;

    if (typeof isPublic !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'isPublic must be a boolean' },
        { status: 400 }
      );
    }

    // Find photo and verify ownership
    const photo = await Photo.findOne({
      _id: params.id,
      userId,
    });

    if (!photo) {
      return NextResponse.json(
        { success: false, message: 'Photo not found or unauthorized' },
        { status: 404 }
      );
    }

    // Set visibility
    photo.isPublic = isPublic;
    await photo.save();

    return NextResponse.json({
      success: true,
      message: `Photo is now ${photo.isPublic ? 'public' : 'private'}`,
      data: {
        photoId: photo._id,
        isPublic: photo.isPublic,
      },
    });
  } catch (error) {
    console.error('Set photo visibility error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update photo visibility',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
