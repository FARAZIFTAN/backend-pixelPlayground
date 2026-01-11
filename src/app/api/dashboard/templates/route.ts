import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FinalComposite from '@/models/FinalComposite';
import { verifyAdmin } from '@/middleware/admin';

// This route uses request headers for admin verification — force dynamic
export const dynamic = 'force-dynamic';

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

    // Get recent composites with template info
    // @ts-ignore - Mongoose types can be complex
    const recentComposites = await FinalComposite.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('templateId createdAt likes views metadata')
      .lean()
      .exec();

    // Group by templateId and get unique templates
    const templateMap = new Map<string, any>();
    
    recentComposites.forEach((composite: any) => {
      if (composite.templateId && !templateMap.has(composite.templateId)) {
        templateMap.set(composite.templateId, {
          name: composite.templateId,
          photoCount: 1,
          lastUpdated: composite.createdAt,
        });
      } else if (composite.templateId) {
        const existing = templateMap.get(composite.templateId);
        existing.photoCount += 1;
      }
    });

    // Convert to array and format
    const templates = Array.from(templateMap.values()).slice(0, 3).map((template: any, index: number) => ({
      id: index + 1,
      name: template.name || `Template ${index + 1}`,
      category: 'Photo Template',
      photos: template.photoCount,
      status: 'Active',
      lastUpdated: template.lastUpdated,
    }));

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Error fetching recent templates:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch recent templates' },
      { status: 500 }
    );
  }
}
