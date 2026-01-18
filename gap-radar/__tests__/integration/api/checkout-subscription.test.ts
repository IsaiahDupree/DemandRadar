/**
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

import { POST } from '@/app/api/checkout/route';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

jest.mock('@/lib/stripe', () => ({
  stripe: {
    customers: {
      create: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
  },
  PLANS: {
    free: {
      name: 'Free',
      price: 0,
      runsLimit: 2,
      features: ['2 runs/month'],
    },
    starter: {
      name: 'Starter',
      price: 29,
      priceId: 'price_starter_test',
      runsLimit: 2,
      features: ['2 runs/month'],
    },
    builder: {
      name: 'Builder',
      price: 99,
      priceId: 'price_builder_test',
      runsLimit: 10,
      features: ['10 runs/month'],
    },
    agency: {
      name: 'Agency',
      price: 249,
      priceId: 'price_agency_test',
      runsLimit: 35,
      features: ['35 runs/month'],
    },
  },
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Subscription Checkout API', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(() => mockSupabase),
      select: jest.fn(() => mockSupabase),
      update: jest.fn(() => mockSupabase),
      eq: jest.fn(() => mockSupabase),
      single: jest.fn(() => Promise.resolve({
        data: { id: 'user_123', email: 'test@example.com', stripe_customer_id: null },
        error: null,
      })),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    // Set env var for tests
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Unauthorized' },
      });

      const request = new Request('http://localhost/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'builder' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should accept authenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user_123', email: 'test@example.com' } },
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'user_123',
          email: 'test@example.com',
          stripe_customer_id: 'cus_test_123',
        },
        error: null,
      });

      const mockSession: Partial<Stripe.Checkout.Session> = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      };

      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockSession);

      const request = new Request('http://localhost/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'builder' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.url).toBe('https://checkout.stripe.com/pay/cs_test_123');
    });
  });

  describe('Plan Validation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user_123', email: 'test@example.com' } },
        error: null,
      });
    });

    it('should reject invalid plan', async () => {
      const request = new Request('http://localhost/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'invalid_plan' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid plan');
    });

    it('should reject free plan', async () => {
      const request = new Request('http://localhost/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'free' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid plan');
    });

    it('should reject missing plan', async () => {
      const request = new Request('http://localhost/api/checkout', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid plan');
    });
  });

  describe('Customer Creation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user_123', email: 'test@example.com' } },
        error: null,
      });
    });

    it('should create new Stripe customer if not exists', async () => {
      const mockCustomer: Partial<Stripe.Customer> = {
        id: 'cus_new_123',
        email: 'test@example.com',
      };

      (stripe.customers.create as jest.Mock).mockResolvedValue(mockCustomer);

      const mockSession: Partial<Stripe.Checkout.Session> = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      };

      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockSession);

      const request = new Request('http://localhost/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'builder' }),
      });

      await POST(request);

      expect(stripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        metadata: {
          supabase_user_id: 'user_123',
        },
      });

      expect(mockSupabase.update).toHaveBeenCalledWith({ stripe_customer_id: 'cus_new_123' });
    });

    it('should use existing Stripe customer if exists', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'user_123',
          email: 'test@example.com',
          stripe_customer_id: 'cus_existing_123',
        },
        error: null,
      });

      const mockSession: Partial<Stripe.Checkout.Session> = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      };

      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockSession);

      const request = new Request('http://localhost/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'builder' }),
      });

      await POST(request);

      expect(stripe.customers.create).not.toHaveBeenCalled();
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_existing_123',
        })
      );
    });
  });

  describe('Checkout Session Creation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user_123', email: 'test@example.com' } },
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'user_123',
          email: 'test@example.com',
          stripe_customer_id: 'cus_test_123',
        },
        error: null,
      });
    });

    it('should create checkout session with correct parameters', async () => {
      const mockSession: Partial<Stripe.Checkout.Session> = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      };

      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockSession);

      const request = new Request('http://localhost/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'builder' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.url).toBe('https://checkout.stripe.com/pay/cs_test_123');

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_test_123',
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: 'price_builder_test',
            quantity: 1,
          },
        ],
        success_url: 'http://localhost:3000/dashboard/settings?success=true',
        cancel_url: 'http://localhost:3000/dashboard/settings?canceled=true',
        metadata: {
          user_id: 'user_123',
          plan: 'builder',
        },
      });
    });

    it('should create session for starter plan', async () => {
      const mockSession: Partial<Stripe.Checkout.Session> = {
        id: 'cs_test_456',
        url: 'https://checkout.stripe.com/pay/cs_test_456',
      };

      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockSession);

      const request = new Request('http://localhost/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'starter' }),
      });

      await POST(request);

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            {
              price: 'price_starter_test',
              quantity: 1,
            },
          ],
          metadata: {
            user_id: 'user_123',
            plan: 'starter',
          },
        })
      );
    });

    it('should create session for agency plan', async () => {
      const mockSession: Partial<Stripe.Checkout.Session> = {
        id: 'cs_test_789',
        url: 'https://checkout.stripe.com/pay/cs_test_789',
      };

      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockSession);

      const request = new Request('http://localhost/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'agency' }),
      });

      await POST(request);

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            {
              price: 'price_agency_test',
              quantity: 1,
            },
          ],
          metadata: {
            user_id: 'user_123',
            plan: 'agency',
          },
        })
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user_123', email: 'test@example.com' } },
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'user_123',
          email: 'test@example.com',
          stripe_customer_id: 'cus_test_123',
        },
        error: null,
      });
    });

    it('should handle Stripe API errors', async () => {
      (stripe.checkout.sessions.create as jest.Mock).mockRejectedValue(
        new Error('Stripe API error')
      );

      const request = new Request('http://localhost/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'builder' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create checkout session');
    });

    it('should handle customer creation errors', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'user_123',
          email: 'test@example.com',
          stripe_customer_id: null,
        },
        error: null,
      });

      (stripe.customers.create as jest.Mock).mockRejectedValue(
        new Error('Customer creation failed')
      );

      const request = new Request('http://localhost/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'builder' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create checkout session');
    });
  });
});
