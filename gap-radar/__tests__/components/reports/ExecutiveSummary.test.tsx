/**
 * Executive Summary Component Tests
 * Tests for the Executive Summary report section
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExecutiveSummary, type ExecutiveSummaryProps } from '@/components/reports/ExecutiveSummary';

describe('ExecutiveSummary Component', () => {
  const mockProps: ExecutiveSummaryProps = {
    nicheName: 'AI-powered Fitness Apps',
    opportunityScore: 75,
    confidence: 0.85,
    topGaps: [
      {
        id: 'gap-1',
        type: 'product',
        title: 'Users want better AI personalization',
        score: 82,
        confidence: 0.9,
      },
      {
        id: 'gap-2',
        type: 'pricing',
        title: 'Pricing too high for casual users',
        score: 78,
        confidence: 0.8,
      },
      {
        id: 'gap-3',
        type: 'trust',
        title: 'Privacy concerns with data tracking',
        score: 71,
        confidence: 0.75,
      },
    ],
    platformRecommendation: {
      platform: 'mobile',
      reasoning: 'Mobile apps dominate fitness tracking. 80% of competitors are mobile-first, and users expect on-the-go access.',
    },
    totalAds: 127,
    totalMentions: 543,
    uniqueAdvertisers: 23,
  };

  it('renders niche name', () => {
    render(<ExecutiveSummary {...mockProps} />);

    const nicheName = screen.getByTestId('niche-name');
    expect(nicheName).toHaveTextContent('AI-powered Fitness Apps');
  });

  it('displays opportunity score', () => {
    render(<ExecutiveSummary {...mockProps} />);

    const score = screen.getByTestId('opportunity-score');
    expect(score).toHaveTextContent('75');
  });

  it('shows progress bar for opportunity score', () => {
    render(<ExecutiveSummary {...mockProps} />);

    const progress = screen.getByTestId('opportunity-progress');
    expect(progress).toBeInTheDocument();
  });

  it('displays data summary with ads, advertisers, and mentions', () => {
    render(<ExecutiveSummary {...mockProps} />);

    expect(screen.getByTestId('total-ads')).toHaveTextContent('127');
    expect(screen.getByTestId('unique-advertisers')).toHaveTextContent('23');
    expect(screen.getByTestId('total-mentions')).toHaveTextContent('543');
  });

  it('limits gaps to top 3', () => {
    const propsWithManyGaps: ExecutiveSummaryProps = {
      ...mockProps,
      topGaps: [
        ...mockProps.topGaps,
        {
          id: 'gap-4',
          type: 'offer',
          title: 'Fourth gap',
          score: 60,
          confidence: 0.7,
        },
        {
          id: 'gap-5',
          type: 'positioning',
          title: 'Fifth gap',
          score: 55,
          confidence: 0.6,
        },
      ],
    };

    render(<ExecutiveSummary {...propsWithManyGaps} />);

    const gapsList = screen.getByTestId('top-gaps-list');
    const gapItems = gapsList.querySelectorAll('[data-testid^="gap-item-"]');

    expect(gapItems).toHaveLength(3);
  });

  it('displays all three top gaps with correct titles', () => {
    render(<ExecutiveSummary {...mockProps} />);

    expect(screen.getByText('Users want better AI personalization')).toBeInTheDocument();
    expect(screen.getByText('Pricing too high for casual users')).toBeInTheDocument();
    expect(screen.getByText('Privacy concerns with data tracking')).toBeInTheDocument();
  });

  it('shows gap numbers (1, 2, 3)', () => {
    render(<ExecutiveSummary {...mockProps} />);

    const gap1 = screen.getByTestId('gap-item-0');
    const gap2 = screen.getByTestId('gap-item-1');
    const gap3 = screen.getByTestId('gap-item-2');

    expect(gap1).toHaveTextContent('1');
    expect(gap2).toHaveTextContent('2');
    expect(gap3).toHaveTextContent('3');
  });

  it('displays platform recommendation', () => {
    render(<ExecutiveSummary {...mockProps} />);

    expect(screen.getByTestId('platform-reasoning')).toHaveTextContent(
      'Mobile apps dominate fitness tracking'
    );
  });

  it('handles empty gaps gracefully', () => {
    const propsWithNoGaps: ExecutiveSummaryProps = {
      ...mockProps,
      topGaps: [],
    };

    render(<ExecutiveSummary {...propsWithNoGaps} />);

    expect(screen.getByText('No gaps identified yet')).toBeInTheDocument();
  });

  it('displays web platform recommendation', () => {
    const webProps: ExecutiveSummaryProps = {
      ...mockProps,
      platformRecommendation: {
        platform: 'web',
        reasoning: 'Complex features require desktop-class UI',
      },
    };

    render(<ExecutiveSummary {...webProps} />);

    expect(screen.getByTestId('platform-reasoning')).toHaveTextContent(
      'Complex features require desktop-class UI'
    );
  });

  it('displays hybrid platform recommendation', () => {
    const hybridProps: ExecutiveSummaryProps = {
      ...mockProps,
      platformRecommendation: {
        platform: 'hybrid',
        reasoning: 'Users need both mobile and web access',
      },
    };

    render(<ExecutiveSummary {...hybridProps} />);

    expect(screen.getByTestId('platform-reasoning')).toHaveTextContent(
      'Users need both mobile and web access'
    );
  });

  it('shows high confidence badge for confidence >= 0.8', () => {
    render(<ExecutiveSummary {...mockProps} />);

    expect(screen.getByText('High Confidence')).toBeInTheDocument();
  });

  it('shows medium confidence badge for confidence 0.5-0.8', () => {
    const mediumConfidenceProps: ExecutiveSummaryProps = {
      ...mockProps,
      confidence: 0.65,
    };

    render(<ExecutiveSummary {...mediumConfidenceProps} />);

    expect(screen.getByText('Medium Confidence')).toBeInTheDocument();
  });

  it('shows low confidence badge for confidence < 0.5', () => {
    const lowConfidenceProps: ExecutiveSummaryProps = {
      ...mockProps,
      confidence: 0.3,
    };

    render(<ExecutiveSummary {...lowConfidenceProps} />);

    expect(screen.getByText('Low Confidence')).toBeInTheDocument();
  });

  it('renders without optional data summary fields', () => {
    const minimalProps: ExecutiveSummaryProps = {
      nicheName: 'Test Niche',
      opportunityScore: 60,
      confidence: 0.7,
      topGaps: [],
      platformRecommendation: {
        platform: 'web',
        reasoning: 'Test reasoning',
      },
    };

    render(<ExecutiveSummary {...minimalProps} />);

    expect(screen.queryByTestId('total-ads')).not.toBeInTheDocument();
    expect(screen.queryByTestId('total-mentions')).not.toBeInTheDocument();
  });

  it('displays gap type badges correctly', () => {
    render(<ExecutiveSummary {...mockProps} />);

    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('Trust')).toBeInTheDocument();
  });

  it('displays gap scores correctly', () => {
    render(<ExecutiveSummary {...mockProps} />);

    const gapsList = screen.getByTestId('top-gaps-list');

    expect(gapsList).toHaveTextContent('82');
    expect(gapsList).toHaveTextContent('78');
    expect(gapsList).toHaveTextContent('71');
  });
});
