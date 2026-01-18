import { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/billing/portal
 * Feature: STRIPE-002 - Create Stripe Customer Portal session
 *
 * Creates a Stripe billing portal session URL for the authenticated user
 * to manage their subscription, payment methods, and view invoices.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Stripe customer ID from user metadata
    const stripeCustomerId = user.user_metadata?.stripe_customer_id;

    if (!stripeCustomerId) {
      return Response.json({ error: 'No Stripe customer found' }, { status: 400 });
    }

    // Parse request body
    let returnUrl: string;
    try {
      const body = await request.json();
      returnUrl = body.returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/dashboard/billing`;
    } catch (e) {
      // If body is empty or invalid, use default return URL
      returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/dashboard/billing`;
    }

    // Create Stripe billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return Response.json({ url: portalSession.url }, { status: 200 });
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    return Response.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}
