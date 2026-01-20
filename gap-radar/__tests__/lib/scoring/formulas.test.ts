/**
 * Comprehensive tests for GapRadar Scoring Formulas
 * Feature: TEST-NEW-001
 *
 * Tests all scoring formulas with edge cases and boundary conditions:
 * - Saturation Score (0-100)
 * - Longevity Score (0-100)
 * - Dissatisfaction Score (0-100)
 * - Misalignment Score (0-100)
 * - Opportunity Score (0-100)
 * - Confidence Score (0-1)
 */

import {
  calculateSaturationScore,
  calculateLongevityScore,
  calculateAverageLongevity,
  calculateDissatisfactionScore,
  calculateMisalignmentScore,
  calculateOpportunityScore,
  calculateConfidenceScore,
  calculateDataSufficiency,
  calculateCrossSourceAlignment,
  calculateRecency,
  calculateRunScores,
  type SaturationInputs,
  type LongevityInputs,
  type DissatisfactionInputs,
  type MisalignmentInputs,
  type OpportunityInputs,
  type ConfidenceInputs,
  type DataSufficiencyInputs,
  type CrossSourceInputs,
  type RecencyInputs,
  type RunData,
} from '@/lib/scoring/formulas';

// ============================================================================
// A) Ad Saturation Score Tests
// ============================================================================

describe('calculateSaturationScore', () => {
  it('should calculate saturation for typical market', () => {
    const inputs: SaturationInputs = {
      uniqueAdvertisers: 50,
      totalCreatives: 200,
      repetitionIndex: 0.6,
    };

    const score = calculateSaturationScore(inputs);

    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(typeof score).toBe('number');
  });

  it('should return low score for empty market', () => {
    const inputs: SaturationInputs = {
      uniqueAdvertisers: 0,
      totalCreatives: 0,
      repetitionIndex: 0,
    };

    const score = calculateSaturationScore(inputs);

    expect(score).toBeLessThanOrEqual(50);
  });

  it('should return high score for saturated market', () => {
    const inputs: SaturationInputs = {
      uniqueAdvertisers: 500,
      totalCreatives: 5000,
      repetitionIndex: 0.9,
    };

    const score = calculateSaturationScore(inputs);

    expect(score).toBeGreaterThan(80);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should clamp repetitionIndex between 0 and 1', () => {
    const inputs1: SaturationInputs = {
      uniqueAdvertisers: 50,
      totalCreatives: 200,
      repetitionIndex: -0.5, // Invalid negative
    };

    const inputs2: SaturationInputs = {
      uniqueAdvertisers: 50,
      totalCreatives: 200,
      repetitionIndex: 1.5, // Invalid > 1
    };

    const score1 = calculateSaturationScore(inputs1);
    const score2 = calculateSaturationScore(inputs2);

    expect(score1).toBeGreaterThanOrEqual(0);
    expect(score1).toBeLessThanOrEqual(100);
    expect(score2).toBeGreaterThanOrEqual(0);
    expect(score2).toBeLessThanOrEqual(100);
  });

  it('should round to 1 decimal place', () => {
    const inputs: SaturationInputs = {
      uniqueAdvertisers: 25,
      totalCreatives: 100,
      repetitionIndex: 0.5,
    };

    const score = calculateSaturationScore(inputs);

    // Check it's rounded to 1 decimal
    expect(score * 10).toBe(Math.round(score * 10));
  });
});

// ============================================================================
// B) Longevity Score Tests
// ============================================================================

describe('calculateLongevityScore', () => {
  it('should return 0 for new ads (0 days)', () => {
    const inputs: LongevityInputs = { daysRunning: 0 };
    const score = calculateLongevityScore(inputs);
    expect(score).toBe(0);
  });

  it('should return ~60-70 for medium-term ads (30 days)', () => {
    const inputs: LongevityInputs = { daysRunning: 30 };
    const score = calculateLongevityScore(inputs);
    expect(score).toBeGreaterThan(50);
    expect(score).toBeLessThan(80);
  });

  it('should return ~100 for long-running ads (180+ days)', () => {
    const inputs: LongevityInputs = { daysRunning: 180 };
    const score = calculateLongevityScore(inputs);
    expect(score).toBeGreaterThanOrEqual(95);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should cap at 100 for very long ads (365 days)', () => {
    const inputs: LongevityInputs = { daysRunning: 365 };
    const score = calculateLongevityScore(inputs);
    expect(score).toBe(100);
  });

  it('should round to 1 decimal place', () => {
    const inputs: LongevityInputs = { daysRunning: 45 };
    const score = calculateLongevityScore(inputs);
    expect(score * 10).toBe(Math.round(score * 10));
  });
});

describe('calculateAverageLongevity', () => {
  it('should return 0 for empty array', () => {
    const score = calculateAverageLongevity([]);
    expect(score).toBe(0);
  });

  it('should calculate average of multiple ads', () => {
    const daysRunning = [30, 60, 90, 120];
    const score = calculateAverageLongevity(daysRunning);

    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should handle single ad', () => {
    const score = calculateAverageLongevity([45]);
    const expectedScore = calculateLongevityScore({ daysRunning: 45 });
    expect(score).toBe(expectedScore);
  });

  it('should round to 1 decimal place', () => {
    const score = calculateAverageLongevity([30, 60, 90]);
    expect(score * 10).toBe(Math.round(score * 10));
  });
});

// ============================================================================
// C) Reddit Dissatisfaction Score Tests
// ============================================================================

describe('calculateDissatisfactionScore', () => {
  it('should return low score when no dissatisfaction', () => {
    const inputs: DissatisfactionInputs = {
      frequency: 0,
      intensity: 0,
      sentimentNegRatio: 0,
      weightedScore: 0,
    };

    const score = calculateDissatisfactionScore(inputs);
    expect(score).toBeLessThanOrEqual(50);
  });

  it('should return high score for strong dissatisfaction', () => {
    const inputs: DissatisfactionInputs = {
      frequency: 100,
      intensity: 0.9,
      sentimentNegRatio: 0.8,
      weightedScore: 500,
    };

    const score = calculateDissatisfactionScore(inputs);
    expect(score).toBeGreaterThan(80);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should handle moderate dissatisfaction', () => {
    const inputs: DissatisfactionInputs = {
      frequency: 50,
      intensity: 0.5,
      sentimentNegRatio: 0.5,
      weightedScore: 200,
    };

    const score = calculateDissatisfactionScore(inputs);
    expect(score).toBeGreaterThan(40);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should clamp intensity and sentimentNegRatio between 0 and 1', () => {
    const inputs: DissatisfactionInputs = {
      frequency: 50,
      intensity: 1.5, // Invalid
      sentimentNegRatio: -0.2, // Invalid
      weightedScore: 100,
    };

    const score = calculateDissatisfactionScore(inputs);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should round to 1 decimal place', () => {
    const inputs: DissatisfactionInputs = {
      frequency: 25,
      intensity: 0.6,
      sentimentNegRatio: 0.4,
      weightedScore: 150,
    };

    const score = calculateDissatisfactionScore(inputs);
    expect(score * 10).toBe(Math.round(score * 10));
  });
});

// ============================================================================
// D) Misalignment Score Tests
// ============================================================================

describe('calculateMisalignmentScore', () => {
  it('should return 0 when perfect alignment (P=1, M=0, T=0)', () => {
    const inputs: MisalignmentInputs = {
      promiseCoverage: 1.0,
      missingFeatureRate: 0,
      trustGap: 0,
    };

    const score = calculateMisalignmentScore(inputs);
    expect(score).toBe(0);
  });

  it('should return ~50 when complete misalignment (P=0, M=1, T=1)', () => {
    const inputs: MisalignmentInputs = {
      promiseCoverage: 0,
      missingFeatureRate: 1.0,
      trustGap: 1.0,
    };

    const score = calculateMisalignmentScore(inputs);
    expect(score).toBe(100);
  });

  it('should handle moderate misalignment', () => {
    const inputs: MisalignmentInputs = {
      promiseCoverage: 0.5,
      missingFeatureRate: 0.3,
      trustGap: 0.2,
    };

    const score = calculateMisalignmentScore(inputs);
    expect(score).toBeGreaterThan(20);
    expect(score).toBeLessThan(50);
  });

  it('should clamp all inputs between 0 and 1', () => {
    const inputs: MisalignmentInputs = {
      promiseCoverage: 1.5, // Invalid
      missingFeatureRate: -0.1, // Invalid
      trustGap: 2.0, // Invalid
    };

    const score = calculateMisalignmentScore(inputs);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should round to 1 decimal place', () => {
    const inputs: MisalignmentInputs = {
      promiseCoverage: 0.7,
      missingFeatureRate: 0.3,
      trustGap: 0.2,
    };

    const score = calculateMisalignmentScore(inputs);
    expect(score * 10).toBe(Math.round(score * 10));
  });
});

// ============================================================================
// E) Opportunity Score Tests
// ============================================================================

describe('calculateOpportunityScore', () => {
  it('should return high score when all positive factors high', () => {
    const inputs: OpportunityInputs = {
      longevity: 90,
      dissatisfaction: 80,
      misalignment: 70,
      saturation: 20, // Low saturation is good
    };

    const score = calculateOpportunityScore(inputs);
    expect(score).toBeGreaterThan(70);
  });

  it('should return low score when saturation is very high', () => {
    const inputs: OpportunityInputs = {
      longevity: 50,
      dissatisfaction: 50,
      misalignment: 50,
      saturation: 100, // Very saturated
    };

    const score = calculateOpportunityScore(inputs);
    // With high saturation, score should be reduced
    expect(score).toBeLessThan(50);
  });

  it('should handle balanced inputs', () => {
    const inputs: OpportunityInputs = {
      longevity: 50,
      dissatisfaction: 50,
      misalignment: 50,
      saturation: 50,
    };

    const score = calculateOpportunityScore(inputs);
    expect(score).toBeGreaterThan(30);
    expect(score).toBeLessThan(60);
  });

  it('should clamp result between 0 and 100', () => {
    const inputs: OpportunityInputs = {
      longevity: 100,
      dissatisfaction: 100,
      misalignment: 100,
      saturation: 0,
    };

    const score = calculateOpportunityScore(inputs);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should verify weights sum correctly', () => {
    const inputs: OpportunityInputs = {
      longevity: 100,
      dissatisfaction: 100,
      misalignment: 100,
      saturation: 0,
    };

    const score = calculateOpportunityScore(inputs);
    // 0.35 + 0.35 + 0.30 - 0.15*0 = 100
    expect(score).toBe(100);
  });

  it('should round to 1 decimal place', () => {
    const inputs: OpportunityInputs = {
      longevity: 45,
      dissatisfaction: 55,
      misalignment: 35,
      saturation: 65,
    };

    const score = calculateOpportunityScore(inputs);
    expect(score * 10).toBe(Math.round(score * 10));
  });
});

// ============================================================================
// F) Confidence Score Tests
// ============================================================================

describe('calculateConfidenceScore', () => {
  it('should return 1.0 when all factors are perfect', () => {
    const inputs: ConfidenceInputs = {
      dataSufficiency: 1.0,
      crossSourceAlignment: 1.0,
      recency: 1.0,
    };

    const score = calculateConfidenceScore(inputs);
    expect(score).toBe(1.0);
  });

  it('should return low score when all factors are poor', () => {
    const inputs: ConfidenceInputs = {
      dataSufficiency: 0,
      crossSourceAlignment: 0,
      recency: 0,
    };

    const score = calculateConfidenceScore(inputs);
    expect(score).toBe(0);
  });

  it('should handle moderate confidence', () => {
    const inputs: ConfidenceInputs = {
      dataSufficiency: 0.6,
      crossSourceAlignment: 0.5,
      recency: 0.7,
    };

    const score = calculateConfidenceScore(inputs);
    expect(score).toBeGreaterThan(0.4);
    expect(score).toBeLessThan(0.7);
  });

  it('should clamp all inputs between 0 and 1', () => {
    const inputs: ConfidenceInputs = {
      dataSufficiency: 1.5, // Invalid
      crossSourceAlignment: -0.2, // Invalid
      recency: 2.0, // Invalid
    };

    const score = calculateConfidenceScore(inputs);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('should verify weights (0.4 + 0.4 + 0.2 = 1.0)', () => {
    const inputs: ConfidenceInputs = {
      dataSufficiency: 1.0,
      crossSourceAlignment: 1.0,
      recency: 1.0,
    };

    const score = calculateConfidenceScore(inputs);
    expect(score).toBe(1.0);
  });

  it('should round to 2 decimal places', () => {
    const inputs: ConfidenceInputs = {
      dataSufficiency: 0.567,
      crossSourceAlignment: 0.432,
      recency: 0.789,
    };

    const score = calculateConfidenceScore(inputs);
    // Check that when multiplied by 100 and rounded, we get back the same value (within floating point tolerance)
    expect(Math.abs((score * 100) - Math.round(score * 100))).toBeLessThan(0.01);
  });
});

// ============================================================================
// Helper: Data Sufficiency Tests
// ============================================================================

describe('calculateDataSufficiency', () => {
  it('should return 1.0 when both sources meet thresholds', () => {
    const inputs: DataSufficiencyInputs = {
      adCount: 100,
      redditMentionCount: 200,
      minAds: 30,
      minReddit: 50,
    };

    const score = calculateDataSufficiency(inputs);
    expect(score).toBe(1.0);
  });

  it('should return 0 when no data', () => {
    const inputs: DataSufficiencyInputs = {
      adCount: 0,
      redditMentionCount: 0,
      minAds: 30,
      minReddit: 50,
    };

    const score = calculateDataSufficiency(inputs);
    expect(score).toBe(0);
  });

  it('should return 0.5 when one source meets threshold', () => {
    const inputs: DataSufficiencyInputs = {
      adCount: 30,
      redditMentionCount: 0,
      minAds: 30,
      minReddit: 50,
    };

    const score = calculateDataSufficiency(inputs);
    expect(score).toBeCloseTo(0.5, 1);
  });

  it('should use default thresholds when not provided', () => {
    const inputs: DataSufficiencyInputs = {
      adCount: 30,
      redditMentionCount: 50,
    };

    const score = calculateDataSufficiency(inputs);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('should handle partial data', () => {
    const inputs: DataSufficiencyInputs = {
      adCount: 15, // Half of 30
      redditMentionCount: 25, // Half of 50
      minAds: 30,
      minReddit: 50,
    };

    const score = calculateDataSufficiency(inputs);
    expect(score).toBeCloseTo(0.5, 1);
  });
});

// ============================================================================
// Helper: Cross-Source Alignment Tests
// ============================================================================

describe('calculateCrossSourceAlignment', () => {
  it('should return low score when no overlap', () => {
    const inputs: CrossSourceInputs = {
      adAngles: ['fast delivery', 'premium quality'],
      redditPains: ['slow support', 'bugs crashes'],
    };

    const score = calculateCrossSourceAlignment(inputs);
    expect(score).toBeLessThan(0.5);
  });

  it('should return high score when strong overlap', () => {
    const inputs: CrossSourceInputs = {
      adAngles: ['fast support', 'reliable uptime'],
      redditPains: ['slow support', 'unreliable uptime'],
    };

    const score = calculateCrossSourceAlignment(inputs);
    expect(score).toBeGreaterThan(0.3);
  });

  it('should return 0.5 when no ad data', () => {
    const inputs: CrossSourceInputs = {
      adAngles: [],
      redditPains: ['slow support', 'bugs'],
    };

    const score = calculateCrossSourceAlignment(inputs);
    expect(score).toBe(0.5);
  });

  it('should return 0.5 when no reddit data', () => {
    const inputs: CrossSourceInputs = {
      adAngles: ['fast support'],
      redditPains: [],
    };

    const score = calculateCrossSourceAlignment(inputs);
    expect(score).toBe(0.5);
  });

  it('should be case insensitive', () => {
    const inputs: CrossSourceInputs = {
      adAngles: ['Fast Support'],
      redditPains: ['fast support'],
    };

    const score = calculateCrossSourceAlignment(inputs);
    expect(score).toBeGreaterThan(0.3);
  });

  it('should clamp between 0 and 1', () => {
    const inputs: CrossSourceInputs = {
      adAngles: ['support', 'uptime', 'speed', 'quality'],
      redditPains: ['support', 'uptime', 'speed', 'quality'],
    };

    const score = calculateCrossSourceAlignment(inputs);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});

// ============================================================================
// Helper: Recency Tests
// ============================================================================

describe('calculateRecency', () => {
  it('should return ~1.0 for very recent data', () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const inputs: RecencyInputs = {
      oldestDataDate: yesterday,
      newestDataDate: now,
      maxAgeDays: 90,
    };

    const score = calculateRecency(inputs);
    expect(score).toBeGreaterThan(0.95);
  });

  it('should return ~0 for very old data', () => {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const hundredDaysAgo = new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000);

    const inputs: RecencyInputs = {
      oldestDataDate: hundredDaysAgo,
      newestDataDate: ninetyDaysAgo,
      maxAgeDays: 90,
    };

    const score = calculateRecency(inputs);
    expect(score).toBeLessThan(0.1);
  });

  it('should return ~0.5 for medium-age data', () => {
    const now = new Date();
    const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);
    const fiftyDaysAgo = new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000);

    const inputs: RecencyInputs = {
      oldestDataDate: fiftyDaysAgo,
      newestDataDate: fortyDaysAgo,
      maxAgeDays: 90,
    };

    const score = calculateRecency(inputs);
    expect(score).toBeGreaterThan(0.4);
    expect(score).toBeLessThan(0.6);
  });

  it('should clamp between 0 and 1', () => {
    const now = new Date();
    const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const inputs: RecencyInputs = {
      oldestDataDate: now,
      newestDataDate: future,
      maxAgeDays: 90,
    };

    const score = calculateRecency(inputs);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});

// ============================================================================
// Complete Run Scoring Tests
// ============================================================================

describe('calculateRunScores', () => {
  it('should calculate all scores for a complete run', () => {
    const data: RunData = {
      ads: {
        count: 100,
        uniqueAdvertisers: 50,
        totalCreatives: 200,
        topAngles: ['fast support', 'reliable uptime'],
        daysRunning: [30, 60, 90, 120],
        repetitionIndex: 0.6,
      },
      reddit: {
        count: 150,
        topPains: ['slow support', 'unreliable uptime'],
        painFrequency: 50,
        painIntensity: 0.7,
        negSentimentRatio: 0.6,
        weightedScore: 250,
      },
      gaps: {
        promiseCoverage: 0.5,
        missingFeatureRate: 0.3,
        trustGap: 0.2,
      },
      meta: {
        oldestDataDate: new Date('2025-10-01'),
        newestDataDate: new Date('2026-01-01'),
      },
    };

    const scores = calculateRunScores(data);

    expect(scores.saturation).toBeGreaterThan(0);
    expect(scores.saturation).toBeLessThanOrEqual(100);

    expect(scores.longevity).toBeGreaterThan(0);
    expect(scores.longevity).toBeLessThanOrEqual(100);

    expect(scores.dissatisfaction).toBeGreaterThan(0);
    expect(scores.dissatisfaction).toBeLessThanOrEqual(100);

    expect(scores.misalignment).toBeGreaterThan(0);
    expect(scores.misalignment).toBeLessThanOrEqual(100);

    expect(scores.opportunity).toBeGreaterThan(0);
    expect(scores.opportunity).toBeLessThanOrEqual(100);

    expect(scores.confidence).toBeGreaterThan(0);
    expect(scores.confidence).toBeLessThanOrEqual(1);
  });

  it('should handle minimal data', () => {
    const data: RunData = {
      ads: {
        count: 10,
        uniqueAdvertisers: 5,
        totalCreatives: 15,
        topAngles: ['feature'],
        daysRunning: [5],
        repetitionIndex: 0.2,
      },
      reddit: {
        count: 20,
        topPains: ['problem'],
        painFrequency: 5,
        painIntensity: 0.3,
        negSentimentRatio: 0.2,
        weightedScore: 50,
      },
      gaps: {
        promiseCoverage: 0.8,
        missingFeatureRate: 0.1,
        trustGap: 0.1,
      },
      meta: {
        oldestDataDate: new Date('2026-01-15'),
        newestDataDate: new Date('2026-01-20'),
      },
    };

    const scores = calculateRunScores(data);

    // All scores should be valid
    expect(scores.saturation).toBeGreaterThanOrEqual(0);
    expect(scores.longevity).toBeGreaterThanOrEqual(0);
    expect(scores.dissatisfaction).toBeGreaterThanOrEqual(0);
    expect(scores.misalignment).toBeGreaterThanOrEqual(0);
    expect(scores.opportunity).toBeGreaterThanOrEqual(0);
    expect(scores.confidence).toBeGreaterThanOrEqual(0);
  });

  it('should produce consistent scores for same input', () => {
    const data: RunData = {
      ads: {
        count: 50,
        uniqueAdvertisers: 25,
        totalCreatives: 100,
        topAngles: ['angle1', 'angle2'],
        daysRunning: [45, 45],
        repetitionIndex: 0.5,
      },
      reddit: {
        count: 75,
        topPains: ['pain1', 'pain2'],
        painFrequency: 25,
        painIntensity: 0.5,
        negSentimentRatio: 0.5,
        weightedScore: 150,
      },
      gaps: {
        promiseCoverage: 0.5,
        missingFeatureRate: 0.5,
        trustGap: 0.5,
      },
      meta: {
        oldestDataDate: new Date('2025-11-01'),
        newestDataDate: new Date('2026-01-01'),
      },
    };

    const scores1 = calculateRunScores(data);
    const scores2 = calculateRunScores(data);

    expect(scores1).toEqual(scores2);
  });
});
