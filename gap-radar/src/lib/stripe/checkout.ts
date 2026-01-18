import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

export interface CreateCheckoutSessionParams {
  priceId: string;
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

/**
 * Creates a Stripe checkout session for subscription purchase
 */
export async function createCheckoutSession({
  priceId,
  userId,
  userEmail,
  successUrl,
  cancelUrl,
  metadata = {},
}: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: userEmail,
    client_reference_id: userId,
    metadata: {
      userId,
      ...metadata,
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
  });

  return session;
}

/**
 * Retrieves a checkout session by ID with expanded data
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'customer'],
  });

  return session;
}
