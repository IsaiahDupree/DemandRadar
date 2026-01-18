/**
 * BILL-010: Add-On Purchases Test
 *
 * Tests checkout flow for add-on purchases:
 * - Ad Angle Pack
 * - Landing Page Rewrites
 * - Competitor Watchlist
 */

// Mock modules before imports
const mockStripeCustomersCreate = jest.fn();
const mockStripeSessionsCreate = jest.fn();
const mockSupabaseAuth = jest.fn();
const mockSupabaseFrom = jest.fn();

jest.mock('@/lib/stripe', () => ({
  stripe: {
    customers: {
      create: mockStripeCustomersCreate,
    },
    checkout: {
      sessions: {
        create: mockStripeSessionsCreate,
      },
    },
  },
  ADDON_PACKAGES: {
    ad_angles: {
      name: 'Ad Angle Pack',
      description: '10 additional ad angles for your niche',
      price: 29,
      priceId: 'price_addon_angles',
    },
    landing_rewrites: {
      name: 'Landing Page Rewrites',
      description: '5 landing page variations optimized for conversion',
      price: 49,
      priceId: 'price_addon_landing',
    },
    competitor_watch: {
      name: 'Competitor Watchlist',
      description: 'Monthly competitor monitoring and alerts',
      price: 99,
      priceId: 'price_addon_watchlist',
    },
  },
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: mockSupabaseAuth,
    },
    from: mockSupabaseFrom,
  })),
}));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/billing/addons/route';

// Polyfill Response.json for test environment
if (!Response.json) {
  (Response as any).json = function (data: any, init?: ResponseInit) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        ...init?.headers,
        'Content-Type': 'application/json',
      },
    });
  };
}

describe('POST /api/billing/addons', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockSupabaseAuth.mockResolvedValue({
      data: {
        user: {
          id: 'user_test123',
          email: 'test@example.com',
        },
      },
      error: null,
    });

    mockStripeCustomersCreate.mockResolvedValue({
      id: 'cus_test123',
    });

    mockStripeSessionsCreate.mockResolvedValue({
      id: 'cs_test123',
      url: 'https://checkout.stripe.com/test',
    });

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'user_test123',
          email: 'test@example.com',
          stripe_customer_id: 'cus_existing123',
        },
        error: null,
      }),
      insert: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      update: jest.fn().mockReturnThis(),
    });
  });

  it('should create checkout session for ad_angles addon', async () => {
    const request = new NextRequest('http://localhost:3000/api/billing/addons', {
      method: 'POST',
      body: JSON.stringify({ addon: 'ad_angles' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('url');
    expect(data.url).toBe('https://checkout.stripe.com/test');
  });

  it('should create checkout session for landing_rewrites addon', async () => {
    const request = new NextRequest('http://localhost:3000/api/billing/addons', {
      method: 'POST',
      body: JSON.stringify({ addon: 'landing_rewrites' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('url');
  });

  it('should create checkout session for competitor_watch addon', async () => {
    const request = new NextRequest('http://localhost:3000/api/billing/addons', {
      method: 'POST',
      body: JSON.stringify({ addon: 'competitor_watch' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('url');
  });

  it('should return 400 for invalid addon', async () => {
    const request = new NextRequest('http://localhost:3000/api/billing/addons', {
      method: 'POST',
      body: JSON.stringify({ addon: 'invalid_addon' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Invalid addon');
  });

  it('should return 401 for unauthenticated user', async () => {
    mockSupabaseAuth.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const request = new NextRequest('http://localhost:3000/api/billing/addons', {
      method: 'POST',
      body: JSON.stringify({ addon: 'ad_angles' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Unauthorized');
  });
});
