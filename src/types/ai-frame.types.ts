/**
 * AI Frame Generation Types
 * Definisi interface untuk request dan response API AI Frame Generator
 */

// Layout types yang didukung
export type FrameLayout = 'vertical' | 'horizontal' | 'grid';

// Request body untuk generate frame
export interface GenerateFrameRequest {
  frameCount: number;           // Jumlah foto dalam frame (2-6)
  layout: FrameLayout;          // Tipe layout frame
  backgroundColor: string;       // Warna background (hex color)
  borderColor: string;          // Warna border (hex color)
  borderThickness?: number;     // Ketebalan border (default: 2)
  borderRadius?: number;        // Radius sudut border (default: 8)
  gradientFrom?: string;        // Warna awal gradient (optional)
  gradientTo?: string;          // Warna akhir gradient (optional)
}

// Response dari generate frame
export interface GenerateFrameResponse {
  success: boolean;
  image: string;                // Base64 encoded image
  contentType: string;          // MIME type (image/svg+xml)
  error?: string;               // Error message jika gagal
  details?: string;             // Detail error
}

// Message untuk chat AI
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Frame specification dari AI chat
export interface AIFrameSpecification {
  frameCount: number;
  layout: FrameLayout;
  backgroundColor: string;
  borderColor: string;
  gradientFrom?: string;
  gradientTo?: string;
  borderThickness?: number;
  borderRadius?: number;
}

// Request body untuk AI chat
export interface ChatAIRequest {
  messages: ChatMessage[];
}

// Response dari AI chat
export interface ChatAIResponse {
  message: string;              // Response text dari AI
  frameSpec?: AIFrameSpecification;  // Frame spec jika ada
  error?: string;               // Error message jika gagal
}

// Response dari generate image (text-to-image)
export interface GenerateImageRequest {
  prompt: string;               // Text prompt untuk generate gambar
  negative_prompt?: string;     // Negative prompt (optional)
  num_inference_steps?: number; // Jumlah steps (default: 10)
}

export interface GenerateImageResponse {
  success: boolean;
  image: string;                // Base64 encoded image
  contentType: string;          // MIME type
  error?: string;               // Error message jika gagal
  details?: string;             // Detail error
}

// Validation constraints
export const FRAME_CONSTRAINTS = {
  MIN_FRAME_COUNT: 2,
  MAX_FRAME_COUNT: 6,
  MIN_WIDTH: 400,
  MAX_WIDTH: 1200,
  MIN_HEIGHT: 400,
  MAX_HEIGHT: 1200,
  VALID_LAYOUTS: ['vertical', 'horizontal', 'grid'] as const,
  DEFAULT_BORDER_THICKNESS: 2,
  DEFAULT_BORDER_RADIUS: 8,
  MIN_BORDER_THICKNESS: 1,
  MAX_BORDER_THICKNESS: 10,
  MIN_BORDER_RADIUS: 0,
  MAX_BORDER_RADIUS: 50,
};

// Validator function
export function validateFrameRequest(request: GenerateFrameRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate frame count
  if (request.frameCount < FRAME_CONSTRAINTS.MIN_FRAME_COUNT || 
      request.frameCount > FRAME_CONSTRAINTS.MAX_FRAME_COUNT) {
    errors.push(`Frame count must be between ${FRAME_CONSTRAINTS.MIN_FRAME_COUNT} and ${FRAME_CONSTRAINTS.MAX_FRAME_COUNT}`);
  }

  // Validate layout
  if (!FRAME_CONSTRAINTS.VALID_LAYOUTS.includes(request.layout)) {
    errors.push(`Layout must be one of: ${FRAME_CONSTRAINTS.VALID_LAYOUTS.join(', ')}`);
  }

  // Validate colors (basic hex validation)
  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
  if (!hexColorRegex.test(request.backgroundColor)) {
    errors.push('backgroundColor must be a valid hex color (e.g., #FF5733)');
  }
  if (!hexColorRegex.test(request.borderColor)) {
    errors.push('borderColor must be a valid hex color (e.g., #FF5733)');
  }

  // Validate optional gradients
  if (request.gradientFrom && !hexColorRegex.test(request.gradientFrom)) {
    errors.push('gradientFrom must be a valid hex color');
  }
  if (request.gradientTo && !hexColorRegex.test(request.gradientTo)) {
    errors.push('gradientTo must be a valid hex color');
  }

  // Validate border thickness
  if (request.borderThickness !== undefined) {
    if (request.borderThickness < FRAME_CONSTRAINTS.MIN_BORDER_THICKNESS || 
        request.borderThickness > FRAME_CONSTRAINTS.MAX_BORDER_THICKNESS) {
      errors.push(`Border thickness must be between ${FRAME_CONSTRAINTS.MIN_BORDER_THICKNESS} and ${FRAME_CONSTRAINTS.MAX_BORDER_THICKNESS}`);
    }
  }

  // Validate border radius
  if (request.borderRadius !== undefined) {
    if (request.borderRadius < FRAME_CONSTRAINTS.MIN_BORDER_RADIUS || 
        request.borderRadius > FRAME_CONSTRAINTS.MAX_BORDER_RADIUS) {
      errors.push(`Border radius must be between ${FRAME_CONSTRAINTS.MIN_BORDER_RADIUS} and ${FRAME_CONSTRAINTS.MAX_BORDER_RADIUS}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
