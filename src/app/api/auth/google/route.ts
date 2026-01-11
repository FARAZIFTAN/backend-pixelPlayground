import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/jwt';
import type { Model } from 'mongoose';
import type { IUser } from '@/models/User';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

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

    // Verify Google token with retry mechanism
    let ticket;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        ticket = await client.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        break; // Success, exit retry loop
      } catch (error: any) {
        if (error.message.includes('Token used too early') && retryCount < maxRetries - 1) {
          // Wait a bit and retry for clock skew issues
          console.log(`Token timing issue, retrying... (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))); // Wait 2s, 4s, 6s
          retryCount++;
          continue;
        }

        // For other errors, try to decode token manually to check timing
        if (error.message.includes('Token used too early') && retryCount === maxRetries - 1) {
          try {
            // Try to decode the JWT to check nbf claim
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
              const currentTime = Math.floor(Date.now() / 1000);
              const nbf = payload.nbf;

              if (nbf && currentTime < nbf) {
                const waitTime = (nbf - currentTime) * 1000 + 1000; // Add 1 second buffer
                console.log(`Token not valid until ${new Date(nbf * 1000).toISOString()}, waiting ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 10000))); // Max 10 seconds

                // Try verification again after waiting
                ticket = await client.verifyIdToken({
                  idToken: token,
                  audience: process.env.GOOGLE_CLIENT_ID,
                });
                break;
              }
            }
          } catch (decodeError) {
            console.error('Failed to decode token manually:', decodeError);
          }
        }

        throw error; // Re-throw if not a timing issue or all retries failed
      }
    }

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Failed to verify Google token after retries' },
        { status: 401 }
      );
    }

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
    let user: IUser | null = await User.findOne({
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
      user = await User.findById(newUser._id).exec() as IUser | null;

      console.log('✅ New Google user created:', email);
    }

    // Generate JWT token
    const jwtToken = generateToken({
      userId: (user!._id as any).toString(),
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
          id: (user!._id as any).toString(),
          name: user!.name,
          email: user!.email,
          role: user!.role,
          profilePicture: user!.profilePicture,
          isEmailVerified: user!.isEmailVerified,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Google auth error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Token used too late') || error.message.includes('Token used too early')) {
        return NextResponse.json(
          { success: false, message: 'Google token timing issue. Please try again.' },
          { status: 401 }
        );
      }

      if (error.message.includes('Invalid token') || error.message.includes('Wrong number of segments')) {
        return NextResponse.json(
          { success: false, message: 'Invalid Google token. Please try again.' },
          { status: 401 }
        );
      }

      if (error.message.includes('Invalid audience')) {
        return NextResponse.json(
          { success: false, message: 'Google authentication configuration error.' },
          { status: 500 }
        );
      }
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
