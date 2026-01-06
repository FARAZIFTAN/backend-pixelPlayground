/**
 * Configuration Service
 * Centralized configuration management for environment variables
 * Makes testing easier by isolating environment dependencies
 */

export interface AppConfig {
  // Server
  port: number;
  nodeEnv: string;
  frontendUrl: string;
  backendUrl: string;

  // Database
  mongodbUri: string;

  // JWT
  jwtSecret: string;
  jwtExpire: string;

  // SMTP Email
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
    fromEmail: string;
    fromName: string;
  };

  // Cloudinary
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };

  // Stripe
  stripe: {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
    priceMonthly: string;
    priceYearly: string;
    priceLifetime: string;
  };

  // Sentry
  sentry: {
    dsn: string;
  };

  // Google OAuth
  google: {
    clientId: string;
    clientSecret: string;
  };
}

export class ConfigService {
  private config: AppConfig;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    this.config = this.loadConfig(env);
  }

  private loadConfig(env: NodeJS.ProcessEnv): AppConfig {
    return {
      // Server
      port: parseInt(env.PORT || '5000', 10),
      nodeEnv: env.NODE_ENV || 'development',
      frontendUrl: env.FRONTEND_URL || 'http://localhost:5173',
      backendUrl: env.BACKEND_URL || 'http://localhost:5000',

      // Database
      mongodbUri: env.MONGODB_URI || 'mongodb://localhost:27017/pixelplayground',

      // JWT
      jwtSecret: env.JWT_SECRET || 'your-secret-key-change-in-production',
      jwtExpire: env.JWT_EXPIRE || '7d',

      // SMTP Email
      smtp: {
        host: env.SMTP_HOST || '',
        port: parseInt(env.SMTP_PORT || '587', 10),
        user: env.SMTP_USER || '',
        pass: env.SMTP_PASS || '',
        fromEmail: env.SMTP_FROM_EMAIL || 'noreply@pixelplayground.com',
        fromName: env.SMTP_FROM_NAME || 'PixelPlayground',
      },

      // Cloudinary
      cloudinary: {
        cloudName: env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: env.CLOUDINARY_API_KEY || '',
        apiSecret: env.CLOUDINARY_API_SECRET || '',
      },

      // Stripe
      stripe: {
        secretKey: env.STRIPE_SECRET_KEY || '',
        publishableKey: env.STRIPE_PUBLISHABLE_KEY || '',
        webhookSecret: env.STRIPE_WEBHOOK_SECRET || '',
        priceMonthly: env.STRIPE_PRICE_MONTHLY || '',
        priceYearly: env.STRIPE_PRICE_YEARLY || '',
        priceLifetime: env.STRIPE_PRICE_LIFETIME || '',
      },

      // Sentry
      sentry: {
        dsn: env.SENTRY_DSN || '',
      },

      // Google OAuth
      google: {
        clientId: env.GOOGLE_CLIENT_ID || '',
        clientSecret: env.GOOGLE_CLIENT_SECRET || '',
      },
    };
  }

  // Getter methods for type-safe access
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  getAll(): AppConfig {
    return { ...this.config };
  }

  // Specific getters for common use cases
  isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  isTest(): boolean {
    return this.config.nodeEnv === 'test';
  }

  // Check if service is configured
  isSmtpConfigured(): boolean {
    return !!(
      this.config.smtp.host &&
      this.config.smtp.user &&
      this.config.smtp.pass
    );
  }

  isCloudinaryConfigured(): boolean {
    return !!(
      this.config.cloudinary.cloudName &&
      this.config.cloudinary.apiKey &&
      this.config.cloudinary.apiSecret
    );
  }

  isStripeConfigured(): boolean {
    return !!(
      this.config.stripe.secretKey &&
      this.config.stripe.publishableKey
    );
  }

  isSentryConfigured(): boolean {
    return !!this.config.sentry.dsn;
  }

  isGoogleOAuthConfigured(): boolean {
    return !!(
      this.config.google.clientId &&
      this.config.google.clientSecret
    );
  }
}

// Default singleton instance for backward compatibility
export const configService = new ConfigService();

// Factory function for testing
export const createConfigService = (env?: NodeJS.ProcessEnv): ConfigService => {
  return new ConfigService(env);
};
