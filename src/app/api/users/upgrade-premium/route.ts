import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';

// POST /api/users/upgrade-premium - User self-upgrade to premium
export async function POST(request: NextRequest) {
  try {
    console.log('[UPGRADE-PREMIUM] Endpoint called');
    await connectDB();

    // Verify user authentication (not admin - regular user can upgrade themselves)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[UPGRADE-PREMIUM] No token provided');
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded || typeof decoded === 'string') {
      console.log('[UPGRADE-PREMIUM] Invalid token');
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Type assertion for decoded token - could have 'id' or 'userId'
    const tokenData = decoded as { id?: string; userId?: string; email?: string };
    const userId = tokenData.id || tokenData.userId;
    console.log('[UPGRADE-PREMIUM] User ID from token:', userId);
    console.log('[UPGRADE-PREMIUM] Decoded token:', JSON.stringify(decoded, null, 2));

    if (!userId) {
      console.log('[UPGRADE-PREMIUM] No user ID in token');
      return NextResponse.json(
        { success: false, message: 'Invalid token: no user ID' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { expiresInDays = 30 } = body;

    // Calculate expiration date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiresInDays);

    console.log('[UPGRADE-PREMIUM] Updating user:', userId, 'to premium until:', expiryDate);

    // Update user to premium
    // @ts-ignore
    const user = await User.findByIdAndUpdate(
      userId,
      {
        isPremium: true,
        premiumExpiresAt: expiryDate,
      },
      { new: true }
    )
      .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires')
      .exec();

    if (!user) {
      console.log('[UPGRADE-PREMIUM] User not found with ID:', userId);
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    console.log(`[UPGRADE-PREMIUM] Success! User ${user.email} upgraded to premium until ${expiryDate}`);

    return NextResponse.json({
      success: true,
      message: 'Successfully upgraded to premium',
      data: { user },
    });
  } catch (error) {
    console.error('[UPGRADE-PREMIUM] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to upgrade to premium', error: String(error) },
      { status: 500 }
    );
  }
}
