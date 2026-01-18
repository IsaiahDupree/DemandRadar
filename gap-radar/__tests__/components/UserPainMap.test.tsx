/**
 * User Pain Map Component Tests
 *
 * Tests for the User Pain Map report section (Page 3):
 * - Top objections (ranked)
 * - Desired features (ranked)
 * - Pricing & trust friction
 * - Switching triggers
 *
 * @see PRD §8 - Report Structure (User Pain Map)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { UserPainMap, UserPainMapProps } from '@/components/reports/UserPainMap';

describe('UserPainMap Component', () => {
  const mockProps: UserPainMapProps = {
    topObjections: [
      {
        id: 'obj-1',
        label: 'Poor customer support',
        frequency: 45,
        intensity: 0.85,
        sentiment: -0.7,
        examples: [
          {
            id: 'reddit-1',
            snippet: 'Customer support takes days to respond',
            source: 'r/SaaS',
            score: 125,
          },
          {
            id: 'reddit-2',
            snippet: 'No live chat option available',
            source: 'r/entrepreneur',
            score: 89,
          },
        ],
      },
      {
        id: 'obj-2',
        label: 'Expensive pricing',
        frequency: 38,
        intensity: 0.75,
        sentiment: -0.6,
        examples: [
          {
            id: 'reddit-3',
            snippet: 'Way too expensive for what it offers',
            source: 'r/SaaS',
            score: 201,
          },
        ],
      },
    ],
    desiredFeatures: [
      {
        id: 'feat-1',
        label: 'Mobile app',
        frequency: 52,
        intensity: 0.9,
        examples: [
          {
            id: 'reddit-4',
            snippet: 'Really wish they had a mobile app',
            source: 'r/startups',
            score: 156,
          },
        ],
      },
      {
        id: 'feat-2',
        label: 'API access',
        frequency: 29,
        intensity: 0.65,
        examples: [
          {
            id: 'reddit-5',
            snippet: 'Need API to integrate with our tools',
            source: 'r/SaaS',
            score: 78,
          },
        ],
      },
    ],
    pricingFriction: [
      {
        id: 'price-1',
        issue: 'No free tier',
        frequency: 34,
        quotes: [
          {
            id: 'reddit-6',
            text: 'Would love to try it but there is no free plan',
            source: 'r/entrepreneur',
            score: 92,
          },
        ],
      },
      {
        id: 'price-2',
        issue: 'Annual commitment required',
        frequency: 21,
        quotes: [
          {
            id: 'reddit-7',
            text: 'Forcing annual plan for small businesses is a dealbreaker',
            source: 'r/smallbusiness',
            score: 143,
          },
        ],
      },
    ],
    trustIssues: [
      {
        id: 'trust-1',
        issue: 'Data privacy concerns',
        frequency: 18,
        quotes: [
          {
            id: 'reddit-8',
            text: 'Not comfortable sharing sensitive data without SOC 2',
            source: 'r/SaaS',
            score: 67,
          },
        ],
      },
    ],
    switchingTriggers: [
      {
        id: 'switch-1',
        trigger: 'Better pricing from competitor',
        frequency: 41,
        context: 'Users mention switching to competitors with more flexible pricing tiers',
      },
      {
        id: 'switch-2',
        trigger: 'Missing critical features',
        frequency: 35,
        context: 'Users leave when realizing core features are missing or behind higher tiers',
      },
    ],
  };

  it('renders the component with correct heading', () => {
    render(<UserPainMap {...mockProps} />);

    expect(screen.getByTestId('user-pain-map')).toBeInTheDocument();
    expect(screen.getByText('User Pain Map')).toBeInTheDocument();
  });

  it('displays top objections ranked by frequency and intensity', () => {
    render(<UserPainMap {...mockProps} />);

    expect(screen.getByTestId('objections-section')).toBeInTheDocument();
    expect(screen.getByText('Poor customer support')).toBeInTheDocument();
    expect(screen.getByText('Expensive pricing')).toBeInTheDocument();

    // Check frequency is displayed
    expect(screen.getByTestId('objection-0-frequency')).toHaveTextContent('45');
  });

  it('shows objection examples with source attribution', () => {
    render(<UserPainMap {...mockProps} />);

    expect(screen.getByText('Customer support takes days to respond')).toBeInTheDocument();
    // Multiple instances of r/SaaS exist in the rendered output
    const sources = screen.getAllByText('r/SaaS');
    expect(sources.length).toBeGreaterThan(0);
  });

  it('displays desired features ranked by frequency', () => {
    render(<UserPainMap {...mockProps} />);

    expect(screen.getByTestId('features-section')).toBeInTheDocument();
    expect(screen.getByText('Mobile app')).toBeInTheDocument();
    expect(screen.getByText('API access')).toBeInTheDocument();

    // Check frequency is displayed
    expect(screen.getByTestId('feature-0-frequency')).toHaveTextContent('52');
  });

  it('displays pricing friction with quotes', () => {
    render(<UserPainMap {...mockProps} />);

    expect(screen.getByTestId('pricing-friction-section')).toBeInTheDocument();
    expect(screen.getByText('No free tier')).toBeInTheDocument();
    // Quote text is wrapped in quotes in the UI
    expect(screen.getByText(/"Would love to try it but there is no free plan"/)).toBeInTheDocument();
  });

  it('displays trust issues with supporting quotes', () => {
    render(<UserPainMap {...mockProps} />);

    expect(screen.getByTestId('trust-issues-section')).toBeInTheDocument();
    expect(screen.getByText('Data privacy concerns')).toBeInTheDocument();
    // Quote text is wrapped in quotes in the UI
    expect(screen.getByText(/"Not comfortable sharing sensitive data without SOC 2"/)).toBeInTheDocument();
  });

  it('displays switching triggers with context', () => {
    render(<UserPainMap {...mockProps} />);

    expect(screen.getByTestId('switching-triggers-section')).toBeInTheDocument();
    expect(screen.getByText('Better pricing from competitor')).toBeInTheDocument();
    expect(screen.getByText(/Users mention switching to competitors/)).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    const emptyProps: UserPainMapProps = {
      topObjections: [],
      desiredFeatures: [],
      pricingFriction: [],
      trustIssues: [],
      switchingTriggers: [],
    };

    render(<UserPainMap {...emptyProps} />);

    expect(screen.getByTestId('user-pain-map')).toBeInTheDocument();
    expect(screen.getByText('No objections identified yet')).toBeInTheDocument();
  });

  it('limits objections display to top 10', () => {
    const manyObjections = Array.from({ length: 15 }, (_, i) => ({
      id: `obj-${i}`,
      label: `Objection ${i}`,
      frequency: 100 - i,
      intensity: 0.8,
      sentiment: -0.5,
      examples: [],
    }));

    render(<UserPainMap {...mockProps} topObjections={manyObjections} />);

    // Should only display 10 items
    const objectionItems = screen.getAllByTestId(/^objection-\d+-frequency$/);
    expect(objectionItems.length).toBeLessThanOrEqual(10);
  });

  it('shows intensity indicator for high-intensity objections', () => {
    render(<UserPainMap {...mockProps} />);

    // First objection has 0.85 intensity (high)
    const firstObjection = screen.getByTestId('objection-0');
    expect(firstObjection).toBeInTheDocument();

    // Should have high intensity indicator
    expect(screen.getByTestId('objection-0-intensity')).toHaveTextContent('85%');
  });
});
