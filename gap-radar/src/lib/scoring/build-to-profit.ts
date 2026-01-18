/**
 * Build-to-Profit Score Calculator
 *
 * Ranks product ideas based on the ratio of profit potential to implementation cost.
 *
 * Formula: Score = (Opportunity × TAM_factor × Margin_factor × TimeToValue_factor) / (CAC_proxy × Complexity × Touch_factor)
 *
 * Higher score = better opportunity relative to effort/cost
 */

export interface BuildToProfitInputs {
  opportunity: number;        // 0-100 opportunity score from gap analysis
  tamFactor: number;          // Total addressable market factor (0-1, higher = larger market)
  marginFactor: number;       // Expected margin factor (0-1, higher = better margins)
  timeToValueFactor: number;  // How quickly users get value (0-1, higher = faster value)
  cacProxy: number;           // Customer acquisition cost proxy (0-1, higher = more expensive)
  complexity: number;         // Build complexity (0-1, higher = harder to build)
  touchFactor: number;        // Human touch required (0-1, higher = more human intervention)
}

/**
 * Calculate Build-to-Profit Score
 *
 * This score helps rank product ideas by their profit potential relative to implementation cost.
 *
 * Numerator (value drivers):
 * - Opportunity: Market gap opportunity score
 * - TAM Factor: Size of addressable market
 * - Margin Factor: Expected profit margins
 * - Time to Value: How fast users see value
 *
 * Denominator (cost drivers):
 * - CAC Proxy: Cost to acquire customers
 * - Complexity: Implementation difficulty
 * - Touch Factor: Human intervention needed
 *
 * @param inputs - All factors needed for scoring
 * @returns Score value (unbounded, higher is better)
 */
export function calculateBuildToProfitScore(inputs: BuildToProfitInputs): number {
  const {
    opportunity,
    tamFactor,
    marginFactor,
    timeToValueFactor,
    cacProxy,
    complexity,
    touchFactor,
  } = inputs;

  // Validate inputs are non-negative
  if (
    opportunity < 0 ||
    tamFactor < 0 ||
    marginFactor < 0 ||
    timeToValueFactor < 0 ||
    cacProxy < 0 ||
    complexity < 0 ||
    touchFactor < 0
  ) {
    throw new Error('All Build-to-Profit inputs must be non-negative');
  }

  // Calculate numerator (value)
  const value = opportunity * tamFactor * marginFactor * timeToValueFactor;

  // Calculate denominator (cost)
  // Prevent division by zero with minimum threshold
  const cost = Math.max(cacProxy * complexity * touchFactor, 0.001);

  // Calculate score
  const score = value / cost;

  // Return non-negative score
  return Math.max(score, 0);
}

/**
 * Helper to normalize TAM (Total Addressable Market) to 0-1 factor
 *
 * @param tam - TAM in dollars
 * @param maxTam - Reference max TAM for normalization (default $10B)
 * @returns Normalized factor 0-1
 */
export function normalizeTAM(tam: number, maxTam: number = 10_000_000_000): number {
  if (tam <= 0) return 0;
  return Math.min(tam / maxTam, 1);
}

/**
 * Helper to normalize margin percentage to 0-1 factor
 *
 * @param marginPercent - Margin as percentage (0-100)
 * @returns Normalized factor 0-1
 */
export function normalizeMargin(marginPercent: number): number {
  if (marginPercent <= 0) return 0;
  return Math.min(marginPercent / 100, 1);
}

/**
 * Helper to normalize complexity score to 0-1 factor
 *
 * @param complexityScore - Complexity on 0-10 scale
 * @returns Normalized factor 0-1
 */
export function normalizeComplexity(complexityScore: number): number {
  if (complexityScore <= 0) return 0;
  return Math.min(complexityScore / 10, 1);
}

/**
 * Convert human touch level to factor
 *
 * @param level - 'high' | 'medium' | 'low'
 * @returns Factor 0-1 (high=0.9, medium=0.5, low=0.2)
 */
export function humanTouchToFactor(level: 'high' | 'medium' | 'low'): number {
  const mapping = {
    high: 0.9,
    medium: 0.5,
    low: 0.2,
  };
  return mapping[level];
}

/**
 * Convert time to value estimate to factor
 *
 * @param daysToValue - Estimated days until user sees value
 * @param maxDays - Reference max (default 90 days)
 * @returns Factor 0-1 (faster = higher)
 */
export function timeToValueToFactor(daysToValue: number, maxDays: number = 90): number {
  if (daysToValue <= 0) return 1; // Instant value
  if (daysToValue >= maxDays) return 0.1; // Very slow
  return 1 - (daysToValue / maxDays) * 0.9; // Linear decay, min 0.1
}

/**
 * Rank multiple ideas by Build-to-Profit score
 *
 * @param ideas - Array of ideas with their inputs
 * @returns Sorted array (highest score first)
 */
export function rankIdeasByBuildToProfit(
  ideas: Array<{ id: string; name: string; inputs: BuildToProfitInputs }>
): Array<{ id: string; name: string; score: number; inputs: BuildToProfitInputs }> {
  const scored = ideas.map((idea) => ({
    ...idea,
    score: calculateBuildToProfitScore(idea.inputs),
  }));

  // Sort descending by score
  return scored.sort((a, b) => b.score - a.score);
}
