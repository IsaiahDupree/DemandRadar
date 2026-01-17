/**
 * Subscription Tier Limits
 *
 * Centralized configuration and enforcement for subscription tier limits
 */

export type SubscriptionTier = "free" | "starter" | "builder" | "agency" | "studio";

export interface TierLimits {
  // Core features
  analysisRuns: number; // Monthly analysis runs
  niches: number; // Tracked niches for Demand Brief

  // Data sources
  metaAdsEnabled: boolean;
  googleAdsEnabled: boolean;
  redditEnabled: boolean;
  appStoreEnabled: boolean;
  ugcEnabled: boolean;

  // Reports
  pdfExport: boolean;
  csvExport: boolean;
  jsonExport: boolean;
  shareReports: boolean;
  whiteLabel: boolean;

  // API access
  apiAccess: boolean;
  apiRateLimit: number; // Requests per hour

  // Alerts & notifications
  demandAlerts: boolean;
  competitorAlerts: boolean;
  trendAlerts: boolean;

  // Support
  support: "community" | "email" | "priority" | "dedicated";
}

/**
 * Tier configuration mapping
 */
export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    analysisRuns: 1, // 1 free trial run
    niches: 0, // No Demand Brief access
    metaAdsEnabled: true,
    googleAdsEnabled: false,
    redditEnabled: true,
    appStoreEnabled: true,
    ugcEnabled: false,
    pdfExport: false,
    csvExport: false,
    jsonExport: false,
    shareReports: false,
    whiteLabel: false,
    apiAccess: false,
    apiRateLimit: 0,
    demandAlerts: false,
    competitorAlerts: false,
    trendAlerts: false,
    support: "community",
  },

  starter: {
    analysisRuns: 5, // 5 runs per month
    niches: 1, // Track 1 niche
    metaAdsEnabled: true,
    googleAdsEnabled: true,
    redditEnabled: true,
    appStoreEnabled: true,
    ugcEnabled: true,
    pdfExport: true,
    csvExport: true,
    jsonExport: false,
    shareReports: false,
    whiteLabel: false,
    apiAccess: false,
    apiRateLimit: 0,
    demandAlerts: false,
    competitorAlerts: false,
    trendAlerts: false,
    support: "email",
  },

  builder: {
    analysisRuns: 15, // 15 runs per month
    niches: 3, // Track 3 niches
    metaAdsEnabled: true,
    googleAdsEnabled: true,
    redditEnabled: true,
    appStoreEnabled: true,
    ugcEnabled: true,
    pdfExport: true,
    csvExport: true,
    jsonExport: true,
    shareReports: true,
    whiteLabel: false,
    apiAccess: false,
    apiRateLimit: 0,
    demandAlerts: true,
    competitorAlerts: true,
    trendAlerts: true,
    support: "email",
  },

  agency: {
    analysisRuns: 50, // 50 runs per month
    niches: 10, // Track 10 niches
    metaAdsEnabled: true,
    googleAdsEnabled: true,
    redditEnabled: true,
    appStoreEnabled: true,
    ugcEnabled: true,
    pdfExport: true,
    csvExport: true,
    jsonExport: true,
    shareReports: true,
    whiteLabel: false,
    apiAccess: true,
    apiRateLimit: 100, // 100 requests/hour
    demandAlerts: true,
    competitorAlerts: true,
    trendAlerts: true,
    support: "priority",
  },

  studio: {
    analysisRuns: 200, // 200 runs per month
    niches: 25, // Track 25 niches
    metaAdsEnabled: true,
    googleAdsEnabled: true,
    redditEnabled: true,
    appStoreEnabled: true,
    ugcEnabled: true,
    pdfExport: true,
    csvExport: true,
    jsonExport: true,
    shareReports: true,
    whiteLabel: true,
    apiAccess: true,
    apiRateLimit: 500, // 500 requests/hour
    demandAlerts: true,
    competitorAlerts: true,
    trendAlerts: true,
    support: "dedicated",
  },
};

/**
 * Get limits for a specific tier
 */
export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return TIER_LIMITS[tier];
}

/**
 * Check if a feature is available for a tier
 */
export function canUseFeature(
  tier: SubscriptionTier,
  feature: keyof TierLimits
): boolean {
  const limits = getTierLimits(tier);
  const value = limits[feature];

  // For boolean features, return the value directly
  if (typeof value === "boolean") {
    return value;
  }

  // For numeric features, check if > 0
  if (typeof value === "number") {
    return value > 0;
  }

  // For other features, return true if not empty/null
  return !!value;
}

/**
 * Get friendly tier name
 */
export function getTierName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    free: "Free Trial",
    starter: "Starter",
    builder: "Builder",
    agency: "Agency",
    studio: "Studio",
  };
  return names[tier];
}

/**
 * Get tier pricing (monthly)
 */
export function getTierPrice(tier: SubscriptionTier): number {
  const prices: Record<SubscriptionTier, number> = {
    free: 0,
    starter: 29,
    builder: 79,
    agency: 199,
    studio: 499,
  };
  return prices[tier];
}

/**
 * Check if usage is within limits
 */
export interface UsageCheck {
  allowed: boolean;
  limit: number;
  current: number;
  message?: string;
}

export function checkAnalysisRunLimit(
  tier: SubscriptionTier,
  currentRuns: number
): UsageCheck {
  const limits = getTierLimits(tier);
  const allowed = currentRuns < limits.analysisRuns;

  return {
    allowed,
    limit: limits.analysisRuns,
    current: currentRuns,
    message: allowed
      ? undefined
      : `You've reached your limit of ${limits.analysisRuns} analysis runs this month. Upgrade to increase your limit.`,
  };
}

export function checkNicheLimit(
  tier: SubscriptionTier,
  currentNiches: number
): UsageCheck {
  const limits = getTierLimits(tier);
  const allowed = currentNiches < limits.niches;

  return {
    allowed,
    limit: limits.niches,
    current: currentNiches,
    message: allowed
      ? undefined
      : `You've reached your limit of ${limits.niches} tracked niche${
          limits.niches !== 1 ? "s" : ""
        }. Upgrade to track more niches.`,
  };
}

/**
 * Get upgrade suggestion based on current tier
 */
export function getUpgradeSuggestion(
  currentTier: SubscriptionTier
): { tier: SubscriptionTier; reason: string } | null {
  switch (currentTier) {
    case "free":
      return {
        tier: "starter",
        reason: "Get 5 monthly runs, PDF exports, and weekly Demand Briefs",
      };
    case "starter":
      return {
        tier: "builder",
        reason: "Track 3 niches, get alerts, and unlock all data sources",
      };
    case "builder":
      return {
        tier: "agency",
        reason: "50 monthly runs, API access, and track up to 10 niches",
      };
    case "agency":
      return {
        tier: "studio",
        reason: "White-label reports, 200 runs, and dedicated support",
      };
    case "studio":
      return null; // Already on highest tier
  }
}

/**
 * Compare tiers (returns positive if tier1 > tier2)
 */
export function compareTiers(
  tier1: SubscriptionTier,
  tier2: SubscriptionTier
): number {
  const order: SubscriptionTier[] = ["free", "starter", "builder", "agency", "studio"];
  return order.indexOf(tier1) - order.indexOf(tier2);
}

/**
 * Check if tier1 is higher than or equal to tier2
 */
export function isTierAtLeast(
  currentTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): boolean {
  return compareTiers(currentTier, requiredTier) >= 0;
}
