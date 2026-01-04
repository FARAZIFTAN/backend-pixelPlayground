import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';
import User from '@/models/User';
import UsageLimit from '@/models/UsageLimit';
import { verifyAuth } from '@/middleware/auth';
import { notificationService } from '@/lib/notificationService';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * PUT /api/admin/payments/[id]/approve
 * Approve payment dan aktifkan akun Pro user
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

    const authUser = await verifyAuth(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const admin = await (User as any).findOne({ _id: authUser.userId });
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { adminNotes } = body;

    // Find payment
    const payment = await (Payment as any).findById(id);
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check if payment can be approved
    if (payment.status !== 'pending_verification') {
      return NextResponse.json(
        { error: 'Only pending payments can be approved' },
        { status: 400 }
      );
    }

    // Find user
    const user = await (User as any).findById(payment.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update payment status
    payment.status = 'approved';
    payment.approvedBy = authUser.userId;
    payment.approvedAt = new Date();
    if (adminNotes) {
      payment.adminNotes = adminNotes;
    }
    await payment.save();

    // Activate user's Pro account
    user.isPremium = true; // Set to true for Pro account
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + payment.durationMonths);
    user.premiumExpiresAt = expiryDate;
    await user.save();

    // Create or update usage limits untuk user
    const today = new Date().toISOString().split('T')[0];
    await UsageLimit.getOrCreateToday(user._id, payment.packageType);

    // Send notification to user
    try {
      await notificationService.createNotification({
        userId: payment.userId,
        title: '🎉 Pembayaran Disetujui!',
        message: `Selamat! Pembayaran untuk ${payment.packageName} (Rp ${payment.amount.toLocaleString('id-ID')}) telah disetujui. Akun Pro Anda aktif hingga ${expiryDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}.`,
        type: 'system',
        data: {
          paymentId: payment._id,
          packageName: payment.packageName,
          amount: payment.amount,
          premiumExpiresAt: expiryDate,
          action: 'payment_approved',
        },
      });
      console.log(`[NOTIFICATION] Payment approval notification sent to user ${payment.userId}`);
    } catch (notifError) {
      console.error('[NOTIFICATION] Failed to send approval notification:', notifError);
      // Don't fail the approval if notification fails
    }

    console.log(`[ADMIN] Payment approved: ${payment._id} for user: ${user.email}`);
    console.log(`[ADMIN] User Pro account activated until: ${expiryDate}`);

    return NextResponse.json({
      success: true,
      message: 'Payment approved and user upgraded to Pro',
      payment: {
        _id: payment._id,
        status: payment.status,
        approvedAt: payment.approvedAt,
        approvedBy: admin.name,
      },
      user: {
        _id: user._id,
        email: user.email,
        isPremium: user.isPremium,
        premiumExpiresAt: user.premiumExpiresAt,
      },
    });

  } catch (error) {
    console.error('[PUT /api/admin/payments/:id/approve] Error:', error);
    return NextResponse.json(
      { error: 'Failed to approve payment' },
      { status: 500 }
    );
  }
}
