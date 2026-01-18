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

/**
 * Integration tests for Stripe Billing Portal API
 * Feature: STRIPE-002 - Customer billing portal
 */

import { POST } from '@/app/api/billing/portal/route';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/stripe', () => ({
  stripe: {
    billingPortal: {
      sessions: {
        create: jest.fn(),
      },
    },
  },
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('POST /api/billing/portal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a billing portal session for authenticated user with Stripe customer', async () => {
    const mockCustomerId = 'cus_test123';
    const mockPortalUrl = 'https://billing.stripe.com/session/test123';

    // Mock Supabase auth
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              user_metadata: {
                stripe_customer_id: mockCustomerId,
              },
            },
          },
          error: null,
        }),
      },
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // Mock Stripe billing portal session creation
    (stripe.billingPortal.sessions.create as jest.Mock).mockResolvedValue({
      url: mockPortalUrl,
    });

    const request = new Request('http://localhost:3001/api/billing/portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        returnUrl: 'http://localhost:3001/dashboard/billing',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('url');
    expect(data.url).toBe(mockPortalUrl);

    expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: mockCustomerId,
      return_url: 'http://localhost:3001/dashboard/billing',
    });
  });

  it('should use default return URL if not provided', async () => {
    const mockCustomerId = 'cus_test123';
    const mockPortalUrl = 'https://billing.stripe.com/session/test123';

    // Mock Supabase auth
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              user_metadata: {
                stripe_customer_id: mockCustomerId,
              },
            },
          },
          error: null,
        }),
      },
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // Mock Stripe billing portal session creation
    (stripe.billingPortal.sessions.create as jest.Mock).mockResolvedValue({
      url: mockPortalUrl,
    });

    const request = new Request('http://localhost:3001/api/billing/portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('url');
    expect(data.url).toBe(mockPortalUrl);

    // Should use default URL (base URL + /dashboard/billing)
    expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: mockCustomerId,
      return_url: expect.stringContaining('/dashboard/billing'),
    });
  });

  it('should return 401 for unauthenticated requests', async () => {
    // Mock Supabase auth - no user
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Unauthorized' },
        }),
      },
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    const request = new Request('http://localhost:3001/api/billing/portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        returnUrl: 'http://localhost:3001/dashboard/billing',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 if user has no Stripe customer ID', async () => {
    // Mock Supabase auth - user without Stripe customer ID
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              user_metadata: {}, // No stripe_customer_id
            },
          },
          error: null,
        }),
      },
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    const request = new Request('http://localhost:3001/api/billing/portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        returnUrl: 'http://localhost:3001/dashboard/billing',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('No Stripe customer found');
  });

  it('should handle Stripe API errors', async () => {
    const mockCustomerId = 'cus_test123';

    // Mock Supabase auth
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              user_metadata: {
                stripe_customer_id: mockCustomerId,
              },
            },
          },
          error: null,
        }),
      },
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // Mock Stripe billing portal session creation to throw error
    (stripe.billingPortal.sessions.create as jest.Mock).mockRejectedValue(
      new Error('Stripe API error')
    );

    const request = new Request('http://localhost:3001/api/billing/portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        returnUrl: 'http://localhost:3001/dashboard/billing',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Failed to create billing portal session');
  });
});
