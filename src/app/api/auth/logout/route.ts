import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';

// POST /api/auth/logout - Logout user
export async function POST(request: NextRequest) {
  try {
    // Verify token is valid
    const authUser = await verifyAuth(request);
    
    if (!authUser) {
      // Even if token is invalid, we still return success for logout
      return NextResponse.json(
        {
          success: true,
          message: 'Logged out successfully',
        },
        { status: 200 }
      );
    }

    // In a stateless JWT system, we can't truly invalidate the token
    // The client should remove the token from localStorage/cookies
    // For better security, you could implement a token blacklist in Redis
    
    return NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Logout error:', error);

    // Even on error, we return success for logout
    return NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
