import { POST } from '@/app/api/webhooks/stripe/route';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
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
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
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

describe('Stripe Webhook Handler', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn(() => mockSupabase),
      update: jest.fn(() => mockSupabase),
      eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('Signature Validation', () => {
    it('should reject requests without signature', async () => {
      const { headers } = await import('next/headers');
      (headers as jest.Mock).mockResolvedValueOnce({
        get: jest.fn(() => null),
      });

      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing signature');
    });

    it('should reject requests with invalid signature', async () => {
      (stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid signature');
    });

    it('should accept requests with valid signature', async () => {
      const mockEvent = {
        type: 'ping',
        data: { object: {} },
      } as Stripe.Event;

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);

      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });
  });

  describe('checkout.session.completed', () => {
    it('should update user plan on checkout completion', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_test123',
            subscription: 'sub_test123',
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
      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.update).toHaveBeenCalledWith({
        plan: 'builder',
        runs_limit: 10,
        runs_used: 0,
        stripe_customer_id: 'cus_test123',
      });
      expect(mockSupabase.eq).toHaveBeenCalledWith('stripe_customer_id', 'cus_test123');
    });

    it('should default to starter plan if price not found', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_test123',
            subscription: 'sub_test123',
          } as Stripe.Checkout.Session,
        },
      } as Stripe.Event;

      const mockSubscription = {
        items: {
          data: [
            {
              price: {
                id: 'price_unknown',
              },
            },
          ],
        },
      } as Stripe.Subscription;

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
      (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue(mockSubscription);

      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      await POST(request);

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          plan: 'starter',
          runs_limit: 5,
        })
      );
    });
  });

  describe('customer.subscription.updated', () => {
    it('should update user plan when subscription changes', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            customer: 'cus_test123',
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
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith({
        plan: 'agency',
        runs_limit: 35,
      });
      expect(mockSupabase.eq).toHaveBeenCalledWith('stripe_customer_id', 'cus_test123');
    });

    it('should handle subscription update without valid plan', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            customer: 'cus_test123',
            items: {
              data: [],
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
      expect(mockSupabase.update).not.toHaveBeenCalled();
    });
  });

  describe('customer.subscription.deleted', () => {
    it('should downgrade user to free plan when subscription cancelled', async () => {
      const mockEvent = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            customer: 'cus_test123',
          } as Stripe.Subscription,
        },
      } as Stripe.Event;

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);

      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith({
        plan: 'free',
        runs_limit: 2,
      });
      expect(mockSupabase.eq).toHaveBeenCalledWith('stripe_customer_id', 'cus_test123');
    });
  });

  describe('invoice.payment_succeeded', () => {
    it('should reset runs_used on new billing cycle', async () => {
      const mockEvent = {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            customer: 'cus_test123',
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
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith({ runs_used: 0 });
      expect(mockSupabase.eq).toHaveBeenCalledWith('stripe_customer_id', 'cus_test123');
    });

    it('should not reset runs_used for non-cycle payments', async () => {
      const mockEvent = {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            customer: 'cus_test123',
            billing_reason: 'manual',
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
      expect(mockSupabase.update).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      const mockEvent = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            customer: 'cus_test123',
          } as Stripe.Subscription,
        },
      } as Stripe.Event;

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
      mockSupabase.eq.mockRejectedValue(new Error('Database error'));

      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Webhook handler failed');
    });
  });

  describe('Unknown Event Types', () => {
    it('should handle unknown event types gracefully', async () => {
      const mockEvent = {
        type: 'customer.created',
        data: {
          object: {} as Stripe.Customer,
        },
      } as Stripe.Event;

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);

      const request = new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });
  });
});
