/**
 * Tests for 3% Better Plan Generator
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  generateThreePercentBetterPlans,
  generateConsolidatedPlan,
  resetOpenAIInstance,
  type ThreePercentBetterPlan,
} from '../src/lib/ai/three-percent-better';
import type { GapOpportunity } from '../src/lib/ai/gap-generator';
import type { Cluster } from '../src/lib/ai/extractor';

describe('Three Percent Better Plan Generator', () => {
  beforeEach(() => {
    resetOpenAIInstance();
  });

  const mockGaps: GapOpportunity[] = [
    {
      gap_type: 'product',
      title: 'Quality is the #1 complaint but no ads address it',
      problem: 'Users complain about poor quality, but advertisers focus on speed and price.',
      evidence_ads: [
        { id: 'ad-1', snippet: 'Fast AI writing in seconds' },
        { id: 'ad-2', snippet: 'Generate content 10x faster' },
      ],
      evidence_reddit: [
        { id: 'reddit-1', snippet: 'The quality is terrible, full of errors' },
        { id: 'reddit-2', snippet: 'Output is unusable, I have to rewrite everything' },
      ],
      recommendation: 'Lead with quality promise. Add quality rating system.',
      opportunity_score: 85,
      confidence: 0.82,
    },
    {
      gap_type: 'pricing',
      title: 'Pricing feels exploitative',
      problem: 'Users feel subscription pricing is too high. Ads hide pricing.',
      evidence_ads: [
        { id: 'ad-3', snippet: 'Try free now!' },
      ],
      evidence_reddit: [
        { id: 'reddit-3', snippet: 'Way too expensive for what you get' },
      ],
      recommendation: 'Show transparent pricing. Consider one-time payment option.',
      opportunity_score: 78,
      confidence: 0.79,
    },
  ];

  const mockClusters: Cluster[] = [
    {
      cluster_type: 'objection',
      label: 'Poor output quality',
      examples: [
        { id: 'ex-1', snippet: 'Quality is terrible' },
        { id: 'ex-2', snippet: 'Full of errors' },
      ],
      frequency: 42,
      intensity: 0.85,
    },
    {
      cluster_type: 'objection',
      label: 'Pricing is too high',
      examples: [
        { id: 'ex-3', snippet: 'Too expensive' },
      ],
      frequency: 28,
      intensity: 0.72,
    },
    {
      cluster_type: 'feature',
      label: 'Want quality controls',
      examples: [
        { id: 'ex-4', snippet: 'Need a way to rate outputs' },
      ],
      frequency: 18,
      intensity: 0.65,
    },
  ];

  test('generates plans for gaps (mock mode)', async () => {
    // Without OpenAI key, should use mock generation
    delete process.env.OPENAI_API_KEY;

    const plans = await generateThreePercentBetterPlans(
      mockGaps,
      mockClusters,
      'AI writing tools'
    );

    expect(plans).toBeDefined();
    expect(plans.length).toBeGreaterThan(0);
    expect(plans.length).toBeLessThanOrEqual(5); // Max 5 plans

    const plan = plans[0];
    expect(plan.gap_id).toBeDefined();
    expect(plan.gap_title).toBeDefined();
    expect(plan.product_changes).toBeDefined();
    expect(plan.offer_changes).toBeDefined();
    expect(plan.copy_changes).toBeDefined();
    expect(plan.mvp_spec).toBeDefined();
    expect(plan.expected_impact).toBeDefined();
  });

  test('product changes have required fields', async () => {
    delete process.env.OPENAI_API_KEY;

    const plans = await generateThreePercentBetterPlans(
      mockGaps,
      mockClusters,
      'AI writing tools'
    );

    const plan = plans[0];
    expect(plan.product_changes.length).toBeGreaterThan(0);

    const change = plan.product_changes[0];
    expect(change.change).toBeDefined();
    expect(change.rationale).toBeDefined();
    expect(change.effort).toMatch(/^(low|medium|high)$/);
    expect(change.impact).toMatch(/^(low|medium|high)$/);
  });

  test('offer changes have required fields', async () => {
    delete process.env.OPENAI_API_KEY;

    const plans = await generateThreePercentBetterPlans(
      mockGaps,
      mockClusters,
      'AI writing tools'
    );

    const plan = plans[0];
    expect(plan.offer_changes.length).toBeGreaterThan(0);

    const change = plan.offer_changes[0];
    expect(change.change).toBeDefined();
    expect(change.rationale).toBeDefined();
    expect(change.effort).toMatch(/^(low|medium|high)$/);
    expect(change.impact).toMatch(/^(low|medium|high)$/);
  });

  test('copy changes have before/after examples', async () => {
    delete process.env.OPENAI_API_KEY;

    const plans = await generateThreePercentBetterPlans(
      mockGaps,
      mockClusters,
      'AI writing tools'
    );

    const plan = plans[0];
    expect(plan.copy_changes.length).toBeGreaterThan(0);

    const change = plan.copy_changes[0];
    expect(change.change).toBeDefined();
    expect(change.before_example).toBeDefined();
    expect(change.after_example).toBeDefined();
    expect(change.rationale).toBeDefined();
  });

  test('MVP spec features are tied to objections', async () => {
    delete process.env.OPENAI_API_KEY;

    const plans = await generateThreePercentBetterPlans(
      mockGaps,
      mockClusters,
      'AI writing tools'
    );

    const plan = plans[0];
    expect(plan.mvp_spec.length).toBeGreaterThan(0);

    const feature = plan.mvp_spec[0];
    expect(feature.feature).toBeDefined();
    expect(feature.addresses_objection).toBeDefined();
    expect(feature.priority).toMatch(/^(must-have|should-have|nice-to-have)$/);
  });

  test('expected impact has confidence scores', async () => {
    delete process.env.OPENAI_API_KEY;

    const plans = await generateThreePercentBetterPlans(
      mockGaps,
      mockClusters,
      'AI writing tools'
    );

    const plan = plans[0];
    expect(plan.expected_impact.length).toBeGreaterThan(0);

    const impact = plan.expected_impact[0];
    expect(impact.metric).toBeDefined();
    expect(impact.improvement).toBeDefined();
    expect(impact.confidence).toBeGreaterThanOrEqual(0);
    expect(impact.confidence).toBeLessThanOrEqual(1);
  });

  test('generates consolidated plan (mock mode)', async () => {
    delete process.env.OPENAI_API_KEY;

    const plans = await generateThreePercentBetterPlans(
      mockGaps,
      mockClusters,
      'AI writing tools'
    );

    const consolidated = await generateConsolidatedPlan(plans, 'AI writing tools');

    expect(consolidated).toBeDefined();
    expect(consolidated.quick_wins).toBeDefined();
    expect(consolidated.mvp_features).toBeDefined();
    expect(consolidated.copy_framework).toBeDefined();
    expect(consolidated.pricing_strategy).toBeDefined();
  });

  test('consolidated plan has quick wins', async () => {
    delete process.env.OPENAI_API_KEY;

    const plans = await generateThreePercentBetterPlans(
      mockGaps,
      mockClusters,
      'AI writing tools'
    );

    const consolidated = await generateConsolidatedPlan(plans, 'AI writing tools');

    expect(consolidated.quick_wins.length).toBeGreaterThan(0);

    const win = consolidated.quick_wins[0];
    expect(win.action).toBeDefined();
    expect(win.impact).toBeDefined();
    expect(win.effort).toBeDefined();
  });

  test('consolidated plan has copy framework', async () => {
    delete process.env.OPENAI_API_KEY;

    const plans = await generateThreePercentBetterPlans(
      mockGaps,
      mockClusters,
      'AI writing tools'
    );

    const consolidated = await generateConsolidatedPlan(plans, 'AI writing tools');

    expect(consolidated.copy_framework.headline).toBeDefined();
    expect(consolidated.copy_framework.subheadline).toBeDefined();
    expect(consolidated.copy_framework.cta).toBeDefined();
  });

  test('consolidated plan has pricing strategy', async () => {
    delete process.env.OPENAI_API_KEY;

    const plans = await generateThreePercentBetterPlans(
      mockGaps,
      mockClusters,
      'AI writing tools'
    );

    const consolidated = await generateConsolidatedPlan(plans, 'AI writing tools');

    expect(consolidated.pricing_strategy.model).toBeDefined();
    expect(consolidated.pricing_strategy.rationale).toBeDefined();
  });

  test('handles empty gaps array', async () => {
    delete process.env.OPENAI_API_KEY;

    const plans = await generateThreePercentBetterPlans([], mockClusters, 'AI writing tools');

    expect(plans).toBeDefined();
    expect(plans).toEqual([]);
  });

  test('limits to max 5 plans', async () => {
    delete process.env.OPENAI_API_KEY;

    const manyGaps: GapOpportunity[] = Array(10).fill(mockGaps[0]);

    const plans = await generateThreePercentBetterPlans(
      manyGaps,
      mockClusters,
      'AI writing tools'
    );

    expect(plans.length).toBeLessThanOrEqual(5);
  });
});
