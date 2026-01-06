import Payment, { IPayment } from '@/models/Payment';
import { FilterQuery, UpdateQuery } from 'mongoose';

/**
 * Payment Repository
 * Abstracts database operations for Payment model
 * Makes payment business logic testable
 */

export interface IPaymentRepository {
  findById(id: string): Promise<IPayment | null>;
  findOne(filter: FilterQuery<IPayment>): Promise<IPayment | null>;
  findByUserId(userId: string, limit?: number): Promise<IPayment[]>;
  findByStatus(status: string, limit?: number): Promise<IPayment[]>;
  create(paymentData: Partial<IPayment>): Promise<IPayment>;
  update(id: string, data: UpdateQuery<IPayment>): Promise<IPayment | null>;
  delete(id: string): Promise<boolean>;
  findMany(filter: FilterQuery<IPayment>, limit?: number, skip?: number): Promise<IPayment[]>;
  count(filter: FilterQuery<IPayment>): Promise<number>;
}

export class PaymentRepository implements IPaymentRepository {
  /**
   * Find payment by ID
   */
  async findById(id: string): Promise<IPayment | null> {
    try {
      return await Payment.findById(id).populate('userId', 'name email').exec();
    } catch (error) {
      console.error('Error finding payment by ID:', error);
      return null;
    }
  }

  /**
   * Find payment by filter
   */
  async findOne(filter: FilterQuery<IPayment>): Promise<IPayment | null> {
    try {
      return await Payment.findOne(filter).populate('userId', 'name email').exec();
    } catch (error) {
      console.error('Error finding payment:', error);
      return null;
    }
  }

  /**
   * Find payments by user ID
   */
  async findByUserId(userId: string, limit: number = 50): Promise<IPayment[]> {
    try {
      return await Payment.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      console.error('Error finding payments by user ID:', error);
      return [];
    }
  }

  /**
   * Find payments by status
   */
  async findByStatus(status: string, limit: number = 100): Promise<IPayment[]> {
    try {
      return await Payment.find({ status })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      console.error('Error finding payments by status:', error);
      return [];
    }
  }

  /**
   * Create new payment
   */
  async create(paymentData: Partial<IPayment>): Promise<IPayment> {
    const payment = new Payment(paymentData);
    return await payment.save();
  }

  /**
   * Update payment by ID
   */
  async update(id: string, data: UpdateQuery<IPayment>): Promise<IPayment | null> {
    try {
      return await Payment.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true }
      )
        .populate('userId', 'name email')
        .exec();
    } catch (error) {
      console.error('Error updating payment:', error);
      return null;
    }
  }

  /**
   * Delete payment
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await Payment.findByIdAndDelete(id).exec();
      return !!result;
    } catch (error) {
      console.error('Error deleting payment:', error);
      return false;
    }
  }

  /**
   * Find multiple payments
   */
  async findMany(
    filter: FilterQuery<IPayment>,
    limit: number = 100,
    skip: number = 0
  ): Promise<IPayment[]> {
    try {
      return await Payment.find(filter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .exec();
    } catch (error) {
      console.error('Error finding payments:', error);
      return [];
    }
  }

  /**
   * Count payments matching filter
   */
  async count(filter: FilterQuery<IPayment>): Promise<number> {
    try {
      return await Payment.countDocuments(filter).exec();
    } catch (error) {
      console.error('Error counting payments:', error);
      return 0;
    }
  }
}

// Export singleton instance for backward compatibility
export const paymentRepository = new PaymentRepository();

// Factory function for testing
export const createPaymentRepository = (): IPaymentRepository => {
  return new PaymentRepository();
};
