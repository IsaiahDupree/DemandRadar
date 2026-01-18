/**
 * Unit tests for Demand Brief Subscription Plans
 *
 * BRIEF-014: Starter (1 niche), Builder (3 niches), Agency (10-25 niches) plans
 *
 * Acceptance criteria:
 * - Tier enforcement
 * - Niche limits
 * - Price configuration
 */

import {
  DemandBriefPlan,
  DemandBriefPlanTier,
  getDemandBriefPlan,
  canAddNiche,
  getAllDemandBriefPlans,
  getPlanByPriceId,
} from '@/lib/plans/demand-brief-plans';

describe('Demand Brief Plans', () => {
  describe('Plan Configuration', () => {
    it('should define Starter plan with correct limits', () => {
      const plan = getDemandBriefPlan('starter');

      expect(plan).toBeDefined();
      expect(plan.tier).toBe('starter');
      expect(plan.name).toBe('Starter');
      expect(plan.maxNiches).toBe(1);
      expect(plan.price).toBeGreaterThan(0);
      expect(plan.features).toContain('Weekly demand briefs');
    });

    it('should define Builder plan with correct limits', () => {
      const plan = getDemandBriefPlan('builder');

      expect(plan).toBeDefined();
      expect(plan.tier).toBe('builder');
      expect(plan.name).toBe('Builder');
      expect(plan.maxNiches).toBe(3);
      expect(plan.price).toBeGreaterThan(0);
      expect(plan.features).toContain('Weekly demand briefs');
    });

    it('should define Agency plan with correct limits', () => {
      const plan = getDemandBriefPlan('agency');

      expect(plan).toBeDefined();
      expect(plan.tier).toBe('agency');
      expect(plan.name).toBe('Agency');
      expect(plan.maxNiches).toBeGreaterThanOrEqual(10);
      expect(plan.maxNiches).toBeLessThanOrEqual(25);
      expect(plan.price).toBeGreaterThan(0);
      expect(plan.features).toContain('Weekly demand briefs');
    });

    it('should return all available plans', () => {
      const plans = getAllDemandBriefPlans();

      expect(plans).toHaveLength(3);
      expect(plans.map((p) => p.tier)).toContain('starter');
      expect(plans.map((p) => p.tier)).toContain('builder');
      expect(plans.map((p) => p.tier)).toContain('agency');
    });

    it('should have increasing prices from Starter to Agency', () => {
      const starter = getDemandBriefPlan('starter');
      const builder = getDemandBriefPlan('builder');
      const agency = getDemandBriefPlan('agency');

      expect(builder.price).toBeGreaterThan(starter.price);
      expect(agency.price).toBeGreaterThan(builder.price);
    });

    it('should have Stripe price IDs configured', () => {
      const plans = getAllDemandBriefPlans();

      plans.forEach((plan) => {
        expect(plan.stripePriceId).toBeDefined();
        expect(plan.stripePriceId).toMatch(/^price_/);
      });
    });
  });

  describe('Plan Features', () => {
    it('should include core features in all plans', () => {
      const plans = getAllDemandBriefPlans();

      plans.forEach((plan) => {
        expect(plan.features).toContain('Weekly demand briefs');
        expect(plan.features.length).toBeGreaterThan(0);
      });
    });

    it('should have more features in higher tiers', () => {
      const starter = getDemandBriefPlan('starter');
      const builder = getDemandBriefPlan('builder');
      const agency = getDemandBriefPlan('agency');

      expect(builder.features.length).toBeGreaterThanOrEqual(starter.features.length);
      expect(agency.features.length).toBeGreaterThanOrEqual(builder.features.length);
    });
  });

  describe('Tier Enforcement - canAddNiche', () => {
    it('should allow adding niche when under limit', () => {
      const result = canAddNiche('starter', 0);
      expect(result.allowed).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should block adding niche when at limit', () => {
      const result = canAddNiche('starter', 1);
      expect(result.allowed).toBe(false);
      expect(result.message?.toLowerCase()).toContain('upgrade');
      expect(result.currentLimit).toBe(1);
    });

    it('should allow builder plan to track 3 niches', () => {
      expect(canAddNiche('builder', 0).allowed).toBe(true);
      expect(canAddNiche('builder', 1).allowed).toBe(true);
      expect(canAddNiche('builder', 2).allowed).toBe(true);
      expect(canAddNiche('builder', 3).allowed).toBe(false);
    });

    it('should allow agency plan to track 10+ niches', () => {
      const result = canAddNiche('agency', 9);
      expect(result.allowed).toBe(true);

      const result10 = canAddNiche('agency', 10);
      expect(result10.allowed).toBe(true);
    });

    it('should block agency plan at max limit', () => {
      const plan = getDemandBriefPlan('agency');
      const result = canAddNiche('agency', plan.maxNiches);

      expect(result.allowed).toBe(false);
      expect(result.message).toContain('maximum');
    });

    it('should provide upgrade suggestion in block message', () => {
      const result = canAddNiche('starter', 1);

      expect(result.allowed).toBe(false);
      expect(result.message).toMatch(/upgrade|Builder/i);
      expect(result.suggestedTier).toBe('builder');
    });

    it('should suggest appropriate tier when at limit', () => {
      const starterLimit = canAddNiche('starter', 1);
      expect(starterLimit.suggestedTier).toBe('builder');

      const builderLimit = canAddNiche('builder', 3);
      expect(builderLimit.suggestedTier).toBe('agency');
    });
  });

  describe('Price ID Lookup', () => {
    it('should find plan by Stripe price ID', () => {
      const plans = getAllDemandBriefPlans();
      const starterPriceId = plans[0].stripePriceId;

      const foundPlan = getPlanByPriceId(starterPriceId);

      expect(foundPlan).toBeDefined();
      expect(foundPlan?.stripePriceId).toBe(starterPriceId);
    });

    it('should return undefined for invalid price ID', () => {
      const result = getPlanByPriceId('price_invalid');
      expect(result).toBeUndefined();
    });
  });

  describe('Plan Comparison', () => {
    it('should have annual flag for yearly plans', () => {
      const plans = getAllDemandBriefPlans();

      plans.forEach((plan) => {
        expect(typeof plan.annual).toBe('boolean');
      });
    });

    it('should calculate per-niche cost correctly', () => {
      const starter = getDemandBriefPlan('starter');
      const builder = getDemandBriefPlan('builder');

      const starterPerNiche = starter.price / starter.maxNiches;
      const builderPerNiche = builder.price / builder.maxNiches;

      // Builder should have better per-niche economics
      expect(builderPerNiche).toBeLessThan(starterPerNiche);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid tier gracefully', () => {
      expect(() => getDemandBriefPlan('invalid' as DemandBriefPlanTier)).toThrow();
    });

    it('should handle negative current niche count', () => {
      const result = canAddNiche('starter', -1);
      expect(result.allowed).toBe(true);
    });

    it('should handle zero niche count', () => {
      const result = canAddNiche('starter', 0);
      expect(result.allowed).toBe(true);
    });
  });
});
