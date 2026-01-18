/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from '@/app/dashboard/page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

// Mock Recharts to avoid rendering issues in tests
jest.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  RadarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="radar-chart">{children}</div>,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  Radar: () => <div data-testid="radar" />,
}));

// Mock chart components
jest.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="chart-container">{children}</div>,
  ChartTooltip: () => <div data-testid="chart-tooltip" />,
  ChartTooltipContent: () => <div data-testid="chart-tooltip-content" />,
}));

// Mock mock-data
jest.mock('@/lib/mock-data', () => ({
  mockRuns: [
    {
      id: '1',
      nicheQuery: 'AI SaaS tools',
      status: 'complete',
      startedAt: new Date('2024-01-15'),
      scores: {
        opportunity: 82,
        confidence: 0.85,
      },
    },
    {
      id: '2',
      nicheQuery: 'Productivity apps',
      status: 'running',
      startedAt: new Date('2024-01-16'),
    },
  ],
  mockGapOpportunities: [
    {
      id: 'gap-1',
      title: 'Better pricing model',
      gapType: 'pricing',
      problem: 'Users complain about complex pricing tiers',
      opportunityScore: 85,
      confidence: 0.78,
    },
    {
      id: 'gap-2',
      title: 'Mobile app needed',
      gapType: 'product',
      problem: 'Strong demand for mobile version',
      opportunityScore: 78,
      confidence: 0.82,
    },
  ],
  mockConceptIdeas: [
    {
      id: 'idea-1',
      name: 'AI Writing Assistant',
      metrics: {
        opportunityScore: 88,
      },
    },
    {
      id: 'idea-2',
      name: 'Content Scheduler',
      metrics: {
        opportunityScore: 72,
      },
    },
  ],
}));

describe('Dashboard Home Page (DASH-002)', () => {
  it('should render page title and description', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Market gap analysis and product idea generation')).toBeInTheDocument();
  });

  it('should display quick action button for new analysis', () => {
    render(<DashboardPage />);

    const newAnalysisButton = screen.getByRole('link', { name: /New Analysis/i });
    expect(newAnalysisButton).toBeInTheDocument();
    expect(newAnalysisButton).toHaveAttribute('href', '/dashboard/new-run');
  });

  it('should show usage stats cards', () => {
    render(<DashboardPage />);

    // Total Runs card
    expect(screen.getByText('Total Runs')).toBeInTheDocument();
    const totalRunsElements = screen.getAllByText('2');
    expect(totalRunsElements.length).toBeGreaterThan(0); // 2 mock runs (might appear multiple times)

    // Gap Opportunities card
    expect(screen.getByText('Gap Opportunities')).toBeInTheDocument();

    // Product Ideas card
    expect(screen.getByText('Product Ideas')).toBeInTheDocument();

    // Confidence card
    expect(screen.getByText('Avg Confidence')).toBeInTheDocument();
  });

  it('should display recent runs section', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Recent Runs')).toBeInTheDocument();
    expect(screen.getByText('Your latest market analysis runs')).toBeInTheDocument();

    // Check for run data (might appear in both desktop table and mobile cards)
    const aiSaasElements = screen.getAllByText('AI SaaS tools');
    expect(aiSaasElements.length).toBeGreaterThan(0);

    const productivityElements = screen.getAllByText('Productivity apps');
    expect(productivityElements.length).toBeGreaterThan(0);
  });

  it('should display top gap opportunities section', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Top Gap Opportunities')).toBeInTheDocument();
    expect(screen.getByText('Highest-scoring market gaps from your analyses')).toBeInTheDocument();

    // Check for gap data
    expect(screen.getByText('Better pricing model')).toBeInTheDocument();
    expect(screen.getByText('Mobile app needed')).toBeInTheDocument();
  });

  it('should show "View All" links for sections', () => {
    render(<DashboardPage />);

    const viewAllLinks = screen.getAllByRole('link', { name: /View All/i });
    expect(viewAllLinks.length).toBeGreaterThan(0);

    // Check that at least one links to runs page
    const runsLink = viewAllLinks.find(link => link.getAttribute('href') === '/dashboard/runs');
    expect(runsLink).toBeTruthy();

    // Check that at least one links to gaps page
    const gapsLink = viewAllLinks.find(link => link.getAttribute('href') === '/dashboard/gaps');
    expect(gapsLink).toBeTruthy();
  });

  it('should display status badges for runs', () => {
    render(<DashboardPage />);

    // Status badges might appear multiple times (desktop and mobile views)
    const completeElements = screen.getAllByText('Complete');
    expect(completeElements.length).toBeGreaterThan(0);

    const runningElements = screen.getAllByText('Running');
    expect(runningElements.length).toBeGreaterThan(0);
  });

  it('should show opportunity scores and confidence metrics', () => {
    render(<DashboardPage />);

    // Opportunity score for completed run (might appear multiple times in desktop/mobile)
    const scoreElements = screen.getAllByText('82');
    expect(scoreElements.length).toBeGreaterThan(0);

    // Confidence percentage (85% = 85)
    const confidenceElements = screen.getAllByText('85%');
    expect(confidenceElements.length).toBeGreaterThan(0);
  });

  it('should render charts for latest analysis', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Latest Analysis: AI SaaS tools')).toBeInTheDocument();
    expect(screen.getByText('Score breakdown from market analysis')).toBeInTheDocument();

    // Check for chart components
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('should render opportunity radar chart', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Opportunity Radar')).toBeInTheDocument();
    expect(screen.getByText('Multi-dimensional market opportunity view')).toBeInTheDocument();

    // Check for radar chart component
    expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
  });

  it('should display gap opportunity details', () => {
    render(<DashboardPage />);

    // Check gap type badges
    expect(screen.getByText('pricing')).toBeInTheDocument();
    expect(screen.getByText('product')).toBeInTheDocument();

    // Check problem descriptions
    expect(screen.getByText(/Users complain about complex pricing tiers/i)).toBeInTheDocument();
    expect(screen.getByText(/Strong demand for mobile version/i)).toBeInTheDocument();

    // Check scores (might appear multiple times)
    const scoreElements = screen.getAllByText(/Score:/);
    expect(scoreElements.length).toBeGreaterThan(0);

    const confidenceElements = screen.getAllByText(/Confidence:/);
    expect(confidenceElements.length).toBeGreaterThan(0);
  });
});
