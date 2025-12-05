import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth, unauthorizedResponse } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify JWT token
    const authUser = await verifyAuth(request);

    if (!authUser) {
      return unauthorizedResponse('Invalid or expired token');
    }

    // Connect to database
    await connectDB();

    // Fetch user from database
    // @ts-ignore - Mongoose types can be complex
    const user = await User.findById(authUser.userId);

    if (!user) {
      return unauthorizedResponse('User not found');
    }

    // Return user data
    return NextResponse.json(
      {
        success: true,
        message: 'Token is valid',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role || 'user',
            profilePicture: user.profilePicture || null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Verify token error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during token verification',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
