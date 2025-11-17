import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// POST /api/auth/forgot-password - Request password reset
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide your email address',
        },
        { status: 400 }
      );
    }

    // Find user
    const user = await (User as any).findOne({ email: email.toLowerCase() });

    // Always return success for security (don't reveal if email exists)
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message: 'If your email is registered, you will receive a password reset link',
        },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // TODO: Send reset password email
    // In production, send email with reset link:
    // const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    // await sendEmail(user.email, 'Reset Your Password', resetUrl);

    console.log('Password Reset Token:', resetToken);
    console.log('User should reset password at: /api/auth/reset-password');

    return NextResponse.json(
      {
        success: true,
        message: 'If your email is registered, you will receive a password reset link',
        // In development only, include token
        ...(process.env.NODE_ENV === 'development' && { 
          data: { resetToken } 
        }),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Forgot password error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while processing your request',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
