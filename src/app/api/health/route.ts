import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

export async function GET() {
  try {
    await connectDB();
    
    return NextResponse.json({
      success: true,
      message: 'Backend is healthy',
      status: {
        server: 'running',
        mongodb: 'connected',
        port: 3001,
      },
      timestamp: new Date().toISOString(),
      endpoints: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        verify: 'GET /api/auth/verify',
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Backend error',
      status: {
        server: 'running',
        mongodb: 'disconnected',
        port: 3001,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
