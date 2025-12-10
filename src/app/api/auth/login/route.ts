import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/jwt';
import { notificationService } from '@/lib/notificationService';

export async function POST(request: NextRequest) {
  try {
    console.log('[LOGIN] Starting login process...');
    await connectDB();
    console.log('[LOGIN] Database connected');

    const body = await request.json();
    const email = body.email as string;
    const password = body.password as string;

    console.log('[LOGIN] Attempting login for email:', email);

    // Validation
    if (!email || !password) {
      console.log('[LOGIN] Missing email or password');
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide email and password',
        },
        { status: 400 }
      );
    }

    // Find user by email (include password field), only if not deleted
    // @ts-ignore - Mongoose types can be complex
    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false }).select('+password +loginHistory');
    
    console.log('[LOGIN] User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('[LOGIN] User not found or deleted');
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    console.log('[LOGIN] User role:', user.role);
    console.log('[LOGIN] User isActive:', user.isActive);

    // Check if account is active
    if (!user.isActive) {
      console.log('[LOGIN] Account is not active');
      return NextResponse.json(
        {
          success: false,
          message: 'Your account has been deactivated. Please contact support.',
        },
        { status: 403 }
      );
    }

    // Compare password
    console.log('[LOGIN] Comparing password...');
    const isPasswordValid = await user.comparePassword(password);
    console.log('[LOGIN] Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('[LOGIN] Invalid password');
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    // Optional: Check if email is verified
    // Uncomment below to enforce email verification before login
    // if (!user.isEmailVerified) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       message: 'Please verify your email before logging in',
    //     },
    //     { status: 403 }
    //   );
    // }

    // Track login history
    console.log('[LOGIN] Updating login history...');
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    user.lastLogin = new Date();
    
    // Initialize loginHistory if it doesn't exist
    if (!user.loginHistory) {
      user.loginHistory = [];
    }
    
    user.loginHistory.unshift({
      ipAddress,
      userAgent,
      loginAt: new Date(),
    });
    
    // Keep only last 10 login history entries
    if (user.loginHistory.length > 10) {
      user.loginHistory = user.loginHistory.slice(0, 10);
    }
    
    console.log('[LOGIN] Saving user...');
    try {
      await user.save();
      console.log('[LOGIN] User saved successfully');
    } catch (saveError) {
      console.error('[LOGIN] Error saving user:', saveError);
      // Continue anyway - login history is not critical
    }

    // Generate JWT token
    console.log('[LOGIN] Generating token...');
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || 'user',
    });
    console.log('[LOGIN] Token generated successfully');

    // Send notification to admins about new login
    try {
      if (user.role === 'user') {
        await notificationService.notifyAllAdmins(
          'New User Login',
          `${user.name} (${user.email}) has logged in`,
          'user',
          {
            userId: user._id,
            userName: user.name,
            userEmail: user.email,
          }
        );
      }
    } catch (notificationError) {
      console.error('[LOGIN] Error sending notification:', notificationError);
      // Don't fail login if notification fails
    }

    // Return success response with token
    console.log('[LOGIN] Login successful for user:', email);
    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role || 'user',
            profilePicture: user.profilePicture || null,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('[LOGIN] Error occurred:', error);
    
    if (error instanceof Error) {
      console.error('[LOGIN] Error message:', error.message);
      console.error('[LOGIN] Error stack:', error.stack);
    }
    
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during login. Please try again.',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
