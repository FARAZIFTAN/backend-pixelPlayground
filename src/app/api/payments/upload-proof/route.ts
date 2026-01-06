import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';
import User from '@/models/User';
import { verifyAuth } from '@/middleware/auth';
import { cloudStorageService } from '@/lib/cloudStorage';
import { notificationService } from '@/lib/notificationService';
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

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const timestamp = Date.now();
    
    let proofUrl: string;

    // Try to upload to Cloudinary first
    const uploadResult = await cloudStorageService.uploadBuffer(buffer, {
      folder: 'pixelplayground/payment-proofs',
      publicId: `payment-${payment._id}-${timestamp}`,
      resourceType: 'image',
    });

    if (uploadResult.success && uploadResult.secure_url) {
      proofUrl = uploadResult.secure_url;
      console.log('✅ Payment proof uploaded to Cloudinary:', proofUrl);
    } else {
      // Fallback to local storage if Cloudinary fails
      console.log('⚠️ Cloudinary upload failed, falling back to local storage');
      
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'payment-proofs');
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const fileExt = path.extname(file.name);
      const fileName = `payment-${payment._id}-${timestamp}${fileExt}`;
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      proofUrl = `/uploads/payment-proofs/${fileName}`;
    }

    // Update payment dengan proof URL
    payment.paymentProofUrl = proofUrl;
    payment.paymentProofUploadedAt = new Date();
    payment.status = 'pending_verification'; // Change status to pending verification
    await payment.save();

    // Get user info for notification
    const user = await (User as any).findById(authUser.userId).select('name email');
    
    // Notify all admins about new payment proof
    try {
      await notificationService.notifyAllAdmins(
        '💰 Bukti Pembayaran Baru',
        `${user?.name || 'User'} (${user?.email}) telah mengupload bukti pembayaran untuk paket ${payment.packageName} (Rp ${payment.amount.toLocaleString('id-ID')}). Silakan verifikasi.`,
        'system',
        {
          paymentId: payment._id,
          userId: authUser.userId,
          userName: user?.name,
          userEmail: user?.email,
          packageName: payment.packageName,
          amount: payment.amount,
          action: 'payment_proof_uploaded',
        }
      );
      console.log('[NOTIFICATION] Payment proof notification sent to admins');
    } catch (notifError) {
      console.error('[NOTIFICATION] Failed to notify admins:', notifError);
      // Don't fail the request if notification fails
    }

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
