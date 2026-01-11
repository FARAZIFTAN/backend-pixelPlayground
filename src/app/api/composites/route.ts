import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FinalComposite from '@/models/FinalComposite';
import PhotoSession from '@/models/PhotoSession';
import Photo from '@/models/Photo';
import Template, { type ITemplate } from '@/models/Template';
import { verifyToken } from '@/lib/jwt';
import type { Model } from 'mongoose';

// POST /api/composites - Create final composite
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
    const { sessionId, compositeUrl, thumbnailUrl, templateId, isPublic, metadata } = body;

    // Validation
    if (!sessionId || !compositeUrl) {
      return NextResponse.json(
        { success: false, message: 'Session ID and composite URL are required' },
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

    // Create composite
    const composite = await FinalComposite.create({
      sessionId,
      userId: decoded.userId,
      templateId: templateId || session.templateId,
      compositeUrl,
      thumbnailUrl: thumbnailUrl || undefined,
      isPublic: isPublic || false,
      likes: 0,
      views: 0,
      metadata: {
        width: metadata?.width,
        height: metadata?.height,
        fileSize: metadata?.fileSize,
        format: metadata?.format,
        photosUsed: metadata?.photosUsed || session.capturedPhotos.length,
      },
    });

    // Update session
    session.finalComposite = (composite._id as any).toString();
    session.status = 'completed';
    session.completedAt = new Date();
    await session.save();

    // AUTO-SAVE to Gallery as PRIVATE by default
    try {
      // Get template name for title
      let templateName = 'Untitled';
      if (composite.templateId) {
        const TemplateModel = Template as Model<ITemplate>;
        const template = await TemplateModel.findOne({ _id: composite.templateId }).lean();
        if (template) {
          templateName = template.name;
        }
      }

      // Create photo entry in gallery (PRIVATE by default)
      const photo = await Photo.create({
        userId: decoded.userId,
        title: `${templateName} - ${new Date().toLocaleDateString('id-ID')}`,
        description: `Created from ${templateName} template`,
        imageUrl: compositeUrl,
        thumbnailUrl: thumbnailUrl || compositeUrl,
        isPublic: false, // PRIVATE by default
        templateId: composite.templateId,
        views: 0,
        likes: 0,
      });

      console.log(`✅ Auto-saved to gallery: ${photo._id}`);
    } catch (galleryError) {
      console.error('⚠️ Failed to auto-save to gallery:', galleryError);
      // Don't fail the composite creation if gallery save fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Composite created successfully and saved to your gallery',
        data: composite,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Create composite error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while creating composite',
      },
      { status: 500 }
    );
  }
}

// GET /api/composites - Get user's composites
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Get composites
    const composites = await FinalComposite.find({
      userId: decoded.userId,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('-__v')
      .lean();

    // Get total count
    const total = await FinalComposite.countDocuments({
      userId: decoded.userId,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          composites,
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
  } catch (error: unknown) {
    console.error('Get composites error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while fetching composites',
      },
      { status: 500 }
    );
  }
}
