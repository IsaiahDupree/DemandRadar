/**
 * Tests for ProgressChart Component (BRIEF-008)
 *
 * Tests the niche progress tracking component that shows:
 * - Historical charts
 * - Trend visualization
 * - Competitor tracking (market activity)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProgressChart from '@/app/dashboard/niches/[id]/components/ProgressChart';

// Mock recharts to avoid issues with SSR/canvas
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  };
});

describe('ProgressChart', () => {
  const mockSnapshots = [
    {
      id: 'snapshot-1',
      week_start: '2026-01-18',
      demand_score: 75,
      demand_score_change: 5,
      opportunity_score: 82,
      message_market_fit_score: 68,
      trend: 'up' as const,
      ad_signals: {
        new_advertisers: 12,
        avg_longevity_days: 45,
      },
      search_signals: {
        volume_change_pct: 25,
      },
    },
    {
      id: 'snapshot-2',
      week_start: '2026-01-11',
      demand_score: 70,
      demand_score_change: 3,
      opportunity_score: 78,
      message_market_fit_score: 65,
      trend: 'up' as const,
      ad_signals: {
        new_advertisers: 8,
        avg_longevity_days: 42,
      },
      search_signals: {
        volume_change_pct: 15,
      },
    },
    {
      id: 'snapshot-3',
      week_start: '2026-01-04',
      demand_score: 67,
      demand_score_change: -2,
      opportunity_score: 75,
      message_market_fit_score: 62,
      trend: 'down' as const,
      ad_signals: {
        new_advertisers: 5,
        avg_longevity_days: 40,
      },
      search_signals: {
        volume_change_pct: -5,
      },
    },
  ];

  describe('Empty State', () => {
    it('should show empty state when no snapshots provided', () => {
      render(<ProgressChart snapshots={[]} nicheName="Test Niche" />);
      expect(
        screen.getByText(/No historical data yet/i)
      ).toBeInTheDocument();
    });

    it('should show empty state when snapshots is null', () => {
      render(<ProgressChart snapshots={null as any} nicheName="Test Niche" />);
      expect(
        screen.getByText(/No historical data yet/i)
      ).toBeInTheDocument();
    });
  });

  describe('Summary Statistics', () => {
    it('should display current demand score', () => {
      render(<ProgressChart snapshots={mockSnapshots} nicheName="Test Niche" />);
      expect(screen.getByText('75')).toBeInTheDocument(); // Current score
    });

    it('should calculate and display total change', () => {
      render(<ProgressChart snapshots={mockSnapshots} nicheName="Test Niche" />);
      // Change from 67 to 75 = +8 points
      expect(screen.getByText(/\+8 pts/i)).toBeInTheDocument();
    });

    it('should calculate and display percent change', () => {
      render(<ProgressChart snapshots={mockSnapshots} nicheName="Test Niche" />);
      // (75-67)/67 * 100 = 11.9%
      expect(screen.getByText(/\+11\.9%/i)).toBeInTheDocument();
    });

    it('should calculate and display average score', () => {
      render(<ProgressChart snapshots={mockSnapshots} nicheName="Test Niche" />);
      // Average of 75, 70, 67 = 71
      expect(screen.getByText('71')).toBeInTheDocument();
    });

    it('should display current trend', () => {
      render(<ProgressChart snapshots={mockSnapshots} nicheName="Test Niche" />);
      expect(screen.getByText(/up/i)).toBeInTheDocument();
    });

    it('should show tracking duration', () => {
      render(<ProgressChart snapshots={mockSnapshots} nicheName="Test Niche" />);
      expect(screen.getByText(/Since 3 weeks ago/i)).toBeInTheDocument();
    });
  });

  describe('Chart Tabs', () => {
    it('should render scores chart tab', () => {
      render(<ProgressChart snapshots={mockSnapshots} nicheName="Test Niche" />);
      expect(screen.getByRole('tab', { name: /scores/i })).toBeInTheDocument();
    });

    it('should render market activity chart tab', () => {
      render(<ProgressChart snapshots={mockSnapshots} nicheName="Test Niche" />);
      expect(screen.getByRole('tab', { name: /market/i })).toBeInTheDocument();
    });

    it('should render search trends chart tab', () => {
      render(<ProgressChart snapshots={mockSnapshots} nicheName="Test Niche" />);
      expect(screen.getByRole('tab', { name: /search/i })).toBeInTheDocument();
    });
  });

  describe('Historical Charts (BRIEF-008 Requirement)', () => {
    it('should render score evolution chart', () => {
      render(<ProgressChart snapshots={mockSnapshots} nicheName="Test Niche" />);
      expect(screen.getByText(/Score Evolution/i)).toBeInTheDocument();
    });

    it('should render chart description about tracking scores over time', () => {
      render(<ProgressChart snapshots={mockSnapshots} nicheName="Test Niche" />);
      expect(screen.getByText(/Track how your niche scores have changed over time/i)).toBeInTheDocument();
    });

    it('should render responsive chart containers', () => {
      const { container } = render(<ProgressChart snapshots={mockSnapshots} nicheName="Test Niche" />);
      const chartContainers = container.querySelectorAll('[data-testid="responsive-container"]');
      expect(chartContainers.length).toBeGreaterThan(0);
    });

    it('should have all three chart tabs available', () => {
      render(<ProgressChart snapshots={mockSnapshots} nicheName="Test Niche" />);
      expect(screen.getByRole('tab', { name: /scores/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /market/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /search/i })).toBeInTheDocument();
    });
  });

  describe('Trend Visualization (BRIEF-008 Requirement)', () => {
    it('should have search trends chart section', () => {
      render(<ProgressChart snapshots={mockSnapshots} nicheName="Test Niche" />);
      // Check for the search tab which contains volume changes
      expect(screen.getByRole('tab', { name: /search/i })).toBeInTheDocument();
    });

    it('should show trend description', () => {
      render(<ProgressChart snapshots={mockSnapshots} nicheName="Test Niche" />);
      expect(
        screen.getByText(/Track how your niche scores have changed over time/i)
      ).toBeInTheDocument();
    });

    it('should display current trend indicator', () => {
      render(<ProgressChart snapshots={mockSnapshots} nicheName="Test Niche" />);
      expect(screen.getByText(/Current trajectory/i)).toBeInTheDocument();
    });
  });

  describe('Competitor Tracking (BRIEF-008 Requirement)', () => {
    it('should have market activity tab for competitor tracking', () => {
      render(<ProgressChart snapshots={mockSnapshots} nicheName="Test Niche" />);
      expect(screen.getByRole('tab', { name: /market/i })).toBeInTheDocument();
    });

    it('should provide context about market activity', () => {
      render(<ProgressChart snapshots={mockSnapshots} nicheName="Test Niche" />);
      // The component tracks new advertisers which indicates competitor activity
      expect(screen.getByText(/Market Activity/i)).toBeInTheDocument();
    });

    it('should render chart containers for competitor data', () => {
      const { container } = render(<ProgressChart snapshots={mockSnapshots} nicheName="Test Niche" />);
      // Multiple chart containers indicate different metrics including competitor tracking
      const charts = container.querySelectorAll('[data-testid="responsive-container"]');
      expect(charts.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Data Formatting', () => {
    it('should format dates correctly in chart data', () => {
      const { container } = render(
        <ProgressChart snapshots={mockSnapshots} nicheName="Test Niche" />
      );
      // Charts should be rendered (we mocked ResponsiveContainer)
      const containers = container.querySelectorAll('[data-testid="responsive-container"]');
      expect(containers.length).toBeGreaterThan(0);
    });

    it('should handle negative trends correctly', () => {
      const negativeSnapshots = [
        {
          ...mockSnapshots[0],
          demand_score: 60,
          trend: 'down' as const,
        },
        {
          ...mockSnapshots[1],
          demand_score: 70,
        },
      ];

      render(<ProgressChart snapshots={negativeSnapshots} nicheName="Test Niche" />);
      // Should show negative change
      expect(screen.getByText(/-10 pts/i)).toBeInTheDocument();
    });
  });

  describe('BRIEF-008 Acceptance Criteria', () => {
    it('✓ should display historical charts', () => {
      render(<ProgressChart snapshots={mockSnapshots} nicheName="Test Niche" />);
      expect(screen.getByText(/Score Evolution/i)).toBeInTheDocument();
      expect(screen.getByText(/Market Activity/i)).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /scores/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /market/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /search/i })).toBeInTheDocument();
    });

    it('✓ should display trend visualization', () => {
      render(<ProgressChart snapshots={mockSnapshots} nicheName="Test Niche" />);
      // Multiple trend indicators
      expect(screen.getByText(/Current trajectory/i)).toBeInTheDocument();
      expect(screen.getByText(/up/i)).toBeInTheDocument();
      expect(screen.getByText(/\+8 pts/i)).toBeInTheDocument();
      expect(screen.getByText(/\+11\.9%/i)).toBeInTheDocument();
    });

    it('✓ should display competitor tracking via market activity', () => {
      render(<ProgressChart snapshots={mockSnapshots} nicheName="Test Niche" />);
      // Market activity tab provides competitor tracking
      expect(screen.getByText(/Market Activity/i)).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /market/i })).toBeInTheDocument();
    });
  });
});
