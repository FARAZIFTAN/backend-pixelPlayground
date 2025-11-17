import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Photo from '@/models/Photo';
import { verifyAuth, unauthorizedResponse } from '@/middleware/auth';
import { unlink } from 'fs/promises';
import path from 'path';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/photos/[id] - Get single photo
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify JWT token
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return unauthorizedResponse('Invalid or expired token');
    }

    await connectDB();

    const photo = await (Photo as any).findOne({
      _id: params.id,
      userId: authUser.userId, // Ensure user can only access their own photos
    });

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
        message: 'Photo retrieved successfully',
        data: {
          photo,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get photo error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while retrieving the photo',
      },
      { status: 500 }
    );
  }
}

// PUT /api/photos/[id] - Update photo metadata
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify JWT token
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return unauthorizedResponse('Invalid or expired token');
    }

    await connectDB();

    const body = await request.json();
    const { title, description } = body;

    // Validation
    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide a title',
        },
        { status: 400 }
      );
    }

    const photo = await (Photo as any).findOneAndUpdate(
      {
        _id: params.id,
        userId: authUser.userId, // Ensure user can only update their own photos
      },
      {
        title: title.trim(),
        description: description ? description.trim() : undefined,
        updatedAt: new Date(),
      },
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
        message: 'Photo updated successfully',
        data: {
          photo,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update photo error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while updating the photo',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/photos/[id] - Delete photo
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify JWT token
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return unauthorizedResponse('Invalid or expired token');
    }

    await connectDB();

    // Find photo first to get file path
    const photo = await (Photo as any).findOne({
      _id: params.id,
      userId: authUser.userId, // Ensure user can only delete their own photos
    });

    if (!photo) {
      return NextResponse.json(
        {
          success: false,
          message: 'Photo not found',
        },
        { status: 404 }
      );
    }

    // Delete file from filesystem
    try {
      const imagePath = path.join(process.cwd(), 'public', photo.imageUrl);
      await unlink(imagePath);

      // Also try to delete thumbnail if it exists and is different
      if (photo.thumbnailUrl && photo.thumbnailUrl !== photo.imageUrl) {
        const thumbnailPath = path.join(process.cwd(), 'public', photo.thumbnailUrl);
        await unlink(thumbnailPath).catch(() => {}); // Ignore if thumbnail doesn't exist
      }
    } catch (fileError) {
      console.warn('Failed to delete photo file:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await (Photo as any).findByIdAndDelete(params.id);

    return NextResponse.json(
      {
        success: true,
        message: 'Photo deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete photo error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while deleting the photo',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}