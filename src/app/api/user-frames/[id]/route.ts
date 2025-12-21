import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserGeneratedFrame from '@/models/UserGeneratedFrame';
import { Types } from 'mongoose';
import { verifyAuth } from '@/middleware/auth';

// GET - Ambil frame by ID (hanya bisa diakses oleh pemiliknya)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid frame ID' },
        { status: 400 }
      );
    }

    const frame = await (UserGeneratedFrame as any).findById(id).lean();
    
    if (!frame) {
      return NextResponse.json(
        { error: 'Frame not found' },
        { status: 404 }
      );
    }

    // Cek ownership - hanya pemilik yang bisa akses
    if (frame.userId !== user.userId) {
      return NextResponse.json(
        { error: 'You can only access your own frames' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: frame,
    });
  } catch (error) {
    console.error('[GET /api/user-frames/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch frame' },
      { status: 500 }
    );
  }
}

// PATCH - Update frame (hanya bisa diupdate oleh pemiliknya)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid frame ID' },
        { status: 400 }
      );
    }

    const frame = await (UserGeneratedFrame as any).findById(id).lean();
    
    if (!frame) {
      return NextResponse.json(
        { error: 'Frame not found' },
        { status: 404 }
      );
    }

    // Cek ownership
    if (frame.userId !== user.userId) {
      return NextResponse.json(
        { error: 'You can only update your own frames' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateData: any = {};

    // Hanya field tertentu yang bisa diupdate
    if (body.name !== undefined) {
      updateData.name = body.name;
    }
    if (body.description !== undefined) {
      updateData.description = body.description;
    }
    if (body.isFavorite !== undefined) {
      updateData.isFavorite = body.isFavorite;
    }
    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive;
    }

    const updatedFrame = await (UserGeneratedFrame as any).findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).lean();

    return NextResponse.json({
      success: true,
      message: 'Frame updated successfully',
      data: updatedFrame,
    });
  } catch (error) {
    console.error('[PATCH /api/user-frames/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update frame' },
      { status: 500 }
    );
  }
}

// DELETE - Hapus frame (hanya bisa dihapus oleh pemiliknya)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid frame ID' },
        { status: 400 }
      );
    }

    const frame = await (UserGeneratedFrame as any).findById(id).lean();
    
    if (!frame) {
      return NextResponse.json(
        { error: 'Frame not found' },
        { status: 404 }
      );
    }

    // Cek ownership
    if (frame.userId !== user.userId) {
      return NextResponse.json(
        { error: 'You can only delete your own frames' },
        { status: 403 }
      );
    }

    await (UserGeneratedFrame as any).findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Frame deleted successfully',
    });
  } catch (error) {
    console.error('[DELETE /api/user-frames/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete frame' },
      { status: 500 }
    );
  }
}
