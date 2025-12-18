import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { notificationService } from '@/lib/notificationService';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const name = body.name as string;
    const email = body.email as string;
    const password = body.password as string;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide all required fields: name, email, password',
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide a valid email address',
        },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: 'Password must be at least 8 characters long',
        },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.length < 2 || name.length > 50) {
      return NextResponse.json(
        {
          success: false,
          message: 'Name must be between 2 and 50 characters',
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    // @ts-ignore - Mongoose types can be complex
    const existingUser = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'User with this email already exists',
        },
        { status: 409 }
      );
    }

    // Create new user (password will be hashed automatically by the pre-save hook)

    // Use correct type for Mongoose instance to access methods
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      isEmailVerified: false,
    }) as any;

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send notification to admins about new user registration
    try {
      console.log('[REGISTER] Sending notification to admins for new user:', user.email);
      await notificationService.notifyAllAdmins(
        'New User Registration',
        `${user.name} (${user.email}) has registered`,
        'user',
        {
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
        }
      );
      console.log('[REGISTER] Notification sent successfully');
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Don't fail registration if notification fails
    }

    // TODO: Send verification email
    // In production, send email with verification link:
    // const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    // await sendEmail(user.email, 'Verify Your Email', verificationUrl);

    console.log('Email Verification Token:', verificationToken);
    console.log('User should verify email at: /api/auth/verify-email?token=' + verificationToken);

    // Return success response (without password)
    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully! Please check your email to verify your account.',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role || 'user',
            createdAt: user.createdAt,
          },
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Register error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        {
          success: false,
          message: messages.join(', '),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during registration. Please try again.',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
