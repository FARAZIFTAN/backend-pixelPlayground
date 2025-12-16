import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Template from '@/models/Template';
import { verifyToken } from '@/lib/jwt';
import { AIFrameSpecification } from '@/types/ai-frame.types';

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

    // Generate layout positions based on frame specification
    const layoutPositions = generateLayoutPositions(frameSpec);

    // Create new template
    const newTemplate = new Template({
      name,
      category: 'AI Generated',
      description: description || `AI-generated frame with ${frameSpec.frameCount} photos`,
      tags: tags || ['AI', 'Generated', frameSpec.layout],
      thumbnail: frameDataUrl,
      frameUrl: frameDataUrl,
      isPremium: false,
      frameCount: frameSpec.frameCount,
      layoutPositions,
      isActive: true,
      createdBy: decoded.userId,
      visibility,
      isAIGenerated: true,
      aiFrameSpec: frameSpec,
    });

    await newTemplate.save();

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
    console.error('Error saving AI frame:', error);
    return NextResponse.json(
      { error: 'Failed to save frame', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Generate layout positions based on frame specification
 */
function generateLayoutPositions(frameSpec: AIFrameSpecification): any[] {
  const { layout, frameCount } = frameSpec;
  const positions = [];

  if (layout === 'vertical') {
    const height = 100 / frameCount;
    for (let i = 0; i < frameCount; i++) {
      positions.push({
        x: 0,
        y: i * height,
        width: 100,
        height: height,
      });
    }
  } else if (layout === 'horizontal') {
    const width = 100 / frameCount;
    for (let i = 0; i < frameCount; i++) {
      positions.push({
        x: i * width,
        y: 0,
        width: width,
        height: 100,
      });
    }
  } else if (layout === 'grid') {
    const cols = Math.ceil(Math.sqrt(frameCount));
    const rows = Math.ceil(frameCount / cols);
    const cellWidth = 100 / cols;
    const cellHeight = 100 / rows;

    for (let i = 0; i < frameCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions.push({
        x: col * cellWidth,
        y: row * cellHeight,
        width: cellWidth,
        height: cellHeight,
      });
    }
  }

  return positions;
}
