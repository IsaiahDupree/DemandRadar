/**
 * GDP-008: Subscription Snapshot Tests
 *
 * Tests for subscription tracking from Stripe events
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  upsertSubscription,
  getOrCreatePersonWithStripeLink,
  findPersonByStripeCustomerId,
  handleCheckoutCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  type SubscriptionData,
} from '@/lib/gdp/stripe-integration';
import { createServiceClient } from '@/lib/supabase/service';
import type Stripe from 'stripe';

// Mock Supabase service client
jest.mock('@/lib/supabase/service', () => ({
  createServiceClient: jest.fn(),
}));

describe('GDP-008: Subscription Snapshot', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup mock Supabase client
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      rpc: jest.fn(),
    };

    (createServiceClient as any).mockReturnValue(mockSupabaseClient);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('upsertSubscription', () => {
    it('should upsert subscription with MRR calculated for monthly billing', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const subscriptionData: SubscriptionData = {
        subscriptionId: 'sub_123',
        customerId: 'cus_123',
        planName: 'builder',
        planId: 'price_builder_monthly',
        status: 'active',
        amountCents: 2900,
        billingInterval: 'month',
        currency: 'usd',
        currentPeriodStart: 1706745600, // 2024-02-01
        currentPeriodEnd: 1709337600,   // 2024-03-01
      };

      mockSupabaseClient.upsert.mockResolvedValue({ data: {}, error: null });

      await upsertSubscription(personId, subscriptionData);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('subscription');
      expect(mockSupabaseClient.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          person_id: personId,
          stripe_customer_id: 'cus_123',
          stripe_subscription_id: 'sub_123',
          plan_name: 'builder',
          plan_id: 'price_builder_monthly',
          status: 'active',
          billing_interval: 'month',
          currency: 'USD',
          amount_cents: 2900,
          mrr_cents: 2900, // Same as amount for monthly
        })
      );
    });

    it('should calculate MRR correctly for yearly billing', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const subscriptionData: SubscriptionData = {
        subscriptionId: 'sub_456',
        customerId: 'cus_456',
        planName: 'agency',
        planId: 'price_agency_yearly',
        status: 'active',
        amountCents: 99900, // $999/year
        billingInterval: 'year',
        currency: 'usd',
      };

      mockSupabaseClient.upsert.mockResolvedValue({ data: {}, error: null });

      await upsertSubscription(personId, subscriptionData);

      expect(mockSupabaseClient.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          mrr_cents: 8325, // 99900 / 12 = 8325
        })
      );
    });

    it('should handle trial periods', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const subscriptionData: SubscriptionData = {
        subscriptionId: 'sub_789',
        customerId: 'cus_789',
        planName: 'starter',
        planId: 'price_starter_monthly',
        status: 'trialing',
        amountCents: 1900,
        billingInterval: 'month',
        trialStart: 1706745600,
        trialEnd: 1707350400,
      };

      mockSupabaseClient.upsert.mockResolvedValue({ data: {}, error: null });

      await upsertSubscription(personId, subscriptionData);

      expect(mockSupabaseClient.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'trialing',
          trial_start: expect.any(String),
          trial_end: expect.any(String),
        })
      );
    });

    it('should handle canceled subscriptions', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const subscriptionData: SubscriptionData = {
        subscriptionId: 'sub_canceled',
        customerId: 'cus_canceled',
        planName: 'builder',
        planId: 'price_builder_monthly',
        status: 'canceled',
        amountCents: 2900,
        canceledAt: 1706745600,
        endedAt: 1707350400,
      };

      mockSupabaseClient.upsert.mockResolvedValue({ data: {}, error: null });

      await upsertSubscription(personId, subscriptionData);

      expect(mockSupabaseClient.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'canceled',
          canceled_at: expect.any(String),
          ended_at: expect.any(String),
        })
      );
    });

    it('should handle errors gracefully', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const subscriptionData: SubscriptionData = {
        subscriptionId: 'sub_error',
        customerId: 'cus_error',
        planName: 'builder',
        planId: 'price_builder',
        status: 'active',
        amountCents: 2900,
      };

      mockSupabaseClient.upsert.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      // Should not throw
      await expect(
        upsertSubscription(personId, subscriptionData)
      ).resolves.not.toThrow();
    });
  });

  describe('getOrCreatePersonWithStripeLink', () => {
    it('should create person and link Stripe customer ID', async () => {
      const customerData = {
        customerId: 'cus_new123',
        email: 'user@example.com',
        name: 'John Doe',
      };

      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: '123e4567-e89b-12d3-a456-426614174000',
        error: null,
      });
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: 'link-id',
        error: null,
      });

      const personId = await getOrCreatePersonWithStripeLink(customerData);

      expect(personId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_or_create_person', {
        p_email: 'user@example.com',
        p_first_name: 'John',
        p_last_name: 'Doe',
        p_properties: {},
      });
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('link_person_identity', {
        p_person_id: '123e4567-e89b-12d3-a456-426614174000',
        p_platform: 'stripe',
        p_external_id: 'cus_new123',
        p_properties: {},
      });
    });

    it('should handle errors when creating person', async () => {
      const customerData = {
        customerId: 'cus_error',
        email: 'error@example.com',
      };

      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Person creation failed' },
      });

      const personId = await getOrCreatePersonWithStripeLink(customerData);

      expect(personId).toBeNull();
    });
  });

  describe('findPersonByStripeCustomerId', () => {
    it('should find person by Stripe customer ID', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: { person_id: '123e4567-e89b-12d3-a456-426614174000' },
        error: null,
      });

      const personId = await findPersonByStripeCustomerId('cus_123');

      expect(personId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('identity_link');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('platform', 'stripe');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('external_id', 'cus_123');
    });

    it('should return null if person not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const personId = await findPersonByStripeCustomerId('cus_notfound');

      expect(personId).toBeNull();
    });
  });

  describe('handleCheckoutCompleted', () => {
    it('should process checkout completion', async () => {
      const session = {
        customer: 'cus_123',
        customer_details: { email: 'user@example.com', name: 'John Doe' },
        amount_total: 2900,
      } as Stripe.Checkout.Session;

      const subscription = {
        id: 'sub_123',
        status: 'active',
        currency: 'usd',
        current_period_start: 1706745600,
        current_period_end: 1709337600,
        items: {
          data: [
            {
              price: {
                id: 'price_builder_monthly',
                unit_amount: 2900,
                recurring: { interval: 'month' as const },
              },
            },
          ],
        },
      } as unknown as Stripe.Subscription;

      // Mock get or create person
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: '123e4567-e89b-12d3-a456-426614174000',
        error: null,
      });
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: 'link-id',
        error: null,
      });

      // Mock upsert subscription
      mockSupabaseClient.upsert.mockResolvedValue({ data: {}, error: null });

      // Mock create unified event
      mockSupabaseClient.insert.mockResolvedValue({ data: {}, error: null });

      await handleCheckoutCompleted(session, subscription);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'get_or_create_person',
        expect.any(Object)
      );
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('subscription');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('unified_event');
    });
  });

  describe('handleSubscriptionUpdated', () => {
    it('should process subscription updates', async () => {
      const subscription = {
        id: 'sub_123',
        customer: 'cus_123',
        status: 'active',
        currency: 'usd',
        current_period_start: 1706745600,
        current_period_end: 1709337600,
        items: {
          data: [
            {
              price: {
                id: 'price_agency_monthly',
                unit_amount: 9900,
                recurring: { interval: 'month' as const },
              },
            },
          ],
        },
      } as unknown as Stripe.Subscription;

      // Mock find person
      mockSupabaseClient.single.mockResolvedValue({
        data: { person_id: '123e4567-e89b-12d3-a456-426614174000' },
        error: null,
      });

      // Mock upsert subscription
      mockSupabaseClient.upsert.mockResolvedValue({ data: {}, error: null });

      // Mock create unified event
      mockSupabaseClient.insert.mockResolvedValue({ data: {}, error: null });

      await handleSubscriptionUpdated(subscription);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('identity_link');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('subscription');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('unified_event');
    });
  });

  describe('handleSubscriptionDeleted', () => {
    it('should process subscription deletion', async () => {
      const subscription = {
        id: 'sub_123',
        customer: 'cus_123',
        canceled_at: 1706745600,
        ended_at: 1707350400,
      } as unknown as Stripe.Subscription;

      // Create separate mocks for each table chain
      const identityLinkMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { person_id: '123e4567-e89b-12d3-a456-426614174000' },
          error: null,
        }),
      };

      const subscriptionMock = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
      };

      const unifiedEventMock = {
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      };

      // Mock from() to return different chains based on table name
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'identity_link') return identityLinkMock;
        if (table === 'subscription') return subscriptionMock;
        if (table === 'unified_event') return unifiedEventMock;
        return mockSupabaseClient;
      });

      await handleSubscriptionDeleted(subscription);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('identity_link');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('subscription');
      expect(subscriptionMock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'canceled',
        })
      );
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('unified_event');
    });
  });
});
