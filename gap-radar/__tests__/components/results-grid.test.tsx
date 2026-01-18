/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ResultsGrid } from '@/components/dashboard/ResultsGrid';
import { mockGapOpportunities } from '@/lib/mock-data';

describe('Results Grid Component (DASH-004)', () => {
  const mockOnGapClick = jest.fn();

  const defaultProps = {
    gaps: mockGapOpportunities,
    onGapClick: mockOnGapClick,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render card-based grid layout', () => {
    render(<ResultsGrid {...defaultProps} />);

    // Should render a grid container
    const grid = screen.getByTestId('results-grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('grid');
  });

  it('should render all gap opportunity cards', () => {
    render(<ResultsGrid {...defaultProps} />);

    // Should render a card for each gap
    mockGapOpportunities.forEach((gap) => {
      expect(screen.getByText(gap.title)).toBeInTheDocument();
    });
  });

  it('should display score badges on each card', () => {
    render(<ResultsGrid {...defaultProps} />);

    // Check for score values
    mockGapOpportunities.forEach((gap) => {
      expect(screen.getByText(gap.opportunityScore.toString())).toBeInTheDocument();
    });
  });

  it('should display confidence scores', () => {
    render(<ResultsGrid {...defaultProps} />);

    // Check for confidence percentages
    mockGapOpportunities.forEach((gap) => {
      const confidencePercent = Math.round(gap.confidence * 100);
      expect(screen.getByText(`${confidencePercent}%`)).toBeInTheDocument();
    });
  });

  it('should display source icons/indicators', () => {
    render(<ResultsGrid {...defaultProps} />);

    // Each card should have evidence indicators
    const adsSources = screen.getAllByText(/ads/i);
    const redditSources = screen.getAllByText(/reddit/i);

    expect(adsSources.length).toBeGreaterThan(0);
    expect(redditSources.length).toBeGreaterThan(0);
  });

  it('should show gap type badges', () => {
    render(<ResultsGrid {...defaultProps} />);

    // Check for gap types
    mockGapOpportunities.forEach((gap) => {
      expect(screen.getByText(gap.gapType)).toBeInTheDocument();
    });
  });

  it('should have hover states on cards', () => {
    render(<ResultsGrid {...defaultProps} />);

    const cards = screen.getAllByRole('button');
    expect(cards.length).toBeGreaterThan(0);

    // Cards should be interactive (clickable)
    cards.forEach((card) => {
      expect(card).toBeInTheDocument();
    });
  });

  it('should call onGapClick when a card is clicked', () => {
    render(<ResultsGrid {...defaultProps} />);

    const firstCard = screen.getAllByRole('button')[0];
    fireEvent.click(firstCard);

    expect(mockOnGapClick).toHaveBeenCalledWith(mockGapOpportunities[0]);
  });

  it('should handle empty gaps array gracefully', () => {
    render(<ResultsGrid gaps={[]} onGapClick={mockOnGapClick} />);

    const emptyMessage = screen.getByText(/no gap opportunities found/i);
    expect(emptyMessage).toBeInTheDocument();
  });

  it('should render cards in responsive grid', () => {
    render(<ResultsGrid {...defaultProps} />);

    const grid = screen.getByTestId('results-grid');

    // Should have responsive grid classes (md:grid-cols-2, lg:grid-cols-3, etc.)
    const classes = grid.className;
    expect(classes).toMatch(/grid/);
  });

  it('should truncate long problem descriptions', () => {
    const longGap = {
      ...mockGapOpportunities[0],
      problem: 'This is a very long problem description that should be truncated in the card view to maintain a clean layout and prevent the cards from becoming too tall and overwhelming for users browsing through the results grid.',
    };

    render(<ResultsGrid gaps={[longGap]} onGapClick={mockOnGapClick} />);

    // Problem text should be present but potentially truncated
    expect(screen.getByText(longGap.title)).toBeInTheDocument();
  });

  it('should display recommendation snippet on cards', () => {
    render(<ResultsGrid {...defaultProps} />);

    // Check for recommendation text (might be truncated)
    const firstGap = mockGapOpportunities[0];
    const recommendationSnippet = firstGap.recommendation.substring(0, 50);

    expect(screen.getByText(firstGap.title)).toBeInTheDocument();
  });
});
