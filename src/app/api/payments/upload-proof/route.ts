import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';
import { verifyAuth } from '@/middleware/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

/**
 * POST /api/payments/upload-proof
 * Upload bukti pembayaran (screenshot transfer)
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

    const formData = await request.formData();
    const file = formData.get('paymentProof') as File;
    const paymentId = formData.get('paymentId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'Payment proof file is required' },
        { status: 400 }
      );
    }

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Validasi file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPG and PNG files are allowed' },
        { status: 400 }
      );
    }

    // Validasi file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Find payment
    const payment = await (Payment as any).findById(paymentId);
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (payment.userId.toString() !== authUser.userId) {
      return NextResponse.json(
        { error: 'Unauthorized to upload proof for this payment' },
        { status: 403 }
      );
    }

    // Check if payment can accept proof upload
    if (!['pending_payment', 'rejected'].includes(payment.status)) {
      return NextResponse.json(
        { error: 'Payment is not in a state that can accept proof upload' },
        { status: 400 }
      );
    }

    // Create upload directory if not exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'payment-proofs');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = path.extname(file.name);
    const fileName = `payment-${payment._id}-${timestamp}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Update payment dengan proof URL
    const proofUrl = `/uploads/payment-proofs/${fileName}`;
    payment.paymentProofUrl = proofUrl;
    payment.paymentProofUploadedAt = new Date();
    payment.status = 'pending_verification'; // Change status to pending verification
    await payment.save();

    return NextResponse.json({
      success: true,
      message: 'Payment proof uploaded successfully. Waiting for admin verification.',
      payment: {
        _id: payment._id,
        status: payment.status,
        paymentProofUrl: payment.paymentProofUrl,
        paymentProofUploadedAt: payment.paymentProofUploadedAt,
      },
    });

  } catch (error) {
    console.error('[POST /api/payments/upload-proof] Error:', error);
    return NextResponse.json(
      { error: 'Failed to upload payment proof' },
      { status: 500 }
    );
  }
}
