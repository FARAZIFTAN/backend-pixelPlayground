import { NextRequest, NextResponse } from 'next/server';

interface ImageRequest {
  prompt: string;
  negative_prompt?: string;
  num_inference_steps?: number;
}

export async function POST(request: NextRequest) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  try {
    const body: ImageRequest = await request.json();

    if (!body.prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'HUGGINGFACE_API_KEY is not configured' },
        { status: 500 }
      );
    }

    console.log('Generating image for prompt:', body.prompt);

    // Try with a reliable model that works with free tier
    // Using stabilityai/stable-diffusion-2-1 as primary (more reliable)
    console.log('Calling Hugging Face API with Stable Diffusion 2.1...');
    
    const payload = {
      inputs: body.prompt,
    };

    // Try primary model first
    let response = await fetch(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1',
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        method: 'POST',
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );

    console.log('Hugging Face primary response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Primary model error:', response.status, errorText);

      // If model not available or loading, try fallback
      if (response.status === 503 || response.status === 429) {
        console.log('Primary model unavailable, trying fallback...');
        return await generateWithFallback(apiKey, body.prompt, controller);
      }

      return NextResponse.json(
        {
          error: 'Failed to generate image',
          details: errorText || `HTTP ${response.status}`,
        },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || '';
    console.log('Response content-type:', contentType);

    let imageBlob: Blob;
    
    // Handle different response types
    if (contentType.includes('application/json')) {
      console.log('Response is JSON, extracting image data...');
      const jsonData = await response.json() as any;
      
      // Some models return array with image data
      if (Array.isArray(jsonData) && jsonData.length > 0) {
        const imageData = jsonData[0];
        if (typeof imageData === 'object' && imageData.image) {
          // Base64 image in JSON
          imageBlob = base64ToBlob(imageData.image);
          console.log('Extracted base64 image from JSON');
        } else if (imageData instanceof Blob) {
          imageBlob = imageData;
          console.log('Got blob from JSON array');
        } else {
          throw new Error('Unexpected JSON response format');
        }
      } else {
        throw new Error('Empty or invalid JSON response from HF API');
      }
    } else if (contentType.includes('image/')) {
      // Direct image blob response
      imageBlob = await response.blob();
      console.log('Got image blob directly, size:', imageBlob.size);
    } else {
      throw new Error(`Unexpected content type: ${contentType}`);
    }

    console.log('Image blob size:', imageBlob.size, 'bytes');
    const base64 = await blobToBase64(imageBlob);
    console.log('Image generated successfully, base64 length:', base64.length);

    return NextResponse.json({
      success: true,
      image: base64,
      contentType: 'image/jpeg',
    });

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Image generation timeout exceeded');
      return NextResponse.json(
        {
          error: 'Image generation timeout',
          details: 'The request took too long. Please try again with a simpler prompt.',
        },
        { status: 504 }
      );
    }

    console.error('Image Generation Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to process image generation request',
        details: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function generateWithFallback(apiKey: string, prompt: string, controller: AbortController) {
  try {
    console.log('Trying fallback model: stabilityai/stable-diffusion-xl-base-1.0');
    
    const response = await fetch(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        method: 'POST',
        body: JSON.stringify({
          inputs: prompt,
        }),
        signal: controller.signal,
      }
    );

    console.log('Fallback response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fallback error:', errorText);
      return NextResponse.json(
        {
          error: 'Failed to generate image with fallback',
          details: errorText,
        },
        { status: response.status }
      );
    }

    const imageBlob = await response.blob();
    const base64 = await blobToBase64(imageBlob);

    return NextResponse.json({
      success: true,
      image: base64,
      contentType: 'image/jpeg',
    });

  } catch (error) {
    console.error('Fallback generation error:', error);
    return NextResponse.json(
      {
        error: 'All image generation models failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBlob(base64String: string): Blob {
  // Remove data URI prefix if present
  const base64 = base64String.replace(/^data:image\/\w+;base64,/, '');
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: 'image/jpeg' });
}
