import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CapturedPhoto from '@/models/CapturedPhoto';
import PhotoSession from '@/models/PhotoSession';
import { verifyToken } from '@/lib/jwt';
import fs from 'fs/promises';
import path from 'path';

// POST /api/photos/upload - Upload captured photo
export async function POST(request: NextRequest) {
  try {
    // Get token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { sessionId, photoUrl, thumbnailUrl, order, metadata } = body;

    // Validation
    if (!sessionId || !photoUrl) {
      return NextResponse.json(
        { success: false, message: 'Session ID and photo URL are required' },
        { status: 400 }
      );
    }

    // Verify session belongs to user
    const session = await PhotoSession.findOne({
      _id: sessionId,
      userId: decoded.userId,
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    // Process photoUrl - if it's base64, save to filesystem
    let finalPhotoUrl = photoUrl;
    let finalThumbnailUrl = thumbnailUrl;

    if (photoUrl.startsWith('data:image/')) {
      try {
        // Extract base64 data
        const matches = photoUrl.match(/^data:image\/(\w+);base64,(.+)$/);
        if (matches) {
          const imageType = matches[1];
          const base64Data = matches[2];
          
          // Create uploads directory if it doesn't exist
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'photos');
          try {
            await fs.access(uploadsDir);
          } catch {
            await fs.mkdir(uploadsDir, { recursive: true });
          }

          // Generate unique filename
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(7);
          const filename = `photo-${decoded.userId}-${timestamp}-${randomStr}.${imageType}`;
          const filepath = path.join(uploadsDir, filename);

          // Save file
          const buffer = Buffer.from(base64Data, 'base64');
          await fs.writeFile(filepath, buffer);

          // Update URL to filesystem path
          finalPhotoUrl = `/uploads/photos/${filename}`;
        }
      } catch (error) {
        console.error('Error saving base64 image:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to save image' },
          { status: 500 }
        );
      }
    }

    // Process thumbnailUrl if it's base64
    if (thumbnailUrl && thumbnailUrl.startsWith('data:image/')) {
      try {
        const matches = thumbnailUrl.match(/^data:image\/(\w+);base64,(.+)$/);
        if (matches) {
          const imageType = matches[1];
          const base64Data = matches[2];
          
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'photos');
          try {
            await fs.access(uploadsDir);
          } catch {
            await fs.mkdir(uploadsDir, { recursive: true });
          }

          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(7);
          const filename = `thumb-${decoded.userId}-${timestamp}-${randomStr}.${imageType}`;
          const filepath = path.join(uploadsDir, filename);

          const buffer = Buffer.from(base64Data, 'base64');
          await fs.writeFile(filepath, buffer);

          finalThumbnailUrl = `/uploads/photos/${filename}`;
        }
      } catch (error) {
        console.error('Error saving thumbnail:', error);
        // Continue without thumbnail
      }
    }

    // Create captured photo
    const photo = await CapturedPhoto.create({
      sessionId,
      userId: decoded.userId,
      photoUrl: finalPhotoUrl,
      thumbnailUrl: finalThumbnailUrl || undefined,
      order: order || 0,
      metadata: {
        width: metadata?.width,
        height: metadata?.height,
        fileSize: metadata?.fileSize,
        format: metadata?.format,
        capturedAt: new Date(),
      },
    });

    // Update session
    session.capturedPhotos.push(photo._id.toString());
    if (session.metadata) {
      session.metadata.totalPhotos = session.capturedPhotos.length;
    }
    await session.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Photo uploaded successfully',
        data: photo,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Upload photo error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while uploading photo',
      },
      { status: 500 }
    );
  }
}

// GET /api/photos/upload?sessionId=xxx - Get photos for session
export async function GET(request: NextRequest) {
  try {
    // Get token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Verify session belongs to user
    const session = await PhotoSession.findOne({
      _id: sessionId,
      userId: decoded.userId,
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    // Get photos
    const photos = await CapturedPhoto.find({
      sessionId,
      userId: decoded.userId,
    })
      .sort({ order: 1 })
      .select('-__v')
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: photos,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Get photos error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while fetching photos',
      },
      { status: 500 }
    );
  }
}
