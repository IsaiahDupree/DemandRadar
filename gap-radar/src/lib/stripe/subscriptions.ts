import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

/**
 * Retrieves a subscription by ID with expanded data
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['customer', 'default_payment_method'],
  });

  return subscription;
}

export interface CancelSubscriptionOptions {
  atPeriodEnd?: boolean;
}

/**
 * Cancels a subscription immediately or at period end
 */
export async function cancelSubscription(
  subscriptionId: string,
  options: CancelSubscriptionOptions = {}
): Promise<Stripe.Subscription> {
  const { atPeriodEnd = false } = options;

  if (atPeriodEnd) {
    // Cancel at period end
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    return subscription;
  } else {
    // Cancel immediately
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  }
}

export interface UpdateSubscriptionOptions {
  newPriceId?: string;
  metadata?: Record<string, string>;
}

/**
 * Updates a subscription (price change or metadata)
 */
export async function updateSubscription(
  subscriptionId: string,
  options: UpdateSubscriptionOptions
): Promise<Stripe.Subscription> {
  const { newPriceId, metadata } = options;

  const updateParams: Stripe.SubscriptionUpdateParams = {};

  // If changing price, update the subscription items
  if (newPriceId) {
    const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    const currentItemId = currentSubscription.items.data[0]?.id;

    if (!currentItemId) {
      throw new Error('No subscription items found');
    }

    updateParams.items = [
      {
        id: currentItemId,
        price: newPriceId,
      },
    ];
    updateParams.proration_behavior = 'create_prorations';
  }

  // If updating metadata
  if (metadata) {
    updateParams.metadata = metadata;
  }

  const subscription = await stripe.subscriptions.update(subscriptionId, updateParams);
  return subscription;
}

export interface ListCustomerSubscriptionsOptions {
  status?: Stripe.SubscriptionListParams.Status;
  limit?: number;
}

/**
 * Lists all subscriptions for a customer
 */
export async function listCustomerSubscriptions(
  customerId: string,
  options: ListCustomerSubscriptionsOptions = {}
): Promise<Stripe.ApiList<Stripe.Subscription>> {
  const { status = 'all', limit } = options;

  const listParams: Stripe.SubscriptionListParams = {
    customer: customerId,
    status,
    expand: ['data.default_payment_method'],
  };

  if (limit) {
    listParams.limit = limit;
  }

  const subscriptions = await stripe.subscriptions.list(listParams);
  return subscriptions;
}
