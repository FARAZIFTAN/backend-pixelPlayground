import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FinalComposite from '@/models/FinalComposite';
import QRCode from 'qrcode';

// GET /api/share/[id] - Get share data for composite
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

    // Generate share URL
    const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:5173';
    const shareUrl = `${baseUrl}/share/${composite._id}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(shareUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#C62828',
        light: '#FFFFFF'
      }
    });

    // Increment view count if this is a view (not just API call)
    const isViewRequest = request.headers.get('x-request-type') === 'view';
    if (isViewRequest) {
      composite.views += 1;
      await composite.save();
    }

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
        qrCode: qrCodeDataUrl,
      },
    });
  } catch (error: unknown) {
    console.error('Share composite error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while generating share data',
      },
      { status: 500 }
    );
  }
}

// POST /api/share/[id]/like - Like/unlike composite
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    await connectDB();

    const composite = await FinalComposite.findById(params.id);

    if (!composite) {
      return NextResponse.json(
        { success: false, message: 'Composite not found' },
        { status: 404 }
      );
    }

    // Toggle like (simplified - in real app you'd track per user)
    composite.likes += 1;
    await composite.save();

    return NextResponse.json({
      success: true,
      message: 'Composite liked successfully',
      data: {
        likes: composite.likes,
      },
    });
  } catch (error: unknown) {
    console.error('Like composite error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while liking the composite',
      },
      { status: 500 }
    );
  }
}