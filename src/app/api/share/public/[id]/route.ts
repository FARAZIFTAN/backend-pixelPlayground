import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FinalComposite from '@/models/FinalComposite';

// GET /api/share/public/[id] - Get public share data (no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const composite = await FinalComposite.findById(params.id);

    if (!composite) {
      return NextResponse.json(
        { success: false, message: 'Composite not found' },
        { status: 404 }
      );
    }

    // Only return public composites
    if (!composite.isPublic) {
      return NextResponse.json(
        { success: false, message: 'This composite is not publicly shared' },
        { status: 403 }
      );
    }

    // Generate share URL
    const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:5173';
    const shareUrl = `${baseUrl}/share/${composite._id}`;

    // Increment view count
    composite.views += 1;
    await composite.save();

    return NextResponse.json({
      success: true,
      data: {
        composite: {
          _id: composite._id,
          compositeUrl: composite.compositeUrl,
          thumbnailUrl: composite.thumbnailUrl,
          isPublic: composite.isPublic,
          likes: composite.likes,
          views: composite.views,
          createdAt: composite.createdAt,
          metadata: composite.metadata,
        },
        shareUrl,
      },
    });
  } catch (error: unknown) {
    console.error('Public share error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while loading shared composite',
      },
      { status: 500 }
    );
  }
}