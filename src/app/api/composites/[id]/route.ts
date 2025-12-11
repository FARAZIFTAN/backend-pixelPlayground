import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FinalComposite from '@/models/FinalComposite';
import Photo from '@/models/Photo';
import PhotoSession from '@/models/PhotoSession';
import { verifyToken } from '@/lib/jwt';
import fs from 'fs/promises';
import path from 'path';

// DELETE /api/composites/[id] - Delete composite
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Await params in Next.js 14+
    const { id: compositeId } = await params;
    console.log('🗑️ DELETE: Composite ID:', compositeId);
    console.log('🗑️ DELETE: User ID:', decoded.userId);

    // Find composite and verify ownership
    const composite = await FinalComposite.findOne({
      _id: compositeId,
      userId: decoded.userId,
    });

    console.log('🗑️ DELETE: Composite found:', composite ? 'YES' : 'NO');

    if (!composite) {
      console.error('❌ DELETE: Composite not found or unauthorized');
      console.error('❌ DELETE: Searched for ID:', compositeId);
      console.error('❌ DELETE: User ID:', decoded.userId);
      
      // Check if composite exists at all (without user filter)
      const anyComposite = await FinalComposite.findById(compositeId);
      if (anyComposite) {
        console.error('❌ DELETE: Composite exists but belongs to different user:', anyComposite.userId);
      } else {
        console.error('❌ DELETE: Composite does not exist in database');
      }
      
      return NextResponse.json(
        { success: false, message: 'Composite not found or unauthorized' },
        { status: 404 }
      );
    }

    console.log('🗑️ DELETE: Starting deletion process...');
    console.log('🗑️ DELETE: Composite URL:', composite.compositeUrl);

    // Delete associated files from filesystem
    try {
      // Delete composite image file
      if (composite.compositeUrl && !composite.compositeUrl.startsWith('data:')) {
        const compositeFilePath = path.join(process.cwd(), 'public', composite.compositeUrl);
        try {
          await fs.unlink(compositeFilePath);
          console.log(`✅ Deleted composite file: ${compositeFilePath}`);
        } catch (err) {
          console.warn(`⚠️ Could not delete composite file: ${compositeFilePath}`, err);
        }
      }

      // Delete thumbnail file if exists
      if (composite.thumbnailUrl && !composite.thumbnailUrl.startsWith('data:')) {
        const thumbnailFilePath = path.join(process.cwd(), 'public', composite.thumbnailUrl);
        try {
          await fs.unlink(thumbnailFilePath);
          console.log(`✅ Deleted thumbnail file: ${thumbnailFilePath}`);
        } catch (err) {
          console.warn(`⚠️ Could not delete thumbnail file: ${thumbnailFilePath}`, err);
        }
      }
    } catch (fileError) {
      console.error('Error deleting files:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from Photo collection (gallery) if exists
    try {
      await Photo.deleteMany({
        userId: decoded.userId,
        imageUrl: composite.compositeUrl,
      });
      console.log(`✅ Deleted from gallery`);
    } catch (photoError) {
      console.warn('⚠️ Failed to delete from gallery:', photoError);
    }

    // Update session to remove finalComposite reference
    try {
      await PhotoSession.updateOne(
        { _id: composite.sessionId },
        { $unset: { finalComposite: '' } }
      );
      console.log(`✅ Updated session reference`);
    } catch (sessionError) {
      console.warn('⚠️ Failed to update session:', sessionError);
    }

    // Delete the composite from database
    await FinalComposite.deleteOne({ _id: compositeId });
    console.log('✅ DELETE: Composite deleted from database');

    return NextResponse.json(
      {
        success: true,
        message: 'Composite deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('❌ DELETE: Error occurred:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ DELETE: Error details:', errorMessage);
    
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while deleting composite',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

// GET /api/composites/[id] - Get single composite
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Await params in Next.js 14+
    const { id: compositeId } = await params;

    // Find composite and verify ownership
    const composite = await FinalComposite.findOne({
      _id: compositeId,
      userId: decoded.userId,
    })
      .select('-__v')
      .lean();

    if (!composite) {
      return NextResponse.json(
        { success: false, message: 'Composite not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: composite,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Get composite error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while fetching composite',
      },
      { status: 500 }
    );
  }
}
