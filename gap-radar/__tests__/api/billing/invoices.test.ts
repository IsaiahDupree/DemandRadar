/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Mock Stripe
const mockStripeInvoicesList = jest.fn();
jest.mock('@/lib/stripe', () => ({
  stripe: {
    invoices: {
      list: mockStripeInvoicesList,
    },
  },
}));

// Mock Supabase
const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

import { GET } from '@/app/api/billing/invoices/route';

describe('GET /api/billing/invoices', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock chains
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
  });

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const request = new NextRequest('http://localhost:3001/api/billing/invoices');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return empty invoices array if user has no stripe_customer_id', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    mockSingle.mockResolvedValue({
      data: { stripe_customer_id: null },
      error: null,
    });

    const request = new NextRequest('http://localhost:3001/api/billing/invoices');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.invoices).toEqual([]);
  });

  it('should fetch and format invoices from Stripe', async () => {
    const mockInvoices = [
      {
        id: 'in_123',
        number: 'INV-001',
        status: 'paid',
        total: 2900,
        currency: 'usd',
        created: 1704067200, // 2024-01-01 00:00:00 UTC
        period_start: 1704067200,
        period_end: 1706745600, // 2024-02-01 00:00:00 UTC
        invoice_pdf: 'https://invoice.pdf',
        hosted_invoice_url: 'https://invoice.stripe.com',
      },
      {
        id: 'in_456',
        number: 'INV-002',
        status: 'open',
        total: 9900,
        currency: 'usd',
        created: 1706745600,
        period_start: 1706745600,
        period_end: 1709251200, // 2024-03-01 00:00:00 UTC
        invoice_pdf: 'https://invoice2.pdf',
        hosted_invoice_url: 'https://invoice2.stripe.com',
      },
    ];

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    mockSingle.mockResolvedValue({
      data: { stripe_customer_id: 'cus_test123' },
      error: null,
    });

    mockStripeInvoicesList.mockResolvedValue({
      data: mockInvoices,
    });

    const request = new NextRequest('http://localhost:3001/api/billing/invoices');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockStripeInvoicesList).toHaveBeenCalledWith({
      customer: 'cus_test123',
      limit: 12,
    });

    expect(data.invoices).toHaveLength(2);
    expect(data.invoices[0]).toEqual({
      id: 'in_123',
      number: 'INV-001',
      status: 'paid',
      amount: 2900,
      currency: 'usd',
      created: '2024-01-01T00:00:00.000Z',
      periodStart: '2024-01-01T00:00:00.000Z',
      periodEnd: '2024-02-01T00:00:00.000Z',
      pdfUrl: 'https://invoice.pdf',
      hostedUrl: 'https://invoice.stripe.com',
    });
  });

  it('should handle Stripe API errors gracefully', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    mockSingle.mockResolvedValue({
      data: { stripe_customer_id: 'cus_test123' },
      error: null,
    });

    mockStripeInvoicesList.mockRejectedValue(new Error('Stripe API error'));

    const request = new NextRequest('http://localhost:3001/api/billing/invoices');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch invoices');
  });

  it('should handle null period_start and period_end', async () => {
    const mockInvoice = {
      id: 'in_789',
      number: 'INV-003',
      status: 'draft',
      total: 4900,
      currency: 'usd',
      created: 1709251200,
      period_start: null,
      period_end: null,
      invoice_pdf: null,
      hosted_invoice_url: null,
    };

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    mockSingle.mockResolvedValue({
      data: { stripe_customer_id: 'cus_test123' },
      error: null,
    });

    mockStripeInvoicesList.mockResolvedValue({
      data: [mockInvoice],
    });

    const request = new NextRequest('http://localhost:3001/api/billing/invoices');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.invoices[0].periodStart).toBeNull();
    expect(data.invoices[0].periodEnd).toBeNull();
    expect(data.invoices[0].pdfUrl).toBeNull();
    expect(data.invoices[0].hostedUrl).toBeNull();
  });
});
