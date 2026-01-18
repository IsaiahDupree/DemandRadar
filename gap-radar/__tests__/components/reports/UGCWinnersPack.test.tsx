/**
 * UGC Winners Pack Component Tests
 * Tests for the UGC Winners Pack report section (Page 8)
 *
 * @see PRD §8 - Report Structure (Page 8: UGC Winners Pack)
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UGCWinnersPack, type UGCWinnersPackProps } from '@/components/reports/UGCWinnersPack';

describe('UGCWinnersPack Component', () => {
  const mockProps: UGCWinnersPackProps = {
    topUGCAssets: [
      {
        id: 'asset-1',
        url: 'https://tiktok.com/test1',
        thumbnailUrl: 'https://tiktok.com/thumb1.jpg',
        caption: 'POV: You finally found an AI tool that actually works',
        platform: 'tiktok',
        source: 'tiktok_top_ads',
        score: 92,
        views: 120000,
        likes: 6000,
        comments: 300,
        shares: 200,
        patterns: {
          hookType: 'POV / Relatable',
          format: 'Demo',
          proofType: 'Results shown',
          objectionHandled: 'Ease of use',
          ctaStyle: 'Link in bio',
        },
      },
      {
        id: 'asset-2',
        url: 'https://tiktok.com/test2',
        thumbnailUrl: 'https://tiktok.com/thumb2.jpg',
        caption: 'Stop wasting money on AI tools that don\'t work!',
        platform: 'tiktok',
        source: 'tiktok_commercial',
        score: 85,
        views: 100000,
        likes: 5000,
        comments: 250,
        shares: 150,
        patterns: {
          hookType: 'Pain point callout',
          format: 'Comparison',
          proofType: 'Numbers/Stats',
          objectionHandled: 'Pricing',
          ctaStyle: 'Direct command',
        },
      },
    ],
    trendSignals: [
      {
        hashtag: '#AItools',
        count: 1500,
        growth: 45,
      },
      {
        hashtag: '#productivity',
        count: 1200,
        growth: 32,
      },
    ],
    hooks: [
      { text: 'POV: You finally found a solution that actually works', type: 'POV / Relatable' },
      { text: 'Stop wasting money on tools that don\'t deliver', type: 'Pain point callout' },
      { text: 'The secret tool professionals don\'t want you to know', type: 'Curiosity / FOMO' },
    ],
    scripts: [
      {
        duration: '15s',
        outline: [
          'Hook: Attention-grabbing opener (2s)',
          'Problem: Show the pain point (3s)',
          'Solution: Introduce the product (5s)',
          'CTA: Direct call-to-action (5s)',
        ],
      },
      {
        duration: '30s',
        outline: [
          'Hook: POV or relatable scenario (3s)',
          'Problem: Show current frustration (5s)',
          'Solution reveal: Introduce product/feature (7s)',
          'Proof: Quick demo or results (10s)',
          'CTA: Link in bio or comment (5s)',
        ],
      },
    ],
    shotList: [
      { shot: 'Close-up of face with reaction', notes: 'Natural lighting, show genuine emotion' },
      { shot: 'Screen recording of app/tool', notes: 'Clean screen, highlight key features' },
      { shot: 'Hands interacting with device', notes: 'Over-the-shoulder angle, show real usage' },
    ],
  };

  it('renders UGC Winners Pack section', () => {
    render(<UGCWinnersPack {...mockProps} />);

    expect(screen.getByTestId('ugc-winners-pack')).toBeInTheDocument();
  });

  it('displays all UGC assets', () => {
    render(<UGCWinnersPack {...mockProps} />);

    const assetsList = screen.getByTestId('ugc-assets-list');
    expect(assetsList).toBeInTheDocument();

    // Check for asset captions
    expect(screen.getByText('POV: You finally found an AI tool that actually works')).toBeInTheDocument();
    expect(screen.getByText('Stop wasting money on AI tools that don\'t work!')).toBeInTheDocument();
  });

  it('displays performance metrics for each asset', () => {
    render(<UGCWinnersPack {...mockProps} />);

    // Should show views, likes, comments, shares (formatted with K suffix)
    expect(screen.getByText(/120\.0K/)).toBeInTheDocument(); // views
    expect(screen.getByText(/6\.0K/)).toBeInTheDocument(); // likes
  });

  it('displays trend signals with hashtags', () => {
    render(<UGCWinnersPack {...mockProps} />);

    expect(screen.getByText('#AItools')).toBeInTheDocument();
    expect(screen.getByText('#productivity')).toBeInTheDocument();
  });

  it('displays all hooks', () => {
    render(<UGCWinnersPack {...mockProps} />);

    expect(screen.getByText('POV: You finally found a solution that actually works')).toBeInTheDocument();
    expect(screen.getByText('Stop wasting money on tools that don\'t deliver')).toBeInTheDocument();
    expect(screen.getByText('The secret tool professionals don\'t want you to know')).toBeInTheDocument();
  });

  it('displays all scripts with durations', () => {
    render(<UGCWinnersPack {...mockProps} />);

    expect(screen.getByText(/15s/)).toBeInTheDocument();
    expect(screen.getByText(/30s/)).toBeInTheDocument();
  });

  it('displays script outlines', () => {
    render(<UGCWinnersPack {...mockProps} />);

    expect(screen.getByText(/Hook: Attention-grabbing opener/)).toBeInTheDocument();
    expect(screen.getByText(/Problem: Show the pain point/)).toBeInTheDocument();
  });

  it('displays shot list with camera instructions', () => {
    render(<UGCWinnersPack {...mockProps} />);

    expect(screen.getByText('Close-up of face with reaction')).toBeInTheDocument();
    expect(screen.getByText('Screen recording of app/tool')).toBeInTheDocument();
    expect(screen.getByText('Hands interacting with device')).toBeInTheDocument();
  });

  it('displays pattern information for UGC assets', () => {
    render(<UGCWinnersPack {...mockProps} />);

    // Pattern types appear multiple times (in assets and hooks), use getAllByText
    const povElements = screen.getAllByText('POV / Relatable');
    expect(povElements.length).toBeGreaterThan(0);

    const painElements = screen.getAllByText('Pain point callout');
    expect(painElements.length).toBeGreaterThan(0);
  });

  it('handles empty UGC assets gracefully', () => {
    const emptyProps: UGCWinnersPackProps = {
      ...mockProps,
      topUGCAssets: [],
    };

    render(<UGCWinnersPack {...emptyProps} />);

    expect(screen.getByText(/No UGC assets/i)).toBeInTheDocument();
  });

  it('handles empty hooks gracefully', () => {
    const emptyHooksProps: UGCWinnersPackProps = {
      ...mockProps,
      hooks: [],
    };

    render(<UGCWinnersPack {...emptyHooksProps} />);

    // Component should still render
    expect(screen.getByTestId('ugc-winners-pack')).toBeInTheDocument();
  });

  it('handles empty scripts gracefully', () => {
    const emptyScriptsProps: UGCWinnersPackProps = {
      ...mockProps,
      scripts: [],
    };

    render(<UGCWinnersPack {...emptyScriptsProps} />);

    // Component should still render
    expect(screen.getByTestId('ugc-winners-pack')).toBeInTheDocument();
  });

  it('displays asset scores', () => {
    render(<UGCWinnersPack {...mockProps} />);

    // Scores should be displayed
    const assetsList = screen.getByTestId('ugc-assets-list');
    expect(assetsList).toHaveTextContent('92');
    expect(assetsList).toHaveTextContent('85');
  });

  it('displays platform badges for assets', () => {
    render(<UGCWinnersPack {...mockProps} />);

    const tikTokBadges = screen.getAllByText(/TikTok/i);
    expect(tikTokBadges.length).toBeGreaterThan(0);
  });

  it('displays growth indicators for trend signals', () => {
    render(<UGCWinnersPack {...mockProps} />);

    // Check for growth percentages
    expect(screen.getByText(/45%/)).toBeInTheDocument();
    expect(screen.getByText(/32%/)).toBeInTheDocument();
  });

  it('groups hooks by type', () => {
    render(<UGCWinnersPack {...mockProps} />);

    const hooksList = screen.getByTestId('hooks-list');
    expect(hooksList).toBeInTheDocument();

    // Should show hook types
    expect(hooksList).toHaveTextContent('POV / Relatable');
    expect(hooksList).toHaveTextContent('Pain point callout');
    expect(hooksList).toHaveTextContent('Curiosity / FOMO');
  });

  it('displays shot list with technical notes', () => {
    render(<UGCWinnersPack {...mockProps} />);

    const shotList = screen.getByTestId('shot-list');
    expect(shotList).toBeInTheDocument();

    // Should show technical notes
    expect(screen.getByText(/Natural lighting/)).toBeInTheDocument();
    expect(screen.getByText(/Clean screen/)).toBeInTheDocument();
  });
});
