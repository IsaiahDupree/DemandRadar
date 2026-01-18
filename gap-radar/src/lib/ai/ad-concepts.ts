/**
 * Ad Concept Generator (AI-006)
 *
 * Generates 3 ad test concepts based on gap opportunities.
 * Each concept includes headline, body copy, CTA, and rationale.
 */

import OpenAI from 'openai';
import { GapOpportunity } from './gap-generator';

export interface AdConcept {
  gapId?: string;
  angle: string;
  headline: string;
  bodyCopy: string;
  cta: string;
  targetAudience: string;
  rationale: string;
  expectedImpact: string;
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

// For testing: reset the OpenAI instance
export function resetOpenAIInstance() {
  openaiInstance = null;
}

export async function generateAdConcepts(
  gaps: GapOpportunity[],
  nicheQuery: string
): Promise<AdConcept[]> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not set, using mock ad concepts');
    return generateMockAdConcepts(gaps, nicheQuery);
  }

  // Get top 3 gaps
  const topGaps = gaps.slice(0, 3);

  if (topGaps.length === 0) {
    // Generate generic concepts if no gaps provided
    return generateMockAdConcepts([], nicheQuery);
  }

  const prompt = `Based on this market analysis for "${nicheQuery}", create 3 distinct ad test concepts.

TOP MARKET GAPS:
${topGaps.map((g, i) => `${i + 1}. ${g.title} (Score: ${g.opportunity_score}/100)
   Problem: ${g.problem}
   Recommendation: ${g.recommendation}
   Evidence from ads: ${g.evidence_ads.map(e => e.snippet).join(' | ')}
   Evidence from Reddit: ${g.evidence_reddit.map(e => e.snippet).join(' | ')}`).join('\n\n')}

Create 3 AD CONCEPTS that directly address these gaps. Each concept should:
1. Use a DIFFERENT ANGLE (problem-aware, aspirational, social proof, etc.)
2. Reference the EVIDENCE from actual user complaints or competitor ads
3. Be immediately testable on Facebook/Google Ads

For each concept include:
- gapId: which gap this addresses (use gap position: "0", "1", "2")
- angle: the hook/angle type (e.g., "Problem-Aware", "Aspirational", "Social Proof", "Comparison")
- headline: 5-10 words, punchy and specific
- bodyCopy: 2-3 sentences that expand on the headline and address the gap
- cta: 2-5 words, action-oriented (e.g., "Try It Free", "Get Started", "See How")
- targetAudience: who this ad is for (be specific)
- rationale: why this concept addresses the gap (reference evidence)
- expectedImpact: what this ad should achieve

IMPORTANT:
- Headline should be under 100 characters
- Body copy should be under 200 characters
- Use actual pain points from the evidence
- Make CTAs specific and urgent
- Each concept should test a DIFFERENT hypothesis

Return JSON following this structure:
{
  "concepts": [
    {
      "gapId": "0",
      "angle": "...",
      "headline": "...",
      "bodyCopy": "...",
      "cta": "...",
      "targetAudience": "...",
      "rationale": "...",
      "expectedImpact": "..."
    },
    ...
  ]
}`;

  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a direct response copywriter specializing in high-converting ads. Be specific, use real pain points, and create immediately testable concepts.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    // Validate and normalize the response
    const concepts: AdConcept[] = (result.concepts || []).map((c: any) => ({
      gapId: c.gapId,
      angle: c.angle || 'Problem-Aware',
      headline: c.headline || 'Transform Your Workflow',
      bodyCopy: c.bodyCopy || 'Discover a better way.',
      cta: c.cta || 'Try It Free',
      targetAudience: c.targetAudience || `${nicheQuery} users`,
      rationale: c.rationale || 'Addresses key market gap.',
      expectedImpact: c.expectedImpact || 'Improved conversion rates.',
    }));

    // Ensure we have exactly 3 concepts
    while (concepts.length < 3) {
      concepts.push(generateGenericConcept(nicheQuery, concepts.length));
    }

    return concepts.slice(0, 3);
  } catch (error) {
    console.error('Error generating ad concepts:', error);
    return generateMockAdConcepts(gaps, nicheQuery);
  }
}

/**
 * Generate mock ad concepts for testing without API key
 */
function generateMockAdConcepts(gaps: GapOpportunity[], nicheQuery: string): AdConcept[] {
  const hasGaps = gaps.length > 0;

  if (!hasGaps) {
    return [
      generateGenericConcept(nicheQuery, 0),
      generateGenericConcept(nicheQuery, 1),
      generateGenericConcept(nicheQuery, 2),
    ];
  }

  const concepts: AdConcept[] = [];

  // Concept 1: Problem-Aware (addresses top gap)
  const gap0 = gaps[0];
  concepts.push({
    gapId: '0',
    angle: 'Problem-Aware',
    headline: `Tired of ${gap0.title.toLowerCase()}?`,
    bodyCopy: `${gap0.problem} ${gap0.recommendation}`,
    cta: 'Fix This Now',
    targetAudience: `${nicheQuery} users frustrated with ${gap0.gap_type} issues`,
    rationale: `Directly addresses the #1 gap (score ${gap0.opportunity_score}/100): "${gap0.title}". Evidence shows users actively complain about this: "${gap0.evidence_reddit[0]?.snippet || 'multiple complaints'}"`,
    expectedImpact: `High click-through rate from users who recognize this specific pain point. Expected 15-25% improvement in conversion vs generic messaging.`,
  });

  // Concept 2: Aspirational (if we have a second gap)
  if (gaps.length > 1) {
    const gap1 = gaps[1];
    concepts.push({
      gapId: '1',
      angle: 'Aspirational',
      headline: `Finally, a ${nicheQuery} that ${gap1.recommendation.toLowerCase()}`,
      bodyCopy: `Stop settling for tools that ${gap1.problem.toLowerCase()}. Join users who've already made the switch.`,
      cta: 'See the Difference',
      targetAudience: `Forward-thinking ${nicheQuery} users ready for better solutions`,
      rationale: `Addresses gap #2 (score ${gap1.opportunity_score}/100) with aspirational framing. Competitor ads show this angle works: "${gap1.evidence_ads[0]?.snippet || 'proven approach'}"`,
      expectedImpact: `Appeals to users seeking premium solutions. Expected to attract higher-intent, higher-value customers.`,
    });
  } else {
    concepts.push(generateGenericConcept(nicheQuery, 1));
  }

  // Concept 3: Social Proof (if we have a third gap, or generic)
  if (gaps.length > 2) {
    const gap2 = gaps[2];
    concepts.push({
      gapId: '2',
      angle: 'Social Proof',
      headline: `Why 1,000+ users switched to us`,
      bodyCopy: `They were tired of ${gap2.problem.toLowerCase()}. Now they ${gap2.recommendation.toLowerCase()}.`,
      cta: 'Join Them',
      targetAudience: `${nicheQuery} users looking for proven, trusted solutions`,
      rationale: `Addresses gap #3 (score ${gap2.opportunity_score}/100) using social validation. Reddit evidence shows trust is critical: "${gap2.evidence_reddit[0]?.snippet || 'trust concerns'}"`,
      expectedImpact: `Reduces skepticism and increases trust. Expected to improve conversion among risk-averse users.`,
    });
  } else {
    concepts.push(generateGenericConcept(nicheQuery, 2));
  }

  return concepts;
}

/**
 * Generate a generic ad concept when gaps are not available
 */
function generateGenericConcept(nicheQuery: string, index: number): AdConcept {
  const angles = [
    {
      angle: 'Problem-Aware',
      headline: `Struggling with ${nicheQuery}?`,
      bodyCopy: `Stop wasting time on tools that don't work. Try the solution that actually delivers results.`,
      cta: 'Get Started Free',
    },
    {
      angle: 'Aspirational',
      headline: `Transform your ${nicheQuery} workflow`,
      bodyCopy: `Join thousands who've already upgraded to a smarter way of working. See results in minutes, not weeks.`,
      cta: 'See How It Works',
    },
    {
      angle: 'Comparison',
      headline: `Better than other ${nicheQuery} tools`,
      bodyCopy: `Why settle for complicated tools when you can have simple, powerful, and affordable? Switch today.`,
      cta: 'Compare Now',
    },
  ];

  const template = angles[index % angles.length];

  return {
    angle: template.angle,
    headline: template.headline,
    bodyCopy: template.bodyCopy,
    cta: template.cta,
    targetAudience: `${nicheQuery} users seeking better solutions`,
    rationale: `Generic ${template.angle.toLowerCase()} angle for ${nicheQuery} market`,
    expectedImpact: `Baseline conversion rate. Use as control against gap-specific variants.`,
  };
}
