import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth, unauthorizedResponse } from '@/middleware/auth';
import fs from 'fs/promises';
import path from 'path';

// POST /api/users/profile-picture - Upload profile picture
export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return unauthorizedResponse('Invalid or expired token');
    }

    await connectDB();

    const formData = await request.formData();
    const file = formData.get('profilePicture') as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: 'No file provided',
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed',
        },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: 'File size exceeds 5MB limit',
        },
        { status: 400 }
      );
    }

    // Get user to check if profile picture exists
    const user = await (User as any).findById(authUser.userId);
    
    if (!user || user.isDeleted) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    // Delete old profile picture if exists
    if (user.profilePicture) {
      const oldPicturePath = path.join(process.cwd(), 'public', user.profilePicture);
      try {
        await fs.access(oldPicturePath);
        await fs.unlink(oldPicturePath);
      } catch (error) {
        // File doesn't exist or already deleted, continue
        console.log('Old profile picture not found or already deleted');
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `profile-${authUser.userId}-${timestamp}.${fileExtension}`;
    const filepath = path.join(uploadsDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filepath, buffer);

    // Update user profile picture path
    const profilePictureUrl = `/uploads/profiles/${filename}`;
    user.profilePicture = profilePictureUrl;
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Profile picture uploaded successfully',
        data: {
          profilePicture: profilePictureUrl,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Upload profile picture error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while uploading profile picture',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/users/profile-picture - Delete profile picture
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return unauthorizedResponse('Invalid or expired token');
    }

    await connectDB();

    const user = await (User as any).findById(authUser.userId);
    
    if (!user || user.isDeleted) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    if (!user.profilePicture) {
      return NextResponse.json(
        {
          success: false,
          message: 'No profile picture to delete',
        },
        { status: 400 }
      );
    }

    // Delete file from filesystem
    const picturePath = path.join(process.cwd(), 'public', user.profilePicture);
    try {
      await fs.access(picturePath);
      await fs.unlink(picturePath);
    } catch (error) {
      console.log('Profile picture file not found on filesystem');
    }

    // Remove from database
    user.profilePicture = '';
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Profile picture deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete profile picture error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while deleting profile picture',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
