/**
 * Search Score Calculator
 *
 * Calculates demand score from Google Trends data
 * Part of Unified Demand Score (UDS-001)
 *
 * Formula: Volume * 0.4 + Growth Rate * 0.4 + Commercial Intent * 0.2
 */

export interface GoogleTrendsData {
  searchVolume: number;      // Monthly search volume
  growthRate: number;        // Growth rate (0.0 to 2.0+, where 1.0 = 100% growth)
  relatedQueries: string[];  // Related search queries
}

const WEIGHTS = {
  volume: 0.4,
  growth: 0.4,
  intent: 0.2,
};

/**
 * Calculate search score from Google Trends data
 * Returns a score between 0-100
 */
export function calculateSearchScore(data: GoogleTrendsData): number {
  if (data.searchVolume === 0 && data.growthRate === 0) {
    return 0;
  }

  const volumeScore = normalizeVolume(data.searchVolume);
  const growthScore = normalizeGrowth(data.growthRate);
  const intentScore = calculateCommercialIntent(data.relatedQueries);

  const score =
    (volumeScore * WEIGHTS.volume) +
    (growthScore * WEIGHTS.growth) +
    (intentScore * WEIGHTS.intent);

  return Math.round(Math.min(Math.max(score, 0), 100));
}

/**
 * Normalize search volume to 0-100 scale using logarithmic scaling
 * Higher volumes have diminishing returns
 */
export function normalizeVolume(volume: number): number {
  if (volume <= 0) return 0;

  // Log scale: log10(volume) mapped to 0-100
  // 100 searches = ~20, 1000 = ~30, 10k = ~40, 100k = ~50, 1M = ~60
  const logVolume = Math.log10(volume);

  // Map log scale: 2 (100) -> 20, 5 (100k) -> 70, 6 (1M) -> 90
  const normalized = ((logVolume - 2) / 4) * 80 + 20;

  return Math.round(Math.min(Math.max(normalized, 0), 100));
}

/**
 * Normalize growth rate to 0-100 scale
 * 0 = no growth, 1.0 = 100% growth, 2.0+ = very high growth
 */
export function normalizeGrowth(growthRate: number): number {
  if (growthRate < 0) return 0;

  // Linear mapping with cap
  // 0.0 -> 0, 0.5 -> 50, 1.0 -> 80, 2.0+ -> 100
  let score: number;

  if (growthRate <= 1.0) {
    score = growthRate * 80;
  } else {
    // Above 100% growth, scale to 100
    score = 80 + ((growthRate - 1.0) * 20);
  }

  return Math.round(Math.min(score, 100));
}

/**
 * Calculate commercial intent from related queries
 * Higher score = more buying intent
 */
export function calculateCommercialIntent(queries: string[]): number {
  if (queries.length === 0) return 0;

  const commercialKeywords = {
    high: ['buy', 'purchase', 'price', 'pricing', 'cost', 'cheap', 'discount', 'deal'],
    medium: ['best', 'top', 'review', 'vs', 'compare', 'comparison', 'alternative', 'competitor'],
    low: ['what', 'how', 'tutorial', 'guide', 'learn', 'example'],
  };

  let totalScore = 0;

  for (const query of queries) {
    const lowerQuery = query.toLowerCase();
    let queryScore = 20; // Base score for any query

    // Check for high intent keywords
    if (commercialKeywords.high.some(kw => lowerQuery.includes(kw))) {
      queryScore = 80;
    }
    // Check for medium intent keywords
    else if (commercialKeywords.medium.some(kw => lowerQuery.includes(kw))) {
      queryScore = 55;
    }
    // Check for low intent keywords
    else if (commercialKeywords.low.some(kw => lowerQuery.includes(kw))) {
      queryScore = 20;
    }

    totalScore += queryScore;
  }

  // Average and normalize
  const avgScore = totalScore / queries.length;
  return Math.round(Math.min(avgScore, 100));
}
