/**
 * Unified Demand Score Calculator
 * Feature: UDS-004
 *
 * Combines 5 signals into a weighted demand score:
 * - Pain Score (Reddit): 25%
 * - Spend Score (Meta Ads): 25%
 * - Search Score (Google Trends): 20%
 * - Content Score (YouTube): 15%
 * - App Score (App Stores): 15%
 *
 * Formula: (pain * 0.25) + (spend * 0.25) + (search * 0.20) + (content * 0.15) + (app * 0.15)
 */

export interface SignalScores {
  pain_score: number;      // Reddit pain points (0-100)
  spend_score: number;     // Meta ad spend signals (0-100)
  search_score: number;    // Google search demand (0-100)
  content_score: number;   // YouTube content gaps (0-100)
  app_score: number;       // App Store signals (0-100)
}

export interface SignalBreakdown {
  value: number;        // Original score (0-100)
  weight: number;       // Signal weight (0.0-1.0)
  contribution: number; // Weighted contribution to final score
}

export interface UnifiedDemandResult {
  unified_score: number; // Final weighted score (0-100)
  breakdown: {
    pain_score: SignalBreakdown;
    spend_score: SignalBreakdown;
    search_score: SignalBreakdown;
    content_score: SignalBreakdown;
    app_score: SignalBreakdown;
  };
}

export const WEIGHTS = {
  pain: 0.25,
  spend: 0.25,
  search: 0.20,
  content: 0.15,
  app: 0.15,
} as const;

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate unified demand score from 5 signals
 * Returns rounded score (0-100) with breakdown
 */
export function calculateUnifiedDemandScore(scores: SignalScores): UnifiedDemandResult {
  // Clamp all input scores to 0-100 range
  const clampedScores = {
    pain_score: clamp(scores.pain_score, 0, 100),
    spend_score: clamp(scores.spend_score, 0, 100),
    search_score: clamp(scores.search_score, 0, 100),
    content_score: clamp(scores.content_score, 0, 100),
    app_score: clamp(scores.app_score, 0, 100),
  };

  // Calculate weighted contributions
  const painContribution = clampedScores.pain_score * WEIGHTS.pain;
  const spendContribution = clampedScores.spend_score * WEIGHTS.spend;
  const searchContribution = clampedScores.search_score * WEIGHTS.search;
  const contentContribution = clampedScores.content_score * WEIGHTS.content;
  const appContribution = clampedScores.app_score * WEIGHTS.app;

  // Calculate final unified score
  const unifiedScore =
    painContribution +
    spendContribution +
    searchContribution +
    contentContribution +
    appContribution;

  return {
    unified_score: Math.round(unifiedScore),
    breakdown: {
      pain_score: {
        value: clampedScores.pain_score,
        weight: WEIGHTS.pain,
        contribution: painContribution,
      },
      spend_score: {
        value: clampedScores.spend_score,
        weight: WEIGHTS.spend,
        contribution: spendContribution,
      },
      search_score: {
        value: clampedScores.search_score,
        weight: WEIGHTS.search,
        contribution: searchContribution,
      },
      content_score: {
        value: clampedScores.content_score,
        weight: WEIGHTS.content,
        contribution: contentContribution,
      },
      app_score: {
        value: clampedScores.app_score,
        weight: WEIGHTS.app,
        contribution: appContribution,
      },
    },
  };
}
