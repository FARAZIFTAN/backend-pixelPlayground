import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Template from '@/models/Template';
import { verifyAuth, unauthorizedResponse } from '@/middleware/auth';

// GET /api/templates - Get all templates (public)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isPremium = searchParams.get('isPremium');
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    
    if (category && category !== 'All') {
      query.category = category;
    }
    
    if (isPremium !== null && isPremium !== undefined) {
      query.isPremium = isPremium === 'true';
    }
    
    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true';
    } else {
      // Default: only show active templates for public
      query.isActive = true;
    }

    // Fetch templates
    const templates = await (Template as any)
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await (Template as any).countDocuments(query);

    return NextResponse.json(
      {
        success: true,
        message: 'Templates retrieved successfully',
        data: {
          templates,
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
    console.error('Get templates error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while retrieving templates',
      },
      { status: 500 }
    );
  }
}

// POST /api/templates - Create new template (admin only)
export async function POST(request: NextRequest) {
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

    // Validation
    if (!name || !category || !thumbnail || !frameUrl || !frameCount || !layoutPositions) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    if (layoutPositions.length !== frameCount) {
      return NextResponse.json(
        {
          success: false,
          message: 'Number of layout positions must match frame count',
        },
        { status: 400 }
      );
    }

    // Create template
    const template = await (Template as any).create({
      name,
      category,
      thumbnail,
      frameUrl,
      isPremium: isPremium || false,
      frameCount,
      layoutPositions,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: authUser.userId,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Template created successfully',
        data: { template },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create template error:', error);

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
        message: 'An error occurred while creating template',
      },
      { status: 500 }
    );
  }
}
