/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import BillingPage from '@/app/dashboard/billing/page';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('BillingPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<BillingPage />);

    expect(screen.getByText(/billing & invoices/i)).toBeInTheDocument();
  });

  it('should display empty state when no invoices', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invoices: [] }),
    });

    render(<BillingPage />);

    await waitFor(() => {
      expect(screen.getByText(/no invoices yet/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/your billing history will appear here/i)).toBeInTheDocument();
  });

  it('should display invoice list when invoices are available', async () => {
    const mockInvoices = [
      {
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
      },
      {
        id: 'in_456',
        number: 'INV-002',
        status: 'open',
        amount: 9900,
        currency: 'usd',
        created: '2024-02-01T00:00:00.000Z',
        periodStart: '2024-02-01T00:00:00.000Z',
        periodEnd: '2024-03-01T00:00:00.000Z',
        pdfUrl: 'https://invoice2.pdf',
        hostedUrl: 'https://invoice2.stripe.com',
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invoices: mockInvoices }),
    });

    render(<BillingPage />);

    await waitFor(() => {
      expect(screen.getByText('INV-001')).toBeInTheDocument();
    });

    expect(screen.getByText('INV-002')).toBeInTheDocument();
    expect(screen.getByText('$29.00')).toBeInTheDocument();
    expect(screen.getByText('$99.00')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('should display download links for invoices', async () => {
    const mockInvoice = {
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
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invoices: [mockInvoice] }),
    });

    render(<BillingPage />);

    await waitFor(() => {
      const pdfLinks = screen.getAllByText('PDF');
      expect(pdfLinks[0]).toBeInTheDocument();
    });

    const viewLinks = screen.getAllByText('View');
    expect(viewLinks[0]).toBeInTheDocument();
  });

  it('should call the correct API endpoint', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invoices: [] }),
    });

    render(<BillingPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/billing/invoices');
    });
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { toast } = require('sonner');

    render(<BillingPage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load invoices');
    });
  });
});
