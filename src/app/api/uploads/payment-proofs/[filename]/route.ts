import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

interface RouteParams {
  params: {
    filename: string;
  };
}

/**
 * GET /uploads/payment-proofs/:filename
 * Serve payment proof images
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { filename } = params;
    
    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    // Build file path
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'payment-proofs', filename);

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = await readFile(filePath);

    // Determine content type based on extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'image/jpeg'; // default
    if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    }

    // Return image with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error) {
    console.error('[GET /uploads/payment-proofs/:filename] Error:', error);
    return NextResponse.json(
      { error: 'Failed to serve image' },
      { status: 500 }
    );
  }
}
