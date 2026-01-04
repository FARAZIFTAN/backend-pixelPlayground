import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';
import { verifyAuth } from '@/middleware/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * DELETE /api/payments/[id]/cancel
 * Cancel pending payment (only for pending_payment status)
 */
export async function DELETE(
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

    const { id } = params;

    // Find payment
    const payment = await (Payment as any).findById(id);
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (payment.userId.toString() !== authUser.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Only allow canceling pending payments (or force cancel if old package type)
    const isOldPackageType = !['pro'].includes(payment.packageType);
    
    if (payment.status !== 'pending_payment' && !isOldPackageType) {
      return NextResponse.json(
        { error: 'Can only cancel pending payments (before proof upload)' },
        { status: 400 }
      );
    }

    // Delete payment
    await (Payment as any).findByIdAndDelete(id);

    console.log(`[PAYMENT] Canceled: ${id} by user: ${authUser.userId}`);

    return NextResponse.json({
      success: true,
      message: 'Payment canceled successfully',
    });

  } catch (error) {
    console.error('[DELETE /api/payments/:id/cancel] Error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel payment' },
      { status: 500 }
    );
  }
}
