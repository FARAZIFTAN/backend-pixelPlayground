import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Template from '@/models/Template';
import { verifyToken } from '@/lib/jwt';
import { AIFrameSpecification } from '@/types/ai-frame.types';

// Rate limiting configuration
const saveFrameAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_SAVES_PER_HOUR = 10;
const RATE_LIMIT_WINDOW = 3600000; // 1 hour in milliseconds

interface SaveFrameRequest {
  name: string;
  frameSpec: AIFrameSpecification;
  frameDataUrl: string;
  visibility: 'public' | 'private';
  description?: string;
  tags?: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || typeof decoded === 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;

    // Rate limiting check
    const now = Date.now();
    const userAttempt = saveFrameAttempts.get(userId);
    
    if (userAttempt) {
      if (now < userAttempt.resetTime) {
        if (userAttempt.count >= MAX_SAVES_PER_HOUR) {
          return NextResponse.json(
            { error: `Rate limit exceeded. Maximum ${MAX_SAVES_PER_HOUR} saves per hour. Try again later.` },
            { status: 429 }
          );
        }
        userAttempt.count++;
      } else {
        // Reset counter after time window
        saveFrameAttempts.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      }
    } else {
      saveFrameAttempts.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }

    // Parse request body
    const body: SaveFrameRequest = await request.json();
    const { name, frameSpec, frameDataUrl, visibility, description, tags } = body;

    // Validate required fields
    if (!name || !frameSpec || !frameDataUrl || !visibility) {
      return NextResponse.json(
        { error: 'Missing required fields: name, frameSpec, frameDataUrl, visibility' },
        { status: 400 }
      );
    }

    // Sanitize and validate name
    const sanitizedName = name.trim().substring(0, 100);
    if (sanitizedName.length < 3) {
      return NextResponse.json(
        { error: 'Frame name must be at least 3 characters long' },
        { status: 400 }
      );
    }

    // Validate frameDataUrl size (max 5MB)
    const MAX_SIZE_MB = 5;
    const sizeInBytes = Buffer.byteLength(frameDataUrl, 'utf8');
    const sizeInMB = sizeInBytes / (1024 * 1024);
    
    if (sizeInMB > MAX_SIZE_MB) {
      return NextResponse.json(
        { error: `Frame data too large (${sizeInMB.toFixed(2)}MB). Maximum ${MAX_SIZE_MB}MB allowed.` },
        { status: 413 }
      );
    }

    // Validate visibility
    if (!['public', 'private'].includes(visibility)) {
      return NextResponse.json(
        { error: 'Invalid visibility. Must be "public" or "private"' },
        { status: 400 }
      );
    }

    // Validate frameSpec
    if (!frameSpec.layout || frameSpec.frameCount < 2 || frameSpec.frameCount > 6) {
      return NextResponse.json(
        { error: 'Invalid frame specification' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Check for duplicate frame name by same user
    const existingTemplate = await (Template as any).findOne({
      name: sanitizedName,
      createdBy: userId,
    });

    if (existingTemplate) {
      return NextResponse.json(
        { error: 'You already have a frame with this name. Please choose a different name.' },
        { status: 409 }
      );
    }

    // Sanitize description
    const sanitizedDescription = description?.trim().substring(0, 500) || 
      `AI-generated ${frameSpec.layout} frame with ${frameSpec.frameCount} photos`;

    // Generate layout positions based on frame specification
    const layoutPositions = generateLayoutPositions(frameSpec);

    // Create new template
    const newTemplate = new Template({
      name: sanitizedName,
      category: 'AI Generated',
      description: sanitizedDescription,
      tags: tags || ['AI', 'Generated', frameSpec.layout],
      thumbnail: frameDataUrl,
      frameUrl: frameDataUrl,
      isPremium: false,
      frameCount: frameSpec.frameCount,
      layoutPositions,
      isActive: true,
      createdBy: userId,
      visibility,
      isAIGenerated: true,
      aiFrameSpec: frameSpec,
    });

    await newTemplate.save();

    // Log successful save for monitoring
    console.log(`✅ Frame saved successfully:`, {
      frameId: newTemplate._id,
      userId: userId,
      frameName: sanitizedName,
      visibility: visibility,
      frameCount: frameSpec.frameCount,
      layout: frameSpec.layout,
      sizeInMB: sizeInMB.toFixed(2),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Frame saved successfully',
        template: {
          id: newTemplate._id,
          name: newTemplate.name,
          category: newTemplate.category,
          thumbnail: newTemplate.thumbnail,
          visibility: newTemplate.visibility,
          isAIGenerated: newTemplate.isAIGenerated,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Error saving AI frame:', error);

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Duplicate frame detected. This frame already exists.' },
        { status: 409 }
      );
    }

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Invalid frame data', details: error.message },
        { status: 400 }
      );
    }

    if (error.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid data format', details: error.message },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { error: 'Failed to save frame', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Generate layout positions based on frame specification
 * Returns pixel coordinates for 600x900 frame size (standard AI frame dimensions)
 */
function generateLayoutPositions(frameSpec: AIFrameSpecification): any[] {
  const { layout, frameCount } = frameSpec;
  const positions = [];
  
  // AI Frame standard dimensions
  const frameWidth = 600;
  const frameHeight = 900;
  const padding = 20; // 20px padding between photos

  if (layout === 'vertical') {
    const totalPadding = padding * (frameCount - 1);
    const photoHeight = (frameHeight - totalPadding) / frameCount;
    const photoWidth = frameWidth;
    
    for (let i = 0; i < frameCount; i++) {
      positions.push({
        x: 0,
        y: i * (photoHeight + padding),
        width: photoWidth,
        height: photoHeight,
      });
    }
  } else if (layout === 'horizontal') {
    const totalPadding = padding * (frameCount - 1);
    const photoWidth = (frameWidth - totalPadding) / frameCount;
    const photoHeight = frameHeight;
    
    for (let i = 0; i < frameCount; i++) {
      positions.push({
        x: i * (photoWidth + padding),
        y: 0,
        width: photoWidth,
        height: photoHeight,
      });
    }
  } else if (layout === 'grid') {
    const cols = Math.ceil(Math.sqrt(frameCount));
    const rows = Math.ceil(frameCount / cols);
    const totalPaddingX = padding * (cols - 1);
    const totalPaddingY = padding * (rows - 1);
    const cellWidth = (frameWidth - totalPaddingX) / cols;
    const cellHeight = (frameHeight - totalPaddingY) / rows;

    for (let i = 0; i < frameCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions.push({
        x: col * (cellWidth + padding),
        y: row * (cellHeight + padding),
        width: cellWidth,
        height: cellHeight,
      });
    }
  }

  return positions;
}
