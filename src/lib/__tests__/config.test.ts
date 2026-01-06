/**
 * Unit Tests for ConfigService
 * Tests configuration management and environment variable handling
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ConfigService, createConfigService } from '@/lib/config';

describe('ConfigService', () => {
  describe('Constructor and Initialization', () => {
    it('should create instance with default process.env', () => {
      const config = new ConfigService();
      expect(config).toBeInstanceOf(ConfigService);
    });

    it('should create instance with custom environment', () => {
      const customEnv = {
        NODE_ENV: 'test',
        PORT: '5000',
        JWT_SECRET: 'custom-secret',
      };
      const config = new ConfigService(customEnv as NodeJS.ProcessEnv);
      expect(config.get('jwtSecret')).toBe('custom-secret');
    });
  });

  describe('Configuration Getters', () => {
    let config: ConfigService;

    beforeEach(() => {
      const mockEnv = {
        NODE_ENV: 'test',
        PORT: '5000',
        FRONTEND_URL: 'http://localhost:5173',
        BACKEND_URL: 'http://localhost:5000',
        MONGODB_URI: 'mongodb://localhost:27017/testdb',
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
        STRIPE_SECRET_KEY: 'sk_test_123456',
        STRIPE_PUBLISHABLE_KEY: 'pk_test_123456',
        STRIPE_WEBHOOK_SECRET: 'whsec_test_123456',
        STRIPE_PRICE_MONTHLY: 'price_monthly_test',
        STRIPE_PRICE_YEARLY: 'price_yearly_test',
        STRIPE_PRICE_LIFETIME: 'price_lifetime_test',
        SENTRY_DSN: 'https://sentry.io/test',
        GOOGLE_CLIENT_ID: 'google-client-id',
        GOOGLE_CLIENT_SECRET: 'google-client-secret',
      };
      config = new ConfigService(mockEnv as NodeJS.ProcessEnv);
    });

    it('should get server port', () => {
      expect(config.get('port')).toBe(5000);
    });

    it('should get node environment', () => {
      expect(config.get('nodeEnv')).toBe('test');
    });

    it('should get frontend URL', () => {
      expect(config.get('frontendUrl')).toBe('http://localhost:5173');
    });

    it('should get JWT configuration', () => {
      expect(config.get('jwtSecret')).toBe('test-secret-key');
      expect(config.get('jwtExpire')).toBe('7d');
    });

    it('should get SMTP configuration', () => {
      const smtp = config.get('smtp');
      expect(smtp.host).toBe('smtp.test.com');
      expect(smtp.port).toBe(587);
      expect(smtp.user).toBe('test@test.com');
      expect(smtp.pass).toBe('test-password');
      expect(smtp.fromEmail).toBe('noreply@test.com');
      expect(smtp.fromName).toBe('Test App');
    });

    it('should get Cloudinary configuration', () => {
      const cloudinary = config.get('cloudinary');
      expect(cloudinary.cloudName).toBe('test-cloud');
      expect(cloudinary.apiKey).toBe('test-api-key');
      expect(cloudinary.apiSecret).toBe('test-api-secret');
    });

    it('should get Stripe configuration', () => {
      const stripe = config.get('stripe');
      expect(stripe.secretKey).toBe('sk_test_123456');
      expect(stripe.publishableKey).toBe('pk_test_123456');
      expect(stripe.webhookSecret).toBe('whsec_test_123456');
      expect(stripe.priceMonthly).toBe('price_monthly_test');
      expect(stripe.priceYearly).toBe('price_yearly_test');
      expect(stripe.priceLifetime).toBe('price_lifetime_test');
    });

    it('should get all configuration', () => {
      const allConfig = config.getAll();
      expect(allConfig).toHaveProperty('port');
      expect(allConfig).toHaveProperty('nodeEnv');
      expect(allConfig).toHaveProperty('smtp');
      expect(allConfig).toHaveProperty('cloudinary');
      expect(allConfig).toHaveProperty('stripe');
    });
  });

  describe('Environment Detection', () => {
    it('should detect development environment', () => {
      const config = new ConfigService({ NODE_ENV: 'development' } as NodeJS.ProcessEnv);
      expect(config.isDevelopment()).toBe(true);
      expect(config.isProduction()).toBe(false);
      expect(config.isTest()).toBe(false);
    });

    it('should detect production environment', () => {
      const config = new ConfigService({ NODE_ENV: 'production' } as NodeJS.ProcessEnv);
      expect(config.isProduction()).toBe(true);
      expect(config.isDevelopment()).toBe(false);
      expect(config.isTest()).toBe(false);
    });

    it('should detect test environment', () => {
      const config = new ConfigService({ NODE_ENV: 'test' } as NodeJS.ProcessEnv);
      expect(config.isTest()).toBe(true);
      expect(config.isDevelopment()).toBe(false);
      expect(config.isProduction()).toBe(false);
    });
  });

  describe('Service Configuration Checks', () => {
    it('should detect when SMTP is configured', () => {
      const config = new ConfigService({
          SMTP_HOST: 'smtp.test.com',
          SMTP_USER: 'test@test.com',
          SMTP_PASS: 'password',
      } as unknown as NodeJS.ProcessEnv);
      expect(config.isSmtpConfigured()).toBe(true);
    });

    it('should detect when SMTP is not configured', () => {
      const config = new ConfigService({} as NodeJS.ProcessEnv);
      expect(config.isSmtpConfigured()).toBe(false);
    });

    it('should detect when Cloudinary is configured', () => {
      const config = new ConfigService({
          CLOUDINARY_CLOUD_NAME: 'test-cloud',
          CLOUDINARY_API_KEY: 'test-key',
          CLOUDINARY_API_SECRET: 'test-secret',
      } as unknown as NodeJS.ProcessEnv);
      expect(config.isCloudinaryConfigured()).toBe(true);
    });

    it('should detect when Cloudinary is not configured', () => {
      const config = new ConfigService({} as NodeJS.ProcessEnv);
      expect(config.isCloudinaryConfigured()).toBe(false);
    });

    it('should detect when Stripe is configured', () => {
      const config = new ConfigService({
          STRIPE_SECRET_KEY: 'sk_test_123',
          STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
      } as unknown as NodeJS.ProcessEnv);
      expect(config.isStripeConfigured()).toBe(true);
    });

    it('should detect when Stripe is not configured', () => {
      const config = new ConfigService({} as NodeJS.ProcessEnv);
      expect(config.isStripeConfigured()).toBe(false);
    });

    it('should detect when Sentry is configured', () => {
      const config = new ConfigService({
          SENTRY_DSN: 'https://sentry.io/project',
      } as unknown as NodeJS.ProcessEnv);
      expect(config.isSentryConfigured()).toBe(true);
    });

    it('should detect when Sentry is not configured', () => {
      const config = new ConfigService({} as NodeJS.ProcessEnv);
      expect(config.isSentryConfigured()).toBe(false);
    });

    it('should detect when Google OAuth is configured', () => {
      const config = new ConfigService({
          GOOGLE_CLIENT_ID: 'client-id',
          GOOGLE_CLIENT_SECRET: 'client-secret',
      } as unknown as NodeJS.ProcessEnv);
      expect(config.isGoogleOAuthConfigured()).toBe(true);
    });

    it('should detect when Google OAuth is not configured', () => {
      const config = new ConfigService({} as NodeJS.ProcessEnv);
      expect(config.isGoogleOAuthConfigured()).toBe(false);
    });
  });

  describe('Default Values', () => {
    it('should use default values when env vars are missing', () => {
      const config = new ConfigService({} as NodeJS.ProcessEnv);
      
      expect(config.get('port')).toBe(5000);
      expect(config.get('nodeEnv')).toBe('development');
      expect(config.get('frontendUrl')).toBe('http://localhost:5173');
      expect(config.get('backendUrl')).toBe('http://localhost:5000');
      expect(config.get('jwtSecret')).toBe('your-secret-key-change-in-production');
      expect(config.get('jwtExpire')).toBe('7d');
    });

    it('should parse port as integer', () => {
      const config = new ConfigService({ PORT: '3000' } as unknown as NodeJS.ProcessEnv);
      expect(typeof config.get('port')).toBe('number');
      expect(config.get('port')).toBe(3000);
    });

    it('should parse SMTP port as integer', () => {
      const config = new ConfigService({ SMTP_PORT: '465' } as unknown as NodeJS.ProcessEnv);
      expect(typeof config.get('smtp').port).toBe('number');
      expect(config.get('smtp').port).toBe(465);
    });
  });

  describe('Factory Function', () => {
    it('should create ConfigService via factory', () => {
      const config = createConfigService();
      expect(config).toBeInstanceOf(ConfigService);
    });

    it('should create ConfigService with custom env via factory', () => {
      const customEnv = { JWT_SECRET: 'factory-secret' };
      const config = createConfigService(customEnv as unknown as NodeJS.ProcessEnv);
      expect(config.get('jwtSecret')).toBe('factory-secret');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty environment object', () => {
      const config = new ConfigService({} as NodeJS.ProcessEnv);
      expect(config.getAll()).toBeDefined();
      expect(config.get('nodeEnv')).toBe('development');
    });

    it('should handle undefined environment variables', () => {
      const config = new ConfigService({
        SMTP_HOST: undefined,
        CLOUDINARY_CLOUD_NAME: undefined,
      } as any);
      expect(config.isSmtpConfigured()).toBe(false);
      expect(config.isCloudinaryConfigured()).toBe(false);
    });

    it('should handle empty string environment variables', () => {
      const config = new ConfigService({
          SMTP_HOST: '',
          SMTP_USER: '',
          SMTP_PASS: '',
      } as unknown as NodeJS.ProcessEnv);
      expect(config.isSmtpConfigured()).toBe(false);
    });
  });
});
