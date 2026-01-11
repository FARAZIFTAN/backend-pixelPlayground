import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FinalComposite from '@/models/FinalComposite';
import User from '@/models/User';
import { verifyAdmin } from '@/middleware/admin';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verify admin access
    const authResult = await verifyAdmin(request);
    if (!authResult || typeof authResult === 'string') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const activities: Array<{action: string, detail: string, time: string, type: string}> = [];

    // Get recent composite creations
    // @ts-ignore - Mongoose types can be complex
    const recentComposites = await FinalComposite.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('templateId createdAt')
      .lean()
      .exec();

    recentComposites.forEach((composite: any, index: number) => {
      if (index < 2) {
        const timeAgo = getTimeAgo(composite.createdAt);
        activities.push({
          action: 'Composite created',
          detail: `${composite.templateId || 'New'} composite image generated`,
          time: timeAgo,
          type: 'create',
        });
      }
    });

    // Get today's composite count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // @ts-ignore - Mongoose types can be complex
    const todayCount = await FinalComposite.countDocuments({
      createdAt: { $gte: today },
    });

    if (todayCount > 0) {
      activities.push({
        action: 'Composites created',
        detail: `${todayCount} composite images created today`,
        time: 'Today',
        type: 'photo',
      });
    }

    // Get recent user registrations
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    // @ts-ignore - Mongoose types can be complex
    const recentUsers = await User.find({
      createdAt: { $gte: weekAgo },
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(2)
      .select('name createdAt role')
      .lean()
      .exec();

    recentUsers.forEach((user: any) => {
      const timeAgo = getTimeAgo(user.createdAt);
      activities.push({
        action: 'User registered',
        detail: `${user.name} (${user.role}) joined the platform`,
        time: timeAgo,
        type: 'user',
      });
    });

    return NextResponse.json({
      success: true,
      data: activities.slice(0, 4),
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch recent activity' },
      { status: 500 }
    );
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Date(date).toLocaleDateString();
}
