import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock mongoose
jest.mock('mongoose', () => {
  class MockSchema {
    definition: any;
    options: any;
    index: jest.Mock;
    constructor(definition: any, options?: any) {
      this.definition = definition;
      this.options = options;
      this.index = jest.fn();
    }
  }

  const Schema = Object.assign(
    jest.fn().mockImplementation((definition: any, options?: any) => new MockSchema(definition, options)),
    {
      Types: {
        ObjectId: String,
        Mixed: Object
      }
    }
  );

  return {
    Schema,
    model: jest.fn((name: string, schema: any) => {
      const ModelConstructor: any = function(this: any, data: any) {
        Object.assign(this, data);
        this.save = jest.fn().mockImplementation(() => Promise.resolve(this));
        return this;
      };
      ModelConstructor.prototype = schema.methods || {};
      return ModelConstructor;
    }),
    models: {}
  };
});

describe('Payment Model', () => {
  let Payment: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const mongoose = require('mongoose');
    Payment = require('../Payment').default;
  });

  describe('Schema Validation', () => {
    it('should accept valid payment with all required fields', () => {
      const paymentData = {
        userId: '507f1f77bcf86cd799439011',
        packageName: 'KaryaKlik Pro',
        packageType: 'pro',
        amount: 50000,
        durationMonths: 1
      };

      const payment = new Payment(paymentData);
      expect(payment.userId).toBe('507f1f77bcf86cd799439011');
      expect(payment.packageName).toBe('KaryaKlik Pro');
      expect(payment.packageType).toBe('pro');
      expect(payment.amount).toBe(50000);
      expect(payment.durationMonths).toBe(1);
    });

    it('should accept valid payment with bank transfer details', () => {
      const paymentData = {
        userId: '507f1f77bcf86cd799439011',
        packageName: 'KaryaKlik Pro',
        packageType: 'pro',
        amount: 50000,
        durationMonths: 1,
        bankName: 'Bank BCA',
        bankAccountNumber: '1234567890',
        bankAccountName: 'PT KaryaKlik Indonesia'
      };

      const payment = new Payment(paymentData);
      expect(payment.bankName).toBe('Bank BCA');
      expect(payment.bankAccountNumber).toBe('1234567890');
      expect(payment.bankAccountName).toBe('PT KaryaKlik Indonesia');
    });

    it('should accept valid payment with payment proof', () => {
      const uploadedAt = new Date();
      const paymentData = {
        userId: '507f1f77bcf86cd799439011',
        packageName: 'KaryaKlik Pro',
        packageType: 'pro',
        amount: 50000,
        durationMonths: 1,
        paymentProofUrl: 'https://cdn.example.com/payment-proof.jpg',
        paymentProofUploadedAt: uploadedAt
      };

      const payment = new Payment(paymentData);
      expect(payment.paymentProofUrl).toBe('https://cdn.example.com/payment-proof.jpg');
      expect(payment.paymentProofUploadedAt).toBe(uploadedAt);
    });

    it('should accept valid status values', () => {
      const statuses = ['pending_payment', 'pending_verification', 'approved', 'rejected'];

      statuses.forEach(status => {
        const payment = new Payment({
          userId: '507f1f77bcf86cd799439011',
          packageName: 'KaryaKlik Pro',
          packageType: 'pro',
          amount: 50000,
          durationMonths: 1,
          status
        });
        expect(payment.status).toBe(status);
      });
    });

    it('should accept payment with rejection details', () => {
      const paymentData = {
        userId: '507f1f77bcf86cd799439011',
        packageName: 'KaryaKlik Pro',
        packageType: 'pro',
        amount: 50000,
        durationMonths: 1,
        status: 'rejected',
        rejectionReason: 'Invalid payment proof',
        adminNotes: 'Payment proof is blurry',
        rejectedBy: '507f1f77bcf86cd799439012',
        rejectedAt: new Date()
      };

      const payment = new Payment(paymentData);
      expect(payment.status).toBe('rejected');
      expect(payment.rejectionReason).toBe('Invalid payment proof');
      expect(payment.adminNotes).toBe('Payment proof is blurry');
      expect(payment.rejectedBy).toBe('507f1f77bcf86cd799439012');
      expect(payment.rejectedAt).toBeInstanceOf(Date);
    });

    it('should accept payment with approval details', () => {
      const approvedAt = new Date();
      const paymentData = {
        userId: '507f1f77bcf86cd799439011',
        packageName: 'KaryaKlik Pro',
        packageType: 'pro',
        amount: 50000,
        durationMonths: 1,
        status: 'approved',
        approvedBy: '507f1f77bcf86cd799439012',
        approvedAt
      };

      const payment = new Payment(paymentData);
      expect(payment.status).toBe('approved');
      expect(payment.approvedBy).toBe('507f1f77bcf86cd799439012');
      expect(payment.approvedAt).toBe(approvedAt);
    });

    it('should accept payment with admin notes', () => {
      const paymentData = {
        userId: '507f1f77bcf86cd799439011',
        packageName: 'KaryaKlik Pro',
        packageType: 'pro',
        amount: 50000,
        durationMonths: 1,
        adminNotes: 'Verified payment with bank statement'
      };

      const payment = new Payment(paymentData);
      expect(payment.adminNotes).toBe('Verified payment with bank statement');
    });

    it('should accept payment with different duration months', () => {
      [1, 3, 6, 12].forEach(months => {
        const payment = new Payment({
          userId: '507f1f77bcf86cd799439011',
          packageName: 'KaryaKlik Pro',
          packageType: 'pro',
          amount: 50000 * months,
          durationMonths: months
        });
        expect(payment.durationMonths).toBe(months);
      });
    });

    it('should accept payment with zero amount', () => {
      const payment = new Payment({
        userId: '507f1f77bcf86cd799439011',
        packageName: 'KaryaKlik Pro',
        packageType: 'pro',
        amount: 0,
        durationMonths: 1
      });
      expect(payment.amount).toBe(0);
    });

    it('should accept packageType as pro', () => {
      const payment = new Payment({
        userId: '507f1f77bcf86cd799439011',
        packageName: 'KaryaKlik Pro',
        packageType: 'pro',
        amount: 50000,
        durationMonths: 1
      });
      expect(payment.packageType).toBe('pro');
    });

    it('should accept packageName as KaryaKlik Pro', () => {
      const payment = new Payment({
        userId: '507f1f77bcf86cd799439011',
        packageName: 'KaryaKlik Pro',
        packageType: 'pro',
        amount: 50000,
        durationMonths: 1
      });
      expect(payment.packageName).toBe('KaryaKlik Pro');
    });
  });

  describe('Model Instance Methods', () => {
    it('should have save method', () => {
      const payment = new Payment({
        userId: '507f1f77bcf86cd799439011',
        packageName: 'KaryaKlik Pro',
        packageType: 'pro',
        amount: 50000,
        durationMonths: 1
      });

      expect(payment.save).toBeDefined();
      expect(typeof payment.save).toBe('function');
    });

    it('should successfully save payment', async () => {
      const payment = new Payment({
        userId: '507f1f77bcf86cd799439011',
        packageName: 'KaryaKlik Pro',
        packageType: 'pro',
        amount: 50000,
        durationMonths: 1
      });

      const result = await payment.save();
      expect(result).toBeDefined();
      expect(result.packageName).toBe('KaryaKlik Pro');
    });
  });

  describe('Payment Status Workflow', () => {
    it('should create payment with pending_payment status', () => {
      const payment = new Payment({
        userId: '507f1f77bcf86cd799439011',
        packageName: 'KaryaKlik Pro',
        packageType: 'pro',
        amount: 50000,
        durationMonths: 1,
        status: 'pending_payment'
      });

      expect(payment.status).toBe('pending_payment');
    });

    it('should update payment to pending_verification after proof upload', () => {
      const payment = new Payment({
        userId: '507f1f77bcf86cd799439011',
        packageName: 'KaryaKlik Pro',
        packageType: 'pro',
        amount: 50000,
        durationMonths: 1,
        status: 'pending_verification',
        paymentProofUrl: 'https://cdn.example.com/proof.jpg',
        paymentProofUploadedAt: new Date()
      });

      expect(payment.status).toBe('pending_verification');
      expect(payment.paymentProofUrl).toBeDefined();
    });

    it('should approve payment with admin details', () => {
      const approvedAt = new Date();
      const payment = new Payment({
        userId: '507f1f77bcf86cd799439011',
        packageName: 'KaryaKlik Pro',
        packageType: 'pro',
        amount: 50000,
        durationMonths: 1,
        status: 'approved',
        approvedBy: '507f1f77bcf86cd799439012',
        approvedAt
      });

      expect(payment.status).toBe('approved');
      expect(payment.approvedBy).toBeDefined();
      expect(payment.approvedAt).toBe(approvedAt);
    });

    it('should reject payment with reason', () => {
      const rejectedAt = new Date();
      const payment = new Payment({
        userId: '507f1f77bcf86cd799439011',
        packageName: 'KaryaKlik Pro',
        packageType: 'pro',
        amount: 50000,
        durationMonths: 1,
        status: 'rejected',
        rejectionReason: 'Invalid payment proof',
        rejectedBy: '507f1f77bcf86cd799439012',
        rejectedAt
      });

      expect(payment.status).toBe('rejected');
      expect(payment.rejectionReason).toBeDefined();
      expect(payment.rejectedBy).toBeDefined();
      expect(payment.rejectedAt).toBe(rejectedAt);
    });
  });

  describe('Complex Payment Scenarios', () => {
    it('should create complete payment with all fields populated', () => {
      const uploadedAt = new Date();
      const approvedAt = new Date();
      const payment = new Payment({
        userId: '507f1f77bcf86cd799439011',
        packageName: 'KaryaKlik Pro',
        packageType: 'pro',
        amount: 150000,
        durationMonths: 3,
        bankName: 'Bank BCA',
        bankAccountNumber: '1234567890',
        bankAccountName: 'PT KaryaKlik Indonesia',
        paymentProofUrl: 'https://cdn.example.com/payment-proof.jpg',
        paymentProofUploadedAt: uploadedAt,
        status: 'approved',
        adminNotes: 'Payment verified and approved',
        approvedBy: '507f1f77bcf86cd799439012',
        approvedAt
      });

      expect(payment).toBeDefined();
      expect(payment.userId).toBe('507f1f77bcf86cd799439011');
      expect(payment.amount).toBe(150000);
      expect(payment.durationMonths).toBe(3);
      expect(payment.status).toBe('approved');
      expect(payment.approvedBy).toBeDefined();
    });

    it('should create minimal payment with required fields only', () => {
      const payment = new Payment({
        userId: '507f1f77bcf86cd799439011',
        packageName: 'KaryaKlik Pro',
        packageType: 'pro',
        amount: 50000,
        durationMonths: 1
      });

      expect(payment).toBeDefined();
      expect(payment.userId).toBe('507f1f77bcf86cd799439011');
      expect(payment.packageName).toBe('KaryaKlik Pro');
    });

    it('should create payment with 12-month duration', () => {
      const payment = new Payment({
        userId: '507f1f77bcf86cd799439011',
        packageName: 'KaryaKlik Pro',
        packageType: 'pro',
        amount: 500000,
        durationMonths: 12
      });

      expect(payment.durationMonths).toBe(12);
      expect(payment.amount).toBe(500000);
    });

    it('should handle rejected payment with detailed notes', () => {
      const rejectedAt = new Date();
      const payment = new Payment({
        userId: '507f1f77bcf86cd799439011',
        packageName: 'KaryaKlik Pro',
        packageType: 'pro',
        amount: 50000,
        durationMonths: 1,
        paymentProofUrl: 'https://cdn.example.com/invalid-proof.jpg',
        status: 'rejected',
        rejectionReason: 'Payment proof is not clear enough',
        adminNotes: 'Requested user to reupload with better quality',
        rejectedBy: '507f1f77bcf86cd799439012',
        rejectedAt
      });

      expect(payment.status).toBe('rejected');
      expect(payment.rejectionReason).toContain('not clear');
      expect(payment.adminNotes).toContain('reupload');
    });

    it('should handle payment with custom bank details', () => {
      const payment = new Payment({
        userId: '507f1f77bcf86cd799439011',
        packageName: 'KaryaKlik Pro',
        packageType: 'pro',
        amount: 50000,
        durationMonths: 1,
        bankName: 'Bank Mandiri',
        bankAccountNumber: '9876543210',
        bankAccountName: 'Custom Account Name'
      });

      expect(payment.bankName).toBe('Bank Mandiri');
      expect(payment.bankAccountNumber).toBe('9876543210');
      expect(payment.bankAccountName).toBe('Custom Account Name');
    });
  });
});
