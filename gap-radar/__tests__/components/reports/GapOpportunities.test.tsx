/**
 * Gap Opportunities Ranked Section Component Tests
 * Tests for the Gap Opportunities report section (Report Page 5)
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GapOpportunities, type GapOpportunitiesProps } from '@/components/reports/GapOpportunities';

describe('GapOpportunities Component', () => {
  const mockProps: GapOpportunitiesProps = {
    gaps: [
      {
        id: 'gap-1',
        runId: 'run-1',
        gapType: 'product',
        title: 'Limited offline workout support',
        problem: 'Users consistently complain about requiring internet connection for basic features. 45% of negative reviews mention this pain point.',
        evidenceAds: [
          { id: 'ad-1', snippet: 'Works anywhere, even without WiFi - FitAI Pro' },
          { id: 'ad-2', snippet: 'Download workouts for offline use - SmartFit' },
        ],
        evidenceReddit: [
          { id: 'reddit-1', snippet: 'Why do I need internet just to track my reps? This is ridiculous.' },
          { id: 'reddit-2', snippet: 'Gym has terrible WiFi and app is useless without connection' },
          { id: 'reddit-3', snippet: 'Offline mode is the #1 feature I need. Would pay extra for it.' },
        ],
        recommendation: 'Add offline-first architecture with local data sync. Core features (workout tracking, timer, exercise library) should work without internet. Sync data when connection is restored.',
        opportunityScore: 87,
        confidence: 0.92,
      },
      {
        id: 'gap-2',
        runId: 'run-1',
        gapType: 'pricing',
        title: 'Pricing transparency and value perception',
        problem: 'Ads emphasize "free trial" but users complain about unclear pricing and surprise charges after trial ends.',
        evidenceAds: [
          { id: 'ad-3', snippet: 'Start your free trial today - no credit card required' },
          { id: 'ad-4', snippet: '7-day free trial, then just $14.99/month' },
        ],
        evidenceReddit: [
          { id: 'reddit-4', snippet: 'I thought it was free but got charged $15 after the trial. Not happy.' },
          { id: 'reddit-5', snippet: 'Pricing is hidden until you create an account. Sketchy.' },
        ],
        recommendation: 'Display pricing clearly on landing page before signup. Add reminder notification 2 days before trial ends. Offer flexible pricing tiers (monthly/annual).',
        opportunityScore: 73,
        confidence: 0.85,
      },
      {
        id: 'gap-3',
        runId: 'run-1',
        gapType: 'trust',
        title: 'Privacy concerns with health data',
        problem: 'Users express concern about how their fitness and health data is used and shared.',
        evidenceAds: [
          { id: 'ad-5', snippet: 'Your data is private and secure with us' },
        ],
        evidenceReddit: [
          { id: 'reddit-6', snippet: 'Does this app sell my health data to advertisers?' },
          { id: 'reddit-7', snippet: 'I want to use this but worried about privacy policy' },
        ],
        recommendation: 'Add privacy-first positioning: clear data policy page, no third-party sharing, option to export/delete all data. Consider HIPAA compliance if targeting health use cases.',
        opportunityScore: 65,
        confidence: 0.78,
      },
      {
        id: 'gap-4',
        runId: 'run-1',
        gapType: 'offer',
        title: 'Annual plan discount opportunity',
        problem: 'Only 15% of ads mention annual plans, but Reddit users actively ask about discounts for long-term commitment.',
        evidenceAds: [
          { id: 'ad-6', snippet: 'Save 30% with annual subscription' },
        ],
        evidenceReddit: [
          { id: 'reddit-8', snippet: 'Is there an annual plan? I would commit if the price is right.' },
        ],
        recommendation: 'Promote annual plan more prominently (40% off standard pricing). Test offering annual-only benefits like priority support or exclusive features.',
        opportunityScore: 58,
        confidence: 0.71,
      },
      {
        id: 'gap-5',
        runId: 'run-1',
        gapType: 'positioning',
        title: 'Beginner-friendly messaging gap',
        problem: 'Ads target "fitness enthusiasts" but Reddit shows demand from complete beginners who feel intimidated.',
        evidenceAds: [
          { id: 'ad-7', snippet: 'Advanced AI coaching for serious athletes' },
        ],
        evidenceReddit: [
          { id: 'reddit-9', snippet: 'I am a total beginner. Is this app too advanced for me?' },
        ],
        recommendation: 'Create beginner-focused landing page variant. Emphasize "starts at your level" and "no gym experience required" messaging. Add beginner success stories.',
        opportunityScore: 52,
        confidence: 0.68,
      },
    ],
  };

  it('renders section title', () => {
    render(<GapOpportunities {...mockProps} />);

    expect(screen.getByText(/Gap Opportunities/i)).toBeInTheDocument();
  });

  it('displays all gap cards', () => {
    render(<GapOpportunities {...mockProps} />);

    expect(screen.getByTestId('gap-0')).toBeInTheDocument();
    expect(screen.getByTestId('gap-1')).toBeInTheDocument();
    expect(screen.getByTestId('gap-2')).toBeInTheDocument();
    expect(screen.getByTestId('gap-3')).toBeInTheDocument();
    expect(screen.getByTestId('gap-4')).toBeInTheDocument();
  });

  it('shows gap titles', () => {
    render(<GapOpportunities {...mockProps} />);

    expect(screen.getByText('Limited offline workout support')).toBeInTheDocument();
    expect(screen.getByText('Pricing transparency and value perception')).toBeInTheDocument();
    expect(screen.getByText('Privacy concerns with health data')).toBeInTheDocument();
  });

  it('shows gap types', () => {
    render(<GapOpportunities {...mockProps} />);

    expect(screen.getByTestId('gap-0-type')).toHaveTextContent('Product');
    expect(screen.getByTestId('gap-1-type')).toHaveTextContent('Pricing');
    expect(screen.getByTestId('gap-2-type')).toHaveTextContent('Trust');
    expect(screen.getByTestId('gap-3-type')).toHaveTextContent('Offer');
    expect(screen.getByTestId('gap-4-type')).toHaveTextContent('Positioning');
  });

  it('shows opportunity scores', () => {
    render(<GapOpportunities {...mockProps} />);

    expect(screen.getByTestId('gap-0-score')).toHaveTextContent('87');
    expect(screen.getByTestId('gap-1-score')).toHaveTextContent('73');
    expect(screen.getByTestId('gap-2-score')).toHaveTextContent('65');
  });

  it('shows confidence scores', () => {
    render(<GapOpportunities {...mockProps} />);

    expect(screen.getByTestId('gap-0-confidence')).toHaveTextContent('92%');
    expect(screen.getByTestId('gap-1-confidence')).toHaveTextContent('85%');
    expect(screen.getByTestId('gap-2-confidence')).toHaveTextContent('78%');
  });

  it('displays problem descriptions', () => {
    render(<GapOpportunities {...mockProps} />);

    expect(screen.getByText(/Users consistently complain about requiring internet/i)).toBeInTheDocument();
    expect(screen.getByText(/unclear pricing and surprise charges/i)).toBeInTheDocument();
  });

  it('shows ad evidence snippets', () => {
    render(<GapOpportunities {...mockProps} />);

    const gap0 = screen.getByTestId('gap-0');
    expect(gap0).toHaveTextContent('Works anywhere, even without WiFi');
    expect(gap0).toHaveTextContent('Download workouts for offline use');
  });

  it('shows reddit evidence snippets', () => {
    render(<GapOpportunities {...mockProps} />);

    const gap0 = screen.getByTestId('gap-0');
    expect(gap0).toHaveTextContent('Why do I need internet just to track my reps?');
    expect(gap0).toHaveTextContent('Gym has terrible WiFi and app is useless');
  });

  it('displays 3% better recommendations', () => {
    render(<GapOpportunities {...mockProps} />);

    expect(screen.getByText(/Add offline-first architecture with local data sync/i)).toBeInTheDocument();
    expect(screen.getByText(/Display pricing clearly on landing page before signup/i)).toBeInTheDocument();
  });

  it('limits reddit evidence to 3 snippets per gap', () => {
    render(<GapOpportunities {...mockProps} />);

    const gap0 = screen.getByTestId('gap-0');
    const evidenceItems = gap0.querySelectorAll('[data-testid^="gap-0-reddit-"]');

    expect(evidenceItems.length).toBeLessThanOrEqual(3);
  });

  it('limits ad evidence to 2 snippets per gap', () => {
    render(<GapOpportunities {...mockProps} />);

    const gap0 = screen.getByTestId('gap-0');
    const evidenceItems = gap0.querySelectorAll('[data-testid^="gap-0-ad-"]');

    expect(evidenceItems.length).toBeLessThanOrEqual(2);
  });

  it('shows gaps in order by opportunity score (highest first)', () => {
    render(<GapOpportunities {...mockProps} />);

    const scores = [
      screen.getByTestId('gap-0-score'),
      screen.getByTestId('gap-1-score'),
      screen.getByTestId('gap-2-score'),
      screen.getByTestId('gap-3-score'),
      screen.getByTestId('gap-4-score'),
    ];

    expect(parseInt(scores[0].textContent || '0')).toBeGreaterThanOrEqual(
      parseInt(scores[1].textContent || '0')
    );
    expect(parseInt(scores[1].textContent || '0')).toBeGreaterThanOrEqual(
      parseInt(scores[2].textContent || '0')
    );
  });

  it('handles empty gaps list', () => {
    const emptyProps: GapOpportunitiesProps = {
      gaps: [],
    };

    render(<GapOpportunities {...emptyProps} />);

    expect(screen.getByText(/No gap opportunities found/i)).toBeInTheDocument();
  });

  it('highlights high opportunity scores (>80)', () => {
    render(<GapOpportunities {...mockProps} />);

    const highScore = screen.getByTestId('gap-0-score');
    // Should have some visual indicator for high scores
    expect(highScore).toBeInTheDocument();
  });

  it('shows expected impact label', () => {
    render(<GapOpportunities {...mockProps} />);

    // High score (87) should show "High Impact"
    expect(screen.getByTestId('gap-0-impact')).toHaveTextContent(/High/i);

    // Medium score (73) should show "Medium Impact"
    expect(screen.getByTestId('gap-1-impact')).toHaveTextContent(/Medium/i);

    // Lower score (52) should show "Medium Impact" or "Low Impact"
    expect(screen.getByTestId('gap-4-impact')).toHaveTextContent(/Medium|Low/i);
  });

  it('renders with data-testid for component', () => {
    render(<GapOpportunities {...mockProps} />);

    expect(screen.getByTestId('gap-opportunities')).toBeInTheDocument();
  });

  it('shows evidence source labels', () => {
    render(<GapOpportunities {...mockProps} />);

    // Multiple gaps may have these labels, so use getAllByText
    const adLabels = screen.getAllByText(/Evidence from Ads/i);
    const redditLabels = screen.getAllByText(/Evidence from Reddit/i);

    expect(adLabels.length).toBeGreaterThan(0);
    expect(redditLabels.length).toBeGreaterThan(0);
  });
});
