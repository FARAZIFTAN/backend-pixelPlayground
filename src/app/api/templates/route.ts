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
    const limit = parseInt(searchParams.get('limit') || '20'); // Reduced from 50 to 20
    const skip = (page - 1) * limit;

    // Get userId from token (if authenticated)
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    let userId: string | null = null;
    
    if (token) {
      try {
        const { verifyToken } = await import('@/lib/jwt');
        const decoded = verifyToken(token);
        if (decoded && typeof decoded !== 'string') {
          userId = decoded.userId;
        }
      } catch (error) {
        // Token invalid or expired, continue as unauthenticated user
        console.log('Token verification failed, showing public templates only');
      }
    }

    // Build query with $and to properly combine all conditions
    const query: any = { $and: [] };
    
    // Filter by category
    if (category && category !== 'All') {
      query.$and.push({ category });
    }
    
    // Filter by premium status
    if (isPremium !== null && isPremium !== undefined) {
      query.$and.push({ isPremium: isPremium === 'true' });
    }
    
    // Filter by active status
    if (isActive !== null && isActive !== undefined) {
      query.$and.push({ isActive: isActive === 'true' });
    } else {
      // Default: only show active templates for public
      query.$and.push({ isActive: true });
    }

    // Filter by visibility:
    // - Public templates: visible to everyone
    // - Private templates: only visible to creator
    // - Templates without visibility field: treated as public (backward compatibility)
    if (userId) {
      // Authenticated: show public templates OR user's own private templates OR templates without visibility (legacy)
      query.$and.push({
        $or: [
          { visibility: 'public' },
          { visibility: { $exists: false } }, // Legacy templates without visibility field
          { visibility: 'private', createdBy: userId }
        ]
      });
    } else {
      // Unauthenticated: show public templates OR templates without visibility (legacy)
      query.$and.push({
        $or: [
          { visibility: 'public' },
          { visibility: { $exists: false } } // Legacy templates without visibility field
        ]
      });
    }

    // Simplify query if $and array is empty or has only one element
    const finalQuery = query.$and.length === 0 ? {} : 
                      query.$and.length === 1 ? query.$and[0] : query;

    // Fetch templates - exclude large frameUrl for list view, only include thumbnail
    const templates = await (Template as any)
      .find(finalQuery)
      .select('-frameUrl') // Exclude large base64 frameUrl from list
      .populate({
        path: 'createdBy',
        select: 'name email',
        strictPopulate: false // Allow populate even if some refs are invalid
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform templates to include creatorName
    const transformedTemplates = templates.map((template: any) => {
      let creatorName = 'Anonymous';
      
      // Check if createdBy is populated (object with name/email)
      if (template.createdBy && typeof template.createdBy === 'object') {
        creatorName = template.createdBy.name || 
                     template.createdBy.email?.split('@')[0] || 
                     'Community Creator';
      }
      // If createdBy is still a string (legacy data), try to use it
      else if (template.createdBy && typeof template.createdBy === 'string') {
        // It's a user ID string, keep it but can't get name
        creatorName = 'Community Creator';
      }

      return {
        ...template,
        creatorName,
        createdBy: template.createdBy?._id || template.createdBy, // Keep the ID
      };
    });

    // Get total count
    const total = await (Template as any).countDocuments(finalQuery);

    return NextResponse.json(
      {
        success: true,
        message: 'Templates retrieved successfully',
        data: {
          templates: transformedTemplates,
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
