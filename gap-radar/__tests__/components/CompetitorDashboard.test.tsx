/**
 * Tests for Competitor Dashboard Page (INTEL-009)
 *
 * @jest-environment jsdom
 *
 * Acceptance Criteria:
 * - Alerts shown
 * - Watchlist displayed
 * - Chart renders
 */

import { render, screen, waitFor } from '@testing-library/react';
import CompetitorDashboardPage from '@/app/dashboard/competitors/page';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

// Mock recharts to avoid rendering issues in tests
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
}));

describe('Competitor Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock: authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });
  });

  describe('Alerts Display', () => {
    it('should display recent alerts', async () => {
      // Mock alerts query
      const mockAlerts = [
        {
          id: 'alert-1',
          alert_type: 'new_campaign',
          title: 'Competitor A launched 7 new ads',
          created_at: new Date().toISOString(),
          is_read: false,
          competitor_id: 'comp-1',
          tracked_competitors: {
            competitor_name: 'Competitor A',
          },
        },
        {
          id: 'alert-2',
          alert_type: 'ad_spike',
          title: 'Competitor B ad volume up 65%',
          created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          is_read: false,
          competitor_id: 'comp-2',
          tracked_competitors: {
            competitor_name: 'Competitor B',
          },
        },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'competitor_alerts') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: mockAlerts,
              error: null,
            }),
          };
        }
        // Default empty response for other tables
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      render(<CompetitorDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/Competitor A launched 7 new ads/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Competitor B ad volume up 65%/i)).toBeInTheDocument();
    });

    it('should show empty state when no alerts', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      }));

      render(<CompetitorDashboardPage />);

      await waitFor(() => {
        // Check for the description text instead which is more unique
        expect(screen.getByText(/When competitors make significant moves/i)).toBeInTheDocument();
      });
    });
  });

  describe('Watchlist Display', () => {
    it('should display tracked competitors', async () => {
      const mockCompetitors = [
        {
          id: 'comp-1',
          competitor_name: 'Competitor A',
          competitor_domain: 'competitor-a.com',
          is_active: true,
          last_checked: new Date().toISOString(),
        },
        {
          id: 'comp-2',
          competitor_name: 'Competitor B',
          competitor_domain: 'competitor-b.com',
          is_active: true,
          last_checked: new Date().toISOString(),
        },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'tracked_competitors') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: mockCompetitors,
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      render(<CompetitorDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Competitor A')).toBeInTheDocument();
      });

      expect(screen.getByText('Competitor B')).toBeInTheDocument();
      expect(screen.getByText('competitor-a.com')).toBeInTheDocument();
      expect(screen.getByText('competitor-b.com')).toBeInTheDocument();
    });

    it('should show empty state when no competitors tracked', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      }));

      render(<CompetitorDashboardPage />);

      await waitFor(() => {
        // Check for the description text which is more unique
        expect(screen.getByText(/Start tracking competitors to monitor their ad campaigns/i)).toBeInTheDocument();
      });
    });
  });

  describe('Chart Rendering', () => {
    it('should render competitive landscape chart', async () => {
      const mockCompetitors = [
        {
          id: 'comp-1',
          competitor_name: 'Competitor A',
          competitor_domain: 'competitor-a.com',
          is_active: true,
        },
      ];

      const mockSnapshots = [
        {
          competitor_id: 'comp-1',
          snapshot_date: '2026-01-15',
          active_ads_count: 10,
        },
        {
          competitor_id: 'comp-1',
          snapshot_date: '2026-01-20',
          active_ads_count: 12,
        },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'tracked_competitors') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: mockCompetitors,
              error: null,
            }),
          };
        }
        if (table === 'competitor_snapshots') {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: mockSnapshots,
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      render(<CompetitorDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });
  });

  it('should handle authentication errors', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    render(<CompetitorDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    });
  });
});
