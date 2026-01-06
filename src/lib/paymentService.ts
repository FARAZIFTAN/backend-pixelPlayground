import Stripe from 'stripe';
import { logError, logInfo } from './errorHandler';
import { emailService, EmailService } from './emailService';
import { ConfigService, configService } from './config';

/**
 * Stripe Payment Service
 * Handles subscription and one-time payments
 * Now supports Dependency Injection for better testability
 */

interface CreateCheckoutSessionOptions {
  userId: string;
  userEmail: string;
  userName: string;
  priceId: string;
  mode: 'subscription' | 'payment';
  successUrl: string;
  cancelUrl: string;
}

interface CreatePaymentIntentOptions {
  amount: number;
  currency: string;
  userId: string;
  userEmail: string;
  description: string;
}

interface ServiceStatus {
  configured: boolean;
  hasPlans: boolean;
}

type PlanType = 'monthly' | 'yearly' | 'lifetime';

interface Plan {
  name: string;
  price: number;
  currency: string;
  interval: string;
}

// Pricing plans constants (in IDR)
const PRICING_PLANS: Record<PlanType, Plan> = {
  monthly: {
    name: 'Pro Creator Monthly',
    price: 99000,
    currency: 'idr',
    interval: 'month',
  },
  yearly: {
    name: 'Pro Creator Yearly',
    price: 990000,
    currency: 'idr',
    interval: 'year',
  },
  lifetime: {
    name: 'Pro Creator Lifetime',
    price: 1990000,
    currency: 'idr',
    interval: 'lifetime',
  },
} as const;

export class PaymentService {
  private stripe: Stripe | null = null;
  private isConfigured: boolean = false;
  public readonly PLANS = PRICING_PLANS;
  private readonly config: ConfigService;
  private readonly emailSvc: EmailService;

  constructor(
    config: ConfigService = configService,
    emailSvc: EmailService = emailService,
    stripeInstance?: Stripe
  ) {
    this.config = config;
    this.emailSvc = emailSvc;
    
    if (stripeInstance) {
      // Injected Stripe instance (for testing)
      this.stripe = stripeInstance;
      this.isConfigured = true;
    } else {
      // Initialize from config
      this.initialize();
    }
  }

  /**
   * Log Stripe configuration warning
   */
  private logConfigurationWarning(): void {
    console.warn('⚠️  Stripe not configured. Payment processing will be disabled.');
    console.warn('💳 Add Stripe credentials to .env file:');
    console.warn('   STRIPE_SECRET_KEY=sk_test_...');
    console.warn('   STRIPE_PUBLISHABLE_KEY=pk_test_...');
    console.warn('   STRIPE_WEBHOOK_SECRET=whsec_...');
  }

  /**
   * Initialize Stripe
   */
  private initialize(): void {
    const stripeSecretKey = this.config.get('stripe').secretKey;

    if (!stripeSecretKey) {
      this.logConfigurationWarning();
      this.isConfigured = false;
      return;
    }

    try {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-12-15.clover',
        typescript: true,
      });

      this.isConfigured = true;
      console.log('✅ Stripe configured successfully');
      logInfo('Stripe initialized');
    } catch (error) {
      console.error('❌ Error initializing Stripe:', (error as Error).message);
      logError(error as Error, { context: 'Stripe initialization' });
      this.isConfigured = false;
    }
  }

  /**
   * Create checkout session for subscription or one-time payment
   */
  async createCheckoutSession(
    options: CreateCheckoutSessionOptions
  ): Promise<{ success: boolean; sessionId?: string; url?: string; error?: string }> {
    if (!this.isConfigured || !this.stripe) {
      return {
        success: false,
        error: 'Stripe not configured. Please contact administrator.',
      };
    }

    try {
      const session = await this.stripe.checkout.sessions.create({
        customer_email: options.userEmail,
        client_reference_id: options.userId,
        line_items: [
          {
            price: options.priceId,
            quantity: 1,
          },
        ],
        mode: options.mode,
        success_url: options.successUrl,
        cancel_url: options.cancelUrl,
        metadata: {
          userId: options.userId,
          userName: options.userName,
        },
      });

      logInfo('Checkout session created', {
        sessionId: session.id,
        userId: options.userId,
        mode: options.mode,
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url || undefined,
      };
    } catch (error: any) {
      console.error('❌ Error creating checkout session:', error.message);
      logError(error, { context: 'Create checkout session', userId: options.userId });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create payment intent for custom amount
   */
  async createPaymentIntent(
    options: CreatePaymentIntentOptions
  ): Promise<{ success: boolean; clientSecret?: string; error?: string }> {
    if (!this.isConfigured || !this.stripe) {
      return {
        success: false,
        error: 'Stripe not configured',
      };
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: options.amount,
        currency: options.currency,
        description: options.description,
        metadata: {
          userId: options.userId,
          userEmail: options.userEmail,
        },
      });

      logInfo('Payment intent created', {
        paymentIntentId: paymentIntent.id,
        amount: options.amount,
        userId: options.userId,
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret || undefined,
      };
    } catch (error: any) {
      console.error('❌ Error creating payment intent:', error.message);
      logError(error, { context: 'Create payment intent', userId: options.userId });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string
  ): Stripe.Event | null {
    if (!this.isConfigured || !this.stripe) {
      return null;
    }

    const webhookSecret = this.config.get('stripe').webhookSecret;
    if (!webhookSecret) {
      console.error('Webhook secret not configured');
      return null;
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
      return event;
    } catch (error: any) {
      console.error('❌ Webhook signature verification failed:', error.message);
      logError(error, { context: 'Webhook verification' });
      return null;
    }
  }

  /**
   * Handle successful payment
   */
  async handleSuccessfulPayment(
    session: Stripe.Checkout.Session
  ): Promise<boolean> {
    try {
      const userId = session.metadata?.userId || session.client_reference_id;
      const userName = session.metadata?.userName || 'User';
      const userEmail = session.customer_email || '';

      if (!userId) {
        throw new Error('User ID not found in session metadata');
      }

      // Send payment confirmation email
      if (userEmail) {
        await this.emailSvc.sendPaymentConfirmationEmail(
          userEmail,
          userName,
          'Pro Creator',
          session.amount_total || 0
        );
      }

      logInfo('Payment successful', {
        userId,
        sessionId: session.id,
        amount: session.amount_total,
      });

      return true;
    } catch (error: any) {
      console.error('❌ Error handling successful payment:', error.message);
      logError(error, { context: 'Handle successful payment' });
      return false;
    }
  }

  /**
   * Retrieve customer subscriptions
   */
  async getCustomerSubscriptions(
    customerId: string
  ): Promise<Stripe.Subscription[]> {
    if (!this.isConfigured || !this.stripe) {
      return [];
    }

    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        limit: 100,
      });

      return subscriptions.data;
    } catch (error: any) {
      console.error('❌ Error retrieving subscriptions:', error.message);
      logError(error, { context: 'Get subscriptions', customerId });
      return [];
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    if (!this.isConfigured || !this.stripe) {
      return false;
    }

    try {
      await this.stripe.subscriptions.cancel(subscriptionId);
      logInfo('Subscription cancelled', { subscriptionId });
      return true;
    } catch (error: any) {
      console.error('❌ Error cancelling subscription:', error.message);
      logError(error, { context: 'Cancel subscription', subscriptionId });
      return false;
    }
  }

  /**
   * Create customer portal session
   */
  async createPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    if (!this.isConfigured || !this.stripe) {
      return {
        success: false,
        error: 'Stripe not configured',
      };
    }

    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return {
        success: true,
        url: session.url,
      };
    } catch (error: any) {
      console.error('❌ Error creating portal session:', error.message);
      logError(error, { context: 'Create portal session', customerId });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get service status
   */
  getStatus(): { configured: boolean; mode: string } {
    const secretKey = this.config.get('stripe').secretKey;
    return {
      configured: this.isConfigured,
      mode: secretKey?.startsWith('sk_test')
        ? 'test'
        : secretKey?.startsWith('sk_live')
        ? 'live'
        : 'not configured',
    };
  }
}

// Export singleton instance for backward compatibility
export const paymentService = new PaymentService();

// Factory function for testing and dependency injection
export const createPaymentService = (
  config?: ConfigService,
  emailSvc?: EmailService,
  stripeInstance?: Stripe
): PaymentService => {
  return new PaymentService(config, emailSvc, stripeInstance);
};

export default paymentService;
