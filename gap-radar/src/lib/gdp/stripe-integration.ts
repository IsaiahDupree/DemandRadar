/**
 * GDP-007: Stripe Integration with Growth Data Plane
 *
 * Helper functions for integrating Stripe webhooks with the Growth Data Plane.
 * Handles person creation, identity linking, subscription tracking, and unified events.
 */

import { createServiceClient } from '@/lib/supabase/service';
import Stripe from 'stripe';

export interface StripeCustomerData {
  customerId: string;
  email: string;
  name?: string;
}

export interface SubscriptionData {
  subscriptionId: string;
  customerId: string;
  planName: string;
  planId: string;
  status: string;
  amountCents: number;
  billingInterval?: string;
  currency?: string;
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
  trialStart?: number;
  trialEnd?: number;
  canceledAt?: number;
  endedAt?: number;
}

/**
 * Get or create a person record in the GDP and link their Stripe customer ID
 */
export async function getOrCreatePersonWithStripeLink(
  customerData: StripeCustomerData
): Promise<string | null> {
  const serviceClient = createServiceClient();

  try {
    // Get or create person by email
    const { data: personId, error: personError } = await serviceClient.rpc(
      'get_or_create_person',
      {
        p_email: customerData.email,
        p_first_name: customerData.name?.split(' ')[0] || null,
        p_last_name: customerData.name?.split(' ').slice(1).join(' ') || null,
        p_properties: {},
      }
    );

    if (personError) {
      console.error('Error creating person:', personError);
      return null;
    }

    // Link Stripe customer ID to person
    const { error: linkError } = await serviceClient.rpc('link_person_identity', {
      p_person_id: personId,
      p_platform: 'stripe',
      p_external_id: customerData.customerId,
      p_properties: {},
    });

    if (linkError) {
      console.error('Error linking Stripe identity:', linkError);
      return null;
    }

    return personId;
  } catch (error) {
    console.error('Error in getOrCreatePersonWithStripeLink:', error);
    return null;
  }
}

/**
 * Find person_id from stripe_customer_id via identity_link table
 */
export async function findPersonByStripeCustomerId(
  customerId: string
): Promise<string | null> {
  const serviceClient = createServiceClient();

  try {
    const { data, error } = await serviceClient
      .from('identity_link')
      .select('person_id')
      .eq('platform', 'stripe')
      .eq('external_id', customerId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.person_id;
  } catch (error) {
    console.error('Error finding person by Stripe customer ID:', error);
    return null;
  }
}

/**
 * Create or update subscription record in GDP subscription table
 */
export async function upsertSubscription(
  personId: string,
  subscriptionData: SubscriptionData
): Promise<void> {
  const serviceClient = createServiceClient();

  try {
    const mrr = subscriptionData.billingInterval === 'year'
      ? Math.round(subscriptionData.amountCents / 12)
      : subscriptionData.amountCents;

    const subscriptionRecord = {
      person_id: personId,
      stripe_customer_id: subscriptionData.customerId,
      stripe_subscription_id: subscriptionData.subscriptionId,
      plan_name: subscriptionData.planName,
      plan_id: subscriptionData.planId,
      status: subscriptionData.status,
      billing_interval: subscriptionData.billingInterval || 'month',
      currency: (subscriptionData.currency || 'USD').toUpperCase(),
      amount_cents: subscriptionData.amountCents,
      mrr_cents: mrr,
      current_period_start: subscriptionData.currentPeriodStart
        ? new Date(subscriptionData.currentPeriodStart * 1000).toISOString()
        : null,
      current_period_end: subscriptionData.currentPeriodEnd
        ? new Date(subscriptionData.currentPeriodEnd * 1000).toISOString()
        : null,
      trial_start: subscriptionData.trialStart
        ? new Date(subscriptionData.trialStart * 1000).toISOString()
        : null,
      trial_end: subscriptionData.trialEnd
        ? new Date(subscriptionData.trialEnd * 1000).toISOString()
        : null,
      canceled_at: subscriptionData.canceledAt
        ? new Date(subscriptionData.canceledAt * 1000).toISOString()
        : null,
      ended_at: subscriptionData.endedAt
        ? new Date(subscriptionData.endedAt * 1000).toISOString()
        : null,
    };

    const { error } = await serviceClient
      .from('subscription')
      .upsert(subscriptionRecord);

    if (error) {
      console.error('Error upserting subscription:', error);
    }
  } catch (error) {
    console.error('Error in upsertSubscription:', error);
  }
}

/**
 * Create a unified event in the GDP unified_event table
 */
export async function createUnifiedEvent(
  personId: string,
  eventName: string,
  properties: Record<string, any>,
  rawEvent?: any
): Promise<void> {
  const serviceClient = createServiceClient();

  try {
    const { error } = await serviceClient.from('unified_event').insert({
      person_id: personId,
      event_name: eventName,
      event_source: 'stripe',
      event_timestamp: new Date().toISOString(),
      properties,
      raw_event: rawEvent || {},
    });

    if (error) {
      console.error('Error creating unified event:', error);
    }
  } catch (error) {
    console.error('Error in createUnifiedEvent:', error);
  }
}

/**
 * Handle checkout.session.completed event
 */
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId = session.customer as string;
  const email = session.customer_details?.email || session.customer_email;
  const name = session.customer_details?.name;

  if (!email) {
    console.error('No email found in checkout session');
    return;
  }

  // Get or create person and link Stripe customer ID
  const personId = await getOrCreatePersonWithStripeLink({
    customerId,
    email,
    name: name || undefined,
  });

  if (!personId) {
    console.error('Failed to create or find person');
    return;
  }

  // Extract subscription details
  const priceData = subscription.items.data[0]?.price;
  const planName = getPlanNameFromPriceId(priceData?.id);

  // Create/update subscription record
  await upsertSubscription(personId, {
    subscriptionId: subscription.id,
    customerId,
    planName,
    planId: priceData?.id || 'unknown',
    status: subscription.status,
    amountCents: priceData?.unit_amount || 0,
    billingInterval: priceData?.recurring?.interval,
    currency: subscription.currency,
    currentPeriodStart: subscription.current_period_start,
    currentPeriodEnd: subscription.current_period_end,
    trialStart: subscription.trial_start || undefined,
    trialEnd: subscription.trial_end || undefined,
  });

  // Create purchase_completed unified event
  await createUnifiedEvent(
    personId,
    'purchase_completed',
    {
      plan: planName,
      amount_cents: session.amount_total || priceData?.unit_amount || 0,
      subscription_id: subscription.id,
      customer_id: customerId,
    },
    { session, subscription }
  );

  console.log('✅ GDP integration: checkout.session.completed processed for', email);
}

/**
 * Handle customer.subscription.updated event
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId = subscription.customer as string;

  // Find person by Stripe customer ID
  const personId = await findPersonByStripeCustomerId(customerId);

  if (!personId) {
    console.error('Person not found for Stripe customer:', customerId);
    return;
  }

  // Extract subscription details
  const priceData = subscription.items.data[0]?.price;
  const planName = getPlanNameFromPriceId(priceData?.id);

  // Update subscription record
  await upsertSubscription(personId, {
    subscriptionId: subscription.id,
    customerId,
    planName,
    planId: priceData?.id || 'unknown',
    status: subscription.status,
    amountCents: priceData?.unit_amount || 0,
    billingInterval: priceData?.recurring?.interval,
    currency: subscription.currency,
    currentPeriodStart: subscription.current_period_start,
    currentPeriodEnd: subscription.current_period_end,
    trialStart: subscription.trial_start || undefined,
    trialEnd: subscription.trial_end || undefined,
    canceledAt: subscription.canceled_at || undefined,
  });

  // Create subscription_updated unified event
  await createUnifiedEvent(
    personId,
    'subscription_updated',
    {
      plan: planName,
      status: subscription.status,
      subscription_id: subscription.id,
    },
    subscription
  );

  console.log('✅ GDP integration: subscription.updated processed for customer', customerId);
}

/**
 * Handle customer.subscription.deleted event
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId = subscription.customer as string;

  // Find person by Stripe customer ID
  const personId = await findPersonByStripeCustomerId(customerId);

  if (!personId) {
    console.error('Person not found for Stripe customer:', customerId);
    return;
  }

  // Update subscription status to canceled
  const serviceClient = createServiceClient();
  await serviceClient
    .from('subscription')
    .update({
      status: 'canceled',
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : new Date().toISOString(),
      ended_at: subscription.ended_at
        ? new Date(subscription.ended_at * 1000).toISOString()
        : new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  // Create subscription_canceled unified event
  await createUnifiedEvent(
    personId,
    'subscription_canceled',
    {
      subscription_id: subscription.id,
      canceled_at: subscription.canceled_at || Math.floor(Date.now() / 1000),
    },
    subscription
  );

  console.log('✅ GDP integration: subscription.deleted processed for customer', customerId);
}

/**
 * Handle invoice.payment_succeeded event
 */
export async function handlePaymentSucceeded(
  invoice: Stripe.Invoice
): Promise<void> {
  const customerId = invoice.customer as string;

  // Find person by Stripe customer ID
  const personId = await findPersonByStripeCustomerId(customerId);

  if (!personId) {
    console.error('Person not found for Stripe customer:', customerId);
    return;
  }

  // Create payment_succeeded unified event
  await createUnifiedEvent(
    personId,
    'payment_succeeded',
    {
      amount_paid: invoice.amount_paid,
      billing_reason: invoice.billing_reason,
      subscription_id: invoice.subscription,
    },
    invoice
  );

  console.log('✅ GDP integration: payment_succeeded processed for customer', customerId);
}

/**
 * Helper function to map price ID to plan name
 */
function getPlanNameFromPriceId(priceId?: string): string {
  if (!priceId) return 'unknown';

  // Map common price ID patterns to plan names
  if (priceId.includes('builder')) return 'builder';
  if (priceId.includes('agency')) return 'agency';
  if (priceId.includes('studio')) return 'studio';
  if (priceId.includes('starter')) return 'starter';

  return 'starter'; // Default
}
