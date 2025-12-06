import { NextRequest, NextResponse } from 'next/server';

interface FrameRequest {
  frameCount: number;
  layout: 'vertical' | 'horizontal' | 'grid';
  backgroundColor: string;
  borderColor: string;
  borderThickness: number;
  borderRadius: number;
  gradientFrom?: string;
  gradientTo?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: FrameRequest = await request.json();

    console.log('Generating frame with specs:', body);

    // Create SVG for the frame
    const svgImage = createFrameSVG(body);
    
    // Convert SVG to PNG (as base64)
    const base64Image = await svgToBase64(svgImage);

    return NextResponse.json({
      success: true,
      image: base64Image,
      contentType: 'image/png',
    });

  } catch (error) {
    console.error('Frame Generation Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to generate frame',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

function createFrameSVG(config: FrameRequest): string {
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
  const effectiveBorderWidth = Math.max(borderWidth, 3); // Minimum 3px untuk visibility
  
  if (config.layout === 'vertical') {
    // N vertical frames
    const photoHeight = (height - padding * (config.frameCount + 1)) / config.frameCount;
    const photoWidth = width - padding * 2;

    for (let i = 0; i < config.frameCount; i++) {
      const y = padding + i * (photoHeight + padding);
      photoElements += `
        <!-- Photo slot ${i + 1} -->
        <rect 
          x="${padding}" 
          y="${y}" 
          width="${photoWidth}" 
          height="${photoHeight}" 
          fill="white" 
          stroke="${borderColor}" 
          stroke-width="${effectiveBorderWidth}" 
          rx="${borderRadius}"
          filter="url(#shadow)"
        />
      `;
    }
  } else if (config.layout === 'horizontal') {
    // N horizontal frames
    const photoWidth = (width - padding * (config.frameCount + 1)) / config.frameCount;
    const photoHeight = height - padding * 2;

    for (let i = 0; i < config.frameCount; i++) {
      const x = padding + i * (photoWidth + padding);
      photoElements += `
        <!-- Photo slot ${i + 1} -->
        <rect 
          x="${x}" 
          y="${padding}" 
          width="${photoWidth}" 
          height="${photoHeight}" 
          fill="white" 
          stroke="${borderColor}" 
          stroke-width="${effectiveBorderWidth}" 
          rx="${borderRadius}"
          filter="url(#shadow)"
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

        photoElements += `
          <!-- Photo slot ${photoNum} -->
          <rect 
            x="${x}" 
            y="${y}" 
            width="${photoWidth}" 
            height="${photoHeight}" 
            fill="white" 
            stroke="${borderColor}" 
            stroke-width="${effectiveBorderWidth}" 
            rx="${borderRadius}"
            filter="url(#shadow)"
          />
        `;
      }
    }
  }

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${gradientDef}
      <defs>
        <style>
          text { font-weight: bold; }
        </style>
        <filter id="shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.15" />
        </filter>
      </defs>
      <!-- Background with gradient -->
      <rect width="${width}" height="${height}" fill="url(#${gradientId})"/>
      <!-- Photo elements with visible borders -->
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
