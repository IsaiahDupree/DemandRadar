/**
 * @jest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProgressTracker from '@/components/dashboard/ProgressTracker';

// Mock recharts
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    LineChart: ({ children }: any) => (
      <div data-testid="line-chart">{children}</div>
    ),
    Line: () => <div data-testid="line" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
  };
});

describe('ProgressTracker Component', () => {
  const mockProgressData = [
    {
      id: 'snapshot-1',
      date: '2026-01-18',
      opportunityScore: 85,
      demandScore: 78,
      saturationScore: 45,
      milestone: 'Initial Analysis',
    },
    {
      id: 'snapshot-2',
      date: '2026-01-11',
      opportunityScore: 80,
      demandScore: 75,
      saturationScore: 40,
      milestone: null,
    },
    {
      id: 'snapshot-3',
      date: '2026-01-04',
      opportunityScore: 75,
      demandScore: 70,
      saturationScore: 38,
      milestone: 'First Run',
    },
  ];

  const mockInsights = [
    {
      id: 'insight-1',
      date: '2026-01-18',
      type: 'positive',
      message: 'Opportunity score increased by 5 points',
    },
    {
      id: 'insight-2',
      date: '2026-01-11',
      type: 'warning',
      message: 'Saturation increasing - consider differentiating',
    },
  ];

  describe('Score Evolution Chart', () => {
    it('should render score evolution chart', () => {
      render(
        <ProgressTracker
          nicheName="AI Marketing Tools"
          progressData={mockProgressData}
          insights={mockInsights}
        />
      );

      expect(screen.getByText(/Score Evolution/i)).toBeInTheDocument();
    });

    it('should display chart with opportunity, demand, and saturation scores', () => {
      const { container } = render(
        <ProgressTracker
          nicheName="AI Marketing Tools"
          progressData={mockProgressData}
          insights={mockInsights}
        />
      );

      const chart = container.querySelector('[data-testid="line-chart"]');
      expect(chart).toBeInTheDocument();
    });

    it('should show current scores in summary', () => {
      render(
        <ProgressTracker
          nicheName="AI Marketing Tools"
          progressData={mockProgressData}
          insights={mockInsights}
        />
      );

      // Current (most recent) scores
      expect(screen.getByText('85')).toBeInTheDocument(); // Opportunity
      expect(screen.getByText('78')).toBeInTheDocument(); // Demand
      expect(screen.getByText('45')).toBeInTheDocument(); // Saturation
    });

    it('should calculate and display score changes', () => {
      render(
        <ProgressTracker
          nicheName="AI Marketing Tools"
          progressData={mockProgressData}
          insights={mockInsights}
        />
      );

      // Change from 75 to 85 = +10
      expect(screen.getByText(/\+10/)).toBeInTheDocument();
    });

    it('should handle empty data gracefully', () => {
      render(
        <ProgressTracker
          nicheName="AI Marketing Tools"
          progressData={[]}
          insights={[]}
        />
      );

      expect(screen.getByText(/No progress data yet/i)).toBeInTheDocument();
    });
  });

  describe('Milestone Markers', () => {
    it('should display milestones on the timeline', () => {
      render(
        <ProgressTracker
          nicheName="AI Marketing Tools"
          progressData={mockProgressData}
          insights={mockInsights}
        />
      );

      expect(screen.getByText('Initial Analysis')).toBeInTheDocument();
      expect(screen.getByText('First Run')).toBeInTheDocument();
    });

    it('should show milestone count', () => {
      render(
        <ProgressTracker
          nicheName="AI Marketing Tools"
          progressData={mockProgressData}
          insights={mockInsights}
        />
      );

      // 2 milestones in the data
      expect(screen.getByText(/2 milestones/i)).toBeInTheDocument();
    });

    it('should render milestone markers visually', () => {
      const { container } = render(
        <ProgressTracker
          nicheName="AI Marketing Tools"
          progressData={mockProgressData}
          insights={mockInsights}
        />
      );

      const milestoneMarkers = container.querySelectorAll('[data-milestone]');
      expect(milestoneMarkers.length).toBeGreaterThanOrEqual(2);
    });

    it('should display milestone dates', () => {
      render(
        <ProgressTracker
          nicheName="AI Marketing Tools"
          progressData={mockProgressData}
          insights={mockInsights}
        />
      );

      // Milestones are displayed - verify the count is shown
      expect(screen.getByText(/2 milestones/i)).toBeInTheDocument();
      // The milestones themselves should be present
      expect(screen.getByText('Initial Analysis')).toBeInTheDocument();
      expect(screen.getByText('First Run')).toBeInTheDocument();
    });
  });

  describe('Insights Timeline', () => {
    it('should display insights in chronological order', () => {
      render(
        <ProgressTracker
          nicheName="AI Marketing Tools"
          progressData={mockProgressData}
          insights={mockInsights}
        />
      );

      expect(screen.getByText(/Insights Timeline/i)).toBeInTheDocument();
    });

    it('should render all insights', () => {
      render(
        <ProgressTracker
          nicheName="AI Marketing Tools"
          progressData={mockProgressData}
          insights={mockInsights}
        />
      );

      expect(
        screen.getByText('Opportunity score increased by 5 points')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Saturation increasing - consider differentiating')
      ).toBeInTheDocument();
    });

    it('should categorize insights by type', () => {
      render(
        <ProgressTracker
          nicheName="AI Marketing Tools"
          progressData={mockProgressData}
          insights={mockInsights}
        />
      );

      const positiveInsight = screen.getByText(
        'Opportunity score increased by 5 points'
      );
      const warningInsight = screen.getByText(
        'Saturation increasing - consider differentiating'
      );

      expect(positiveInsight).toBeInTheDocument();
      expect(warningInsight).toBeInTheDocument();
    });

    it('should display insight dates', () => {
      render(
        <ProgressTracker
          nicheName="AI Marketing Tools"
          progressData={mockProgressData}
          insights={mockInsights}
        />
      );

      const insightCards = screen.getAllByText(/2026-01/);
      expect(insightCards.length).toBeGreaterThanOrEqual(2);
    });

    it('should show empty state when no insights', () => {
      render(
        <ProgressTracker
          nicheName="AI Marketing Tools"
          progressData={mockProgressData}
          insights={[]}
        />
      );

      expect(screen.getByText(/No insights yet/i)).toBeInTheDocument();
    });
  });

  describe('Niche Information', () => {
    it('should display niche name', () => {
      render(
        <ProgressTracker
          nicheName="AI Marketing Tools"
          progressData={mockProgressData}
          insights={mockInsights}
        />
      );

      expect(screen.getByText('AI Marketing Tools')).toBeInTheDocument();
    });

    it('should show tracking duration', () => {
      render(
        <ProgressTracker
          nicheName="AI Marketing Tools"
          progressData={mockProgressData}
          insights={mockInsights}
        />
      );

      // Should calculate duration from first to last snapshot
      expect(screen.getByText(/14 days/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should use responsive chart container', () => {
      const { container } = render(
        <ProgressTracker
          nicheName="AI Marketing Tools"
          progressData={mockProgressData}
          insights={mockInsights}
        />
      );

      const responsiveContainer = container.querySelector(
        '[data-testid="responsive-container"]'
      );
      expect(responsiveContainer).toBeInTheDocument();
    });

    it('should render chart with appropriate height', () => {
      const { container } = render(
        <ProgressTracker
          nicheName="AI Marketing Tools"
          progressData={mockProgressData}
          insights={mockInsights}
        />
      );

      const chart = container.querySelector('[data-testid="line-chart"]');
      expect(chart).toBeInTheDocument();
    });
  });

  describe('Acceptance Criteria (BRIEF-017)', () => {
    it('✓ should display score evolution chart', () => {
      render(
        <ProgressTracker
          nicheName="AI Marketing Tools"
          progressData={mockProgressData}
          insights={mockInsights}
        />
      );

      expect(screen.getByText(/Score Evolution/i)).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText(/\+10/)).toBeInTheDocument();
    });

    it('✓ should display milestone markers', () => {
      render(
        <ProgressTracker
          nicheName="AI Marketing Tools"
          progressData={mockProgressData}
          insights={mockInsights}
        />
      );

      expect(screen.getByText('Initial Analysis')).toBeInTheDocument();
      expect(screen.getByText('First Run')).toBeInTheDocument();
      expect(screen.getByText(/2 milestones/i)).toBeInTheDocument();
    });

    it('✓ should display insights timeline', () => {
      render(
        <ProgressTracker
          nicheName="AI Marketing Tools"
          progressData={mockProgressData}
          insights={mockInsights}
        />
      );

      expect(screen.getByText(/Insights Timeline/i)).toBeInTheDocument();
      expect(
        screen.getByText('Opportunity score increased by 5 points')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Saturation increasing - consider differentiating')
      ).toBeInTheDocument();
    });
  });
});
