import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Template from '@/models/Template';
import { verifyAuth, unauthorizedResponse } from '@/middleware/auth';
import { verifyAdmin } from '@/middleware/admin';

type RouteParams = {
  params: {
    id: string;
  };
};

// GET /api/templates/:id - Get single template
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

    const template = await (Template as any).findById(params.id).lean();

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          message: 'Template not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Template retrieved successfully',
        data: { template },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get template error:', error);

    if (error.name === 'CastError') {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid template ID',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while retrieving template',
      },
      { status: 500 }
    );
  }
}

// PUT /api/templates/:id - Update template (admin only)
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verify JWT token
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return unauthorizedResponse('Invalid or expired token');
    }

    // Verify admin role
    if (authUser.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          message: 'Access denied. Admin privileges required.',
        },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      name,
      category,
      thumbnail,
      frameUrl,
      isPremium,
      frameCount,
      layoutPositions,
      isActive,
    } = body;

    // Find template
    const template = await (Template as any).findById(params.id);

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          message: 'Template not found',
        },
        { status: 404 }
      );
    }

    // Update fields
    if (name !== undefined) template.name = name;
    if (category !== undefined) template.category = category;
    if (thumbnail !== undefined) template.thumbnail = thumbnail;
    if (frameUrl !== undefined) template.frameUrl = frameUrl;
    if (isPremium !== undefined) template.isPremium = isPremium;
    if (frameCount !== undefined) template.frameCount = frameCount;
    if (layoutPositions !== undefined) {
      // Validate if frameCount is also being updated
      const newFrameCount = frameCount !== undefined ? frameCount : template.frameCount;
      if (layoutPositions.length !== newFrameCount) {
        return NextResponse.json(
          {
            success: false,
            message: 'Number of layout positions must match frame count',
          },
          { status: 400 }
        );
      }
      template.layoutPositions = layoutPositions;
    }
    if (isActive !== undefined) template.isActive = isActive;

    await template.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Template updated successfully',
        data: { template },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update template error:', error);

    if (error.name === 'CastError') {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid template ID',
        },
        { status: 400 }
      );
    }

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation error',
          errors: Object.values(error.errors).map((e: any) => e.message),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while updating template',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/:id - Delete template (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verify JWT token
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return unauthorizedResponse('Invalid or expired token');
    }

    // Verify admin role
    if (authUser.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          message: 'Access denied. Admin privileges required.',
        },
        { status: 403 }
      );
    }

    await connectDB();

    const template = await (Template as any).findById(params.id);

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          message: 'Template not found',
        },
        { status: 404 }
      );
    }

    // Soft delete: set isActive to false instead of deleting
    template.isActive = false;
    await template.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Template deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete template error:', error);

    if (error.name === 'CastError') {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid template ID',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while deleting template',
      },
      { status: 500 }
    );
  }
}
