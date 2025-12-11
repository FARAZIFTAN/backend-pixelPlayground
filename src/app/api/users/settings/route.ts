import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';

// GET /api/users/settings - Get user settings
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await (User as any).findById(decoded.userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Return settings with defaults if not set
    const settings = {
      notifications: {
        emailNotifications: (user as any).settings?.notifications?.emailNotifications ?? true,
        templateAlerts: (user as any).settings?.notifications?.templateAlerts ?? true,
        weeklyReports: (user as any).settings?.notifications?.weeklyReports ?? false,
      },
      theme: {
        theme: (user as any).settings?.theme?.theme ?? 'dark',
        language: (user as any).settings?.theme?.language ?? 'en',
      },
    };

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// PUT /api/users/settings - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { type, settings } = body;

    if (!type || !['notifications', 'theme'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid settings type' },
        { status: 400 }
      );
    }

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Settings data is required' },
        { status: 400 }
      );
    }

    // Build update object
    const updateObj: any = {};

    if (type === 'notifications') {
      if (typeof settings.emailNotifications === 'boolean') {
        updateObj['settings.notifications.emailNotifications'] = settings.emailNotifications;
      }
      if (typeof settings.templateAlerts === 'boolean') {
        updateObj['settings.notifications.templateAlerts'] = settings.templateAlerts;
      }
      if (typeof settings.weeklyReports === 'boolean') {
        updateObj['settings.notifications.weeklyReports'] = settings.weeklyReports;
      }
    } else if (type === 'theme') {
      if (settings.theme && ['light', 'dark'].includes(settings.theme)) {
        updateObj['settings.theme.theme'] = settings.theme;
      }
      if (settings.language && ['en', 'id'].includes(settings.language)) {
        updateObj['settings.theme.language'] = settings.language;
      }
    }

    if (Object.keys(updateObj).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid settings to update' },
        { status: 400 }
      );
    }

    const user = await (User as any).findByIdAndUpdate(
      decoded.userId,
      { $set: updateObj },
      { new: true, runValidators: true }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: (user as any).settings,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
