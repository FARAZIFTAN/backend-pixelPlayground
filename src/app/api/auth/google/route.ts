import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/jwt';
import type { Model } from 'mongoose';
import type { IUser } from '@/models/User';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/google - Google OAuth login/register
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Google token is required' },
        { status: 400 }
      );
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Invalid Google token' },
        { status: 401 }
      );
    }

    const { sub: googleId, email, name, picture } = payload;

    await connectDB();

    // Check if user exists by googleId or email
    // @ts-expect-error - Mongoose type inference issue with union types
    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    }).exec();

    if (user) {
      // User exists - update googleId if not set
      if (!user.googleId) {
        user.googleId = googleId;
        user.isEmailVerified = true; // Google accounts are already verified
        await user.save();
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      console.log('✅ Google login successful:', email);
    } else {
      // Create new user with Google account
      // @ts-expect-error - Mongoose type inference issue with union types
      const newUser = await User.create({
        name,
        email,
        googleId,
        profilePicture: picture,
        isEmailVerified: true, // Google accounts are pre-verified
        isActive: true,
        role: 'user',
        lastLogin: new Date(),
      });

      // Re-fetch to get full user document
      // @ts-expect-error - Mongoose type inference issue with union types
      user = await User.findById(newUser._id).exec();

      console.log('✅ New Google user created:', email);
    }

    // Generate JWT token
    const jwtToken = generateToken({
      userId: user!._id.toString(),
      email: user!.email,
      name: user!.name,
      role: user!.role,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Google authentication successful',
        token: jwtToken,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
          isEmailVerified: user.isEmailVerified,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Google auth error:', error);
    
    if (error instanceof Error && error.message.includes('Token used too late')) {
      return NextResponse.json(
        { success: false, message: 'Google token expired. Please try again.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Google authentication failed. Please try again.',
      },
      { status: 500 }
    );
  }
}
