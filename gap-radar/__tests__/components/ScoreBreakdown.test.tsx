/**
 * Tests for Score Breakdown UI Component
 * Feature: UDS-005
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ScoreBreakdown } from '@/components/ScoreBreakdown';
import type { UnifiedDemandResult } from '@/lib/scoring/unified-score';

describe('ScoreBreakdown', () => {
  const mockResult: UnifiedDemandResult = {
    unified_score: 63,
    breakdown: {
      pain_score: {
        value: 80,
        weight: 0.25,
        contribution: 20,
      },
      spend_score: {
        value: 70,
        weight: 0.25,
        contribution: 17.5,
      },
      search_score: {
        value: 60,
        weight: 0.20,
        contribution: 12,
      },
      content_score: {
        value: 50,
        weight: 0.15,
        contribution: 7.5,
      },
      app_score: {
        value: 40,
        weight: 0.15,
        contribution: 6,
      },
    },
  };

  it('should render unified score', () => {
    render(<ScoreBreakdown result={mockResult} />);

    expect(screen.getByText(/Demand Score/i)).toBeInTheDocument();
    expect(screen.getByText('63')).toBeInTheDocument();
  });

  it('should display all 5 signal names', () => {
    render(<ScoreBreakdown result={mockResult} />);

    expect(screen.getByText(/Pain Points/i)).toBeInTheDocument();
    expect(screen.getByText(/Ad Spend/i)).toBeInTheDocument();
    expect(screen.getByText(/Search Demand/i)).toBeInTheDocument();
    expect(screen.getByText(/Content Gaps/i)).toBeInTheDocument();
    expect(screen.getByText(/App Market/i)).toBeInTheDocument();
  });

  it('should display signal values', () => {
    render(<ScoreBreakdown result={mockResult} />);

    expect(screen.getByText('80')).toBeInTheDocument(); // Pain score
    expect(screen.getByText('70')).toBeInTheDocument(); // Spend score
    expect(screen.getByText('60')).toBeInTheDocument(); // Search score
    expect(screen.getByText('50')).toBeInTheDocument(); // Content score
    expect(screen.getByText('40')).toBeInTheDocument(); // App score
  });

  it('should display signal weights', () => {
    render(<ScoreBreakdown result={mockResult} />);

    // Check for weight percentages (25%, 20%, 15%)
    const weights = screen.getAllByText(/25%|20%|15%/);
    expect(weights.length).toBeGreaterThan(0);
  });

  it('should render progress bars for each signal', () => {
    const { container } = render(<ScoreBreakdown result={mockResult} />);

    // Look for progress bar elements or data attributes
    const progressBars = container.querySelectorAll('[role="progressbar"]');
    expect(progressBars.length).toBe(5);
  });

  it('should handle zero scores', () => {
    const zeroResult: UnifiedDemandResult = {
      unified_score: 0,
      breakdown: {
        pain_score: { value: 0, weight: 0.25, contribution: 0 },
        spend_score: { value: 0, weight: 0.25, contribution: 0 },
        search_score: { value: 0, weight: 0.20, contribution: 0 },
        content_score: { value: 0, weight: 0.15, contribution: 0 },
        app_score: { value: 0, weight: 0.15, contribution: 0 },
      },
    };

    render(<ScoreBreakdown result={zeroResult} />);

    expect(screen.getByText(/Demand Score/i)).toBeInTheDocument();
    const totalScore = screen.getByText('0/100');
    expect(totalScore).toBeInTheDocument();
  });

  it('should handle perfect scores', () => {
    const perfectResult: UnifiedDemandResult = {
      unified_score: 100,
      breakdown: {
        pain_score: { value: 100, weight: 0.25, contribution: 25 },
        spend_score: { value: 100, weight: 0.25, contribution: 25 },
        search_score: { value: 100, weight: 0.20, contribution: 20 },
        content_score: { value: 100, weight: 0.15, contribution: 15 },
        app_score: { value: 100, weight: 0.15, contribution: 15 },
      },
    };

    render(<ScoreBreakdown result={perfectResult} />);

    expect(screen.getByText(/Demand Score/i)).toBeInTheDocument();
    const totalScore = screen.getByText('100/100');
    expect(totalScore).toBeInTheDocument();
  });
});
