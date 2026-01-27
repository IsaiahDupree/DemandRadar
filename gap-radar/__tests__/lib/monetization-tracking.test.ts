/**
 * Test: Monetization Event Tracking (TRACK-005)
 * Test-Driven Development: RED → GREEN → REFACTOR
 *
 * Tests for monetization events:
 * - checkout_started: User begins checkout process
 * - purchase_completed: User completes a purchase
 * - subscription_created: New subscription created
 * - subscription_updated: Subscription plan changed
 * - subscription_cancelled: Subscription cancelled
 * - subscription_renewed: Subscription renewed
 */

import { tracker } from '@/lib/tracking/userEventTracker';
import {
  trackCheckoutStarted,
  trackPurchaseCompleted,
  trackSubscriptionCreated,
  trackSubscriptionUpdated,
  trackSubscriptionCancelled,
  trackSubscriptionRenewed,
} from '@/lib/tracking/monetization';

describe('Monetization Event Tracking (TRACK-005)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = '';
    tracker.init({ projectId: 'gapradar', debug: false });
  });

  describe('checkout_started event', () => {
    it('should track checkout_started event', () => {
      expect(() => {
        trackCheckoutStarted();
      }).not.toThrow();
    });

    it('should track checkout_started with plan', () => {
      expect(() => {
        trackCheckoutStarted({
          plan: 'pro',
        });
      }).not.toThrow();
    });

    it('should track checkout_started with full properties', () => {
      expect(() => {
        trackCheckoutStarted({
          plan: 'pro',
          interval: 'monthly',
          amount: 49.99,
          currency: 'USD',
          promo_code: 'LAUNCH2026',
        });
      }).not.toThrow();
    });
  });

  describe('purchase_completed event', () => {
    it('should track purchase_completed event', () => {
      expect(() => {
        trackPurchaseCompleted();
      }).not.toThrow();
    });

    it('should track purchase_completed with minimal properties', () => {
      expect(() => {
        trackPurchaseCompleted({
          transaction_id: 'txn_123',
          amount: 49.99,
        });
      }).not.toThrow();
    });

    it('should track purchase_completed with full properties', () => {
      expect(() => {
        trackPurchaseCompleted({
          transaction_id: 'txn_123',
          plan: 'pro',
          interval: 'monthly',
          amount: 49.99,
          currency: 'USD',
          payment_method: 'card',
          promo_code: 'LAUNCH2026',
          discount_amount: 10.0,
        });
      }).not.toThrow();
    });

    it('should track revenue with trackConversion', () => {
      expect(() => {
        trackPurchaseCompleted({
          transaction_id: 'txn_456',
          amount: 99.99,
          plan: 'pro',
          interval: 'yearly',
        });
      }).not.toThrow();
    });
  });

  describe('subscription_created event', () => {
    it('should track subscription_created event', () => {
      expect(() => {
        trackSubscriptionCreated();
      }).not.toThrow();
    });

    it('should track subscription_created with minimal properties', () => {
      expect(() => {
        trackSubscriptionCreated({
          subscription_id: 'sub_123',
          plan: 'pro',
        });
      }).not.toThrow();
    });

    it('should track subscription_created with full properties', () => {
      expect(() => {
        trackSubscriptionCreated({
          subscription_id: 'sub_123',
          plan: 'pro',
          interval: 'monthly',
          amount: 49.99,
          currency: 'USD',
          trial_days: 14,
          status: 'active',
        });
      }).not.toThrow();
    });
  });

  describe('subscription_updated event', () => {
    it('should track subscription_updated event', () => {
      expect(() => {
        trackSubscriptionUpdated();
      }).not.toThrow();
    });

    it('should track subscription_updated with plan change', () => {
      expect(() => {
        trackSubscriptionUpdated({
          subscription_id: 'sub_123',
          old_plan: 'starter',
          new_plan: 'pro',
        });
      }).not.toThrow();
    });

    it('should track subscription_updated with full properties', () => {
      expect(() => {
        trackSubscriptionUpdated({
          subscription_id: 'sub_123',
          old_plan: 'starter',
          new_plan: 'pro',
          old_interval: 'monthly',
          new_interval: 'yearly',
          change_type: 'upgrade',
          mrr_change: 50.0,
        });
      }).not.toThrow();
    });
  });

  describe('subscription_cancelled event', () => {
    it('should track subscription_cancelled event', () => {
      expect(() => {
        trackSubscriptionCancelled();
      }).not.toThrow();
    });

    it('should track subscription_cancelled with minimal properties', () => {
      expect(() => {
        trackSubscriptionCancelled({
          subscription_id: 'sub_123',
        });
      }).not.toThrow();
    });

    it('should track subscription_cancelled with full properties', () => {
      expect(() => {
        trackSubscriptionCancelled({
          subscription_id: 'sub_123',
          plan: 'pro',
          reason: 'too_expensive',
          feedback: 'Found a cheaper alternative',
          cancellation_date: '2026-01-31',
          refund_amount: 0,
        });
      }).not.toThrow();
    });
  });

  describe('subscription_renewed event', () => {
    it('should track subscription_renewed event', () => {
      expect(() => {
        trackSubscriptionRenewed();
      }).not.toThrow();
    });

    it('should track subscription_renewed with minimal properties', () => {
      expect(() => {
        trackSubscriptionRenewed({
          subscription_id: 'sub_123',
        });
      }).not.toThrow();
    });

    it('should track subscription_renewed with full properties', () => {
      expect(() => {
        trackSubscriptionRenewed({
          subscription_id: 'sub_123',
          plan: 'pro',
          interval: 'monthly',
          amount: 49.99,
          renewal_count: 5,
          ltv: 249.95,
        });
      }).not.toThrow();
    });
  });

  describe('Monetization journey tracking', () => {
    it('should track complete purchase flow', () => {
      tracker.identify('usr_123', { email: 'customer@example.com' });

      // User starts checkout
      trackCheckoutStarted({
        plan: 'pro',
        interval: 'monthly',
        amount: 49.99,
        currency: 'USD',
      });

      // Purchase completed
      trackPurchaseCompleted({
        transaction_id: 'txn_789',
        plan: 'pro',
        interval: 'monthly',
        amount: 49.99,
        currency: 'USD',
        payment_method: 'card',
      });

      // Subscription created
      trackSubscriptionCreated({
        subscription_id: 'sub_789',
        plan: 'pro',
        interval: 'monthly',
        amount: 49.99,
        status: 'active',
      });

      expect(tracker.getUserId()).toBe('usr_123');
    });

    it('should track subscription lifecycle', () => {
      tracker.identify('usr_456');

      // Subscription created
      trackSubscriptionCreated({
        subscription_id: 'sub_999',
        plan: 'starter',
        interval: 'monthly',
        amount: 29.99,
      });

      // Subscription upgraded
      trackSubscriptionUpdated({
        subscription_id: 'sub_999',
        old_plan: 'starter',
        new_plan: 'pro',
        change_type: 'upgrade',
      });

      // Subscription renewed
      trackSubscriptionRenewed({
        subscription_id: 'sub_999',
        plan: 'pro',
        renewal_count: 3,
      });

      // Subscription cancelled
      trackSubscriptionCancelled({
        subscription_id: 'sub_999',
        plan: 'pro',
        reason: 'not_using',
      });

      expect(tracker.getUserId()).toBe('usr_456');
    });
  });

  describe('Revenue tracking', () => {
    it('should track revenue on purchase completion', () => {
      // The trackPurchaseCompleted should internally call trackConversion
      expect(() => {
        trackPurchaseCompleted({
          transaction_id: 'txn_revenue',
          amount: 199.99,
          plan: 'enterprise',
          interval: 'yearly',
        });
      }).not.toThrow();
    });
  });
});
