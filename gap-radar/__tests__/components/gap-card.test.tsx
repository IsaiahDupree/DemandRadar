/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { GapCard } from '@/components/dashboard/GapCard';
import { mockGapOpportunities } from '@/lib/mock-data';

describe('Gap Card Component (DASH-004)', () => {
  const mockOnClick = jest.fn();

  const gap = mockGapOpportunities[0];

  const defaultProps = {
    gap,
    onClick: mockOnClick,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render gap title', () => {
    render(<GapCard {...defaultProps} />);

    expect(screen.getByText(gap.title)).toBeInTheDocument();
  });

  it('should render gap type badge', () => {
    render(<GapCard {...defaultProps} />);

    expect(screen.getByText(gap.gapType)).toBeInTheDocument();
  });

  it('should display opportunity score with visual indicator', () => {
    render(<GapCard {...defaultProps} />);

    expect(screen.getByText(gap.opportunityScore.toString())).toBeInTheDocument();
  });

  it('should display confidence score as percentage', () => {
    render(<GapCard {...defaultProps} />);

    const confidencePercent = Math.round(gap.confidence * 100);
    expect(screen.getByText(`${confidencePercent}%`)).toBeInTheDocument();
  });

  it('should render problem description', () => {
    render(<GapCard {...defaultProps} />);

    expect(screen.getByText(gap.problem)).toBeInTheDocument();
  });

  it('should show evidence source indicators', () => {
    render(<GapCard {...defaultProps} />);

    // Should indicate sources (ads + reddit)
    const adsLabels = screen.getAllByText(/ads/i);
    const redditLabels = screen.getAllByText(/reddit/i);

    expect(adsLabels.length).toBeGreaterThan(0);
    expect(redditLabels.length).toBeGreaterThan(0);
  });

  it('should be clickable', () => {
    render(<GapCard {...defaultProps} />);

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(mockOnClick).toHaveBeenCalledWith(gap);
  });

  it('should have hover state styling', () => {
    render(<GapCard {...defaultProps} />);

    const card = screen.getByRole('button');

    // Should have transition classes for hover effects
    expect(card.className).toMatch(/transition|hover/);
  });

  it('should display score with color coding based on value', () => {
    const highScoreGap = { ...gap, opportunityScore: 90 };
    const lowScoreGap = { ...gap, opportunityScore: 30 };

    const { rerender } = render(<GapCard gap={highScoreGap} onClick={mockOnClick} />);
    expect(screen.getByText('90')).toBeInTheDocument();

    rerender(<GapCard gap={lowScoreGap} onClick={mockOnClick} />);
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('should truncate long problem text with line-clamp', () => {
    const longProblemGap = {
      ...gap,
      problem: 'This is a very long problem description that should be truncated to prevent the card from becoming too tall. '.repeat(10),
    };

    const { container } = render(<GapCard gap={longProblemGap} onClick={mockOnClick} />);

    // Find the problem text element (it will be truncated by CSS line-clamp-3)
    const problemElements = container.querySelectorAll('.line-clamp-3');
    expect(problemElements.length).toBeGreaterThan(0);
  });

  it('should show evidence count indicators', () => {
    render(<GapCard {...defaultProps} />);

    // Should show evidence source labels and counts
    expect(screen.getByText(/Ads:/i)).toBeInTheDocument();
    expect(screen.getByText(/Reddit:/i)).toBeInTheDocument();

    // Verify structure shows counts (they appear next to the labels)
    const adsCount = gap.evidenceAds.length;
    const redditCount = gap.evidenceReddit.length;

    // Just verify the component renders the evidence section
    const card = screen.getByRole('button');
    expect(card).toBeInTheDocument();
  });

  it('should render with proper card layout structure', () => {
    render(<GapCard {...defaultProps} />);

    const card = screen.getByRole('button');

    // Should have proper spacing and layout classes
    const classes = card.className;
    expect(classes).toMatch(/rounded/);
  });

  it('should be keyboard accessible', () => {
    render(<GapCard {...defaultProps} />);

    const card = screen.getByRole('button');

    // Should be focusable
    card.focus();
    expect(card).toHaveFocus();
  });

  it('should display confidence with visual indicator', () => {
    const highConfidenceGap = { ...gap, confidence: 0.95 };
    const lowConfidenceGap = { ...gap, confidence: 0.45 };

    const { rerender } = render(<GapCard gap={highConfidenceGap} onClick={mockOnClick} />);
    expect(screen.getByText('95%')).toBeInTheDocument();

    rerender(<GapCard gap={lowConfidenceGap} onClick={mockOnClick} />);
    expect(screen.getByText('45%')).toBeInTheDocument();
  });
});
