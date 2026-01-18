/**
 * Demand Brief Subscription Plans Configuration
 *
 * BRIEF-014: Defines subscription tiers (Starter, Builder, Agency)
 * with niche limits, pricing, and features.
 */

export type DemandBriefPlanTier = 'starter' | 'builder' | 'agency';

export interface DemandBriefPlan {
  tier: DemandBriefPlanTier;
  name: string;
  price: number; // Monthly price in USD
  maxNiches: number;
  stripePriceId: string;
  annual: boolean;
  features: string[];
  description: string;
}

/**
 * Demand Brief Subscription Plans
 */
const DEMAND_BRIEF_PLANS: Record<DemandBriefPlanTier, DemandBriefPlan> = {
  starter: {
    tier: 'starter',
    name: 'Starter',
    price: 29,
    maxNiches: 1,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_DEMAND_BRIEF_STARTER_PRICE_ID || 'price_starter_test',
    annual: false,
    features: [
      'Weekly demand briefs',
      '1 tracked niche',
      'Demand score tracking',
      'Market signals (ads, search, forums)',
      'Actionable plays each week',
      'Copy library (hooks, subject lines)',
    ],
    description: 'Perfect for solo founders testing one idea',
  },
  builder: {
    tier: 'builder',
    name: 'Builder',
    price: 79,
    maxNiches: 3,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_DEMAND_BRIEF_BUILDER_PRICE_ID || 'price_builder_test',
    annual: false,
    features: [
      'Weekly demand briefs',
      '3 tracked niches',
      'Demand score tracking',
      'Market signals (ads, search, forums)',
      'Actionable plays each week',
      'Copy library (hooks, subject lines)',
      'Historical trend charts',
      'Competitor monitoring',
    ],
    description: 'For builders testing multiple ideas or products',
  },
  agency: {
    tier: 'agency',
    name: 'Agency',
    price: 249,
    maxNiches: 15,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_DEMAND_BRIEF_AGENCY_PRICE_ID || 'price_agency_test',
    annual: false,
    features: [
      'Weekly demand briefs',
      '10-15 tracked niches',
      'Demand score tracking',
      'Market signals (ads, search, forums)',
      'Actionable plays each week',
      'Copy library (hooks, subject lines)',
      'Historical trend charts',
      'Competitor monitoring',
      'Multi-client support',
      'Priority support',
      'API access',
    ],
    description: 'For agencies managing multiple client niches',
  },
};

/**
 * Gets a demand brief plan by tier
 */
export function getDemandBriefPlan(tier: DemandBriefPlanTier): DemandBriefPlan {
  const plan = DEMAND_BRIEF_PLANS[tier];

  if (!plan) {
    throw new Error(`Invalid plan tier: ${tier}`);
  }

  return plan;
}

/**
 * Gets all available demand brief plans
 */
export function getAllDemandBriefPlans(): DemandBriefPlan[] {
  return [
    DEMAND_BRIEF_PLANS.starter,
    DEMAND_BRIEF_PLANS.builder,
    DEMAND_BRIEF_PLANS.agency,
  ];
}

/**
 * Finds a plan by Stripe price ID
 */
export function getPlanByPriceId(priceId: string): DemandBriefPlan | undefined {
  return getAllDemandBriefPlans().find((plan) => plan.stripePriceId === priceId);
}

/**
 * Result of checking if a niche can be added
 */
export interface CanAddNicheResult {
  allowed: boolean;
  message?: string;
  currentLimit?: number;
  suggestedTier?: DemandBriefPlanTier;
}

/**
 * Checks if a user can add another niche based on their plan tier
 */
export function canAddNiche(
  tier: DemandBriefPlanTier,
  currentNicheCount: number
): CanAddNicheResult {
  const plan = getDemandBriefPlan(tier);

  // Handle negative counts gracefully
  const nicheCount = Math.max(0, currentNicheCount);

  if (nicheCount < plan.maxNiches) {
    return {
      allowed: true,
    };
  }

  // Determine suggested upgrade tier
  let suggestedTier: DemandBriefPlanTier | undefined;
  if (tier === 'starter') {
    suggestedTier = 'builder';
  } else if (tier === 'builder') {
    suggestedTier = 'agency';
  }

  // Generate message
  let message: string;
  if (tier === 'agency') {
    message = `You've reached the maximum of ${plan.maxNiches} niches for the Agency plan. Please contact support if you need to track more.`;
  } else {
    const nextPlan = suggestedTier ? getDemandBriefPlan(suggestedTier) : null;
    message = `You've reached your plan limit of ${plan.maxNiches} niche${
      plan.maxNiches > 1 ? 's' : ''
    }. Upgrade to ${nextPlan?.name} to track up to ${nextPlan?.maxNiches} niches.`;
  }

  return {
    allowed: false,
    message,
    currentLimit: plan.maxNiches,
    suggestedTier,
  };
}

/**
 * Gets the per-niche cost for a plan
 */
export function getPerNicheCost(tier: DemandBriefPlanTier): number {
  const plan = getDemandBriefPlan(tier);
  return plan.price / plan.maxNiches;
}

/**
 * Checks if a tier allows a specific number of niches
 */
export function canTierSupport(tier: DemandBriefPlanTier, nicheCount: number): boolean {
  const plan = getDemandBriefPlan(tier);
  return nicheCount <= plan.maxNiches;
}

/**
 * Gets the minimum tier required for a given niche count
 */
export function getMinimumTierForNiches(nicheCount: number): DemandBriefPlanTier {
  const plans = getAllDemandBriefPlans();

  for (const plan of plans) {
    if (plan.maxNiches >= nicheCount) {
      return plan.tier;
    }
  }

  // Default to highest tier if count exceeds all limits
  return 'agency';
}
