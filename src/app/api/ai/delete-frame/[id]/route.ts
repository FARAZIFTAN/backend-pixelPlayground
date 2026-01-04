import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Template from '@/models/Template';
import { verifyToken } from '@/lib/jwt';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * DELETE /api/ai/delete-frame/:id
 * Menghapus AI-generated frame milik user
 * 
 * Authorization: Hanya user yang membuat frame yang bisa menghapusnya
 * 
 * Response:
 * {
 *   success: true,
 *   message: string
 * }
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized. Please login to delete your AI frames.' 
        },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || typeof decoded === 'string') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid or expired token. Please login again.' 
        },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Connect to database
    await connectDB();

    // Find the frame
    const frame = await (Template as any).findById(params.id);

    if (!frame) {
      return NextResponse.json(
        {
          success: false,
          message: 'Frame not found',
        },
        { status: 404 }
      );
    }

    // Verify ownership - user hanya bisa delete frame miliknya sendiri
    if (frame.createdBy?.toString() !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Access denied. You can only delete your own frames.',
        },
        { status: 403 }
      );
    }

    // Verify it's an AI-generated frame
    if (!frame.isAIGenerated) {
      return NextResponse.json(
        {
          success: false,
          message: 'This endpoint is only for AI-generated frames.',
        },
        { status: 400 }
      );
    }

    // Soft delete: set isActive to false
    frame.isActive = false;
    await frame.save();

    return NextResponse.json(
      {
        success: true,
        message: 'AI frame deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete AI frame error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete AI frame',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
