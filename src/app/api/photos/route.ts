import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Photo from '@/models/Photo';
import { verifyAuth, unauthorizedResponse } from '@/middleware/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// GET /api/photos - Get user's photos
export async function GET(request: NextRequest) {
  try {
    // Verify JWT token
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return unauthorizedResponse('Invalid or expired token');
    }

    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Fetch user's photos
    const photos = await (Photo as any).find({ userId: authUser.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await (Photo as any).countDocuments({ userId: authUser.userId });

    return NextResponse.json(
      {
        success: true,
        message: 'Photos retrieved successfully',
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
    console.error('Get photos error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while retrieving photos',
      },
      { status: 500 }
    );
  }
}

// POST /api/photos - Upload new photo
export async function POST(request: NextRequest) {
  try {
    // Verify JWT token
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return unauthorizedResponse('Invalid or expired token');
    }

    await connectDB();

    const formData = await request.formData();
    const file = formData.get('photo') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const isPublic = formData.get('isPublic') === 'true';
    const templateId = formData.get('templateId') as string;

    // Validation
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide a photo file',
        },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide a title',
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Only JPEG, PNG, and WebP images are allowed',
        },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: 'File size must be less than 10MB',
        },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'photos');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.name) || '.png';
    const filename = `${timestamp}-${randomId}${extension}`;
    const filepath = path.join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Create photo record in database
    const photo = new (Photo as any)({
      userId: authUser.userId,
      title: title.trim(),
      description: description ? description.trim() : undefined,
      imageUrl: `/uploads/photos/${filename}`,
      thumbnailUrl: `/uploads/photos/${filename}`, // For now, use same image as thumbnail
      isPublic: isPublic !== undefined ? isPublic : true,
      templateId: templateId || undefined,
      views: 0,
      likes: 0,
    });

    await photo.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Photo uploaded successfully',
        data: {
          photo,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Upload photo error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while uploading the photo',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}