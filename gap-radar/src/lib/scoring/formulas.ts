/**
 * GapRadar Scoring Formulas
 *
 * Implementation of all scoring formulas from PRD:
 * - Ad Saturation Score (0-100)
 * - Longevity Signal (0-100)
 * - Reddit Dissatisfaction Score (0-100)
 * - Misalignment Score (0-100)
 * - Opportunity Score (0-100)
 * - Confidence Score (0-1)
 */

/**
 * Sigmoid function for score normalization
 * Maps any input to 0-1 range with smooth transition
 */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * log1p function (log(1 + x))
 * Handles zero values gracefully
 */
function log1p(x: number): number {
  return Math.log(1 + Math.max(0, x));
}

/**
 * Clamp function to constrain values to a range
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================================================
// A) Ad Saturation Score (0-100)
// ============================================================================

export interface SaturationInputs {
  uniqueAdvertisers: number;      // A
  totalCreatives: number;          // C
  repetitionIndex: number;         // R (0-1, top_3_angle_share)
}

/**
 * Calculate Ad Saturation Score
 *
 * Formula: saturation = 100 * sigmoid(0.6*log1p(A) + 0.3*log1p(C) + 0.8*R)
 *
 * Where:
 * - A = unique_advertisers
 * - C = total_creatives
 * - R = repetition_index (top_3_angle_share, 0-1)
 *
 * Higher score = more saturated market
 */
export function calculateSaturationScore(inputs: SaturationInputs): number {
  const { uniqueAdvertisers, totalCreatives, repetitionIndex } = inputs;

  const A = uniqueAdvertisers;
  const C = totalCreatives;
  const R = clamp(repetitionIndex, 0, 1);

  const score = 100 * sigmoid(
    0.6 * log1p(A) +
    0.3 * log1p(C) +
    0.8 * R
  );

  return Math.round(score * 10) / 10; // Round to 1 decimal
}

// ============================================================================
// B) Longevity Signal (0-100)
// ============================================================================

export interface LongevityInputs {
  daysRunning: number;
}

/**
 * Calculate Longevity Score
 *
 * Formula: longevity = clamp(100 * log1p(days_running) / log1p(180), 0, 100)
 *
 * Where:
 * - 180 days = normalization window (6 months)
 * - Ads running 180+ days get score of ~100
 *
 * Higher score = longer running ads (proxy for ad performance)
 */
export function calculateLongevityScore(inputs: LongevityInputs): number {
  const { daysRunning } = inputs;

  const score = clamp(
    100 * log1p(daysRunning) / log1p(180),
    0,
    100
  );

  return Math.round(score * 10) / 10;
}

/**
 * Calculate average longevity score for multiple ads
 */
export function calculateAverageLongevity(adsWithDaysRunning: number[]): number {
  if (adsWithDaysRunning.length === 0) return 0;

  const scores = adsWithDaysRunning.map(days =>
    calculateLongevityScore({ daysRunning: days })
  );

  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  return Math.round(avgScore * 10) / 10;
}

// ============================================================================
// C) Reddit Dissatisfaction Score (0-100)
// ============================================================================

export interface DissatisfactionInputs {
  frequency: number;               // F - # mentions in top objection clusters
  intensity: number;               // I - LLM-rated strength (0-1)
  sentimentNegRatio: number;       // S - negative sentiment ratio (0-1)
  weightedScore: number;           // W - sum of upvoted complaints
}

/**
 * Calculate Reddit Dissatisfaction Score
 *
 * Formula: dissatisfaction = 100 * sigmoid(0.5*log1p(F) + 0.7*I + 0.6*S + 0.2*log1p(W))
 *
 * Where:
 * - F = frequency (# mentions in top objection clusters)
 * - I = intensity (LLM-rated strength 0-1)
 * - S = sentiment_neg_ratio (0-1)
 * - W = weighted_score (sum of upvoted complaints)
 *
 * Higher score = more dissatisfaction/pain
 */
export function calculateDissatisfactionScore(inputs: DissatisfactionInputs): number {
  const { frequency, intensity, sentimentNegRatio, weightedScore } = inputs;

  const F = frequency;
  const I = clamp(intensity, 0, 1);
  const S = clamp(sentimentNegRatio, 0, 1);
  const W = weightedScore;

  const score = 100 * sigmoid(
    0.5 * log1p(F) +
    0.7 * I +
    0.6 * S +
    0.2 * log1p(W)
  );

  return Math.round(score * 10) / 10;
}

// ============================================================================
// D) Misalignment Score (0-100)
// ============================================================================

export interface MisalignmentInputs {
  promiseCoverage: number;         // P - how well ads cover user needs (0-1)
  missingFeatureRate: number;      // M - rate of requested features not in ads (0-1)
  trustGap: number;                // T - trust/credibility issues (0-1)
}

/**
 * Calculate Misalignment Score
 *
 * Formula: misalignment = 100 * (0.5*(1 - P) + 0.3*M + 0.2*T)
 *
 * Where:
 * - P = promise_coverage (0-1)
 * - M = missing_feature_rate (0-1)
 * - T = trust_gap (0-1)
 *
 * Higher score = bigger gap between what ads promise and what users want
 */
export function calculateMisalignmentScore(inputs: MisalignmentInputs): number {
  const { promiseCoverage, missingFeatureRate, trustGap } = inputs;

  const P = clamp(promiseCoverage, 0, 1);
  const M = clamp(missingFeatureRate, 0, 1);
  const T = clamp(trustGap, 0, 1);

  const score = 100 * (
    0.5 * (1 - P) +
    0.3 * M +
    0.2 * T
  );

  return Math.round(score * 10) / 10;
}

// ============================================================================
// E) Opportunity Score (0-100)
// ============================================================================

export interface OpportunityInputs {
  longevity: number;               // 0-100
  dissatisfaction: number;         // 0-100
  misalignment: number;            // 0-100
  saturation: number;              // 0-100
}

/**
 * Calculate Opportunity Score
 *
 * Formula: opportunity = 0.35*longevity + 0.35*dissatisfaction + 0.30*misalignment - 0.15*saturation
 *
 * Components:
 * - Longevity (35%): Market is proven (ads running long)
 * - Dissatisfaction (35%): High user pain
 * - Misalignment (30%): Gap between ads and user needs
 * - Saturation (-15%): Less opportunity in saturated markets
 *
 * Higher score = better opportunity
 */
export function calculateOpportunityScore(inputs: OpportunityInputs): number {
  const { longevity, dissatisfaction, misalignment, saturation } = inputs;

  const score =
    0.35 * longevity +
    0.35 * dissatisfaction +
    0.30 * misalignment -
    0.15 * saturation;

  return Math.round(clamp(score, 0, 100) * 10) / 10;
}

// ============================================================================
// F) Confidence Score (0-1)
// ============================================================================

export interface ConfidenceInputs {
  dataSufficiency: number;         // 0-1 (enough data points?)
  crossSourceAlignment: number;    // 0-1 (ads + reddit agree?)
  recency: number;                 // 0-1 (data freshness)
}

/**
 * Calculate Confidence Score
 *
 * Formula: confidence = clamp(0.4*data_sufficiency + 0.4*cross_source + 0.2*recency, 0, 1)
 *
 * Where:
 * - data_sufficiency: Do we have enough data? (0-1)
 * - cross_source_alignment: Do sources agree? (0-1)
 * - recency: Is data recent? (0-1)
 *
 * Higher score = more confident in the analysis
 */
export function calculateConfidenceScore(inputs: ConfidenceInputs): number {
  const { dataSufficiency, crossSourceAlignment, recency } = inputs;

  const score = clamp(
    0.4 * clamp(dataSufficiency, 0, 1) +
    0.4 * clamp(crossSourceAlignment, 0, 1) +
    0.2 * clamp(recency, 0, 1),
    0,
    1
  );

  return Math.round(score * 100) / 100; // Round to 2 decimals
}

// ============================================================================
// Helper: Calculate Data Sufficiency
// ============================================================================

export interface DataSufficiencyInputs {
  adCount: number;
  redditMentionCount: number;
  minAds?: number;
  minReddit?: number;
}

/**
 * Calculate data sufficiency score
 * Based on whether we have enough data for reliable analysis
 */
export function calculateDataSufficiency(inputs: DataSufficiencyInputs): number {
  const {
    adCount,
    redditMentionCount,
    minAds = 30,
    minReddit = 50,
  } = inputs;

  const adSufficiency = Math.min(adCount / minAds, 1);
  const redditSufficiency = Math.min(redditMentionCount / minReddit, 1);

  // Average of both sources
  return (adSufficiency + redditSufficiency) / 2;
}

// ============================================================================
// Helper: Calculate Cross-Source Alignment
// ============================================================================

export interface CrossSourceInputs {
  adAngles: string[];              // Top angles from ads
  redditPains: string[];           // Top pains from Reddit
  overlapThreshold?: number;       // Min word overlap to consider aligned
}

/**
 * Calculate cross-source alignment
 * How well do ads address the pains mentioned on Reddit?
 */
export function calculateCrossSourceAlignment(inputs: CrossSourceInputs): number {
  const { adAngles, redditPains, overlapThreshold = 2 } = inputs;

  if (adAngles.length === 0 || redditPains.length === 0) {
    return 0.5; // Neutral if missing data
  }

  // Convert to word sets
  const adWords = new Set(
    adAngles.flatMap(a => a.toLowerCase().split(/\s+/))
  );
  const painWords = new Set(
    redditPains.flatMap(p => p.toLowerCase().split(/\s+/))
  );

  // Count overlapping words
  const overlap = [...adWords].filter(w => painWords.has(w)).length;

  // Normalize by total unique words
  const totalWords = new Set([...adWords, ...painWords]).size;

  if (totalWords === 0) return 0.5;

  const alignmentRatio = overlap / totalWords;

  // Scale to 0-1
  return clamp(alignmentRatio * 5, 0, 1); // Multiply to make it more sensitive
}

// ============================================================================
// Helper: Calculate Recency Score
// ============================================================================

export interface RecencyInputs {
  oldestDataDate: Date;
  newestDataDate: Date;
  maxAgeDays?: number;
}

/**
 * Calculate recency score
 * More recent data = higher score
 */
export function calculateRecency(inputs: RecencyInputs): number {
  const { oldestDataDate, newestDataDate, maxAgeDays = 90 } = inputs;

  const now = new Date();
  const avgDate = new Date(
    (oldestDataDate.getTime() + newestDataDate.getTime()) / 2
  );

  const avgAgeDays = (now.getTime() - avgDate.getTime()) / (1000 * 60 * 60 * 24);

  // Score decreases linearly as data gets older
  // Data from today = 1.0, data from maxAgeDays ago = 0
  return clamp(1 - (avgAgeDays / maxAgeDays), 0, 1);
}

// ============================================================================
// Complete Run Scoring
// ============================================================================

export interface RunData {
  // Ad data
  ads: {
    count: number;
    uniqueAdvertisers: number;
    totalCreatives: number;
    topAngles: string[];
    daysRunning: number[]; // For each ad
    repetitionIndex: number; // 0-1
  };

  // Reddit data
  reddit: {
    count: number;
    topPains: string[];
    painFrequency: number;
    painIntensity: number; // 0-1 from LLM
    negSentimentRatio: number; // 0-1
    weightedScore: number;
  };

  // Gap analysis
  gaps: {
    promiseCoverage: number; // 0-1
    missingFeatureRate: number; // 0-1
    trustGap: number; // 0-1
  };

  // Metadata
  meta: {
    oldestDataDate: Date;
    newestDataDate: Date;
  };
}

export interface RunScores {
  saturation: number;
  longevity: number;
  dissatisfaction: number;
  misalignment: number;
  opportunity: number;
  confidence: number;
}

/**
 * Calculate all scores for a run
 */
export function calculateRunScores(data: RunData): RunScores {
  // A) Saturation
  const saturation = calculateSaturationScore({
    uniqueAdvertisers: data.ads.uniqueAdvertisers,
    totalCreatives: data.ads.totalCreatives,
    repetitionIndex: data.ads.repetitionIndex,
  });

  // B) Longevity
  const longevity = calculateAverageLongevity(data.ads.daysRunning);

  // C) Dissatisfaction
  const dissatisfaction = calculateDissatisfactionScore({
    frequency: data.reddit.painFrequency,
    intensity: data.reddit.painIntensity,
    sentimentNegRatio: data.reddit.negSentimentRatio,
    weightedScore: data.reddit.weightedScore,
  });

  // D) Misalignment
  const misalignment = calculateMisalignmentScore({
    promiseCoverage: data.gaps.promiseCoverage,
    missingFeatureRate: data.gaps.missingFeatureRate,
    trustGap: data.gaps.trustGap,
  });

  // E) Opportunity
  const opportunity = calculateOpportunityScore({
    longevity,
    dissatisfaction,
    misalignment,
    saturation,
  });

  // F) Confidence
  const dataSufficiency = calculateDataSufficiency({
    adCount: data.ads.count,
    redditMentionCount: data.reddit.count,
  });

  const crossSourceAlignment = calculateCrossSourceAlignment({
    adAngles: data.ads.topAngles,
    redditPains: data.reddit.topPains,
  });

  const recency = calculateRecency({
    oldestDataDate: data.meta.oldestDataDate,
    newestDataDate: data.meta.newestDataDate,
  });

  const confidence = calculateConfidenceScore({
    dataSufficiency,
    crossSourceAlignment,
    recency,
  });

  return {
    saturation,
    longevity,
    dissatisfaction,
    misalignment,
    opportunity,
    confidence,
  };
}
