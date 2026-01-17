/**
 * Demand Score Calculator
 *
 * Calculates a 0-100 demand score based on weekly signals:
 * - Ad Activity (30%): # advertisers × avg creative longevity
 * - Buyer Intent Keywords (25%): Volume of "best", "alternative", "pricing", "vs", "review"
 * - Chatter Velocity (20%): Week-over-week growth rate of mentions
 * - Pain Intensity (15%): Frequency of complaints → purchase triggers
 * - Competitive Heat (10%): # active competitors (inverse - more = lower score)
 */

export interface WeeklySignals {
  ads: {
    advertiserCount: number;
    avgLongevityDays: number;
    topAngles: string[];
    topOffers: string[];
  };
  search: {
    buyerIntentKeywords: {
      keyword: string;
      volume: number;
    }[];
    totalVolume: number;
  };
  mentions: {
    currentWeekCount: number;
    previousWeekCount: number;
    sources: string[];
  };
  forums: {
    complaints: { text: string; frequency: number }[];
    desires: { text: string; frequency: number }[];
    purchaseTriggers: number;
  };
  competitors: {
    activeCompetitors: number;
    pricingChanges: any[];
    featureChanges: any[];
  };
  previousScore?: number;
}

export interface DemandMetrics {
  demandScore: number; // 0-100, main score
  opportunityScore: number; // demand - competitive_heat
  messageMarketFit: number; // how well ads match detected pains
  trend: "up" | "down" | "stable";
  trendDelta: number; // +/- change from last week
}

/**
 * Calculate Ad Activity Score (0-100)
 * Based on number of advertisers and how long they're running ads
 */
function calculateAdActivity(ads: WeeklySignals["ads"]): number {
  const { advertiserCount, avgLongevityDays } = ads;

  // Normalize advertiser count (assume 50+ advertisers = saturated market = 100)
  const advertiserScore = Math.min(advertiserCount / 50, 1) * 100;

  // Normalize longevity (assume 60+ days = stable ads = 100)
  const longevityScore = Math.min(avgLongevityDays / 60, 1) * 100;

  // Weighted average: more weight on advertiser count
  return advertiserScore * 0.7 + longevityScore * 0.3;
}

/**
 * Calculate Buyer Intent Score (0-100)
 * Based on search volume for buyer intent keywords
 */
function calculateBuyerIntent(search: WeeklySignals["search"]): number {
  const { buyerIntentKeywords, totalVolume } = search;

  if (buyerIntentKeywords.length === 0 || totalVolume === 0) {
    return 0;
  }

  // Count high-intent keywords
  const buyerIntentTypes = [
    "best",
    "alternative",
    "pricing",
    "vs",
    "review",
    "compare",
    "cost",
    "price",
  ];

  const buyerIntentCount = buyerIntentKeywords.filter((kw) =>
    buyerIntentTypes.some((type) => kw.keyword.toLowerCase().includes(type))
  ).length;

  // Score based on percentage of buyer intent keywords
  const intentPercentage = buyerIntentCount / buyerIntentKeywords.length;

  // Normalize total volume (assume 10,000+ searches/month = high demand)
  const volumeScore = Math.min(totalVolume / 10000, 1);

  // Combine: higher weight on intent percentage
  return (intentPercentage * 0.6 + volumeScore * 0.4) * 100;
}

/**
 * Calculate Chatter Velocity Score (0-100)
 * Based on week-over-week growth rate
 */
function calculateChatterVelocity(mentions: WeeklySignals["mentions"]): number {
  const { currentWeekCount, previousWeekCount } = mentions;

  if (currentWeekCount === 0) {
    return 0;
  }

  if (previousWeekCount === 0) {
    // First week, base score on absolute count
    return Math.min(currentWeekCount / 100, 1) * 50; // Max 50 for first week
  }

  // Calculate growth rate
  const growthRate =
    (currentWeekCount - previousWeekCount) / previousWeekCount;

  // Normalize growth rate (-100% to +100% maps to 0-100)
  // Growth of 0% = 50, Growth of +100% = 100, Growth of -100% = 0
  const score = Math.max(0, Math.min(100, (growthRate + 1) * 50));

  return score;
}

/**
 * Calculate Pain Intensity Score (0-100)
 * Based on complaint frequency and purchase triggers
 */
function calculatePainIntensity(forums: WeeklySignals["forums"]): number {
  const { complaints, desires, purchaseTriggers } = forums;

  if (complaints.length === 0 && desires.length === 0) {
    return 0;
  }

  // Calculate total pain points mentioned
  const totalPainMentions = complaints.reduce(
    (sum, c) => sum + c.frequency,
    0
  );

  // Calculate total desire mentions
  const totalDesireMentions = desires.reduce((sum, d) => sum + d.frequency, 0);

  // Normalize pain mentions (assume 100+ = high pain)
  const painScore = Math.min(totalPainMentions / 100, 1) * 100;

  // Normalize desire mentions (assume 100+ = high desire)
  const desireScore = Math.min(totalDesireMentions / 100, 1) * 100;

  // Purchase trigger score (assume 50+ triggers = very high intent)
  const triggerScore = Math.min(purchaseTriggers / 50, 1) * 100;

  // Weighted average: pain + desire + triggers
  return painScore * 0.4 + desireScore * 0.3 + triggerScore * 0.3;
}

/**
 * Calculate Competitive Heat Score (0-100)
 * Higher score = more competition (this will be inverted in final calculation)
 */
function calculateCompetitiveHeat(
  competitors: WeeklySignals["competitors"]
): number {
  const { activeCompetitors } = competitors;

  // Normalize competitor count (assume 50+ competitors = very saturated)
  return Math.min(activeCompetitors / 50, 1) * 100;
}

/**
 * Calculate Message-Market Fit
 * How well do ads align with detected pains/desires?
 */
function calculateMessageFit(
  ads: WeeklySignals["ads"],
  forums: WeeklySignals["forums"]
): number {
  const { topAngles, topOffers } = ads;
  const { complaints, desires } = forums;

  if (topAngles.length === 0 || (complaints.length === 0 && desires.length === 0)) {
    return 50; // Neutral score if not enough data
  }

  // Simple heuristic: count keyword overlaps between ad angles and pain points
  const painKeywords = [
    ...complaints.map((c) => c.text.toLowerCase().split(" ")).flat(),
    ...desires.map((d) => d.text.toLowerCase().split(" ")).flat(),
  ];

  const adKeywords = [
    ...topAngles.map((a) => a.toLowerCase().split(" ")).flat(),
    ...topOffers.map((o) => o.toLowerCase().split(" ")).flat(),
  ];

  // Count overlapping keywords
  const overlaps = adKeywords.filter((keyword) =>
    painKeywords.includes(keyword)
  ).length;

  // Normalize (assume 20+ overlaps = strong alignment)
  return Math.min(overlaps / 20, 1) * 100;
}

/**
 * Determine trend direction
 */
function determineTrend(
  currentScore: number,
  previousScore: number | undefined
): "up" | "down" | "stable" {
  if (previousScore === undefined) {
    return "stable";
  }

  const delta = currentScore - previousScore;

  if (delta > 5) return "up";
  if (delta < -5) return "down";
  return "stable";
}

/**
 * Main function: Calculate Demand Score and companion metrics
 */
export function calculateDemandScore(signals: WeeklySignals): DemandMetrics {
  // Calculate component scores
  const adScore = calculateAdActivity(signals.ads); // 0-100
  const intentScore = calculateBuyerIntent(signals.search); // 0-100
  const velocityScore = calculateChatterVelocity(signals.mentions); // 0-100
  const painScore = calculatePainIntensity(signals.forums); // 0-100
  const heatScore = calculateCompetitiveHeat(signals.competitors); // 0-100

  // Weighted demand score
  const demandScore = Math.round(
    adScore * 0.3 +
      intentScore * 0.25 +
      velocityScore * 0.2 +
      painScore * 0.15 +
      (100 - heatScore) * 0.1 // Invert: less competition = higher score
  );

  // Opportunity score: demand minus competitive pressure
  const opportunityScore = Math.round(
    Math.max(0, demandScore - heatScore * 0.5)
  );

  // Message-market fit
  const messageMarketFit = Math.round(
    calculateMessageFit(signals.ads, signals.forums)
  );

  // Trend and delta
  const previousScore = signals.previousScore || demandScore;
  const trend = determineTrend(demandScore, signals.previousScore);
  const trendDelta = demandScore - previousScore;

  return {
    demandScore,
    opportunityScore,
    messageMarketFit,
    trend,
    trendDelta,
  };
}

/**
 * Generate mock signals for testing
 */
export function generateMockSignals(): WeeklySignals {
  return {
    ads: {
      advertiserCount: 25,
      avgLongevityDays: 45,
      topAngles: [
        "Remove watermarks instantly",
        "No quality loss exports",
        "Batch processing included",
      ],
      topOffers: ["Free trial", "50% off first month", "Money-back guarantee"],
    },
    search: {
      buyerIntentKeywords: [
        { keyword: "best logo maker", volume: 5000 },
        { keyword: "canva alternative", volume: 3000 },
        { keyword: "logo design pricing", volume: 2000 },
        { keyword: "logo maker review", volume: 1500 },
      ],
      totalVolume: 11500,
    },
    mentions: {
      currentWeekCount: 120,
      previousWeekCount: 100,
      sources: ["reddit", "twitter", "forums"],
    },
    forums: {
      complaints: [
        { text: "too expensive", frequency: 45 },
        { text: "slow rendering", frequency: 30 },
        { text: "limited templates", frequency: 25 },
      ],
      desires: [
        { text: "batch processing", frequency: 60 },
        { text: "custom fonts", frequency: 40 },
        { text: "export to svg", frequency: 35 },
      ],
      purchaseTriggers: 35,
    },
    competitors: {
      activeCompetitors: 18,
      pricingChanges: [{ competitor: "Competitor1", change: -20 }],
      featureChanges: [],
    },
    previousScore: 65,
  };
}
