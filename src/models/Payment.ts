import { Schema, model, models, Document } from 'mongoose';

export interface IPayment extends Document {
  userId: Schema.Types.ObjectId;
  packageName: string;
  packageType: 'pro';
  amount: number;
  durationMonths: number;
  
  // Bank Transfer Details
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  
  // Payment Proof
  paymentProofUrl?: string;
  paymentProofUploadedAt?: Date;
  
  // Status
  status: 'pending_payment' | 'pending_verification' | 'approved' | 'rejected';
  rejectionReason?: string;
  adminNotes?: string;
  
  // Admin Action
  approvedBy?: Schema.Types.ObjectId;
  approvedAt?: Date;
  rejectedBy?: Schema.Types.ObjectId;
  rejectedAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    packageName: {
      type: String,
      required: [true, 'Package name is required'],
      enum: ['KaryaKlik Pro'],
    },
    packageType: {
      type: String,
      required: [true, 'Package type is required'],
      enum: ['pro'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    durationMonths: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    
    // Bank Transfer Details
    bankName: {
      type: String,
      required: false,
      default: 'Bank BCA',
    },
    bankAccountNumber: {
      type: String,
      required: false,
      default: '1234567890',
    },
    bankAccountName: {
      type: String,
      required: false,
      default: 'PT KaryaKlik Indonesia',
    },
    
    // Payment Proof
    paymentProofUrl: {
      type: String,
    },
    paymentProofUploadedAt: {
      type: Date,
    },
    
    // Status
    status: {
      type: String,
      required: true,
      enum: ['pending_payment', 'pending_verification', 'approved', 'rejected'],
      default: 'pending_payment',
      index: true,
    },
    rejectionReason: {
      type: String,
    },
    adminNotes: {
      type: String,
    },
    
    // Admin Action
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ createdAt: -1 });

// Delete cached model to ensure schema updates are applied
if (models.Payment) {
  delete models.Payment;
}

const Payment = model<IPayment>('Payment', paymentSchema);

export default Payment;
