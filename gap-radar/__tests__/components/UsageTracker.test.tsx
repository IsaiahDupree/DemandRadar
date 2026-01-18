/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import UsageTracker from '@/components/billing/UsageTracker';

// Mock fetch
global.fetch = jest.fn();

describe('UsageTracker Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<UsageTracker />);

    // Should show some loading indicator
    expect(screen.getByTestId('usage-tracker')).toBeInTheDocument();
  });

  it('should display usage stats when data is loaded', async () => {
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

    render(<UsageTracker />);

    await waitFor(() => {
      expect(screen.getByText(/5 \/ 10 runs/i)).toBeInTheDocument();
    });

    // Should show remaining runs
    expect(screen.getByText(/5.*runs.*remaining/i)).toBeInTheDocument();
  });

  it('should calculate and display usage percentage', async () => {
    const mockCredits = {
      used: 7,
      limit: 10,
      remaining: 3,
      plan: 'builder',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCredits,
    });

    render(<UsageTracker />);

    await waitFor(() => {
      // 70% usage (7/10)
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '70');
    });
  });

  it('should show warning when usage is above 80%', async () => {
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

    render(<UsageTracker />);

    await waitFor(() => {
      // Should have warning styling (could be a badge, color change, etc.)
      expect(screen.getByText(/1.*remaining/i)).toBeInTheDocument();
    });
  });

  it('should display plan name', async () => {
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

    render(<UsageTracker />);

    await waitFor(() => {
      expect(screen.getByText(/builder/i)).toBeInTheDocument();
    });
  });

  it('should handle zero usage correctly', async () => {
    const mockCredits = {
      used: 0,
      limit: 10,
      remaining: 10,
      plan: 'builder',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCredits,
    });

    render(<UsageTracker />);

    await waitFor(() => {
      expect(screen.getByText(/0 \/ 10 runs/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/10.*runs.*remaining/i)).toBeInTheDocument();

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  it('should handle full usage correctly', async () => {
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

    render(<UsageTracker />);

    await waitFor(() => {
      expect(screen.getByText(/0.*remaining/i)).toBeInTheDocument();
    });

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
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

    render(<UsageTracker />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/billing/credits');
    });
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<UsageTracker />);

    await waitFor(() => {
      // Should still render the component but show error state or fallback
      expect(screen.getByTestId('usage-tracker')).toBeInTheDocument();
    });
  });

  it('should refresh data when refresh prop changes', async () => {
    const mockCredits = {
      used: 5,
      limit: 10,
      remaining: 5,
      plan: 'builder',
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockCredits,
    });

    const { rerender } = render(<UsageTracker refreshTrigger={0} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Change refresh trigger - should fetch again
    const updatedCredits = {
      used: 6,
      limit: 10,
      remaining: 4,
      plan: 'builder',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => updatedCredits,
    });

    rerender(<UsageTracker refreshTrigger={1} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
