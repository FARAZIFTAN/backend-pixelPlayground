import { NextRequest, NextResponse } from 'next/server';
import { 
  ChatMessage, 
  ChatAIRequest, 
  ChatAIResponse, 
  AIFrameSpecification 
} from '@/types/ai-frame.types';

/**
 * POST /api/ai/chat
 * 
 * Chat dengan AI untuk mendapatkan bantuan dalam mendesain frame template
 * AI akan membantu user menentukan spesifikasi frame dan menghasilkan frameSpec jika user sudah confirm
 * 
 * @param request - Request body berisi array messages
 * @returns ChatAIResponse dengan message dan optional frameSpec
 * 
 * @example
 * ```typescript
 * // Request
 * POST /api/ai/chat
 * {
 *   "messages": [
 *     { "role": "user", "content": "Saya ingin frame dengan 3 foto vertikal" }
 *   ]
 * }
 * 
 * // Response
 * {
 *   "message": "Oke! Frame 3 foto vertikal...",
 *   "frameSpec": {
 *     "frameCount": 3,
 *     "layout": "vertical",
 *     "backgroundColor": "#FFD700",
 *     ...
 *   }
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { messages }: ChatAIRequest = body;

    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages:', messages);
      return NextResponse.json(
        { 
          error: 'Messages array is required and must be an array' 
        } as ChatAIResponse,
        { status: 400 }
      );
    }

    if (messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array cannot be empty' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // System prompt for frame design assistance
    const systemPrompt = `You are a helpful AI assistant for designing photo booth frames.

Your role is to:
1. Help users describe and visualize their ideal photo frame
2. Ask clarifying questions about layout, colors, style, and number of photos
3. Provide encouraging feedback
4. When the frame design is CONFIRMED by the user, output a JSON frame specification in this format EXACTLY at the end of your response:

\`\`\`json
{
  "frameSpec": {
    "frameCount": 3,
    "layout": "vertical",
    "backgroundColor": "#FFD700",
    "borderColor": "#FFA500",
    "gradientFrom": "#FFD700",
    "gradientTo": "#FFC700"
  }
}
\`\`\`

Valid layouts: "vertical", "horizontal", "grid"
Valid frameCount: 2, 3, 4, 5, or 6

IMPORTANT: Only output the JSON spec when the user has CONFIRMED their frame design is ready.
Before that, just ask questions and provide suggestions conversationally.

Keep responses concise and friendly. Be creative and supportive!`;

    // Call Groq API
    console.log('Calling Groq API with messages:', messages);
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Updated: using currently available model
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    console.log('Groq API response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API Error:', error);
      return NextResponse.json(
        {
          error: 'Failed to get response from Groq API',
          details: error || 'Unknown error',
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || '';

    if (!assistantMessage) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Try to extract frame spec from the response if it contains JSON
    let frameSpec: AIFrameSpecification | undefined = undefined;
    const jsonMatch = assistantMessage.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        if (jsonData.frameSpec) {
          frameSpec = jsonData.frameSpec as AIFrameSpecification;
          console.log('Extracted frame spec from response:', frameSpec);
        }
      } catch (e) {
        console.log('Could not parse frame spec from response');
      }
    }

    return NextResponse.json({
      message: assistantMessage,
      frameSpec: frameSpec, // Include frame spec if it was in the response
    } as ChatAIResponse);
  } catch (error) {
    console.error('AI Chat Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to process AI request',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
