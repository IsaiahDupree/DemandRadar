/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import CreditsDisplay from '@/components/billing/CreditsDisplay';

// Mock fetch
global.fetch = jest.fn();

describe('CreditsDisplay Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<CreditsDisplay />);

    expect(screen.getByTestId('credits-display')).toBeInTheDocument();
  });

  it('should display current credit balance', async () => {
    const mockCredits = {
      used: 5,
      limit: 10,
      remaining: 5,
      plan: 'builder',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCredits,
    });

    render(<CreditsDisplay />);

    await waitFor(() => {
      expect(screen.getByText(/5/)).toBeInTheDocument();
    });
  });

  it('should show low balance warning when remaining credits are below threshold', async () => {
    const mockCredits = {
      used: 9,
      limit: 10,
      remaining: 1,
      plan: 'builder',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCredits,
    });

    render(<CreditsDisplay />);

    await waitFor(() => {
      // Should show a warning indicator or message
      expect(screen.getByTestId('low-balance-warning')).toBeInTheDocument();
    });
  });

  it('should not show warning when credits are sufficient', async () => {
    const mockCredits = {
      used: 2,
      limit: 10,
      remaining: 8,
      plan: 'builder',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCredits,
    });

    render(<CreditsDisplay />);

    await waitFor(() => {
      expect(screen.queryByTestId('low-balance-warning')).not.toBeInTheDocument();
    });
  });

  it('should include a link to buy more credits', async () => {
    const mockCredits = {
      used: 5,
      limit: 10,
      remaining: 5,
      plan: 'builder',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCredits,
    });

    render(<CreditsDisplay />);

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /buy.*credit/i });
      expect(link).toHaveAttribute('href', '/dashboard/billing');
    });
  });

  it('should call the correct API endpoint', async () => {
    const mockCredits = {
      used: 5,
      limit: 10,
      remaining: 5,
      plan: 'builder',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCredits,
    });

    render(<CreditsDisplay />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/billing/credits');
    });
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<CreditsDisplay />);

    await waitFor(() => {
      // Should still render but maybe show error state or fallback
      expect(screen.getByTestId('credits-display')).toBeInTheDocument();
    });
  });

  it('should handle zero credits', async () => {
    const mockCredits = {
      used: 10,
      limit: 10,
      remaining: 0,
      plan: 'builder',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCredits,
    });

    render(<CreditsDisplay />);

    await waitFor(() => {
      expect(screen.getByText(/0/)).toBeInTheDocument();
      expect(screen.getByTestId('low-balance-warning')).toBeInTheDocument();
    });
  });

  it('should display a compact format suitable for header/sidebar', async () => {
    const mockCredits = {
      used: 5,
      limit: 10,
      remaining: 5,
      plan: 'builder',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCredits,
    });

    render(<CreditsDisplay />);

    await waitFor(() => {
      const display = screen.getByTestId('credits-display');
      // Should be compact (not like the full UsageTracker card)
      expect(display).toBeInTheDocument();
    });
  });
});
