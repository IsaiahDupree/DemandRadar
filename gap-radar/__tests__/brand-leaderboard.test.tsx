/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import BrandLeaderboardPage from '@/app/dashboard/brands/page';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  TrendingUp: () => <div data-testid="icon-trending-up" />,
  Target: () => <div data-testid="icon-target" />,
  Activity: () => <div data-testid="icon-activity" />,
  ExternalLink: () => <div data-testid="icon-external-link" />,
  ArrowUpDown: () => <div data-testid="icon-arrow-up-down" />,
}));

describe('Brand Leaderboard Page', () => {
  const mockBrandData = [
    {
      advertiser_name: 'Brand A',
      total_ads: 150,
      active_ads: 75,
      avg_longevity_days: 45,
      first_seen: '2025-11-01T00:00:00.000Z',
      last_seen: '2026-01-15T00:00:00.000Z',
      gaps_found: 12,
    },
    {
      advertiser_name: 'Brand B',
      total_ads: 100,
      active_ads: 50,
      avg_longevity_days: 30,
      first_seen: '2025-12-01T00:00:00.000Z',
      last_seen: '2026-01-10T00:00:00.000Z',
      gaps_found: 8,
    },
    {
      advertiser_name: 'Brand C',
      total_ads: 80,
      active_ads: 40,
      avg_longevity_days: 20,
      first_seen: '2026-01-01T00:00:00.000Z',
      last_seen: '2026-01-12T00:00:00.000Z',
      gaps_found: 5,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the brand leaderboard page with header', async () => {
    const mockSupabase = {
      rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    render(<BrandLeaderboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Brand Leaderboard')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Track top brands by advertising activity/i)
    ).toBeInTheDocument();
  });

  it('should display brand cards with metrics', async () => {
    const mockSupabase = {
      rpc: jest.fn().mockResolvedValue({ data: mockBrandData, error: null }),
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockBrandData, error: null }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    render(<BrandLeaderboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('brand-leaderboard-container')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check that all brands are displayed
    expect(screen.getByText('Brand A')).toBeInTheDocument();
    expect(screen.getByText('Brand B')).toBeInTheDocument();
    expect(screen.getByText('Brand C')).toBeInTheDocument();

    // Check that metrics are displayed for Brand A
    expect(screen.getByText('150')).toBeInTheDocument(); // total_ads
    expect(screen.getByText('75')).toBeInTheDocument(); // active_ads
    expect(screen.getByText('45d')).toBeInTheDocument(); // avg_longevity_days
    expect(screen.getByText('12')).toBeInTheDocument(); // gaps_found
  });

  it('should show empty state when no brands', async () => {
    const mockSupabase = {
      rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    render(<BrandLeaderboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    expect(screen.getByText(/No brands found/i)).toBeInTheDocument();
  });

  it('should display loading skeleton initially', () => {
    const mockSupabase = {
      rpc: jest.fn().mockReturnValue(
        new Promise(() => {}) // Never resolves, keeps loading
      ),
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnValue(
        new Promise(() => {}) // Never resolves, keeps loading
      ),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    render(<BrandLeaderboardPage />);

    // Check for skeleton elements (using class or test IDs)
    const skeletons = screen.queryAllByRole('status', { hidden: true });
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should allow clicking on brand card to view details', async () => {
    const mockSupabase = {
      rpc: jest.fn().mockResolvedValue({ data: mockBrandData, error: null }),
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockBrandData, error: null }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    render(<BrandLeaderboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Brand A')).toBeInTheDocument();
    }, { timeout: 3000 });

    const brandCard = screen.getByTestId('brand-card-Brand A');
    expect(brandCard).toBeInTheDocument();

    // Check if card has proper link or button
    const viewDetailsButton = screen.getAllByText(/View Details/i)[0];
    expect(viewDetailsButton).toBeInTheDocument();
  });

  it('should support sorting by different columns', async () => {
    const mockSupabase = {
      rpc: jest.fn().mockResolvedValue({ data: mockBrandData, error: null }),
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockBrandData, error: null }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    render(<BrandLeaderboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('brand-leaderboard-container')).toBeInTheDocument();
    });

    // Check for sort buttons
    const sortButtons = screen.getAllByRole('button', { name: /sort/i });
    expect(sortButtons.length).toBeGreaterThan(0);
  });
});
