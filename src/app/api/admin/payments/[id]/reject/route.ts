import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';
import User from '@/models/User';
import { verifyAuth } from '@/middleware/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * PUT /api/admin/payments/[id]/reject
 * Reject payment dan beri alasan penolakan
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
    const admin = await (User as any).findById(authUser.userId);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { rejectionReason, adminNotes } = body;

    if (!rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Find payment
    const payment = await (Payment as any).findById(id);
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check if payment can be rejected
    if (payment.status !== 'pending_verification') {
      return NextResponse.json(
        { error: 'Only pending payments can be rejected' },
        { status: 400 }
      );
    }

    // Update payment status
    payment.status = 'rejected';
    payment.rejectionReason = rejectionReason;
    payment.rejectedBy = authUser.userId;
    payment.rejectedAt = new Date();
    if (adminNotes) {
      payment.adminNotes = adminNotes;
    }
    await payment.save();

    console.log(`[ADMIN] Payment rejected: ${payment._id} - Reason: ${rejectionReason}`);

    return NextResponse.json({
      success: true,
      message: 'Payment rejected',
      payment: {
        _id: payment._id,
        status: payment.status,
        rejectionReason: payment.rejectionReason,
        rejectedAt: payment.rejectedAt,
        rejectedBy: admin.name,
      },
    });

  } catch (error) {
    console.error('[PUT /api/admin/payments/:id/reject] Error:', error);
    return NextResponse.json(
      { error: 'Failed to reject payment' },
      { status: 500 }
    );
  }
}
