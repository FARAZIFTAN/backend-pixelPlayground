import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { verifyToken } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import FinalComposite from '@/models/FinalComposite';
import PhotoSession from '@/models/PhotoSession';

// Next.js 14 App Router - Route Segment Config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/composites/upload - Upload composite image as file
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

    // Parse FormData
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const sessionId = formData.get('sessionId') as string;
    const templateId = formData.get('templateId') as string | null;
    const isPublic = formData.get('isPublic') === 'true';

    if (!imageFile) {
      return NextResponse.json(
        { success: false, message: 'Image file is required' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Verify session belongs to user
    const session = await PhotoSession.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.userId !== decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Session does not belong to user' },
        { status: 403 }
      );
    }

    // Save file to uploads/composites/
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'composites');
    await mkdir(uploadDir, { recursive: true });

    const timestamp = Date.now();
    const filename = `composite-${decoded.userId}-${timestamp}.png`;
    const filepath = join(uploadDir, filename);

    // Convert File to Buffer and save
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    console.log('✅ Composite image saved:', filename);

    // Create composite URL (relative path)
    const compositeUrl = `/uploads/composites/${filename}`;

    // Save to database
    const composite = await FinalComposite.create({
      sessionId,
      userId: decoded.userId,
      templateId: templateId || undefined,
      compositeUrl,
      isPublic: isPublic || false,
      likes: 0,
      views: 0,
      metadata: {
        width: 800,
        height: 600,
        fileSize: buffer.length,
        format: 'png',
      },
    });

    // Update session status
    await PhotoSession.findByIdAndUpdate(sessionId, {
      status: 'completed',
      'metadata.completedAt': new Date().toISOString(),
    });

    console.log('✅ Composite created in database:', composite._id);

    return NextResponse.json(
      {
        success: true,
        message: 'Composite uploaded successfully',
        data: {
          _id: composite._id,
          compositeUrl: composite.compositeUrl,
          sessionId: composite.sessionId,
          createdAt: composite.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Upload composite error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while uploading composite',
      },
      { status: 500 }
    );
  }
}
