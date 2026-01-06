/**
 * Unit Tests for PaymentService
 * Tests Stripe payment integration with mocked dependencies
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PaymentService, createPaymentService } from '@/lib/paymentService';
import { createConfigService } from '@/lib/config';
import { createEmailService } from '@/lib/emailService';
import Stripe from 'stripe';

describe('PaymentService', () => {
  let mockStripe: any;
  let mockConfig: any;
  let mockEmailService: any;
  let paymentService: PaymentService;

  beforeEach(() => {
    // Mock config
    mockConfig = createConfigService({
        STRIPE_SECRET_KEY: 'sk_test_123456',
        STRIPE_PUBLISHABLE_KEY: 'pk_test_123456',
        STRIPE_WEBHOOK_SECRET: 'whsec_test_123456',
        STRIPE_PRICE_MONTHLY: 'price_monthly_test',
        STRIPE_PRICE_YEARLY: 'price_yearly_test',
        STRIPE_PRICE_LIFETIME: 'price_lifetime_test',
    } as any);

    // Mock email service
    mockEmailService = {
      sendPaymentConfirmationEmail: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
    };

    // Mock Stripe instance
    mockStripe = {
      checkout: {
        sessions: {
          create: jest.fn<() => Promise<{id: string; url: string}>>().mockResolvedValue({
            id: 'cs_test_123456',
            url: 'https://checkout.stripe.com/pay/cs_test_123456',
          }),
          retrieve: jest.fn<() => Promise<{id: string; payment_status: string; amount_total: number; customer_email: string}>>().mockResolvedValue({
            id: 'cs_test_123456',
            payment_status: 'paid',
            amount_total: 99000,
            customer_email: 'test@test.com',
          }) as any,
        },
      },
      paymentIntents: {
        create: jest.fn<() => Promise<{id: string; client_secret: string}>>().mockResolvedValue({
          id: 'pi_test_123456',
          client_secret: 'pi_test_123456_secret_xyz',
        }),
      },
      webhooks: {
        constructEvent: jest.fn().mockReturnValue({
          id: 'evt_test_123456',
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_test_123',
              customer_email: 'test@test.com',
            },
          },
        }),
      },
      subscriptions: {
        list: jest.fn<() => Promise<{data: Array<{id: string; status: string; current_period_end: number}>}>>().mockResolvedValue({
          data: [
            {
              id: 'sub_test_123',
              status: 'active',
              current_period_end: Math.floor(Date.now() / 1000) + 86400,
            },
          ],
        }),
        cancel: jest.fn<() => Promise<{id: string; status: string}>>().mockResolvedValue({
          id: 'sub_test_123',
          status: 'canceled',
        }),
      },
    };

    // Create PaymentService with mocks
    paymentService = createPaymentService(mockConfig, mockEmailService, mockStripe as any);
  });

  describe('Constructor and Initialization', () => {
    it('should create instance with dependencies', () => {
      expect(paymentService).toBeInstanceOf(PaymentService);
    });

    it('should create instance with default config when not provided', () => {
      const service = new PaymentService();
      expect(service).toBeInstanceOf(PaymentService);
    });

    it('should be configured when Stripe instance is injected', () => {
      const status = paymentService.getStatus();
      expect(status.configured).toBe(true);
    });

    it('should have PLANS property', () => {
      expect(paymentService.PLANS).toBeDefined();
      expect(paymentService.PLANS.monthly).toBeDefined();
      expect(paymentService.PLANS.yearly).toBeDefined();
      expect(paymentService.PLANS.lifetime).toBeDefined();
    });
  });

  describe('Pricing Plans', () => {
    it('should have monthly plan with correct details', () => {
      const plan = paymentService.PLANS.monthly;
      expect(plan.name).toBe('Pro Creator Monthly');
      expect(plan.price).toBe(99000);
      expect(plan.currency).toBe('idr');
      expect(plan.interval).toBe('month');
    });

    it('should have yearly plan with correct details', () => {
      const plan = paymentService.PLANS.yearly;
      expect(plan.name).toBe('Pro Creator Yearly');
      expect(plan.price).toBe(990000);
      expect(plan.currency).toBe('idr');
      expect(plan.interval).toBe('year');
    });

    it('should have lifetime plan with correct details', () => {
      const plan = paymentService.PLANS.lifetime;
      expect(plan.name).toBe('Pro Creator Lifetime');
      expect(plan.price).toBe(1990000);
      expect(plan.currency).toBe('idr');
      expect(plan.interval).toBe('lifetime');
    });
  });

  describe('Create Checkout Session', () => {
    const validOptions = {
      userId: 'user_123',
      userEmail: 'test@test.com',
      userName: 'Test User',
      priceId: 'price_monthly_test',
      mode: 'subscription' as const,
      successUrl: 'http://localhost:3000/success',
      cancelUrl: 'http://localhost:3000/cancel',
    };

    it('should create checkout session successfully', async () => {
      const result = await paymentService.createCheckoutSession(validOptions);

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe('cs_test_123456');
      expect(result.url).toBe('https://checkout.stripe.com/pay/cs_test_123456');
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalled();
    });

    it('should pass correct parameters to Stripe', async () => {
      await paymentService.createCheckoutSession(validOptions);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_email: 'test@test.com',
          client_reference_id: 'user_123',
          mode: 'subscription',
          line_items: [{ price: 'price_monthly_test', quantity: 1 }],
          success_url: 'http://localhost:3000/success',
          cancel_url: 'http://localhost:3000/cancel',
        })
      );
    });

    it('should include metadata in session', async () => {
      await paymentService.createCheckoutSession(validOptions);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            userId: 'user_123',
            userName: 'Test User',
          },
        })
      );
    });

    it('should handle Stripe API errors', async () => {
      mockStripe.checkout.sessions.create.mockRejectedValueOnce(
        new Error('Stripe API error')
      );

      const result = await paymentService.createCheckoutSession(validOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Stripe API error');
    });

    it('should return error when Stripe is not configured', async () => {
      const unconfiguredService = new PaymentService(mockConfig, mockEmailService);
      const result = await unconfiguredService.createCheckoutSession(validOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Create Payment Intent', () => {
    const intentOptions = {
      amount: 99000,
      currency: 'idr',
      userId: 'user_123',
      userEmail: 'test@test.com',
      description: 'Pro Creator Monthly',
    };

    it('should create payment intent successfully', async () => {
      const result = await paymentService.createPaymentIntent(intentOptions);

      expect(result.success).toBe(true);
      expect(result.clientSecret).toBe('pi_test_123456_secret_xyz');
      expect(mockStripe.paymentIntents.create).toHaveBeenCalled();
    });

    it('should pass correct parameters to Stripe', async () => {
      await paymentService.createPaymentIntent(intentOptions);

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 99000,
          currency: 'idr',
          description: 'Pro Creator Monthly',
          metadata: {
            userId: 'user_123',
            userEmail: 'test@test.com',
          },
        })
      );
    });

    it('should handle payment intent creation errors', async () => {
      mockStripe.paymentIntents.create.mockRejectedValueOnce(
        new Error('Payment intent failed')
      );

      const result = await paymentService.createPaymentIntent(intentOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment intent failed');
    });

    it('should return error when Stripe is not configured', async () => {
      const unconfiguredService = new PaymentService(mockConfig, mockEmailService);
      const result = await unconfiguredService.createPaymentIntent(intentOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Verify Webhook Signature', () => {
    const payload = 'webhook_payload_data';
    const signature = 'stripe_signature_xyz';

    it('should verify webhook signature successfully', () => {
      const event = paymentService.verifyWebhookSignature(payload, signature);

      expect(event).not.toBeNull();
      expect(event?.id).toBe('evt_test_123456');
      expect(event?.type).toBe('checkout.session.completed');
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        payload,
        signature,
        'whsec_test_123456'
      );
    });

    it('should return null when signature verification fails', () => {
      mockStripe.webhooks.constructEvent.mockImplementationOnce(() => {
        throw new Error('Invalid signature');
      });

      const event = paymentService.verifyWebhookSignature(payload, signature);

      expect(event).toBeNull();
    });

    it('should return null when Stripe is not configured', () => {
      const unconfiguredService = new PaymentService(mockConfig, mockEmailService);
      const event = unconfiguredService.verifyWebhookSignature(payload, signature);

      expect(event).toBeNull();
    });

    it('should return null when webhook secret is missing', () => {
      const configWithoutSecret = createConfigService({
        STRIPE_SECRET_KEY: 'sk_test_123',
      } as any);
      const service = createPaymentService(configWithoutSecret, mockEmailService, mockStripe);
      
      const event = service.verifyWebhookSignature(payload, signature);

      expect(event).toBeNull();
    });
  });

  describe('Handle Successful Payment', () => {
    const mockSession: any = {
      id: 'cs_test_123',
      metadata: {
        userId: 'user_123',
        userName: 'Test User',
      },
      customer_email: 'test@test.com',
      amount_total: 99000,
    };

    it('should handle successful payment', async () => {
      const result = await paymentService.handleSuccessfulPayment(mockSession);

      expect(result).toBe(true);
      expect(mockEmailService.sendPaymentConfirmationEmail).toHaveBeenCalledWith(
        'test@test.com',
        'Test User',
        'Pro Creator',
        99000
      );
    });

    it('should handle payment with client_reference_id', async () => {
      const sessionWithRef = {
        ...mockSession,
        metadata: {},
        client_reference_id: 'user_456',
      };

      const result = await paymentService.handleSuccessfulPayment(sessionWithRef);

      expect(result).toBe(true);
    });

    it('should return true even if email fails', async () => {
      mockEmailService.sendPaymentConfirmationEmail.mockResolvedValueOnce(false);

      const result = await paymentService.handleSuccessfulPayment(mockSession);

      expect(result).toBe(true);
    });

    it('should handle missing user ID', async () => {
      const invalidSession = {
        ...mockSession,
        metadata: {},
        client_reference_id: null,
      };

      const result = await paymentService.handleSuccessfulPayment(invalidSession);

      expect(result).toBe(false);
    });

    it('should not send email if customer_email is missing', async () => {
      const sessionWithoutEmail = {
        ...mockSession,
        customer_email: null,
      };

      await paymentService.handleSuccessfulPayment(sessionWithoutEmail);

      expect(mockEmailService.sendPaymentConfirmationEmail).not.toHaveBeenCalled();
    });
  });

  describe('Get Customer Subscriptions', () => {
    const customerId = 'cus_test_123';

    it('should retrieve customer subscriptions successfully', async () => {
      const result = await paymentService.getCustomerSubscriptions(customerId);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('sub_test_123');
      expect(mockStripe.subscriptions.list).toHaveBeenCalledWith({
        customer: customerId,
        limit: 100,
      });
    });

    it('should handle empty subscriptions', async () => {
      mockStripe.subscriptions.list.mockResolvedValueOnce({ data: [] });

      const result = await paymentService.getCustomerSubscriptions(customerId);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should handle API errors', async () => {
      mockStripe.subscriptions.list.mockRejectedValueOnce(new Error('API error'));

      const result = await paymentService.getCustomerSubscriptions(customerId);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should return empty array when Stripe is not configured', async () => {
      const unconfiguredService = new PaymentService(mockConfig, mockEmailService);
      const result = await unconfiguredService.getCustomerSubscriptions(customerId);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('Cancel Subscription', () => {
    const subscriptionId = 'sub_test_123';

    it('should cancel subscription successfully', async () => {
      const result = await paymentService.cancelSubscription(subscriptionId);

      expect(result).toBe(true);
      expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith(subscriptionId);
    });

    it('should handle cancellation errors', async () => {
      mockStripe.subscriptions.cancel.mockRejectedValueOnce(
        new Error('Cannot cancel')
      );

      const result = await paymentService.cancelSubscription(subscriptionId);

      expect(result).toBe(false);
    });

    it('should return false when Stripe is not configured', async () => {
      const unconfiguredService = new PaymentService(mockConfig, mockEmailService);
      const result = await unconfiguredService.cancelSubscription(subscriptionId);

      expect(result).toBe(false);
    });
  });

  describe('Service Status', () => {
    it('should return test mode status', () => {
      const status = paymentService.getStatus();
      expect(status.configured).toBe(true);
      expect(status.mode).toBe('test');
    });

    it('should detect live mode', () => {
      const liveConfig = createConfigService({
        STRIPE_SECRET_KEY: 'sk_live_123456',
      } as any);
      const service = createPaymentService(liveConfig, mockEmailService, mockStripe);

      const status = service.getStatus();
      expect(status.mode).toBe('live');
    });

    it('should return not configured when Stripe is missing', () => {
      const emptyConfig = createConfigService({} as NodeJS.ProcessEnv);
      const unconfiguredService = new PaymentService(emptyConfig, mockEmailService);
      const status = unconfiguredService.getStatus();

      expect(status.configured).toBe(false);
      expect(status.mode).toBe('not configured');
    });
  });

  describe('Factory Function', () => {
    it('should create PaymentService via factory', () => {
      const service = createPaymentService();
      expect(service).toBeInstanceOf(PaymentService);
    });

    it('should create PaymentService with custom config via factory', () => {
      const customConfig = createConfigService({
        STRIPE_SECRET_KEY: 'sk_test_custom',
      } as any);
      const service = createPaymentService(customConfig);
      expect(service).toBeInstanceOf(PaymentService);
    });

    it('should create PaymentService with all dependencies via factory', () => {
      const service = createPaymentService(mockConfig, mockEmailService, mockStripe);
      expect(service).toBeInstanceOf(PaymentService);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockStripe.checkout.sessions.create.mockRejectedValueOnce(
        new Error('Network timeout')
      );

      const result = await paymentService.createCheckoutSession({
        userId: 'user_123',
        userEmail: 'test@test.com',
        userName: 'Test',
        priceId: 'price_test',
        mode: 'subscription',
        successUrl: 'http://success',
        cancelUrl: 'http://cancel',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle invalid API keys', async () => {
      mockStripe.checkout.sessions.create.mockRejectedValueOnce(
        new Error('Invalid API key provided')
      );

      const result = await paymentService.createCheckoutSession({
        userId: 'user_123',
        userEmail: 'test@test.com',
        userName: 'Test',
        priceId: 'price_test',
        mode: 'payment',
        successUrl: 'http://success',
        cancelUrl: 'http://cancel',
      });

      expect(result.success).toBe(false);
    });
  });
});
