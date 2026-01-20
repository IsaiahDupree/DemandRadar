/**
 * Tests for Unified Demand Score Calculator
 * Feature: UDS-004
 */

import {
  calculateUnifiedDemandScore,
  type SignalScores,
  type UnifiedDemandResult,
  WEIGHTS,
} from '@/lib/scoring/unified-score';

describe('calculateUnifiedDemandScore', () => {
  it('should calculate unified score with all 5 signals', () => {
    const scores: SignalScores = {
      pain_score: 80,
      spend_score: 70,
      search_score: 60,
      content_score: 50,
      app_score: 40,
    };

    const result = calculateUnifiedDemandScore(scores);

    // Expected: (80 * 0.25) + (70 * 0.25) + (60 * 0.20) + (50 * 0.15) + (40 * 0.15)
    //         = 20 + 17.5 + 12 + 7.5 + 6 = 63
    expect(result.unified_score).toBe(63);
    expect(result.breakdown.pain_score).toEqual({ value: 80, weight: 0.25, contribution: 20 });
    expect(result.breakdown.spend_score).toEqual({ value: 70, weight: 0.25, contribution: 17.5 });
    expect(result.breakdown.search_score).toEqual({ value: 60, weight: 0.20, contribution: 12 });
    expect(result.breakdown.content_score).toEqual({ value: 50, weight: 0.15, contribution: 7.5 });
    expect(result.breakdown.app_score).toEqual({ value: 40, weight: 0.15, contribution: 6 });
  });

  it('should handle all zeros', () => {
    const scores: SignalScores = {
      pain_score: 0,
      spend_score: 0,
      search_score: 0,
      content_score: 0,
      app_score: 0,
    };

    const result = calculateUnifiedDemandScore(scores);

    expect(result.unified_score).toBe(0);
    expect(result.breakdown.pain_score.contribution).toBe(0);
  });

  it('should handle perfect scores', () => {
    const scores: SignalScores = {
      pain_score: 100,
      spend_score: 100,
      search_score: 100,
      content_score: 100,
      app_score: 100,
    };

    const result = calculateUnifiedDemandScore(scores);

    expect(result.unified_score).toBe(100);
    expect(result.breakdown.pain_score.contribution).toBe(25);
    expect(result.breakdown.spend_score.contribution).toBe(25);
    expect(result.breakdown.search_score.contribution).toBe(20);
    expect(result.breakdown.content_score.contribution).toBe(15);
    expect(result.breakdown.app_score.contribution).toBe(15);
  });

  it('should round to nearest integer', () => {
    const scores: SignalScores = {
      pain_score: 33,
      spend_score: 33,
      search_score: 33,
      content_score: 33,
      app_score: 33,
    };

    const result = calculateUnifiedDemandScore(scores);

    // Expected: (33 * 0.25) + (33 * 0.25) + (33 * 0.20) + (33 * 0.15) + (33 * 0.15)
    //         = 8.25 + 8.25 + 6.6 + 4.95 + 4.95 = 33
    expect(result.unified_score).toBe(33);
  });

  it('should handle partial signals (missing data)', () => {
    const scores: SignalScores = {
      pain_score: 80,
      spend_score: 70,
      search_score: 0, // No Google data
      content_score: 0, // No YouTube data
      app_score: 0, // No App Store data
    };

    const result = calculateUnifiedDemandScore(scores);

    // Expected: (80 * 0.25) + (70 * 0.25) + (0 * 0.20) + (0 * 0.15) + (0 * 0.15)
    //         = 20 + 17.5 = 37.5 = 38 (rounded)
    expect(result.unified_score).toBe(38);
  });

  it('should export correct weights', () => {
    expect(WEIGHTS.pain).toBe(0.25);
    expect(WEIGHTS.spend).toBe(0.25);
    expect(WEIGHTS.search).toBe(0.20);
    expect(WEIGHTS.content).toBe(0.15);
    expect(WEIGHTS.app).toBe(0.15);

    // Weights should sum to 1.0
    const sum = WEIGHTS.pain + WEIGHTS.spend + WEIGHTS.search + WEIGHTS.content + WEIGHTS.app;
    expect(sum).toBe(1.0);
  });

  it('should clamp scores between 0-100', () => {
    const scores: SignalScores = {
      pain_score: 150, // Over 100
      spend_score: -10, // Negative
      search_score: 50,
      content_score: 50,
      app_score: 50,
    };

    const result = calculateUnifiedDemandScore(scores);

    // Should clamp pain_score to 100 and spend_score to 0
    expect(result.breakdown.pain_score.value).toBe(100);
    expect(result.breakdown.spend_score.value).toBe(0);
    expect(result.unified_score).toBeGreaterThanOrEqual(0);
    expect(result.unified_score).toBeLessThanOrEqual(100);
  });
});
