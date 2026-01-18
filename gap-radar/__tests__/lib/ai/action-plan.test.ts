/**
 * Tests for Action Plan Generator (AI-005)
 *
 * Generates 7-day quick wins and 30-day roadmap from gap analysis
 *
 * Acceptance Criteria:
 * - 7-day plan generated
 * - 30-day roadmap generated
 * - Tied to gaps
 */

import { generateActionPlan, type ActionPlan } from '@/lib/ai/action-plan';
import type { GapOpportunity, ConceptIdea } from '@/lib/ai/gap-generator';

describe('Action Plan Generator (AI-005)', () => {
  const mockGaps: GapOpportunity[] = [
    {
      gap_type: 'product',
      title: 'Missing mobile app integration',
      problem: 'Users complain they cannot sync with their mobile calendar app',
      evidence_ads: [
        { id: 'ad-1', snippet: 'Sync with Google Calendar and Outlook' },
      ],
      evidence_reddit: [
        { id: 'reddit-1', snippet: 'Wish it synced with my phone calendar' },
        { id: 'reddit-2', snippet: 'No mobile sync is a dealbreaker for me' },
      ],
      recommendation: 'Add native calendar sync for iOS and Android',
      opportunity_score: 85,
      confidence: 0.9,
    },
    {
      gap_type: 'pricing',
      title: 'Pricing transparency issues',
      problem: 'Users are frustrated by hidden fees and unclear pricing',
      evidence_ads: [
        { id: 'ad-2', snippet: 'Transparent pricing, no hidden fees' },
      ],
      evidence_reddit: [
        { id: 'reddit-3', snippet: "Got charged extra fees I didn't expect" },
        { id: 'reddit-4', snippet: 'Pricing page is so confusing' },
      ],
      recommendation: 'Create clear pricing tiers with all fees visible upfront',
      opportunity_score: 78,
      confidence: 0.85,
    },
    {
      gap_type: 'trust',
      title: 'Lack of social proof',
      problem: 'No testimonials or case studies visible on landing page',
      evidence_ads: [
        { id: 'ad-3', snippet: 'Trusted by 10,000+ companies' },
        { id: 'ad-4', snippet: 'See why teams love us' },
      ],
      evidence_reddit: [
        { id: 'reddit-5', snippet: "Is this legit? Can't find any reviews" },
      ],
      recommendation: 'Add customer testimonials and trust badges',
      opportunity_score: 65,
      confidence: 0.75,
    },
  ];

  const mockConcepts: ConceptIdea[] = [
    {
      name: 'CalendarSync Pro',
      one_liner: 'Simple calendar sync for productivity apps',
      platform_recommendation: 'mobile',
      platform_reasoning: 'Users primarily need mobile calendar integration',
      industry: 'Productivity',
      icp: 'Knowledge workers who use multiple calendar apps',
      business_model: 'b2c',
      gap_thesis: 'Mobile calendar sync is highly requested but poorly executed',
      mvp_spec: {
        must_haves: [
          'Two-way sync with Google Calendar',
          'iOS native calendar integration',
          'Conflict resolution',
        ],
        non_goals: [
          'Advanced team scheduling',
          'Video conferencing integration',
        ],
        differentiator: 'Works seamlessly even with poor internet',
        pricing_model: 'Freemium with $4.99/month premium',
        success_criteria: [
          '1000 signups in first month',
          '20% conversion to premium',
          '4.5+ app store rating',
        ],
      },
    },
  ];

  it('should generate a 7-day plan', async () => {
    const plan = await generateActionPlan(mockGaps, mockConcepts, 'productivity app');

    expect(plan.sevenDay).toBeDefined();
    expect(plan.sevenDay.length).toBeGreaterThan(0);
    expect(plan.sevenDay.length).toBeLessThanOrEqual(7);

    // Each quick win should have required fields
    plan.sevenDay.forEach((item) => {
      expect(item.day).toBeGreaterThan(0);
      expect(item.day).toBeLessThanOrEqual(7);
      expect(item.task).toBeTruthy();
      expect(item.category).toMatch(/^(research|build|marketing|content|validation)$/);
      expect(item.effort).toMatch(/^(low|medium|high)$/);
      expect(item.priority).toMatch(/^(critical|high|medium)$/);
    });
  });

  it('should generate a 30-day roadmap', async () => {
    const plan = await generateActionPlan(mockGaps, mockConcepts, 'productivity app');

    expect(plan.thirtyDay).toBeDefined();
    expect(plan.thirtyDay.length).toBeGreaterThan(0);

    // Each roadmap item should have required fields
    plan.thirtyDay.forEach((item) => {
      expect(item.day).toBeGreaterThan(0);
      expect(item.day).toBeLessThanOrEqual(30);
      expect(item.task).toBeTruthy();
      expect(item.category).toMatch(/^(research|build|marketing|content|validation)$/);
      expect(item.effort).toMatch(/^(low|medium|high)$/);
      expect(item.priority).toMatch(/^(critical|high|medium)$/);
    });
  });

  it('should include quick wins', async () => {
    const plan = await generateActionPlan(mockGaps, mockConcepts, 'productivity app');

    expect(plan.quickWins).toBeDefined();
    expect(Array.isArray(plan.quickWins)).toBe(true);
    expect(plan.quickWins.length).toBeGreaterThan(0);
  });

  it('should include key risks', async () => {
    const plan = await generateActionPlan(mockGaps, mockConcepts, 'productivity app');

    expect(plan.keyRisks).toBeDefined();
    expect(Array.isArray(plan.keyRisks)).toBe(true);
    expect(plan.keyRisks.length).toBeGreaterThan(0);
  });

  it('should tie actions to gaps (by referencing gap problems)', async () => {
    const plan = await generateActionPlan(mockGaps, mockConcepts, 'productivity app');

    // The plan should reference the gaps in some way
    const planText = JSON.stringify(plan).toLowerCase();

    // Check if top gap is mentioned
    const topGapMentioned = planText.includes('mobile') ||
                            planText.includes('calendar') ||
                            planText.includes('sync');

    expect(topGapMentioned).toBe(true);
  });

  it('should handle empty gaps array gracefully', async () => {
    const plan = await generateActionPlan([], [], 'productivity app');

    expect(plan.sevenDay).toBeDefined();
    expect(plan.thirtyDay).toBeDefined();
    expect(plan.quickWins).toBeDefined();
    expect(plan.keyRisks).toBeDefined();
    expect(plan.nextSteps).toBeDefined();

    // Should still provide generic advice
    expect(plan.sevenDay.length).toBeGreaterThan(0);
    expect(plan.thirtyDay.length).toBeGreaterThan(0);
  });

  it('should include niche context in plans', async () => {
    const plan = await generateActionPlan(mockGaps, mockConcepts, 'AI writing assistant');

    // At least one action should reference the niche context
    const planText = JSON.stringify(plan).toLowerCase();
    const hasNicheContext = planText.includes('ai') || planText.includes('writing');

    expect(hasNicheContext).toBe(true);
  });

  it('should include concept details when concepts are provided', async () => {
    const plan = await generateActionPlan(mockGaps, mockConcepts, 'productivity app');

    const planText = JSON.stringify(plan);

    // Should reference the concept name or its features
    const includesConcept = planText.includes('CalendarSync') ||
                           planText.includes(mockConcepts[0].mvp_spec.must_haves[0]);

    expect(includesConcept).toBe(true);
  });

  it('should have days in sequential order', async () => {
    const plan = await generateActionPlan(mockGaps, mockConcepts, 'productivity app');

    // Check 7-day plan
    for (let i = 1; i < plan.sevenDay.length; i++) {
      expect(plan.sevenDay[i].day).toBeGreaterThanOrEqual(plan.sevenDay[i - 1].day);
    }

    // Check 30-day plan
    for (let i = 1; i < plan.thirtyDay.length; i++) {
      expect(plan.thirtyDay[i].day).toBeGreaterThanOrEqual(plan.thirtyDay[i - 1].day);
    }
  });
});
