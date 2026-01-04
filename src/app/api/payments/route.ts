import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';
import User from '@/models/User';
import { verifyAuth } from '@/middleware/auth';

/**
 * POST /api/payments/create
 * Create new payment request setelah user pilih paket
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authUser = await verifyAuth(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { packageName, packageType, amount, durationMonths } = body;

    // Validasi required fields
    if (!packageName || !packageType || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: packageName, packageType, amount' },
        { status: 400 }
      );
    }

    // Validasi package type
    if (packageType !== 'pro') {
      return NextResponse.json(
        { error: 'Invalid package type. Only "pro" is supported.' },
        { status: 400 }
      );
    }

    // Cek apakah user sudah punya pending payment
    const existingPending = await (Payment as any).findOne({
      userId: authUser.userId,
      status: { $in: ['pending_payment', 'pending_verification'] },
    });

    if (existingPending) {
      return NextResponse.json(
        { 
          error: 'You already have a pending payment request',
          payment: existingPending,
        },
        { status: 400 }
      );
    }

    // Create payment record
    const payment = new Payment({
      userId: authUser.userId,
      packageName,
      packageType,
      amount,
      durationMonths: durationMonths || 1,
      status: 'pending_payment', // Menunggu user upload bukti
    });

    await payment.save();

    console.log('[POST /api/payments] Payment created:', {
      id: payment._id,
      userId: authUser.userId,
      packageName,
      packageType,
      amount,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment request created. Please upload payment proof.',
      payment: {
        _id: payment._id,
        packageName: payment.packageName,
        packageType: payment.packageType,
        amount: payment.amount,
        durationMonths: payment.durationMonths,
        status: payment.status,
        bankName: payment.bankName,
        bankAccountNumber: payment.bankAccountNumber,
        bankAccountName: payment.bankAccountName,
        createdAt: payment.createdAt,
      },
    });

  } catch (error) {
    console.error('[POST /api/payments/create] Error:', error);
    if (error instanceof Error) {
      console.error('[POST /api/payments/create] Error message:', error.message);
      console.error('[POST /api/payments/create] Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Failed to create payment request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/user
 * Get user's payment history and current pending payment
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const authUser = await verifyAuth(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const payments = await (Payment as any).find({ userId: authUser.userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      payments,
    });

  } catch (error) {
    console.error('[GET /api/payments/user] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
