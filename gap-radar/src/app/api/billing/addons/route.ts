/**
 * BILL-010: Add-On Purchases API
 *
 * Handles checkout for add-on purchases:
 * - Ad Angle Pack ($29)
 * - Landing Page Rewrites ($49)
 * - Competitor Watchlist ($99)
 */

import { stripe, ADDON_PACKAGES, AddonPackageKey } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse request body
  const body = await request.json();
  const { addon } = body as { addon: AddonPackageKey };

  // Validate addon package
  if (!addon || !ADDON_PACKAGES[addon]) {
    return NextResponse.json({ error: 'Invalid addon' }, { status: 400 });
  }

  const addonConfig = ADDON_PACKAGES[addon];
  if (!addonConfig.priceId) {
    return NextResponse.json({ error: 'Addon not available' }, { status: 400 });
  }

  try {
    // Get or create Stripe customer
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();

    let customerId = userData?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData?.email || user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Create checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: addonConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing/addons?success=true&addon=${addon}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing/addons?canceled=true`,
      metadata: {
        user_id: user.id,
        addon_type: addon,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Addon checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
