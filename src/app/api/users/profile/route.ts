import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth, unauthorizedResponse } from '@/middleware/auth';

// GET /api/users/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return unauthorizedResponse('Invalid or expired token');
    }

    await connectDB();

    const user = await (User as any).findById(authUser.userId).select('-password');
    
    if (!user || user.isDeleted) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            profilePicture: user.profilePicture,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get profile error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while retrieving profile',
      },
      { status: 500 }
    );
  }
}

// PUT /api/users/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return unauthorizedResponse('Invalid or expired token');
    }

    await connectDB();

    const body = await request.json();
    const { name, email, phone } = body;

    // Validation
    if (!name && !email && phone === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide at least one field to update',
        },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (name) {
      if (name.trim().length < 2) {
        return NextResponse.json(
          {
            success: false,
            message: 'Name must be at least 2 characters',
          },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (email) {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          {
            success: false,
            message: 'Please provide a valid email',
          },
          { status: 400 }
        );
      }

      // Check if email is already taken by another user
      const existingUser = await (User as any).findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: authUser.userId },
        isDeleted: false
      });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            message: 'Email is already in use',
          },
          { status: 400 }
        );
      }

      updateData.email = email.toLowerCase();
    }

    if (phone !== undefined) {
      if (phone && phone.trim().length > 0) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(phone)) {
          return NextResponse.json(
            {
              success: false,
              message: 'Please provide a valid phone number',
            },
            { status: 400 }
          );
        }
        updateData.phone = phone.trim();
      } else {
        updateData.phone = '';
      }
    }

    const updatedUser = await (User as any).findByIdAndUpdate(
      authUser.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser || updatedUser.isDeleted) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            profilePicture: updatedUser.profilePicture,
            role: updatedUser.role,
            isEmailVerified: updatedUser.isEmailVerified,
            lastLogin: updatedUser.lastLogin,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update profile error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while updating profile',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
