/**
 * Test Utilities and Mock Helpers
 * Provides mock implementations for services, repositories, and external dependencies
 * Makes unit testing easier and faster
 * 
 * Note: This file uses dynamic 'any' types for mock functions
 * When Jest is installed, replace with proper jest.fn() types
 */

import nodemailer from 'nodemailer';
import Stripe from 'stripe';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from './config';
import { IUserRepository } from '@/repositories/UserRepository';
import { IPaymentRepository } from '@/repositories/PaymentRepository';
import { IUser } from '@/models/User';
import { IPayment } from '@/models/Payment';
import { FilterQuery, UpdateQuery } from 'mongoose';

// Type-safe mock function creator (will use jest.fn() when available)
const createMockFn = (returnValue?: any) => {
  let currentReturnValue = returnValue;
  const fn: any = (...args: any[]) => currentReturnValue;
  fn.mockResolvedValue = (value: any) => { currentReturnValue = Promise.resolve(value); return fn; };
  fn.mockReturnValue = (value: any) => { currentReturnValue = value; return fn; };
  fn.mockImplementation = (impl: any) => { Object.assign(fn, impl); return fn; };
  return fn;
};

/**
 * Mock ConfigService for testing
 */
export const createMockConfig = (overrides?: Partial<any>): ConfigService => {
  const mockEnv: NodeJS.ProcessEnv = {
    NODE_ENV: 'test',
    PORT: '5000',
    FRONTEND_URL: 'http://localhost:5173',
    BACKEND_URL: 'http://localhost:5000',
    MONGODB_URI: 'mongodb://localhost:27017/test',
    JWT_SECRET: 'test-secret-key',
    JWT_EXPIRE: '7d',
    SMTP_HOST: 'smtp.test.com',
    SMTP_PORT: '587',
    SMTP_USER: 'test@test.com',
    SMTP_PASS: 'test-password',
    SMTP_FROM_EMAIL: 'noreply@test.com',
    SMTP_FROM_NAME: 'Test App',
    CLOUDINARY_CLOUD_NAME: 'test-cloud',
    CLOUDINARY_API_KEY: 'test-api-key',
    CLOUDINARY_API_SECRET: 'test-api-secret',
    STRIPE_SECRET_KEY: 'sk_test_123',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
    STRIPE_WEBHOOK_SECRET: 'whsec_test_123',
    STRIPE_PRICE_MONTHLY: 'price_monthly_test',
    STRIPE_PRICE_YEARLY: 'price_yearly_test',
    STRIPE_PRICE_LIFETIME: 'price_lifetime_test',
    SENTRY_DSN: '',
    GOOGLE_CLIENT_ID: '',
    GOOGLE_CLIENT_SECRET: '',
    ...overrides,
  };

  return new ConfigService(mockEnv);
};

/**
 * Mock Nodemailer Transporter
 */
export const createMockMailTransporter = (): nodemailer.Transporter => {
  return {
    sendMail: createMockFn({
      messageId: 'test-message-id',
      accepted: ['test@test.com'],
      rejected: [],
    }),
    verify: createMockFn(true),
  } as any;
};

/**
 * Mock Stripe Instance
 */
export const createMockStripe = (): Stripe => {
  return {
    checkout: {
      sessions: {
        create: createMockFn({
          id: 'cs_test_123',
          url: 'https://checkout.stripe.com/test',
        }),
        retrieve: createMockFn({
          id: 'cs_test_123',
          payment_status: 'paid',
        }),
      },
    },
    paymentIntents: {
      create: createMockFn({
        id: 'pi_test_123',
        client_secret: 'pi_test_secret',
      }),
    },
    webhooks: {
      constructEvent: createMockFn({
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: { object: {} },
      }),
    },
    subscriptions: {
      list: createMockFn({ data: [] }),
      cancel: createMockFn({ id: 'sub_test_123', status: 'canceled' }),
    },
  } as any;
};

/**
 * Mock Cloudinary Instance
 */
export const createMockCloudinary = (): typeof cloudinary => {
  const uploadStreamMock = (options: any, callback: any) => {
    callback(null, {
      public_id: 'test-image-id',
      url: 'http://cloudinary.com/test.jpg',
      secure_url: 'https://cloudinary.com/test.jpg',
    });
    return { end: createMockFn() };
  };

  return {
    config: createMockFn(),
    uploader: {
      upload: createMockFn({
        public_id: 'test-image-id',
        url: 'http://cloudinary.com/test.jpg',
        secure_url: 'https://cloudinary.com/test.jpg',
      }),
      upload_stream: uploadStreamMock as any,
      destroy: createMockFn({ result: 'ok' }),
    },
  } as any;
};

/**
 * Mock User Repository
 */
export class MockUserRepository implements IUserRepository {
  private users: Map<string, IUser> = new Map();

  constructor(initialUsers: IUser[] = []) {
    initialUsers.forEach(user => this.users.set((user._id as string).toString(), user));
  }

  async findById(id: string, select?: string): Promise<IUser | null> {
    return this.users.get(id) || null;
  }

  async findOne(filter: FilterQuery<IUser>, select?: string): Promise<IUser | null> {
    const users = Array.from(this.users.values());
    return users.find(u => {
      if (filter.email) return u.email === filter.email;
      if (filter._id) return (u._id as any).toString() === filter._id.toString();
      return false;
    }) || null;
  }

  async findByEmail(email: string, select?: string): Promise<IUser | null> {
    return this.findOne({ email: email.toLowerCase() }, select);
  }

  async create(userData: Partial<IUser>): Promise<IUser> {
    const user = {
      _id: `user_${Date.now()}`,
      ...userData,
    } as IUser;
    this.users.set((user._id as string).toString(), user);
    return user;
  }

  async update(id: string, data: UpdateQuery<IUser>): Promise<IUser | null> {
    const user = this.users.get(id);
    if (!user) return null;
    const updated = { ...user, ...data } as IUser;
    this.users.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async softDelete(id: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    user.isDeleted = true;
    user.isActive = false;
    user.deletedAt = new Date();
    return true;
  }

  async findMany(filter: FilterQuery<IUser>, limit?: number, skip?: number): Promise<IUser[]> {
    return Array.from(this.users.values()).slice(skip || 0, (skip || 0) + (limit || 100));
  }

  async count(filter: FilterQuery<IUser>): Promise<number> {
    return this.users.size;
  }

  async exists(filter: FilterQuery<IUser>): Promise<boolean> {
    return (await this.findOne(filter)) !== null;
  }
}

/**
 * Mock Payment Repository
 */
export class MockPaymentRepository implements IPaymentRepository {
  private payments: Map<string, IPayment> = new Map();

  constructor(initialPayments: IPayment[] = []) {
    initialPayments.forEach(payment => this.payments.set((payment._id as string).toString(), payment));
  }

  async findById(id: string): Promise<IPayment | null> {
    return this.payments.get(id) || null;
  }

  async findOne(filter: FilterQuery<IPayment>): Promise<IPayment | null> {
    const payments = Array.from(this.payments.values());
    return payments.find(p => {
      if (filter._id) return (p._id as any).toString() === filter._id.toString();
      if (filter.userId) return p.userId.toString() === filter.userId.toString();
      return false;
    }) || null;
  }

  async findByUserId(userId: string, limit?: number): Promise<IPayment[]> {
    return Array.from(this.payments.values())
      .filter(p => p.userId.toString() === userId)
      .slice(0, limit || 50);
  }

  async findByStatus(status: string, limit?: number): Promise<IPayment[]> {
    return Array.from(this.payments.values())
      .filter(p => p.status === status)
      .slice(0, limit || 100);
  }

  async create(paymentData: Partial<IPayment>): Promise<IPayment> {
    const payment = {
      _id: `payment_${Date.now()}`,
      ...paymentData,
    } as IPayment;
    this.payments.set((payment._id as string).toString(), payment);
    return payment;
  }

  async update(id: string, data: UpdateQuery<IPayment>): Promise<IPayment | null> {
    const payment = this.payments.get(id);
    if (!payment) return null;
    const updated = { ...payment, ...data } as IPayment;
    this.payments.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.payments.delete(id);
  }

  async findMany(filter: FilterQuery<IPayment>, limit?: number, skip?: number): Promise<IPayment[]> {
    return Array.from(this.payments.values()).slice(skip || 0, (skip || 0) + (limit || 100));
  }

  async count(filter: FilterQuery<IPayment>): Promise<number> {
    return this.payments.size;
  }
}

/**
 * Mock User Factory
 */
export const createMockUser = (overrides?: Partial<IUser>): IUser => {
  const mockFn: any = () => Promise.resolve(true);
  return {
    _id: 'user_123',
    name: 'Test User',
    email: 'test@test.com',
    password: 'hashed-password',
    role: 'user',
    isEmailVerified: true,
    isActive: true,
    isDeleted: false,
    isPremium: false,
    loginHistory: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    comparePassword: mockFn,
    generateEmailVerificationToken: () => 'verification-token',
    generateResetPasswordToken: () => 'reset-token',
    ...overrides,
  } as any;
};

/**
 * Mock Payment Factory
 */
export const createMockPayment = (overrides?: Partial<IPayment>): IPayment => {
  return {
    _id: 'payment_123',
    userId: 'user_123',
    amount: 99000,
    currency: 'idr',
    status: 'completed',
    plan: 'monthly',
    paymentMethod: 'card',
    stripeSessionId: 'cs_test_123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as any;
};

/**
 * Helper to create mock NextRequest
 */
export const createMockRequest = (options?: {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}): any => {
  return {
    method: options?.method || 'GET',
    headers: {
      get: (name: string) => options?.headers?.[name] || null,
    },
    json: createMockFn(options?.body || {}),
  };
};

/**
 * Helper to suppress console logs in tests
 * Note: Replace with jest.spyOn when Jest is installed
 */
export const suppressConsole = () => {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  return {
    suppress: () => {
      console.log = () => {};
      console.warn = () => {};
      console.error = () => {};
    },
    restore: () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    },
  };
};
