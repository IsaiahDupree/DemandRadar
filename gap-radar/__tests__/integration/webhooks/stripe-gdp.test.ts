/**
 * GDP-007: Stripe Webhook Integration with Growth Data Plane
 * Tests that Stripe webhooks properly map stripe_customer_id to person_id
 * and track subscription events in the unified_event and subscription tables
 * @jest-environment node
 */

// Polyfill for Response.json (Node.js < 18.2.0 compatibility)
if (!Response.json) {
  Response.json = function (data: any, init?: ResponseInit) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  };
}

import { POST } from '@/app/api/webhooks/stripe/route';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import Stripe from 'stripe';

jest.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
    subscriptions: {
      retrieve: jest.fn(),
    },
  },
  getPlanByPriceId: jest.fn((priceId: string) => {
    if (priceId === 'price_builder') return 'builder';
    if (priceId === 'price_agency') return 'agency';
    if (priceId === 'price_studio') return 'studio';
    return 'starter';
  }),
  getRunsLimit: jest.fn((plan: string) => {
    const limits: Record<string, number> = {
      free: 2,
      starter: 5,
      builder: 10,
      agency: 35,
      studio: 100,
    };
    return limits[plan] || 2;
  }),
  PLANS: {
    free: { name: 'Free', price: 0, features: ['2 runs per month'] },
    starter: { name: 'Starter', price: 29, features: ['5 runs per month'] },
    builder: { name: 'Builder', price: 99, features: ['10 runs per month'] },
    agency: { name: 'Agency', price: 249, features: ['35 runs per month'] },
    studio: { name: 'Studio', price: 499, features: ['100 runs per month'] },
  },
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/supabase/service', () => ({
  createServiceClient: jest.fn(),
}));

jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn(() => Promise.resolve({ success: true })),
}));

jest.mock('@/lib/email-templates', () => ({
  SubscriptionConfirmationEmail: jest.fn(() => ({})),
}));

jest.mock('next/headers', () => ({
  headers: jest.fn(() =>
    Promise.resolve({
      get: jest.fn((key: string) => {
        if (key === 'stripe-signature') return 'test_signature';
        return null;
      }),
    })
  ),
}));

describe('GDP-007: Stripe Webhook Integration with Growth Data Plane', () => {
  let mockSupabase: any;
  let mockServiceClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock standard Supabase client
    mockSupabase = {
      from: jest.fn(() => mockSupabase),
      update: jest.fn(() => mockSupabase),
      insert: jest.fn(() => mockSupabase),
      select: jest.fn(() => mockSupabase),
      single: jest.fn(() => Promise.resolve({
        data: { email: 'test@example.com', name: 'Test User' },
        error: null
      })),
      eq: jest.fn(() => mockSupabase),
      rpc: jest.fn(() => Promise.resolve({ data: 'person-uuid-123', error: null })),
    };

    // Mock service role client for GDP operations
    mockServiceClient = {
      from: jest.fn((table: string) => {
        if (table === 'identity_link') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve({
                    data: { person_id: 'person-uuid-123' },
                    error: null
                  }))
                }))
              }))
            }))
          };
        }
        return mockServiceClient;
      }),
      insert: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: {}, error: null }))
      })),
      upsert: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      select: jest.fn(() => mockServiceClient),
      single: jest.fn(() => Promise.resolve({
        data: { id: 'person-uuid-123', email: 'test@example.com' },
        error: null
      })),
      eq: jest.fn(() => mockServiceClient),
      rpc: jest.fn(() => Promise.resolve({ data: 'person-uuid-123', error: null })),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    (createServiceClient as jest.Mock).mockReturnValue(mockServiceClient);
  });

  describe('checkout.session.completed - GDP Integration', () => {
    it('should create person record and link stripe_customer_id', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_test123',
            subscription: 'sub_test123',
            customer_details: {
              email: 'newuser@example.com',
              name: 'New User',
            },
          } as Stripe.Checkout.Session,
        },
      } as Stripe.Event;

      const mockSubscription = {
        id: 'sub_test123',
        items: {
          data: [
            {
              price: {
                id: 'price_builder',
              },
            },
          ],
        },
        status: 'active',
        current_period_start: 1640000000,
        current_period_end: 1642678400,
      } as Stripe.Subscription;

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
      (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue(mockSubscription);

      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);

      // Should call get_or_create_person function
      expect(mockServiceClient.rpc).toHaveBeenCalledWith(
        'get_or_create_person',
        expect.objectContaining({
          p_email: 'newuser@example.com',
        })
      );

      // Should link stripe_customer_id to person
      expect(mockServiceClient.rpc).toHaveBeenCalledWith(
        'link_person_identity',
        expect.objectContaining({
          p_platform: 'stripe',
          p_external_id: 'cus_test123',
        })
      );
    });

    it('should create subscription record in GDP subscription table', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_test123',
            subscription: 'sub_test123',
            customer_details: {
              email: 'user@example.com',
            },
          } as Stripe.Checkout.Session,
        },
      } as Stripe.Event;

      const mockSubscription = {
        id: 'sub_test123',
        items: {
          data: [
            {
              price: {
                id: 'price_builder',
                unit_amount: 9900,
                recurring: {
                  interval: 'month',
                },
              },
            },
          ],
        },
        status: 'active',
        currency: 'usd',
        current_period_start: 1640000000,
        current_period_end: 1642678400,
      } as any;

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
      (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue(mockSubscription);

      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Should upsert subscription record
      expect(mockServiceClient.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          stripe_customer_id: 'cus_test123',
          stripe_subscription_id: 'sub_test123',
          plan_name: 'builder',
          status: 'active',
          amount_cents: 9900,
          billing_interval: 'month',
          currency: 'USD',
        })
      );
    });

    it('should create purchase_completed unified event', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_test123',
            subscription: 'sub_test123',
            customer_details: {
              email: 'user@example.com',
            },
            amount_total: 9900,
          } as Stripe.Checkout.Session,
        },
      } as Stripe.Event;

      const mockSubscription = {
        items: {
          data: [
            {
              price: {
                id: 'price_builder',
              },
            },
          ],
        },
        status: 'active',
      } as any;

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
      (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue(mockSubscription);

      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Should create unified event for purchase_completed
      expect(mockServiceClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_name: 'purchase_completed',
          event_source: 'stripe',
          properties: expect.objectContaining({
            plan: 'builder',
            amount_cents: 9900,
          }),
        })
      );
    });
  });

  describe('customer.subscription.updated - GDP Integration', () => {
    it('should update subscription record in GDP', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            items: {
              data: [
                {
                  price: {
                    id: 'price_agency',
                    unit_amount: 24900,
                  },
                },
              ],
            },
            status: 'active',
            current_period_start: 1640000000,
            current_period_end: 1642678400,
          } as Stripe.Subscription,
        },
      } as Stripe.Event;

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);

      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Should upsert subscription record (which acts as update)
      expect(mockServiceClient.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          plan_name: 'agency',
          status: 'active',
          amount_cents: 24900,
        })
      );
    });
  });

  describe('customer.subscription.deleted - GDP Integration', () => {
    it('should update subscription status to canceled in GDP', async () => {
      const mockEvent = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'canceled',
            canceled_at: 1640000000,
          } as Stripe.Subscription,
        },
      } as Stripe.Event;

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);

      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Should update subscription status to canceled
      expect(mockServiceClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'canceled',
        })
      );
    });
  });

  describe('invoice.payment_succeeded - GDP Integration', () => {
    it('should create unified event for recurring payment', async () => {
      const mockEvent = {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            customer: 'cus_test123',
            subscription: 'sub_test123',
            amount_paid: 9900,
            billing_reason: 'subscription_cycle',
          } as Stripe.Invoice,
        },
      } as Stripe.Event;

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);

      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Should create unified event for recurring payment
      expect(mockServiceClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_name: 'payment_succeeded',
          event_source: 'stripe',
          properties: expect.objectContaining({
            amount_paid: 9900,
            billing_reason: 'subscription_cycle',
          }),
        })
      );
    });
  });

  describe('Person lookup by stripe_customer_id', () => {
    it('should find person_id from stripe_customer_id via identity_link', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            customer: 'cus_existing123',
            items: {
              data: [
                {
                  price: {
                    id: 'price_agency',
                  },
                },
              ],
            },
          } as Stripe.Subscription,
        },
      } as Stripe.Event;

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);

      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Should query identity_link table for person lookup
      expect(mockServiceClient.from).toHaveBeenCalledWith('identity_link');

      // The subscription should be upserted after finding the person
      expect(mockServiceClient.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          person_id: 'person-uuid-123',
          stripe_customer_id: 'cus_existing123',
        })
      );
    });
  });
});
