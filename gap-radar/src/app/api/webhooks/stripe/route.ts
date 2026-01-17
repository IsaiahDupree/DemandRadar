import { stripe, getPlanByPriceId, getRunsLimit, PLANS } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendEmail } from '@/lib/email';
import { SubscriptionConfirmationEmail } from '@/lib/email-templates';

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        // Get the subscription to find the price
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        const plan = priceId ? getPlanByPriceId(priceId) : 'starter';

        // Update user's plan
        const { data: updatedUser } = await supabase
          .from('users')
          .update({
            plan: plan || 'starter',
            runs_limit: getRunsLimit(plan || 'starter'),
            runs_used: 0,
            stripe_customer_id: customerId,
          })
          .eq('stripe_customer_id', customerId)
          .select('email, name')
          .single();

        // Send subscription confirmation email
        if (updatedUser?.email && plan) {
          const planInfo = PLANS[plan];
          try {
            await sendEmail({
              to: updatedUser.email,
              subject: `Welcome to ${planInfo.name}! 🎉`,
              react: SubscriptionConfirmationEmail({
                userName: updatedUser.name,
                planName: planInfo.name,
                planPrice: `$${planInfo.price}/month`,
                features: [...planInfo.features],
                isUpgrade: false,
              }),
            });
            console.log('✅ Subscription confirmation email sent to:', updatedUser.email);
          } catch (error) {
            console.error('⚠️ Failed to send subscription confirmation email:', error);
          }
        }

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price.id;
        const plan = priceId ? getPlanByPriceId(priceId) : null;

        if (plan) {
          const { data: updatedUser } = await supabase
            .from('users')
            .update({
              plan,
              runs_limit: getRunsLimit(plan),
            })
            .eq('stripe_customer_id', customerId)
            .select('email, name')
            .single();

          // Send upgrade/change confirmation email
          if (updatedUser?.email) {
            const planInfo = PLANS[plan];
            try {
              await sendEmail({
                to: updatedUser.email,
                subject: `Plan Updated to ${planInfo.name}! 🎉`,
                react: SubscriptionConfirmationEmail({
                  userName: updatedUser.name,
                  planName: planInfo.name,
                  planPrice: `$${planInfo.price}/month`,
                  features: [...planInfo.features],
                  isUpgrade: true,
                }),
              });
              console.log('✅ Plan change confirmation email sent to:', updatedUser.email);
            } catch (error) {
              console.error('⚠️ Failed to send plan change email:', error);
            }
          }
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Downgrade to free plan
        await supabase
          .from('users')
          .update({
            plan: 'free',
            runs_limit: 2,
          })
          .eq('stripe_customer_id', customerId);

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Reset runs_used on successful payment (new billing cycle)
        if (invoice.billing_reason === 'subscription_cycle') {
          await supabase
            .from('users')
            .update({ runs_used: 0 })
            .eq('stripe_customer_id', customerId);
        }

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
