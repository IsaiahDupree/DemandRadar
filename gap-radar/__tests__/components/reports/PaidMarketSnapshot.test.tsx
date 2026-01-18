/**
 * Paid Market Snapshot Component Tests
 * Tests for the Paid Market Snapshot report section (Report Page 2)
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PaidMarketSnapshot, type PaidMarketSnapshotProps } from '@/components/reports/PaidMarketSnapshot';

describe('PaidMarketSnapshot Component', () => {
  const mockProps: PaidMarketSnapshotProps = {
    topAdvertisers: [
      {
        advertiserName: 'FitAI Pro',
        creativeCount: 45,
        averageDaysRunning: 127,
        longestRunningDays: 180,
      },
      {
        advertiserName: 'SmartFit Labs',
        creativeCount: 32,
        averageDaysRunning: 98,
        longestRunningDays: 145,
      },
      {
        advertiserName: 'AI Coach Plus',
        creativeCount: 28,
        averageDaysRunning: 85,
        longestRunningDays: 120,
      },
    ],
    repeatedAngles: [
      {
        angle: 'AI-powered personalization',
        frequency: 23,
        examples: [
          { advertiser: 'FitAI Pro', snippet: 'AI that adapts to your fitness level...' },
          { advertiser: 'SmartFit Labs', snippet: 'Personalized workouts powered by AI...' },
        ],
      },
      {
        angle: '30-day transformation guarantee',
        frequency: 18,
        examples: [
          { advertiser: 'AI Coach Plus', snippet: 'See results in 30 days or money back...' },
        ],
      },
    ],
    longestRunningCreatives: [
      {
        id: 'ad-1',
        advertiserName: 'FitAI Pro',
        headline: 'Get fit with AI-powered coaching',
        daysRunning: 180,
        isActive: true,
        snippet: 'Transform your fitness journey with personalized AI coaching...',
      },
      {
        id: 'ad-2',
        advertiserName: 'SmartFit Labs',
        headline: 'Your AI fitness companion',
        daysRunning: 145,
        isActive: true,
        snippet: 'Never miss a workout with smart AI reminders...',
      },
    ],
    offerPatterns: [
      {
        pattern: 'Free trial',
        frequency: 15,
        details: '7-14 day free trials are most common',
      },
      {
        pattern: 'Money-back guarantee',
        frequency: 12,
        details: '30-day money-back guarantee standard',
      },
      {
        pattern: 'Annual discount',
        frequency: 8,
        details: '20-40% discount for annual plans',
      },
    ],
  };

  it('renders section title', () => {
    render(<PaidMarketSnapshot {...mockProps} />);

    expect(screen.getByText(/Paid Market Snapshot/i)).toBeInTheDocument();
  });

  it('displays top advertisers table', () => {
    render(<PaidMarketSnapshot {...mockProps} />);

    const table = screen.getByTestId('advertisers-table');
    expect(table).toHaveTextContent('FitAI Pro');
    expect(table).toHaveTextContent('SmartFit Labs');
    expect(table).toHaveTextContent('AI Coach Plus');
  });

  it('shows advertiser creative counts', () => {
    render(<PaidMarketSnapshot {...mockProps} />);

    expect(screen.getByTestId('advertiser-0-count')).toHaveTextContent('45');
    expect(screen.getByTestId('advertiser-1-count')).toHaveTextContent('32');
    expect(screen.getByTestId('advertiser-2-count')).toHaveTextContent('28');
  });

  it('shows advertiser average days running', () => {
    render(<PaidMarketSnapshot {...mockProps} />);

    expect(screen.getByTestId('advertiser-0-avg-days')).toHaveTextContent('127');
    expect(screen.getByTestId('advertiser-1-avg-days')).toHaveTextContent('98');
    expect(screen.getByTestId('advertiser-2-avg-days')).toHaveTextContent('85');
  });

  it('displays repeated angles section', () => {
    render(<PaidMarketSnapshot {...mockProps} />);

    expect(screen.getByText('AI-powered personalization')).toBeInTheDocument();
    expect(screen.getByText('30-day transformation guarantee')).toBeInTheDocument();
  });

  it('shows angle frequency counts', () => {
    render(<PaidMarketSnapshot {...mockProps} />);

    expect(screen.getByTestId('angle-0-frequency')).toHaveTextContent('23');
    expect(screen.getByTestId('angle-1-frequency')).toHaveTextContent('18');
  });

  it('displays angle examples with advertiser names', () => {
    render(<PaidMarketSnapshot {...mockProps} />);

    const anglesList = screen.getByTestId('angles-list');
    expect(anglesList).toHaveTextContent('FitAI Pro');
    expect(anglesList).toHaveTextContent(/AI that adapts to your fitness level/i);
  });

  it('displays longest-running creatives', () => {
    render(<PaidMarketSnapshot {...mockProps} />);

    expect(screen.getByText('Get fit with AI-powered coaching')).toBeInTheDocument();
    expect(screen.getByText('Your AI fitness companion')).toBeInTheDocument();
  });

  it('shows days running for longest creatives', () => {
    render(<PaidMarketSnapshot {...mockProps} />);

    expect(screen.getByTestId('creative-0-days')).toHaveTextContent('180');
    expect(screen.getByTestId('creative-1-days')).toHaveTextContent('145');
  });

  it('displays active status badges for longest creatives', () => {
    render(<PaidMarketSnapshot {...mockProps} />);

    const activeBadges = screen.getAllByText('Active');
    expect(activeBadges.length).toBeGreaterThan(0);
  });

  it('displays offer patterns', () => {
    render(<PaidMarketSnapshot {...mockProps} />);

    expect(screen.getByText('Free trial')).toBeInTheDocument();
    expect(screen.getByText('Money-back guarantee')).toBeInTheDocument();
    expect(screen.getByText('Annual discount')).toBeInTheDocument();
  });

  it('shows offer pattern frequencies', () => {
    render(<PaidMarketSnapshot {...mockProps} />);

    expect(screen.getByTestId('offer-0-frequency')).toHaveTextContent('15');
    expect(screen.getByTestId('offer-1-frequency')).toHaveTextContent('12');
    expect(screen.getByTestId('offer-2-frequency')).toHaveTextContent('8');
  });

  it('shows offer pattern details', () => {
    render(<PaidMarketSnapshot {...mockProps} />);

    expect(screen.getByText(/7-14 day free trials/i)).toBeInTheDocument();
    expect(screen.getByText(/30-day money-back guarantee/i)).toBeInTheDocument();
    expect(screen.getByText(/20-40% discount for annual/i)).toBeInTheDocument();
  });

  it('handles empty advertisers list', () => {
    const emptyProps: PaidMarketSnapshotProps = {
      ...mockProps,
      topAdvertisers: [],
    };

    render(<PaidMarketSnapshot {...emptyProps} />);

    expect(screen.getByText(/No advertisers found/i)).toBeInTheDocument();
  });

  it('handles empty repeated angles list', () => {
    const emptyProps: PaidMarketSnapshotProps = {
      ...mockProps,
      repeatedAngles: [],
    };

    render(<PaidMarketSnapshot {...emptyProps} />);

    expect(screen.getByText(/No repeated angles found/i)).toBeInTheDocument();
  });

  it('handles empty longest-running creatives list', () => {
    const emptyProps: PaidMarketSnapshotProps = {
      ...mockProps,
      longestRunningCreatives: [],
    };

    render(<PaidMarketSnapshot {...emptyProps} />);

    expect(screen.getByText(/No long-running creatives found/i)).toBeInTheDocument();
  });

  it('handles empty offer patterns list', () => {
    const emptyProps: PaidMarketSnapshotProps = {
      ...mockProps,
      offerPatterns: [],
    };

    render(<PaidMarketSnapshot {...emptyProps} />);

    expect(screen.getByText(/No offer patterns found/i)).toBeInTheDocument();
  });

  it('limits advertisers to top 10', () => {
    const manyAdvertisers = Array.from({ length: 15 }, (_, i) => ({
      advertiserName: `Advertiser ${i + 1}`,
      creativeCount: 50 - i,
      averageDaysRunning: 100 - i,
      longestRunningDays: 150 - i,
    }));

    const propsWithMany: PaidMarketSnapshotProps = {
      ...mockProps,
      topAdvertisers: manyAdvertisers,
    };

    render(<PaidMarketSnapshot {...propsWithMany} />);

    const table = screen.getByTestId('advertisers-table');
    const rows = table.querySelectorAll('tbody tr');

    expect(rows.length).toBeLessThanOrEqual(10);
  });

  it('limits repeated angles to top 5', () => {
    const manyAngles = Array.from({ length: 10 }, (_, i) => ({
      angle: `Angle ${i + 1}`,
      frequency: 30 - i,
      examples: [{ advertiser: 'Test', snippet: 'Example snippet' }],
    }));

    const propsWithMany: PaidMarketSnapshotProps = {
      ...mockProps,
      repeatedAngles: manyAngles,
    };

    render(<PaidMarketSnapshot {...propsWithMany} />);

    const anglesList = screen.getByTestId('angles-list');
    // Count direct children with data-testid="angle-X"
    const angleItems = anglesList.querySelectorAll('[data-testid^="angle-"]:not([data-testid$="-frequency"])');

    expect(angleItems.length).toBeLessThanOrEqual(5);
  });

  it('limits longest-running creatives to top 5', () => {
    const manyCreatives = Array.from({ length: 10 }, (_, i) => ({
      id: `ad-${i}`,
      advertiserName: `Advertiser ${i + 1}`,
      headline: `Headline ${i + 1}`,
      daysRunning: 200 - i * 10,
      isActive: true,
      snippet: `Snippet ${i + 1}`,
    }));

    const propsWithMany: PaidMarketSnapshotProps = {
      ...mockProps,
      longestRunningCreatives: manyCreatives,
    };

    render(<PaidMarketSnapshot {...propsWithMany} />);

    const creativesList = screen.getByTestId('creatives-list');
    // Count direct children with data-testid="creative-X"
    const creativeItems = creativesList.querySelectorAll('[data-testid^="creative-"]:not([data-testid$="-days"])');

    expect(creativeItems.length).toBeLessThanOrEqual(5);
  });

  it('shows inactive badge for inactive creatives', () => {
    const propsWithInactive: PaidMarketSnapshotProps = {
      ...mockProps,
      longestRunningCreatives: [
        {
          id: 'ad-inactive',
          advertiserName: 'Test Advertiser',
          headline: 'Inactive ad',
          daysRunning: 90,
          isActive: false,
          snippet: 'This ad is no longer active',
        },
      ],
    };

    render(<PaidMarketSnapshot {...propsWithInactive} />);

    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('renders with data-testid for component', () => {
    render(<PaidMarketSnapshot {...mockProps} />);

    expect(screen.getByTestId('paid-market-snapshot')).toBeInTheDocument();
  });
});
