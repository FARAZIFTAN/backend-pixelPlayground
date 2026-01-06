import { NextRequest, NextResponse } from 'next/server';
import { 
  GenerateFrameRequest, 
  GenerateFrameResponse, 
  validateFrameRequest 
} from '@/types/ai-frame.types';
import { verifyAuth } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import UsageLimit from '@/models/UsageLimit';

/**
 * POST /api/ai/generate-frame
 * 
 * Generate frame template sebagai SVG image berdasarkan spesifikasi yang diberikan
 * 
 * @param request - Request body berisi GenerateFrameRequest
 * @returns GenerateFrameResponse dengan base64 encoded SVG image
 * 
 * @example
 * ```typescript
 * // Request
 * POST /api/ai/generate-frame
 * {
 *   "frameCount": 3,
 *   "layout": "vertical",
 *   "backgroundColor": "#FFD700",
 *   "borderColor": "#FFA500",
 *   "gradientFrom": "#FFD700",
 *   "gradientTo": "#FFC700"
 * }
 * 
 * // Response
 * {
 *   "success": true,
 *   "image": "base64_encoded_svg...",
 *   "contentType": "image/svg+xml"
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          details: 'Please login to use AI Template Creator',
        } as GenerateFrameResponse,
        { status: 401 }
      );
    }

    // Get user details to check premium status
    const userDoc = await User.findById(user.userId).exec();
    if (!userDoc) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        } as GenerateFrameResponse,
        { status: 404 }
      );
    }

    // Determine package type
    let packageType: 'free' | 'pro' = 'free';
    if (userDoc.isPremium && userDoc.premiumExpiresAt && userDoc.premiumExpiresAt > new Date()) {
      // User has active premium
      packageType = 'pro';
    }

    // Check usage limit
    try {
      const usageLimit = await UsageLimit.getOrCreateToday(user.userId, packageType);
      await usageLimit.incrementAIGeneration();
    } catch (error: any) {
      console.error('AI generation limit exceeded:', error.message);
      return NextResponse.json(
        { 
          success: false,
          error: 'Daily AI generation limit reached',
          details: error.message,
          packageType,
          upgradeUrl: '/upgrade-pro'
        },
        { status: 429 } // Too Many Requests
      );
    }

    const body: GenerateFrameRequest = await request.json();

    // Validate request
    const validation = validateFrameRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.errors.join(', '),
        } as GenerateFrameResponse,
        { status: 400 }
      );
    }

    console.log('Generating frame with specs:', body);

    // Create SVG for the frame
    const svgImage = createFrameSVG(body);
    
    // Convert SVG to base64 (keep as SVG for transparency support)
    const base64Image = await svgToBase64(svgImage);

    return NextResponse.json({
      success: true,
      image: base64Image,
      contentType: 'image/svg+xml',
    } as GenerateFrameResponse);

  } catch (error) {
    console.error('Frame Generation Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate frame',
        details: errorMessage,
      } as GenerateFrameResponse,
      { status: 500 }
    );
  }
}

/**
 * Create SVG image untuk frame template
 * 
 * @param config - Frame configuration
 * @returns SVG string
 */
function createFrameSVG(config: GenerateFrameRequest): string {
  const width = 600;
  const height = 900;
  const padding = 30;
  const borderWidth = config.borderThickness || 2;
  const borderRadius = config.borderRadius || 8;
  const bgColor = config.backgroundColor || '#FDE2E4';
  const borderColor = config.borderColor || '#F7A9A8';
  const gradientFrom = config.gradientFrom || bgColor;
  const gradientTo = config.gradientTo || bgColor;

  // Create gradient definition
  const gradientId = 'bgGradient';
  const gradientDef = `
    <defs>
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:${gradientFrom};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${gradientTo};stop-opacity:1" />
      </linearGradient>
    </defs>
  `;

  let photoElements = '';
  let photoMasks = ''; // For creating transparent cutouts
  const effectiveBorderWidth = Math.max(borderWidth, 3); // Minimum 3px untuk visibility
  
  if (config.layout === 'vertical') {
    // N vertical frames
    const photoHeight = (height - padding * (config.frameCount + 1)) / config.frameCount;
    const photoWidth = width - padding * 2;

    for (let i = 0; i < config.frameCount; i++) {
      const y = padding + i * (photoHeight + padding);
      
      // Create mask cutout for photo area
      photoMasks += `
        <rect 
          x="${padding}" 
          y="${y}" 
          width="${photoWidth}" 
          height="${photoHeight}" 
          rx="${borderRadius}"
        />
      `;
      
      // Border only (no fill, will be drawn on top)
      photoElements += `
        <!-- Photo border ${i + 1} -->
        <rect 
          x="${padding}" 
          y="${y}" 
          width="${photoWidth}" 
          height="${photoHeight}" 
          fill="none" 
          stroke="${borderColor}" 
          stroke-width="${effectiveBorderWidth}" 
          rx="${borderRadius}"
        />
      `;
    }
  } else if (config.layout === 'horizontal') {
    // N horizontal frames
    const photoWidth = (width - padding * (config.frameCount + 1)) / config.frameCount;
    const photoHeight = height - padding * 2;

    for (let i = 0; i < config.frameCount; i++) {
      const x = padding + i * (photoWidth + padding);
      
      // Create mask cutout for photo area
      photoMasks += `
        <rect 
          x="${x}" 
          y="${padding}" 
          width="${photoWidth}" 
          height="${photoHeight}" 
          rx="${borderRadius}"
        />
      `;
      
      // Border only (no fill)
      photoElements += `
        <!-- Photo border ${i + 1} -->
        <rect 
          x="${x}" 
          y="${padding}" 
          width="${photoWidth}" 
          height="${photoHeight}" 
          fill="none" 
          stroke="${borderColor}" 
          stroke-width="${effectiveBorderWidth}" 
          rx="${borderRadius}"
        />
      `;
    }
  } else if (config.layout === 'grid') {
    // Grid layout
    const cols = config.frameCount === 4 ? 2 : config.frameCount === 6 ? 3 : 2;
    const rows = Math.ceil(config.frameCount / cols);
    const photoWidth = (width - padding * (cols + 1)) / cols;
    const photoHeight = (height - padding * (rows + 1)) / rows;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const photoNum = row * cols + col + 1;
        if (photoNum > config.frameCount) break;

        const x = padding + col * (photoWidth + padding);
        const y = padding + row * (photoHeight + padding);

        // Create mask cutout for photo area
        photoMasks += `
          <rect 
            x="${x}" 
            y="${y}" 
            width="${photoWidth}" 
            height="${photoHeight}" 
            rx="${borderRadius}"
          />
        `;
        
        // Border only (no fill)
        photoElements += `
          <!-- Photo border ${photoNum} -->
          <rect 
            x="${x}" 
            y="${y}" 
            width="${photoWidth}" 
            height="${photoHeight}" 
            fill="none" 
            stroke="${borderColor}" 
            stroke-width="${effectiveBorderWidth}" 
            rx="${borderRadius}"
          />
        `;
      }
    }
  }

  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      ${gradientDef}
      <defs>
        <style>
          text { font-weight: bold; }
        </style>
        <filter id="shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.15" />
        </filter>
        <!-- Mask for photo cutouts - black areas will be cut out -->
        <mask id="frameMask">
          <rect width="${width}" height="${height}" fill="white"/>
          ${photoMasks.replace(/<rect /g, '<rect fill="black" ')}
        </mask>
      </defs>
      <!-- Background with gradient and mask (transparent where photos go) -->
      <rect width="${width}" height="${height}" fill="url(#${gradientId})" mask="url(#frameMask)"/>
      <!-- Photo borders on top -->
      ${photoElements}
    </svg>
  `;

  return svg;
}

async function svgToBase64(svgString: string): Promise<string> {
  // For Node.js, we need to convert SVG to base64
  // SVG can be embedded as data URI
  const cleanSvg = svgString.replace(/\n/g, '').replace(/\s+/g, ' ');
  const base64 = Buffer.from(cleanSvg).toString('base64');
  return base64;
}
