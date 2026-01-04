import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';
import User from '@/models/User';
import { verifyAuth } from '@/middleware/auth';

/**
 * DELETE /api/admin/payments/cleanup-old
 * Cleanup old payments with invalid package types (admin only)
 */
export async function DELETE(request: NextRequest) {
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

    // Find all payments with old package types
    const oldPayments = await (Payment as any).find({
      packageType: { $in: ['basic', 'plus', 'enterprise'] }
    });

    console.log(`[CLEANUP] Found ${oldPayments.length} payments with old package types`);

    // Delete all pending old payments
    const deleteResult = await (Payment as any).deleteMany({
      packageType: { $in: ['basic', 'plus', 'enterprise'] },
      status: { $in: ['pending_payment', 'pending_verification'] }
    });

    console.log(`[CLEANUP] Deleted ${deleteResult.deletedCount} pending old payments`);

    // Update approved old payments to 'pro' type
    const updateResult = await (Payment as any).updateMany(
      {
        packageType: { $in: ['basic', 'plus', 'enterprise'] },
        status: 'approved'
      },
      {
        $set: { 
          packageType: 'pro',
          packageName: 'KaryaKlik Pro'
        }
      }
    );

    console.log(`[CLEANUP] Updated ${updateResult.modifiedCount} approved old payments to 'pro' type`);

    return NextResponse.json({
      success: true,
      message: 'Old payments cleaned up successfully',
      deleted: deleteResult.deletedCount,
      updated: updateResult.modifiedCount,
      total: oldPayments.length,
    });

  } catch (error) {
    console.error('[DELETE /api/admin/payments/cleanup-old] Error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup old payments' },
      { status: 500 }
    );
  }
}
