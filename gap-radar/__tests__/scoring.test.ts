/**
 * Scoring Formula Unit Tests
 * Based on PRD scoring specifications
 */

import { describe, it, expect } from '@jest/globals';

// These will be implemented in src/lib/scoring/
// For now, define the expected interfaces

interface SaturationInput {
  uniqueAdvertisers: number;
  totalCreatives: number;
  repetitionIndex: number; // 0-1
}

interface LongevityInput {
  daysRunning: number;
}

interface DissatisfactionInput {
  frequency: number;
  intensity: number; // 0-1
  sentimentNegRatio: number; // 0-1
  weightedScore: number;
}

interface MisalignmentInput {
  promiseCoverage: number; // 0-1
  missingFeatureRate: number; // 0-1
  trustGap: number; // 0-1
}

interface OpportunityInput {
  longevity: number;
  dissatisfaction: number;
  misalignment: number;
  saturation: number;
}

interface ConfidenceInput {
  dataSufficiency: number; // 0-1
  crossSourceAlignment: number; // 0-1
  recency: number; // 0-1
}

// Sigmoid helper
const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));

// Clamp helper
const clamp = (value: number, min: number, max: number): number => 
  Math.max(min, Math.min(max, value));

describe('Ad Saturation Score', () => {
  // Formula: saturation = 100 * sigmoid(0.6*log1p(A) + 0.3*log1p(C) + 0.8*R)
  const calculateSaturation = (input: SaturationInput): number => {
    const { uniqueAdvertisers, totalCreatives, repetitionIndex } = input;
    const score = 0.6 * Math.log1p(uniqueAdvertisers) + 
                  0.3 * Math.log1p(totalCreatives) + 
                  0.8 * repetitionIndex;
    return 100 * sigmoid(score);
  };

  it('returns 0-100 range', () => {
    const score = calculateSaturation({ uniqueAdvertisers: 10, totalCreatives: 50, repetitionIndex: 0.5 });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('increases with more advertisers', () => {
    const low = calculateSaturation({ uniqueAdvertisers: 5, totalCreatives: 50, repetitionIndex: 0.5 });
    const high = calculateSaturation({ uniqueAdvertisers: 100, totalCreatives: 50, repetitionIndex: 0.5 });
    expect(high).toBeGreaterThan(low);
  });

  it('increases with higher repetition index', () => {
    const low = calculateSaturation({ uniqueAdvertisers: 10, totalCreatives: 50, repetitionIndex: 0.1 });
    const high = calculateSaturation({ uniqueAdvertisers: 10, totalCreatives: 50, repetitionIndex: 0.9 });
    expect(high).toBeGreaterThan(low);
  });

  it('handles zero inputs gracefully', () => {
    const score = calculateSaturation({ uniqueAdvertisers: 0, totalCreatives: 0, repetitionIndex: 0 });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(score)).toBe(true);
  });
});

describe('Longevity Signal Score', () => {
  // Formula: longevity = clamp(100 * log1p(days_running) / log1p(180), 0, 100)
  const calculateLongevity = (input: LongevityInput): number => {
    const { daysRunning } = input;
    return clamp(100 * Math.log1p(daysRunning) / Math.log1p(180), 0, 100);
  };

  it('returns 0-100 range', () => {
    const score = calculateLongevity({ daysRunning: 90 });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('returns 0 for 0 days', () => {
    const score = calculateLongevity({ daysRunning: 0 });
    expect(score).toBe(0);
  });

  it('approaches 100 at 180 days', () => {
    const score = calculateLongevity({ daysRunning: 180 });
    expect(score).toBeCloseTo(100, 0);
  });

  it('caps at 100 for very long running ads', () => {
    const score = calculateLongevity({ daysRunning: 365 });
    expect(score).toBeLessThanOrEqual(100);
  });

  it('increases with more days', () => {
    const low = calculateLongevity({ daysRunning: 30 });
    const high = calculateLongevity({ daysRunning: 120 });
    expect(high).toBeGreaterThan(low);
  });
});

describe('Reddit Dissatisfaction Score', () => {
  // Formula: dissatisfaction = 100 * sigmoid(0.5*log1p(F) + 0.7*I + 0.6*S + 0.2*log1p(W))
  const calculateDissatisfaction = (input: DissatisfactionInput): number => {
    const { frequency, intensity, sentimentNegRatio, weightedScore } = input;
    const score = 0.5 * Math.log1p(frequency) + 
                  0.7 * intensity + 
                  0.6 * sentimentNegRatio + 
                  0.2 * Math.log1p(weightedScore);
    return 100 * sigmoid(score);
  };

  it('returns 0-100 range', () => {
    const score = calculateDissatisfaction({ 
      frequency: 50, 
      intensity: 0.7, 
      sentimentNegRatio: 0.6, 
      weightedScore: 1000 
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('increases with higher intensity', () => {
    const low = calculateDissatisfaction({ frequency: 50, intensity: 0.2, sentimentNegRatio: 0.5, weightedScore: 500 });
    const high = calculateDissatisfaction({ frequency: 50, intensity: 0.9, sentimentNegRatio: 0.5, weightedScore: 500 });
    expect(high).toBeGreaterThan(low);
  });

  it('increases with more negative sentiment', () => {
    const low = calculateDissatisfaction({ frequency: 50, intensity: 0.5, sentimentNegRatio: 0.1, weightedScore: 500 });
    const high = calculateDissatisfaction({ frequency: 50, intensity: 0.5, sentimentNegRatio: 0.9, weightedScore: 500 });
    expect(high).toBeGreaterThan(low);
  });
});

describe('Misalignment Score', () => {
  // Formula: misalignment = 100 * (0.5*(1 - P) + 0.3*M + 0.2*T)
  const calculateMisalignment = (input: MisalignmentInput): number => {
    const { promiseCoverage, missingFeatureRate, trustGap } = input;
    return 100 * (0.5 * (1 - promiseCoverage) + 0.3 * missingFeatureRate + 0.2 * trustGap);
  };

  it('returns 0-100 range', () => {
    const score = calculateMisalignment({ promiseCoverage: 0.5, missingFeatureRate: 0.5, trustGap: 0.5 });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('returns 0 when everything aligns', () => {
    const score = calculateMisalignment({ promiseCoverage: 1, missingFeatureRate: 0, trustGap: 0 });
    expect(score).toBe(0);
  });

  it('returns max when nothing aligns', () => {
    const score = calculateMisalignment({ promiseCoverage: 0, missingFeatureRate: 1, trustGap: 1 });
    expect(score).toBe(100);
  });

  it('decreases with better promise coverage', () => {
    const high = calculateMisalignment({ promiseCoverage: 0.2, missingFeatureRate: 0.5, trustGap: 0.5 });
    const low = calculateMisalignment({ promiseCoverage: 0.8, missingFeatureRate: 0.5, trustGap: 0.5 });
    expect(high).toBeGreaterThan(low);
  });
});

describe('Opportunity Score', () => {
  // Formula: opportunity = 0.35*longevity + 0.35*dissatisfaction + 0.30*misalignment
  // opportunity_adj = opportunity - 0.15*saturation
  const calculateOpportunity = (input: OpportunityInput): number => {
    const { longevity, dissatisfaction, misalignment, saturation } = input;
    const base = 0.35 * longevity + 0.35 * dissatisfaction + 0.30 * misalignment;
    return base - 0.15 * saturation;
  };

  it('combines all factors correctly', () => {
    const score = calculateOpportunity({ 
      longevity: 80, 
      dissatisfaction: 70, 
      misalignment: 60, 
      saturation: 40 
    });
    
    const expected = 0.35 * 80 + 0.35 * 70 + 0.30 * 60 - 0.15 * 40;
    expect(score).toBeCloseTo(expected, 2);
  });

  it('decreases with higher saturation', () => {
    const highSat = calculateOpportunity({ longevity: 80, dissatisfaction: 70, misalignment: 60, saturation: 80 });
    const lowSat = calculateOpportunity({ longevity: 80, dissatisfaction: 70, misalignment: 60, saturation: 20 });
    expect(lowSat).toBeGreaterThan(highSat);
  });
});

describe('Confidence Score', () => {
  // Formula: confidence = clamp(0.4*data_sufficiency + 0.4*cross_source_alignment + 0.2*recency, 0, 1)
  const calculateConfidence = (input: ConfidenceInput): number => {
    const { dataSufficiency, crossSourceAlignment, recency } = input;
    return clamp(0.4 * dataSufficiency + 0.4 * crossSourceAlignment + 0.2 * recency, 0, 1);
  };

  it('returns 0-1 range', () => {
    const score = calculateConfidence({ dataSufficiency: 0.8, crossSourceAlignment: 0.7, recency: 0.9 });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('returns max when all factors are 1', () => {
    const score = calculateConfidence({ dataSufficiency: 1, crossSourceAlignment: 1, recency: 1 });
    expect(score).toBe(1);
  });

  it('returns min when all factors are 0', () => {
    const score = calculateConfidence({ dataSufficiency: 0, crossSourceAlignment: 0, recency: 0 });
    expect(score).toBe(0);
  });

  it('weights data sufficiency and alignment equally', () => {
    const onlyData = calculateConfidence({ dataSufficiency: 1, crossSourceAlignment: 0, recency: 0 });
    const onlyAlign = calculateConfidence({ dataSufficiency: 0, crossSourceAlignment: 1, recency: 0 });
    expect(onlyData).toBeCloseTo(onlyAlign, 2);
  });
});

describe('UGC Scoring', () => {
  // Ad-tested: Score = 0.45*Longevity + 0.35*Reach + 0.20*EngagementProxy
  const calculateAdTestedUGC = (longevity: number, reach: number, engagement: number): number => {
    return 0.45 * longevity + 0.35 * reach + 0.20 * engagement;
  };

  // Trend: Score = 0.6*Recency + 0.4*RelevanceToNiche
  const calculateTrendUGC = (recency: number, relevance: number): number => {
    return 0.6 * recency + 0.4 * relevance;
  };

  // Connected: Score = 0.4*SharesRate + 0.3*CommentRate + 0.2*LikeRate + 0.1*ViewVelocity
  const calculateConnectedUGC = (shares: number, comments: number, likes: number, views: number): number => {
    return 0.4 * shares + 0.3 * comments + 0.2 * likes + 0.1 * views;
  };

  it('ad-tested prioritizes longevity', () => {
    const highLongevity = calculateAdTestedUGC(100, 50, 50);
    const lowLongevity = calculateAdTestedUGC(20, 50, 50);
    expect(highLongevity).toBeGreaterThan(lowLongevity);
  });

  it('trend prioritizes recency', () => {
    const highRecency = calculateTrendUGC(100, 50);
    const lowRecency = calculateTrendUGC(20, 50);
    expect(highRecency).toBeGreaterThan(lowRecency);
  });

  it('connected prioritizes shares', () => {
    const highShares = calculateConnectedUGC(100, 50, 50, 50);
    const lowShares = calculateConnectedUGC(20, 50, 50, 50);
    expect(highShares).toBeGreaterThan(lowShares);
  });
});
