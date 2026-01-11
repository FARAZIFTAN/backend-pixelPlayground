import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/paymentService';
import { verifyAuth } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';

/**
 * @swagger
 * /api/payments/create-checkout:
 *   post:
 *     summary: Create Stripe checkout session
 *     description: Create a checkout session for Pro Creator subscription
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plan
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [monthly, yearly, lifetime]
 *                 description: Subscription plan
 *     responses:
 *       200:
 *         description: Checkout session created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 sessionId:
 *                   type: string
 *                 url:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

const VALID_PLANS = ['monthly', 'yearly', 'lifetime'] as const;
type ValidPlan = typeof VALID_PLANS[number];

const PRICE_ID_ENV_KEYS: Record<ValidPlan, string> = {
  monthly: 'STRIPE_PRICE_MONTHLY',
  yearly: 'STRIPE_PRICE_YEARLY',
  lifetime: 'STRIPE_PRICE_LIFETIME',
};

function isValidPlan(plan: any): plan is ValidPlan {
  return VALID_PLANS.includes(plan);
}

function getPriceId(plan: ValidPlan): string | null {
  return process.env[PRICE_ID_ENV_KEYS[plan]] || null;
}

function getCheckoutMode(plan: ValidPlan): 'subscription' | 'payment' {
  return plan === 'lifetime' ? 'payment' : 'subscription';
}
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult || !authResult.isValid || !authResult.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const { plan } = await request.json();

    // Validate plan
    if (!isValidPlan(plan)) {
      return NextResponse.json(
        { success: false, message: `Invalid plan. Must be one of: ${VALID_PLANS.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if Stripe is configured
    const stripeStatus = paymentService.getStatus();
    if (!stripeStatus.configured) {
      return NextResponse.json(
        {
          success: false,
          message: 'Payment system is not configured. Please contact administrator.',
        },
        { status: 503 }
      );
    }

    // Get price ID from environment
    const priceId = getPriceId(plan);
    if (!priceId) {
      return NextResponse.json(
        {
          success: false,
          message: `Price ID for ${plan} plan not configured`,
        },
        { status: 500 }
      );
    }

    // Create checkout session
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const result = await paymentService.createCheckoutSession({
      userId: user._id.toString(),
      userEmail: user.email,
      userName: user.name,
      priceId,
      mode: getCheckoutMode(plan),
      successUrl: `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${frontendUrl}/pricing`,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.error || 'Failed to create checkout session',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      url: result.url,
    });
  } catch (error) {
    console.error('Create checkout error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while creating checkout session',
      },
      { status: 500 }
    );
  }
}
