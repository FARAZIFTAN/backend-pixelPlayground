import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PaymentRepository } from '../PaymentRepository';
import Payment from '../../models/Payment';
import { ObjectId } from 'mongodb';

// Mock Payment model dengan struktur yang benar
jest.mock('../../models/Payment');

const mockPaymentModel = Payment as jest.Mocked<typeof Payment>;

// Fungsi helper untuk membuat mock query chain
const createMockQueryChain = (execResult: any, populateResult: any | null = null, sortResult: any | null = null, limitResult: any | null = null, skipResult: any | null = null) => {
  const mockExec = jest.fn().mockResolvedValue(execResult);
  const mockPopulate = jest.fn().mockReturnValue(populateResult || { exec: mockExec });
  const mockSort = jest.fn().mockReturnValue(sortResult || { exec: mockExec });
  const mockLimit = jest.fn().mockReturnValue(limitResult || { exec: mockExec });
  const mockSkip = jest.fn().mockReturnValue(skipResult || { exec: mockExec });

  return {
    exec: mockExec,
    populate: mockPopulate,
    sort: mockSort,
    limit: mockLimit,
    skip: mockSkip,
  };
};

describe('PaymentRepository', () => {
  let repository: PaymentRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PaymentRepository();
  });

  describe('create', () => {
    it('should create new payment', async () => {
      const paymentData = {
        userId: '507f1f77bcf86cd799439011',
        amount: 50000,
        status: 'pending' as const,
        proofImage: 'proof.jpg'
      };

      const mockSave = jest.fn().mockResolvedValue({ ...paymentData, _id: 'payment123' });
      (mockPaymentModel as any).mockImplementation((data) => ({ ...data, save: mockSave }));

      const result = await repository.create(paymentData);

      expect(result).toHaveProperty('_id', 'payment123');
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find payment by ID', async () => {
      const mockPaymentDoc: any = {
        _id: 'payment123',
        userId: 'user123',
        amount: 50000,
        status: 'approved'
      };

      const chain = createMockQueryChain(mockPaymentDoc);
      mockPaymentModel.findById = jest.fn().mockReturnValue({ populate: chain.populate });
      (mockPaymentModel.findById as jest.Mock).mockReturnThis();
      (mockPaymentModel.findById as jest.Mock).mockImplementation(() => ({ populate: chain.populate }));

      const result = await repository.findById('payment123');

      expect(mockPaymentModel.findById).toHaveBeenCalledWith('payment123');
      expect(chain.populate).toHaveBeenCalledWith('userId', 'name email');
      expect(result).toEqual(mockPaymentDoc);
    });

    it('should return null for non-existent ID', async () => {
      const chain = createMockQueryChain(null);
      mockPaymentModel.findById = jest.fn().mockReturnValue({ populate: chain.populate });

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const chain = createMockQueryChain(Promise.reject(new Error('Database error')));
      mockPaymentModel.findById = jest.fn().mockReturnValue({ populate: chain.populate });

      const result = await repository.findById('payment123');

      expect(result).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should find one payment by filter', async () => {
      const mockPaymentDoc = { _id: 'payment123', userId: 'user123' };
      const chain = createMockQueryChain(mockPaymentDoc);
      mockPaymentModel.findOne = jest.fn().mockReturnValue({ populate: chain.populate });

      const result = await repository.findOne({ userId: 'user123' });

      expect(mockPaymentModel.findOne).toHaveBeenCalledWith({ userId: 'user123' });
      expect(result).toEqual(mockPaymentDoc);
    });

    it('should return null when no payment matches', async () => {
      const chain = createMockQueryChain(null);
      mockPaymentModel.findOne = jest.fn().mockReturnValue({ populate: chain.populate });

      const result = await repository.findOne({ userId: 'nonexistent' });

      expect(result).toBeNull();
    });

    it('should handle errors and return null', async () => {
      const chain = createMockQueryChain(Promise.reject(new Error('Find failed')));
      mockPaymentModel.findOne = jest.fn().mockReturnValue({ populate: chain.populate });

      const result = await repository.findOne({ userId: 'user123' });

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find payments by user ID', async () => {
      const mockPayments = [
        { _id: 'payment1', userId: 'user123', amount: 50000 },
        { _id: 'payment2', userId: 'user123', amount: 75000 }
      ];

      const mockExec = jest.fn().mockResolvedValue(mockPayments);
      const mockLimit = jest.fn().mockReturnValue({ exec: mockExec });
      const mockSort = jest.fn().mockReturnValue({ limit: mockLimit });
      mockPaymentModel.find = jest.fn().mockReturnValue({ sort: mockSort });

      const result = await repository.findByUserId('user123');

      expect(mockPaymentModel.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockLimit).toHaveBeenCalledWith(50);
      expect(result).toHaveLength(2);
    });

    it('should return empty array for user with no payments', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn().mockReturnValue({ exec: mockExec });
      const mockSort = jest.fn().mockReturnValue({ limit: mockLimit });
      mockPaymentModel.find = jest.fn().mockReturnValue({ sort: mockSort });

      const result = await repository.findByUserId('user456');

      expect(result).toEqual([]);
    });

    it('should handle errors and return empty array', async () => {
      const error = new Error('Database error');
      const mockExec = jest.fn().mockRejectedValue(error);
      const mockLimit = jest.fn().mockReturnValue({ exec: mockExec });
      const mockSort = jest.fn().mockReturnValue({ limit: mockLimit });
      mockPaymentModel.find = jest.fn().mockReturnValue({ sort: mockSort });

      const result = await repository.findByUserId('user123');

      expect(result).toEqual([]);
    });
  });

  describe('findByStatus', () => {
    it('should find payments by status', async () => {
      const mockPayments = [
        { _id: 'payment1', status: 'approved', amount: 50000 },
        { _id: 'payment2', status: 'approved', amount: 75000 }
      ];

      const mockExec = jest.fn().mockResolvedValue(mockPayments);
      const mockLimit = jest.fn().mockReturnValue({ exec: mockExec });
      const mockSort = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort });
      mockPaymentModel.find = jest.fn().mockReturnValue({ populate: mockPopulate });

      const result = await repository.findByStatus('approved');

      expect(mockPaymentModel.find).toHaveBeenCalledWith({ status: 'approved' });
      expect(mockPopulate).toHaveBeenCalledWith('userId', 'name email');
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockLimit).toHaveBeenCalledWith(100);
      expect(result).toHaveLength(2);
    });

    it('should return empty array for status with no payments', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn().mockReturnValue({ exec: mockExec });
      const mockSort = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort });
      mockPaymentModel.find = jest.fn().mockReturnValue({ populate: mockPopulate });

      const result = await repository.findByStatus('pending');

      expect(result).toEqual([]);
    });

    it('should handle errors and return empty array', async () => {
      const error = new Error('Database error');
      const mockExec = jest.fn().mockRejectedValue(error);
      const mockLimit = jest.fn().mockReturnValue({ exec: mockExec });
      const mockSort = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort });
      mockPaymentModel.find = jest.fn().mockReturnValue({ populate: mockPopulate });

      const result = await repository.findByStatus('approved');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update payment', async () => {
      const updateData = { status: 'approved' as const };
      const mockUpdatedPayment = {
        _id: 'payment123',
        status: 'approved',
        amount: 50000
      };

      const chain = createMockQueryChain(mockUpdatedPayment);
      mockPaymentModel.findByIdAndUpdate = jest.fn().mockReturnValue({ populate: chain.populate });

      const result = await repository.update('payment123', updateData);

      expect(mockPaymentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'payment123',
        updateData,
        { new: true, runValidators: true }
      );
      expect(result).toEqual(mockUpdatedPayment);
    });

    it('should return null for non-existent payment', async () => {
      const chain = createMockQueryChain(null);
      mockPaymentModel.findByIdAndUpdate = jest.fn().mockReturnValue({ populate: chain.populate });

      const result = await repository.update('nonexistent', { status: 'approved' });

      expect(result).toBeNull();
    });

    it('should handle errors and return null', async () => {
      const chain = createMockQueryChain(Promise.reject(new Error('Update failed')));
      mockPaymentModel.findByIdAndUpdate = jest.fn().mockReturnValue({ populate: chain.populate });

      const result = await repository.update('payment123', { status: 'approved' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete payment', async () => {
      const chain = createMockQueryChain({ _id: 'payment123' });
      mockPaymentModel.findByIdAndDelete = jest.fn().mockReturnValue({ exec: chain.exec });

      const result = await repository.delete('payment123');

      expect(mockPaymentModel.findByIdAndDelete).toHaveBeenCalledWith('payment123');
      expect(result).toBe(true);
    });

    it('should return false for non-existent payment', async () => {
      const chain = createMockQueryChain(null);
      mockPaymentModel.findByIdAndDelete = jest.fn().mockReturnValue({ exec: chain.exec });

      const result = await repository.delete('nonexistent');

      expect(result).toBe(false);
    });

    it('should handle errors and return false', async () => {
      const chain = createMockQueryChain(Promise.reject(new Error('Delete failed')));
      mockPaymentModel.findByIdAndDelete = jest.fn().mockReturnValue({ exec: chain.exec });

      const result = await repository.delete('payment123');

      expect(result).toBe(false);
    });
  });

  describe('findMany', () => {
    it('should find payments with filter and pagination', async () => {
      const mockPayments = [
        { _id: 'payment1', amount: 50000, status: 'approved' },
        { _id: 'payment2', amount: 75000, status: 'approved' }
      ];

      const chain = createMockQueryChain(mockPayments);
      mockPaymentModel.find = jest.fn().mockReturnValue({ populate: chain.populate });
      (chain.populate as jest.Mock).mockReturnValue({ sort: chain.sort });
      (chain.sort as jest.Mock).mockReturnValue({ limit: chain.limit });
      (chain.limit as jest.Mock).mockReturnValue({ skip: chain.skip });
      (chain.skip as jest.Mock).mockReturnValue({ exec: chain.exec });

      const result = await repository.findMany({ status: 'approved' }, 10, 0);

      expect(mockPaymentModel.find).toHaveBeenCalledWith({ status: 'approved' });
      expect(result).toHaveLength(2);
    });

    it('should use default pagination values', async () => {
      const chain = createMockQueryChain([]);
      mockPaymentModel.find = jest.fn().mockReturnValue({ populate: chain.populate });
      (chain.populate as jest.Mock).mockReturnValue({ sort: chain.sort });
      (chain.sort as jest.Mock).mockReturnValue({ limit: chain.limit });
      (chain.limit as jest.Mock).mockReturnValue({ skip: chain.skip });
      (chain.skip as jest.Mock).mockReturnValue({ exec: chain.exec });

      await repository.findMany({});

      expect(chain.limit).toHaveBeenCalledWith(100);
      expect(chain.skip).toHaveBeenCalledWith(0);
    });

    it('should handle errors and return empty array', async () => {
      const chain = createMockQueryChain(Promise.reject(new Error('Find failed')));
      mockPaymentModel.find = jest.fn().mockReturnValue({ populate: chain.populate });
      (chain.populate as jest.Mock).mockReturnValue({ sort: chain.sort });
      (chain.sort as jest.Mock).mockReturnValue({ limit: chain.limit });
      (chain.limit as jest.Mock).mockReturnValue({ skip: chain.skip });
      (chain.skip as jest.Mock).mockReturnValue({ exec: chain.exec });

      const result = await repository.findMany({});

      expect(result).toEqual([]);
    });
  });

  describe('count', () => {
    it('should count payments with filter', async () => {
      const mockExec = jest.fn().mockResolvedValue(42);
      mockPaymentModel.countDocuments = jest.fn().mockReturnValue({ exec: mockExec });

      const result = await repository.count({ status: 'approved' });

      expect(mockPaymentModel.countDocuments).toHaveBeenCalledWith({ status: 'approved' });
      expect(result).toBe(42);
    });

    it('should return 0 when no payments match', async () => {
      const mockExec = jest.fn().mockResolvedValue(0);
      mockPaymentModel.countDocuments = jest.fn().mockReturnValue({ exec: mockExec });

      const result = await repository.count({ status: 'rejected' });

      expect(result).toBe(0);
    });

    it('should handle errors and return 0', async () => {
      const mockExec = jest.fn().mockRejectedValue(new Error('Count failed'));
      mockPaymentModel.countDocuments = jest.fn().mockReturnValue({ exec: mockExec });

      const result = await repository.count({});

      expect(result).toBe(0);
    });
  });
});