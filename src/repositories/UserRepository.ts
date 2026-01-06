import User, { IUser } from '@/models/User';
import { FilterQuery, UpdateQuery } from 'mongoose';

/**
 * User Repository
 * Abstracts database operations for User model
 * Makes business logic testable by allowing mock implementations
 */

export interface IUserRepository {
  findById(id: string, select?: string): Promise<IUser | null>;
  findOne(filter: FilterQuery<IUser>, select?: string): Promise<IUser | null>;
  findByEmail(email: string, select?: string): Promise<IUser | null>;
  create(userData: Partial<IUser>): Promise<IUser>;
  update(id: string, data: UpdateQuery<IUser>): Promise<IUser | null>;
  delete(id: string): Promise<boolean>;
  softDelete(id: string): Promise<boolean>;
  findMany(filter: FilterQuery<IUser>, limit?: number, skip?: number): Promise<IUser[]>;
  count(filter: FilterQuery<IUser>): Promise<number>;
  exists(filter: FilterQuery<IUser>): Promise<boolean>;
}

export class UserRepository implements IUserRepository {
  /**
   * Find user by ID
   */
  async findById(id: string, select?: string): Promise<IUser | null> {
    try {
      const query = (User as any).findById(id);
      if (select) {
        query.select(select);
      }
      return await query.exec();
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  /**
   * Find user by filter
   */
  async findOne(filter: FilterQuery<IUser>, select?: string): Promise<IUser | null> {
    try {
      const query = (User as any).findOne(filter);
      if (select) {
        query.select(select);
      }
      return await query.exec();
    } catch (error) {
      console.error('Error finding user:', error);
      return null;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string, select?: string): Promise<IUser | null> {
    return this.findOne({ email: email.toLowerCase() }, select);
  }

  /**
   * Create new user
   */
  async create(userData: Partial<IUser>): Promise<IUser> {
    const user = new User(userData);
    return await user.save();
  }

  /**
   * Update user by ID
   */
  async update(id: string, data: UpdateQuery<IUser>): Promise<IUser | null> {
    try {
      return await (User as any).findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true }
      ).exec();
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  /**
   * Hard delete user
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await (User as any).findByIdAndDelete(id).exec();
      return !!result;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  /**
   * Soft delete user
   */
  async softDelete(id: string): Promise<boolean> {
    try {
      const result = await (User as any).findByIdAndUpdate(
        id,
        {
          isDeleted: true,
          isActive: false,
          deletedAt: new Date(),
        },
        { new: true }
      ).exec();
      return !!result;
    } catch (error) {
      console.error('Error soft deleting user:', error);
      return false;
    }
  }

  /**
   * Find multiple users
   */
  async findMany(
    filter: FilterQuery<IUser>,
    limit: number = 100,
    skip: number = 0
  ): Promise<IUser[]> {
    try {
      return await (User as any).find(filter)
        .limit(limit)
        .skip(skip)
        .exec();
    } catch (error) {
      console.error('Error finding users:', error);
      return [];
    }
  }

  /**
   * Count users matching filter
   */
  async count(filter: FilterQuery<IUser>): Promise<number> {
    try {
      return await User.countDocuments(filter).exec();
    } catch (error) {
      console.error('Error counting users:', error);
      return 0;
    }
  }

  /**
   * Check if user exists
   */
  async exists(filter: FilterQuery<IUser>): Promise<boolean> {
    try {
      const count = await User.countDocuments(filter).limit(1).exec();
      return count > 0;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }
}

// Export singleton instance for backward compatibility
export const userRepository = new UserRepository();

// Factory function for testing
export const createUserRepository = (): IUserRepository => {
  return new UserRepository();
};
