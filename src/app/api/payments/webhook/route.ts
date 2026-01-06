import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/paymentService';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Payment from '@/models/Payment';
import { logInfo, logError } from '@/lib/errorHandler';
import type Stripe from 'stripe';

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Stripe webhook handler
 *     description: Handle Stripe webhook events for payment processing
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Webhook processed
 */

// Convert cents to currency amount
function convertFromCents(amountInCents: number): number {
  return amountInCents / 100;
}

// Handle checkout session completed
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  logInfo('Checkout session completed', { sessionId: session.id });

  const userId = session.metadata?.userId || session.client_reference_id;
  if (!userId) {
    logError(new Error('User ID not found in session'), { sessionId: session.id });
    return;
  }

  // Update user to premium
  const user = await (User as any).findByIdAndUpdate(
    userId,
    {
      isPremium: true,
      premiumStartDate: new Date(),
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription || null,
    },
    { new: true }
  );

  if (!user) {
    logError(new Error('User not found'), { userId });
    return;
  }

  // Create payment record
  await Payment.create({
    user: userId,
    amount: convertFromCents(session.amount_total || 0),
    currency: session.currency,
    status: 'approved',
    paymentMethod: 'stripe',
    stripeSessionId: session.id,
    stripePaymentIntentId: session.payment_intent,
  });

  // Send confirmation email
  await paymentService.handleSuccessfulPayment(session);

  logInfo('User upgraded to premium', { userId, email: user.email });
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  logInfo('Subscription cancelled', { subscriptionId: subscription.id });

  const user = await (User as any).findOneAndUpdate(
    { stripeSubscriptionId: subscription.id },
    {
      isPremium: false,
      premiumEndDate: new Date(),
    },
    { new: true }
  );

  if (user) {
    logInfo('User downgraded from premium', { userId: user._id });
  }
}

// Handle successful invoice payment
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  logInfo('Invoice payment succeeded', { invoiceId: invoice.id });

  const userId = invoice.customer_email;
  if (userId) {
    await Payment.create({
      user: userId,
      amount: convertFromCents(invoice.amount_paid),
      currency: invoice.currency,
      status: 'approved',
      paymentMethod: 'stripe',
      stripeInvoiceId: invoice.id,
    });
  }
}

// Handle failed invoice payment
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  logError(
    new Error('Invoice payment failed'),
    { invoiceId: invoice.id, customerId: invoice.customer }
  );

  await Payment.create({
    amount: convertFromCents(invoice.amount_due),
    currency: invoice.currency,
    status: 'rejected',
    paymentMethod: 'stripe',
    stripeInvoiceId: invoice.id,
    reason: 'Payment failed',
  });
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { success: false, message: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const event = paymentService.verifyWebhookSignature(body, signature);
    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Invalid signature' },
        { status: 400 }
      );
    }

    await connectDB();

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    logError(error as Error, { context: 'Stripe webhook' });
    return NextResponse.json(
      { success: false, message: 'Webhook error' },
      { status: 400 }
    );
  }
}
