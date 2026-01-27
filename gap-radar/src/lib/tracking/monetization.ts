/**
 * Monetization Event Tracking (TRACK-005)
 * ========================================
 *
 * Tracks monetization and revenue events:
 * - checkout_started: User begins checkout process
 * - purchase_completed: User completes a purchase
 * - subscription_created: New subscription created
 * - subscription_updated: Subscription plan changed (upgrade/downgrade)
 * - subscription_cancelled: Subscription cancelled
 * - subscription_renewed: Subscription renewed
 *
 * These events are critical for measuring revenue, MRR, churn,
 * and understanding the business health of the product.
 */

import { tracker } from './userEventTracker';

/**
 * Track checkout started
 *
 * Called when user initiates the checkout process.
 *
 * @param properties - Checkout properties
 * @param properties.plan - Plan name (e.g., 'starter', 'pro', 'enterprise')
 * @param properties.interval - Billing interval ('monthly', 'yearly')
 * @param properties.amount - Price amount
 * @param properties.currency - Currency code (e.g., 'USD')
 * @param properties.promo_code - Promo code applied
 */
export function trackCheckoutStarted(properties?: {
  plan?: string;
  interval?: 'monthly' | 'yearly';
  amount?: number;
  currency?: string;
  promo_code?: string;
  [key: string]: any;
}): void {
  tracker.track('checkout_started', properties || {});
}

/**
 * Track purchase completed
 *
 * Called when user successfully completes a purchase.
 * Also tracks revenue via trackConversion.
 *
 * @param properties - Purchase properties
 * @param properties.transaction_id - Unique transaction ID
 * @param properties.plan - Plan purchased
 * @param properties.interval - Billing interval
 * @param properties.amount - Purchase amount
 * @param properties.currency - Currency code
 * @param properties.payment_method - Payment method used (e.g., 'card', 'paypal')
 * @param properties.promo_code - Promo code used
 * @param properties.discount_amount - Discount applied
 */
export function trackPurchaseCompleted(properties?: {
  transaction_id?: string;
  plan?: string;
  interval?: 'monthly' | 'yearly';
  amount?: number;
  currency?: string;
  payment_method?: string;
  promo_code?: string;
  discount_amount?: number;
  [key: string]: any;
}): void {
  tracker.track('purchase_completed', properties || {});

  // Also track as a conversion with revenue
  if (properties?.amount) {
    tracker.trackConversion('purchase', properties.amount, {
      transaction_id: properties.transaction_id,
      plan: properties.plan,
      interval: properties.interval,
      currency: properties.currency || 'USD',
    });
  }
}

/**
 * Track subscription created
 *
 * Called when a new subscription is created.
 *
 * @param properties - Subscription properties
 * @param properties.subscription_id - Unique subscription ID
 * @param properties.plan - Plan name
 * @param properties.interval - Billing interval
 * @param properties.amount - Subscription amount
 * @param properties.currency - Currency code
 * @param properties.trial_days - Trial period days
 * @param properties.status - Subscription status (e.g., 'active', 'trialing')
 */
export function trackSubscriptionCreated(properties?: {
  subscription_id?: string;
  plan?: string;
  interval?: 'monthly' | 'yearly';
  amount?: number;
  currency?: string;
  trial_days?: number;
  status?: string;
  [key: string]: any;
}): void {
  tracker.track('subscription_created', properties || {});
}

/**
 * Track subscription updated
 *
 * Called when a subscription is modified (upgrade/downgrade/interval change).
 *
 * @param properties - Subscription update properties
 * @param properties.subscription_id - Subscription ID
 * @param properties.old_plan - Previous plan name
 * @param properties.new_plan - New plan name
 * @param properties.old_interval - Previous billing interval
 * @param properties.new_interval - New billing interval
 * @param properties.change_type - Type of change ('upgrade', 'downgrade', 'interval_change')
 * @param properties.mrr_change - Monthly recurring revenue change (can be negative)
 */
export function trackSubscriptionUpdated(properties?: {
  subscription_id?: string;
  old_plan?: string;
  new_plan?: string;
  old_interval?: 'monthly' | 'yearly';
  new_interval?: 'monthly' | 'yearly';
  change_type?: 'upgrade' | 'downgrade' | 'interval_change';
  mrr_change?: number;
  [key: string]: any;
}): void {
  tracker.track('subscription_updated', properties || {});
}

/**
 * Track subscription cancelled
 *
 * Called when a subscription is cancelled.
 *
 * @param properties - Cancellation properties
 * @param properties.subscription_id - Subscription ID
 * @param properties.plan - Plan being cancelled
 * @param properties.reason - Cancellation reason (e.g., 'too_expensive', 'not_using', 'missing_features')
 * @param properties.feedback - User's feedback text
 * @param properties.cancellation_date - Date when cancellation takes effect
 * @param properties.refund_amount - Refund amount (if any)
 */
export function trackSubscriptionCancelled(properties?: {
  subscription_id?: string;
  plan?: string;
  reason?: string;
  feedback?: string;
  cancellation_date?: string;
  refund_amount?: number;
  [key: string]: any;
}): void {
  tracker.track('subscription_cancelled', properties || {});
}

/**
 * Track subscription renewed
 *
 * Called when a subscription is successfully renewed.
 *
 * @param properties - Renewal properties
 * @param properties.subscription_id - Subscription ID
 * @param properties.plan - Plan renewed
 * @param properties.interval - Billing interval
 * @param properties.amount - Renewal amount
 * @param properties.renewal_count - Number of times renewed (1 = first renewal)
 * @param properties.ltv - Customer lifetime value to date
 */
export function trackSubscriptionRenewed(properties?: {
  subscription_id?: string;
  plan?: string;
  interval?: 'monthly' | 'yearly';
  amount?: number;
  renewal_count?: number;
  ltv?: number;
  [key: string]: any;
}): void {
  tracker.track('subscription_renewed', properties || {});
}
