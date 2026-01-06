import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { UserRepository, createUserRepository } from '../UserRepository';
import User from '@/models/User';

// Mock the User model
jest.mock('@/models/User');

describe('UserRepository', () => {
  let repository: UserRepository;
  
  // Mock query chains
  const mockExec: any = jest.fn();
  const mockSelect: any = jest.fn();
  const mockLimit: any = jest.fn();
  const mockSkip: any = jest.fn();
  const mockFindQuery = {
    select: mockSelect,
    exec: mockExec,
    limit: mockLimit,
    skip: mockSkip,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new UserRepository();
    
    // Reset exec mock
    mockExec.mockReset();
    mockSelect.mockReset();
    mockLimit.mockReset();
    mockSkip.mockReset();
  });

  describe('Constructor and Instance', () => {
    it('should create repository instance', () => {
      expect(repository).toBeInstanceOf(UserRepository);
    });

    it('should create repository via factory function', () => {
      const repo = createUserRepository();
      expect(repo).toBeInstanceOf(UserRepository);
    });
  });

  describe('findById', () => {
    it('should find user by ID successfully', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      };
      
      mockExec.mockResolvedValue(mockUser);
      (User as any).findById = jest.fn(() => mockFindQuery);

      const result = await repository.findById('user123');

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockUser);
    });

    it('should find user by ID with select fields', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
      };
      
      mockExec.mockResolvedValue(mockUser);
      mockSelect.mockReturnValue({ exec: mockExec });
      (User as any).findById = jest.fn(() => mockFindQuery);

      const result = await repository.findById('user123', 'email name');

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockSelect).toHaveBeenCalledWith('email name');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockExec.mockResolvedValue(null);
      (User as any).findById = jest.fn(() => mockFindQuery);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}) as any;
      mockExec.mockRejectedValue(new Error('Database error'));
      (User as any).findById = jest.fn(() => mockFindQuery);

      const result = await repository.findById('user123');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error finding user by ID:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('findOne', () => {
    it('should find user by filter', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user',
      };
      
      mockExec.mockResolvedValue(mockUser);
      (User as any).findOne = jest.fn(() => mockFindQuery);

      const result = await repository.findOne({ email: 'test@example.com' });

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(result).toEqual(mockUser);
    });

    it('should find user by filter with select', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
      };
      
      mockExec.mockResolvedValue(mockUser);
      mockSelect.mockReturnValue({ exec: mockExec });
      (User as any).findOne = jest.fn(() => mockFindQuery);

      const result = await repository.findOne(
        { email: 'test@example.com' },
        'email name'
      );

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockSelect).toHaveBeenCalledWith('email name');
      expect(result).toEqual(mockUser);
    });

    it('should return null when no user matches filter', async () => {
      mockExec.mockResolvedValue(null);
      (User as any).findOne = jest.fn(() => mockFindQuery);

      const result = await repository.findOne({ email: 'nonexistent@example.com' });

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}) as any;
      mockExec.mockRejectedValue(new Error('Database error'));
      (User as any).findOne = jest.fn(() => mockFindQuery);

      const result = await repository.findOne({ email: 'test@example.com' });

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error finding user:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email (lowercase)', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
      };
      
      mockExec.mockResolvedValue(mockUser);
      (User as any).findOne = jest.fn(() => mockFindQuery);

      const result = await repository.findByEmail('TEST@EXAMPLE.COM');

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(result).toEqual(mockUser);
    });

    it('should find user by email with select', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
      };
      
      mockExec.mockResolvedValue(mockUser);
      mockSelect.mockReturnValue({ exec: mockExec });
      (User as any).findOne = jest.fn(() => mockFindQuery);

      const result = await repository.findByEmail('test@example.com', 'email name');

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockSelect).toHaveBeenCalledWith('email name');
      expect(result).toEqual(mockUser);
    });

    it('should handle mixed case email', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
      };
      
      mockExec.mockResolvedValue(mockUser);
      (User as any).findOne = jest.fn(() => mockFindQuery);

      await repository.findByEmail('TeSt@ExAmPlE.CoM');

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    });
  });

  describe('create', () => {
    it('should create new user successfully', async () => {
      const userData = {
        email: 'new@example.com',
        name: 'New User',
        password: 'hashedPassword',
      };
      
      const mockSavedUser = {
        _id: 'newUser123',
        ...userData,
        createdAt: new Date(),
      };

      const mockSave = (jest.fn() as any).mockResolvedValue(mockSavedUser);
      (User as any).mockImplementation(() => ({
        save: mockSave,
      }));

      const result = await repository.create(userData);

      expect(User).toHaveBeenCalledWith(userData);
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(mockSavedUser);
    });

    it('should create user with partial data', async () => {
      const partialData = {
        email: 'partial@example.com',
      };
      
      const mockSavedUser = {
        _id: 'partialUser123',
        email: 'partial@example.com',
        createdAt: new Date(),
      };

      const mockSave = (jest.fn() as any).mockResolvedValue(mockSavedUser);
      (User as any).mockImplementation(() => ({
        save: mockSave,
      }));

      const result = await repository.create(partialData);

      expect(User).toHaveBeenCalledWith(partialData);
      expect(result).toEqual(mockSavedUser);
    });

    it('should propagate validation errors', async () => {
      const invalidData = {
        email: 'invalid-email',
      };

      const validationError = new Error('Validation failed');
      const mockSave = (jest.fn() as any).mockRejectedValue(validationError);
      (User as any).mockImplementation(() => ({
        save: mockSave,
      }));

      await expect(repository.create(invalidData)).rejects.toThrow('Validation failed');
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateData = { name: 'Updated Name' };
      const mockUpdatedUser = {
        _id: 'user123',
        name: 'Updated Name',
        email: 'test@example.com',
      };

      mockExec.mockResolvedValue(mockUpdatedUser);
      (User as any).findByIdAndUpdate = jest.fn(() => mockFindQuery);

      const result = await repository.update('user123', updateData);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        updateData,
        { new: true, runValidators: true }
      );
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should return null when user not found', async () => {
      mockExec.mockResolvedValue(null);
      (User as any).findByIdAndUpdate = jest.fn(() => mockFindQuery);

      const result = await repository.update('nonexistent', { name: 'New Name' });

      expect(result).toBeNull();
    });

    it('should handle update errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}) as any;
      mockExec.mockRejectedValue(new Error('Update failed'));
      (User as any).findByIdAndUpdate = jest.fn(() => mockFindQuery);

      const result = await repository.update('user123', { name: 'New Name' });

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating user:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const mockDeletedUser = {
        _id: 'user123',
        email: 'deleted@example.com',
      };

      mockExec.mockResolvedValue(mockDeletedUser);
      (User as any).findByIdAndDelete = jest.fn(() => mockFindQuery);

      const result = await repository.delete('user123');

      expect(User.findByIdAndDelete).toHaveBeenCalledWith('user123');
      expect(result).toBe(true);
    });

    it('should return false when user not found', async () => {
      mockExec.mockResolvedValue(null);
      (User as any).findByIdAndDelete = jest.fn(() => mockFindQuery);

      const result = await repository.delete('nonexistent');

      expect(result).toBe(false);
    });

    it('should handle delete errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}) as any;
      mockExec.mockRejectedValue(new Error('Delete failed'));
      (User as any).findByIdAndDelete = jest.fn(() => mockFindQuery);

      const result = await repository.delete('user123');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error deleting user:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('softDelete', () => {
    it('should soft delete user successfully', async () => {
      const mockSoftDeletedUser = {
        _id: 'user123',
        email: 'test@example.com',
        isDeleted: true,
        isActive: false,
        deletedAt: expect.any(Date),
      };

      mockExec.mockResolvedValue(mockSoftDeletedUser);
      (User as any).findByIdAndUpdate = jest.fn(() => mockFindQuery);

      const result = await repository.softDelete('user123');

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        {
          isDeleted: true,
          isActive: false,
          deletedAt: expect.any(Date),
        },
        { new: true }
      );
      expect(result).toBe(true);
    });

    it('should return false when user not found', async () => {
      mockExec.mockResolvedValue(null);
      (User as any).findByIdAndUpdate = jest.fn(() => mockFindQuery);

      const result = await repository.softDelete('nonexistent');

      expect(result).toBe(false);
    });

    it('should handle soft delete errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}) as any;
      mockExec.mockRejectedValue(new Error('Soft delete failed'));
      (User as any).findByIdAndUpdate = jest.fn(() => mockFindQuery);

      const result = await repository.softDelete('user123');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error soft deleting user:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('findMany', () => {
    it('should find multiple users with default pagination', async () => {
      const mockUsers = [
        { _id: 'user1', email: 'user1@example.com' },
        { _id: 'user2', email: 'user2@example.com' },
      ];

      const mockChain = {
        limit: (jest.fn() as any).mockReturnThis(),
        skip: (jest.fn() as any).mockReturnThis(),
        exec: (jest.fn() as any).mockResolvedValue(mockUsers),
      };

      (User as any).find = jest.fn(() => mockChain);

      const result = await repository.findMany({ role: 'user' });

      expect(User.find).toHaveBeenCalledWith({ role: 'user' });
      expect(mockChain.limit).toHaveBeenCalledWith(100);
      expect(mockChain.skip).toHaveBeenCalledWith(0);
      expect(result).toEqual(mockUsers);
    });

    it('should find users with custom limit and skip', async () => {
      const mockUsers = [
        { _id: 'user3', email: 'user3@example.com' },
      ];

      const mockChain = {
        limit: (jest.fn() as any).mockReturnThis(),
        skip: (jest.fn() as any).mockReturnThis(),
        exec: (jest.fn() as any).mockResolvedValue(mockUsers),
      };

      (User as any).find = jest.fn(() => mockChain);

      const result = await repository.findMany({ role: 'admin' }, 10, 20);

      expect(User.find).toHaveBeenCalledWith({ role: 'admin' });
      expect(mockChain.limit).toHaveBeenCalledWith(10);
      expect(mockChain.skip).toHaveBeenCalledWith(20);
      expect(result).toEqual(mockUsers);
    });

    it('should return empty array when no users found', async () => {
      const mockChain = {
        limit: (jest.fn() as any).mockReturnThis(),
        skip: (jest.fn() as any).mockReturnThis(),
        exec: (jest.fn() as any).mockResolvedValue([]),
      };

      (User as any).find = jest.fn(() => mockChain);

      const result = await repository.findMany({ role: 'superadmin' });

      expect(result).toEqual([]);
    });

    it('should handle findMany errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}) as any;
      
      const mockChain = {
        limit: (jest.fn() as any).mockReturnThis(),
        skip: (jest.fn() as any).mockReturnThis(),
        exec: (jest.fn() as any).mockRejectedValue(new Error('Query failed')),
      };

      (User as any).find = jest.fn(() => mockChain);

      const result = await repository.findMany({ role: 'user' });

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error finding users:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('count', () => {
    it('should count users matching filter', async () => {
      const mockChain = {
        exec: (jest.fn() as any).mockResolvedValue(42),
      };

      (User as any).countDocuments = jest.fn(() => mockChain);

      const result = await repository.count({ role: 'user' });

      expect(User.countDocuments).toHaveBeenCalledWith({ role: 'user' });
      expect(result).toBe(42);
    });

    it('should return 0 when no users match', async () => {
      const mockChain = {
        exec: (jest.fn() as any).mockResolvedValue(0),
      };

      (User as any).countDocuments = jest.fn(() => mockChain);

      const result = await repository.count({ role: 'nonexistent' });

      expect(result).toBe(0);
    });

    it('should handle count errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}) as any;
      
      const mockChain = {
        exec: (jest.fn() as any).mockRejectedValue(new Error('Count failed')),
      };

      (User as any).countDocuments = jest.fn(() => mockChain);

      const result = await repository.count({ role: 'user' });

      expect(result).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error counting users:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('exists', () => {
    it('should return true when user exists', async () => {
      const mockChain = {
        limit: (jest.fn() as any).mockReturnThis(),
        exec: (jest.fn() as any).mockResolvedValue(1),
      };

      (User as any).countDocuments = jest.fn(() => mockChain);

      const result = await repository.exists({ email: 'existing@example.com' });

      expect(User.countDocuments).toHaveBeenCalledWith({ email: 'existing@example.com' });
      expect(mockChain.limit).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      const mockChain = {
        limit: (jest.fn() as any).mockReturnThis(),
        exec: (jest.fn() as any).mockResolvedValue(0),
      };

      (User as any).countDocuments = jest.fn(() => mockChain);

      const result = await repository.exists({ email: 'nonexistent@example.com' });

      expect(result).toBe(false);
    });

    it('should handle exists errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}) as any;
      
      const mockChain = {
        limit: (jest.fn() as any).mockReturnThis(),
        exec: (jest.fn() as any).mockRejectedValue(new Error('Exists check failed')),
      };

      (User as any).countDocuments = jest.fn(() => mockChain);

      const result = await repository.exists({ email: 'test@example.com' });

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error checking user existence:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });
});
