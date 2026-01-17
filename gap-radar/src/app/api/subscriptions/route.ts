import { stripe, PLANS, PlanKey } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscription data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('plan, runs_limit, runs_used, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let subscriptionData = null;

    // If user has a Stripe customer ID, get their subscription details
    if (userData.stripe_customer_id) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: userData.stripe_customer_id,
          status: 'active',
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0] as any;
          subscriptionData = {
            id: subscription.id,
            status: subscription.status,
            currentPeriodEnd: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
            cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
            priceId: subscription.items?.data?.[0]?.price?.id,
          };
        }
      } catch (stripeError) {
        console.error('Error fetching Stripe subscription:', stripeError);
      }
    }

    return NextResponse.json({
      plan: userData.plan,
      runsLimit: userData.runs_limit,
      runsUsed: userData.runs_used,
      subscription: subscriptionData,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, planKey } = body;

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'upgrade') {
      // Validate plan
      if (!planKey || !(planKey in PLANS)) {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
      }

      const plan = PLANS[planKey as PlanKey];

      if (!('priceId' in plan) || !plan.priceId) {
        return NextResponse.json({ error: 'Plan not available' }, { status: 400 });
      }

      // Create or get customer
      let customerId = userData.stripe_customer_id;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: userData.email,
          metadata: {
            supabase_user_id: user.id,
          },
        });
        customerId = customer.id;

        // Update user with customer ID
        await supabase
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id);
      }

      // Check for existing active subscription
      const existingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      });

      if (existingSubscriptions.data.length > 0) {
        // Update existing subscription
        const subscription = existingSubscriptions.data[0];
        const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
          items: [
            {
              id: subscription.items.data[0].id,
              price: plan.priceId,
            },
          ],
          proration_behavior: 'always_invoice',
        });

        return NextResponse.json({
          success: true,
          subscription: {
            id: updatedSubscription.id,
            status: updatedSubscription.status,
          },
        });
      } else {
        // Create checkout session for new subscription
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [
            {
              price: plan.priceId,
              quantity: 1,
            },
          ],
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
          metadata: {
            supabase_user_id: user.id,
          },
        });

        return NextResponse.json({
          success: true,
          checkoutUrl: session.url,
        });
      }
    } else if (action === 'cancel') {
      if (!userData.stripe_customer_id) {
        return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
      }

      // Get active subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: userData.stripe_customer_id,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        return NextResponse.json({ error: 'No active subscription' }, { status: 404 });
      }

      // Cancel at period end (don't cancel immediately)
      const subscription = await stripe.subscriptions.update(subscriptions.data[0].id, {
        cancel_at_period_end: true,
      });

      return NextResponse.json({
        success: true,
        subscription: {
          id: subscription.id,
          cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
        },
      });
    } else if (action === 'reactivate') {
      if (!userData.stripe_customer_id) {
        return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
      }

      // Get subscription scheduled for cancellation
      const subscriptions = await stripe.subscriptions.list({
        customer: userData.stripe_customer_id,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        return NextResponse.json({ error: 'No active subscription' }, { status: 404 });
      }

      const currentSub = subscriptions.data[0];

      if (!currentSub.cancel_at_period_end) {
        return NextResponse.json({ error: 'Subscription is not scheduled for cancellation' }, { status: 400 });
      }

      // Reactivate subscription
      const subscription = await stripe.subscriptions.update(currentSub.id, {
        cancel_at_period_end: false,
      });

      return NextResponse.json({
        success: true,
        subscription: {
          id: subscription.id,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error managing subscription:', error);
    return NextResponse.json(
      { error: 'Failed to manage subscription' },
      { status: 500 }
    );
  }
}
