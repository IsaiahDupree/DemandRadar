/**
 * 3% Better Plan Generator
 *
 * Generates tiny, actionable product/offer/copy changes that neutralize
 * top objections and misalignments. The "3% better" philosophy focuses on
 * incremental improvements backed by real evidence.
 */

import OpenAI from 'openai';
import { GapOpportunity } from './gap-generator';
import { Cluster } from './extractor';

export interface ThreePercentBetterPlan {
  gap_id: string;
  gap_title: string;

  // Product changes
  product_changes: {
    change: string;
    rationale: string;
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
  }[];

  // Offer changes
  offer_changes: {
    change: string;
    rationale: string;
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
  }[];

  // Copy/messaging changes
  copy_changes: {
    change: string;
    before_example: string;
    after_example: string;
    rationale: string;
  }[];

  // MVP spec tied to objections
  mvp_spec: {
    feature: string;
    addresses_objection: string;
    priority: 'must-have' | 'should-have' | 'nice-to-have';
  }[];

  // Expected impact
  expected_impact: {
    metric: string;
    improvement: string;
    confidence: number; // 0-1
  }[];
}

let openaiInstance: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
}

export function resetOpenAIInstance() {
  openaiInstance = null;
}

/**
 * Generate a "3% better" plan for each gap opportunity
 */
export async function generateThreePercentBetterPlans(
  gaps: GapOpportunity[],
  clusters: Cluster[],
  nicheQuery: string
): Promise<ThreePercentBetterPlan[]> {

  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not set, using mock plans');
    return generateMockPlans(gaps);
  }

  const plans: ThreePercentBetterPlan[] = [];

  // Generate a plan for each high-priority gap
  for (const gap of gaps.slice(0, 5)) {
    try {
      const plan = await generatePlanForGap(gap, clusters, nicheQuery);
      plans.push(plan);
    } catch (error) {
      console.error(`Failed to generate plan for gap ${gap.title}:`, error);
      // Add a mock plan as fallback
      plans.push(generateMockPlanForGap(gap));
    }
  }

  return plans;
}

async function generatePlanForGap(
  gap: GapOpportunity,
  clusters: Cluster[],
  nicheQuery: string
): Promise<ThreePercentBetterPlan> {

  const objectionClusters = clusters.filter(c => c.cluster_type === 'objection');
  const featureClusters = clusters.filter(c => c.cluster_type === 'feature');

  const prompt = `You are a product strategy expert. Generate a "3% better" plan for this market gap in the "${nicheQuery}" niche.

GAP OPPORTUNITY:
- Type: ${gap.gap_type}
- Title: ${gap.title}
- Problem: ${gap.problem}
- Recommendation: ${gap.recommendation}

EVIDENCE FROM ADS:
${gap.evidence_ads.map(e => `- ${e.snippet}`).join('\n')}

EVIDENCE FROM REDDIT:
${gap.evidence_reddit.map(e => `- ${e.snippet}`).join('\n')}

USER OBJECTIONS:
${objectionClusters.slice(0, 5).map(c => `- ${c.label} (frequency: ${c.frequency}, intensity: ${c.intensity})`).join('\n')}

DESIRED FEATURES:
${featureClusters.slice(0, 5).map(c => `- ${c.label} (frequency: ${c.frequency})`).join('\n')}

Generate a "3% better" plan with:

1. PRODUCT CHANGES (2-4 tiny improvements)
   - Each with: change, rationale, effort (low/medium/high), impact (low/medium/high)
   - Focus on neutralizing objections, not massive rewrites

2. OFFER CHANGES (2-3 improvements)
   - Pricing, guarantees, trials, packaging
   - Each with: change, rationale, effort, impact

3. COPY/MESSAGING CHANGES (3-5 improvements)
   - Specific before/after examples
   - Each with: change, before_example, after_example, rationale

4. MVP SPEC (3-5 must-have features)
   - Each tied directly to a user objection
   - Priority: must-have | should-have | nice-to-have

5. EXPECTED IMPACT (2-4 metrics)
   - What will improve (conversion, retention, satisfaction, etc.)
   - Estimated improvement percentage or description
   - Confidence 0-1

Return JSON following this structure:
{
  "product_changes": [...],
  "offer_changes": [...],
  "copy_changes": [...],
  "mvp_spec": [...],
  "expected_impact": [...]
}

Keep recommendations specific, actionable, and evidence-backed. Focus on "3% better" - incremental wins, not complete pivots.`;

  const response = await getOpenAIClient().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.5,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return generateMockPlanForGap(gap);
  }

  const parsed = JSON.parse(content);

  return {
    gap_id: gap.title.toLowerCase().replace(/\s+/g, '-'),
    gap_title: gap.title,
    product_changes: parsed.product_changes || [],
    offer_changes: parsed.offer_changes || [],
    copy_changes: parsed.copy_changes || [],
    mvp_spec: parsed.mvp_spec || [],
    expected_impact: parsed.expected_impact || [],
  };
}

function generateMockPlanForGap(gap: GapOpportunity): ThreePercentBetterPlan {
  return {
    gap_id: gap.title.toLowerCase().replace(/\s+/g, '-'),
    gap_title: gap.title,

    product_changes: [
      {
        change: 'Add quality assurance badge/indicator in UI',
        rationale: 'Users complain about quality but ads focus on speed. Make quality visible.',
        effort: 'low',
        impact: 'medium',
      },
      {
        change: 'Implement output rating system (1-5 stars)',
        rationale: 'Let users signal quality issues immediately. Shows you care.',
        effort: 'medium',
        impact: 'high',
      },
    ],

    offer_changes: [
      {
        change: 'Add "Quality Guarantee" with free re-do policy',
        rationale: 'Addresses trust gap. Low cost (2-5% re-dos) but high signal.',
        effort: 'low',
        impact: 'high',
      },
      {
        change: 'Show transparent pricing on landing page (above fold)',
        rationale: 'Users hate hidden pricing. Reduces friction, increases trust.',
        effort: 'low',
        impact: 'medium',
      },
    ],

    copy_changes: [
      {
        change: 'Lead with quality promise instead of speed',
        before_example: 'Generate content in seconds',
        after_example: 'Quality-first content you can trust - generated in seconds',
        rationale: 'Reframes speed as a bonus, not the only value prop',
      },
      {
        change: 'Add social proof in every ad creative',
        before_example: 'Try it free now',
        after_example: 'Join 10,000+ creators who trust us. Try it free.',
        rationale: 'Addresses skepticism with evidence',
      },
      {
        change: 'Show pricing in ad copy (not just landing page)',
        before_example: 'Start your free trial',
        after_example: 'Plans from $9/mo. Start free trial.',
        rationale: 'Reduces pricing objections early in funnel',
      },
    ],

    mvp_spec: [
      {
        feature: 'Output quality rating (1-5 stars)',
        addresses_objection: 'Quality is inconsistent',
        priority: 'must-have',
      },
      {
        feature: 'Regenerate/refine button (1-click re-do)',
        addresses_objection: 'Results are not good enough',
        priority: 'must-have',
      },
      {
        feature: 'Transparent pricing page with comparison',
        addresses_objection: 'Pricing feels hidden/exploitative',
        priority: 'must-have',
      },
      {
        feature: 'Testimonials section with real examples',
        addresses_objection: 'Seems like a scam / no proof',
        priority: 'should-have',
      },
    ],

    expected_impact: [
      {
        metric: 'Landing page conversion rate',
        improvement: '+15-25% from transparent pricing',
        confidence: 0.8,
      },
      {
        metric: 'User satisfaction (NPS)',
        improvement: '+10-20 points from quality improvements',
        confidence: 0.75,
      },
      {
        metric: 'Trust signals (review score)',
        improvement: '3.5 → 4.2+ stars',
        confidence: 0.7,
      },
    ],
  };
}

function generateMockPlans(gaps: GapOpportunity[]): ThreePercentBetterPlan[] {
  return gaps.slice(0, 3).map(gap => generateMockPlanForGap(gap));
}

/**
 * Generate a consolidated "3% Better" action plan across all gaps
 */
export async function generateConsolidatedPlan(
  plans: ThreePercentBetterPlan[],
  nicheQuery: string
): Promise<{
  quick_wins: { action: string; impact: string; effort: string }[];
  mvp_features: { feature: string; priority: string; rationale: string }[];
  copy_framework: { headline: string; subheadline: string; cta: string };
  pricing_strategy: { model: string; rationale: string };
}> {

  if (!process.env.OPENAI_API_KEY) {
    return generateMockConsolidatedPlan(plans);
  }

  const allProductChanges = plans.flatMap(p => p.product_changes);
  const allOfferChanges = plans.flatMap(p => p.offer_changes);
  const allCopyChanges = plans.flatMap(p => p.copy_changes);
  const allMvpFeatures = plans.flatMap(p => p.mvp_spec);

  const prompt = `Consolidate these "3% better" plans into a single action plan for "${nicheQuery}".

PRODUCT CHANGES:
${allProductChanges.map(c => `- ${c.change} (effort: ${c.effort}, impact: ${c.impact})`).join('\n')}

OFFER CHANGES:
${allOfferChanges.map(c => `- ${c.change} (effort: ${c.effort}, impact: ${c.impact})`).join('\n')}

COPY CHANGES:
${allCopyChanges.map(c => `- ${c.change}`).join('\n')}

MVP FEATURES:
${allMvpFeatures.map(f => `- ${f.feature} (${f.priority})`).join('\n')}

Generate a consolidated plan:

1. QUICK WINS (3-5 actions)
   - Low effort, high impact changes to implement this week
   - Each with: action, impact, effort

2. MVP FEATURES (5-7 features)
   - Must-have features for v1, prioritized
   - Each with: feature, priority, rationale

3. COPY FRAMEWORK
   - Recommended headline, subheadline, and CTA for landing page
   - Based on gap analysis

4. PRICING STRATEGY
   - Recommended pricing model
   - Rationale based on objections

Return JSON: { "quick_wins": [...], "mvp_features": [...], "copy_framework": {...}, "pricing_strategy": {...} }`;

  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return generateMockConsolidatedPlan(plans);
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Consolidated plan generation error:', error);
    return generateMockConsolidatedPlan(plans);
  }
}

function generateMockConsolidatedPlan(plans: ThreePercentBetterPlan[]): {
  quick_wins: { action: string; impact: string; effort: string }[];
  mvp_features: { feature: string; priority: string; rationale: string }[];
  copy_framework: { headline: string; subheadline: string; cta: string };
  pricing_strategy: { model: string; rationale: string };
} {
  return {
    quick_wins: [
      {
        action: 'Add transparent pricing to landing page (above fold)',
        impact: 'Reduces pricing objections, increases trust',
        effort: 'Low (1-2 hours)',
      },
      {
        action: 'Lead with quality promise in all ad copy',
        impact: 'Addresses #1 user complaint',
        effort: 'Low (update ad templates)',
      },
      {
        action: 'Add 3-5 testimonials with real results',
        impact: 'Builds trust, neutralizes skepticism',
        effort: 'Low (collect + format)',
      },
      {
        action: 'Implement output rating system (1-5 stars)',
        impact: 'Quality feedback loop, shows you care',
        effort: 'Medium (1-2 days dev)',
      },
    ],

    mvp_features: [
      {
        feature: 'Quality rating & regenerate button',
        priority: 'Must-have',
        rationale: 'Directly addresses quality complaints',
      },
      {
        feature: 'Transparent pricing page',
        priority: 'Must-have',
        rationale: 'Users hate hidden pricing',
      },
      {
        feature: 'Social proof section (testimonials + reviews)',
        priority: 'Must-have',
        rationale: 'Builds trust, reduces skepticism',
      },
      {
        feature: 'Quality guarantee policy',
        priority: 'Should-have',
        rationale: 'Low-cost signal of confidence',
      },
      {
        feature: 'Onboarding tutorial (show quality features)',
        priority: 'Should-have',
        rationale: 'Educates users on quality controls',
      },
    ],

    copy_framework: {
      headline: 'Quality-First [Product] You Can Trust',
      subheadline: 'Built to address the #1 complaint: inconsistent quality. Rate every output, regenerate instantly, satisfaction guaranteed.',
      cta: 'Try It Free - Plans from $9/mo',
    },

    pricing_strategy: {
      model: 'Transparent tiered pricing with generous free tier',
      rationale: 'Users complain about hidden pricing and feeling exploited. Show pricing upfront, offer free tier to build trust, clear upgrade path.',
    },
  };
}
