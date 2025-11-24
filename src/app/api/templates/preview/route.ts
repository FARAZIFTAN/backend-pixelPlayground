import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/middleware/auth';
import { verifyAdmin } from '@/middleware/admin';

// POST /api/templates/preview - Preview template composition (admin only)
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

    // Parse JSON body
    const body = await request.json();
    const { frameUrl, layoutPositions, samplePhotos } = body;

    // Basic validation
    if (!frameUrl || !layoutPositions || !Array.isArray(layoutPositions)) {
      return NextResponse.json(
        {
          success: false,
          message: 'frameUrl dan layoutPositions wajib diisi',
        },
        { status: 400 }
      );
    }

    // Simulasi: Kembalikan data preview (URL frame, posisi layout, dan contoh foto jika ada)
    // Di tahap lanjut, Anda bisa generate gambar preview secara dinamis (pakai canvas/node-canvas/dll)
    return NextResponse.json(
      {
        success: true,
        message: 'Preview data generated',
        data: {
          frameUrl,
          layoutPositions,
          samplePhotos: samplePhotos || [],
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Preview template error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while generating preview',
      },
      { status: 500 }
    );
  }
}
