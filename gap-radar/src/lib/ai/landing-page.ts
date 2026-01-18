/**
 * Landing Page Structure Generator
 *
 * AI-007: Generates recommended landing page structure from market insights
 * - Section recommendations
 * - Copy suggestions
 * - Objection handling
 */

import OpenAI from 'openai';
import { GapOpportunity } from './gap-generator';

export interface LandingPageSection {
  type: string;
  title: string;
  description: string;
  order: number;
  content?: string[];
}

export interface ObjectionHandling {
  objection: string;
  response: string;
  placement: string;
}

export interface LandingPageStructure {
  sections: LandingPageSection[];
  headline_suggestions: string[];
  subheadline_suggestions: string[];
  cta_suggestions: string[];
  objections: ObjectionHandling[];
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

/**
 * Generate landing page structure from market insights
 */
export async function generateLandingPageStructure(
  gaps: GapOpportunity[],
  nicheQuery: string,
  valueProposition: string
): Promise<LandingPageStructure> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not set, using mock landing page structure');
    return generateMockLandingPageStructure(gaps, nicheQuery, valueProposition);
  }

  const topGaps = gaps.slice(0, 5);

  const prompt = `You are a conversion optimization expert. Generate a high-converting landing page structure for: "${nicheQuery}"

VALUE PROPOSITION: ${valueProposition || 'Not specified - infer from gaps'}

TOP MARKET GAPS (use these to inform copy and objection handling):
${topGaps.map((g, i) => `${i + 1}. ${g.title} (Score: ${g.opportunity_score}/100)
   Problem: ${g.problem}
   Recommendation: ${g.recommendation}
   Key Evidence: ${g.evidence_reddit.slice(0, 2).map(e => `"${e.snippet}"`).join(', ')}`).join('\n\n')}

Create a landing page structure with:

1. **SECTIONS** - Ordered list of landing page sections:
   - type: hero, features, benefits, how_it_works, social_proof, testimonials, pricing, faq, cta, final_cta
   - title: Section heading
   - description: What this section should accomplish
   - order: Position in page (1 = first)
   - content: Array of bullet points/content suggestions for this section

2. **HEADLINE SUGGESTIONS** - 5 compelling headlines that:
   - Address the top gap directly
   - Lead with benefit, not feature
   - Are specific and credible
   - Create curiosity or urgency

3. **SUBHEADLINE SUGGESTIONS** - 5 supporting subheadlines that:
   - Clarify the value proposition
   - Address secondary benefits
   - Build credibility

4. **CTA SUGGESTIONS** - 5 call-to-action button copy options:
   - Action-oriented
   - Low friction
   - Benefit-focused
   - Varied urgency levels

5. **OBJECTIONS** - Top 5 objections to handle (derived from gap evidence):
   - objection: What the customer is thinking/worried about
   - response: How to address it (copy suggestion)
   - placement: Where on the page to address it (section type)

IMPORTANT:
- Base objections on actual gap evidence (especially Reddit quotes)
- Prioritize objections by gap opportunity score
- Make copy specific to the niche, not generic
- Focus on benefits and outcomes, not features

Return JSON following this structure:
{
  "sections": [{ type, title, description, order, content }, ...],
  "headline_suggestions": ["...", ...],
  "subheadline_suggestions": ["...", ...],
  "cta_suggestions": ["...", ...],
  "objections": [{ objection, response, placement }, ...]
}`;

  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert conversion copywriter who creates high-converting landing pages based on market research. Be specific, benefit-focused, and always tie recommendations to the gap evidence provided.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    // Validate and normalize the response
    const structure: LandingPageStructure = {
      sections: result.sections || [],
      headline_suggestions: result.headline_suggestions || [],
      subheadline_suggestions: result.subheadline_suggestions || [],
      cta_suggestions: result.cta_suggestions || [],
      objections: result.objections || [],
    };

    return structure;

  } catch (error) {
    console.error('Error generating landing page structure:', error);
    return generateMockLandingPageStructure(gaps, nicheQuery, valueProposition);
  }
}

/**
 * Generate mock landing page structure for testing without API key
 */
function generateMockLandingPageStructure(
  gaps: GapOpportunity[],
  nicheQuery: string,
  valueProposition: string
): LandingPageStructure {
  const topGap = gaps.length > 0 ? gaps[0] : null;
  const secondGap = gaps.length > 1 ? gaps[1] : null;

  // Generate sections
  const sections: LandingPageSection[] = [
    {
      type: 'hero',
      title: 'Hero Section',
      description: 'Grab attention with clear value proposition',
      order: 1,
      content: [
        valueProposition || `The best ${nicheQuery} for modern teams`,
        topGap ? `Finally, ${topGap.recommendation.toLowerCase()}` : 'Everything you need to succeed',
        'Start free trial - no credit card required',
      ],
    },
    {
      type: 'benefits',
      title: 'Key Benefits',
      description: 'Show outcomes and value, not features',
      order: 2,
      content: topGap ? [
        `${topGap.recommendation}`,
        secondGap ? `${secondGap.recommendation}` : 'Save time and increase productivity',
        'Join thousands of satisfied users',
      ] : [
        'Save time and increase productivity',
        'Work better together',
        'Get results faster',
      ],
    },
    {
      type: 'how_it_works',
      title: 'How It Works',
      description: 'Simple 3-step process',
      order: 3,
      content: [
        'Sign up in 30 seconds',
        'Set up your workspace',
        'Start getting results',
      ],
    },
    {
      type: 'social_proof',
      title: 'Trusted By',
      description: 'Build credibility with logos and numbers',
      order: 4,
      content: [
        'Trusted by 10,000+ teams',
        'Featured on Product Hunt',
        '4.8/5 stars from 500+ reviews',
      ],
    },
    {
      type: 'testimonials',
      title: 'What Customers Say',
      description: 'Real testimonials addressing top objections',
      order: 5,
      content: topGap ? [
        `"${topGap.recommendation} - exactly what we needed!" - Sarah K., Product Manager`,
        '"Finally, a tool that actually works" - Mike D., Founder',
        '"Best investment we made this year" - Alex T., Team Lead',
      ] : [
        '"Game changer for our team" - Sarah K.',
        '"Best tool we\'ve used" - Mike D.',
        '"Highly recommend" - Alex T.',
      ],
    },
    {
      type: 'pricing',
      title: 'Simple, Transparent Pricing',
      description: 'Clear pricing tiers with all features listed',
      order: 6,
      content: [
        'Free tier: Get started at no cost',
        'Pro: $29/month - All features unlocked',
        'Enterprise: Custom pricing for teams',
      ],
    },
    {
      type: 'faq',
      title: 'Frequently Asked Questions',
      description: 'Address common objections and concerns',
      order: 7,
      content: [
        'Is there a free trial? Yes, 14 days free',
        'Can I cancel anytime? Yes, no lock-in',
        'Do you offer refunds? 30-day money-back guarantee',
      ],
    },
    {
      type: 'final_cta',
      title: 'Ready to Get Started?',
      description: 'Strong final call-to-action',
      order: 8,
      content: [
        'Join 10,000+ teams already using our platform',
        'Start your free trial today',
        'No credit card required',
      ],
    },
  ];

  // Generate headline suggestions
  const headline_suggestions = topGap ? [
    `${topGap.recommendation.replace(/^Add |^Create /, '')} for ${nicheQuery}`,
    valueProposition || `The ${nicheQuery} that actually works`,
    `Save time with better ${topGap.problem.toLowerCase().replace('users', 'your team').replace('no ', '').replace('lack of ', '').replace('missing ', '')}`,
    `${nicheQuery} - done right`,
    `Work faster with ${nicheQuery.toLowerCase()}`,
  ] : [
    valueProposition || `The best ${nicheQuery} for modern teams`,
    `${nicheQuery} - reimagined`,
    `Save time with our ${nicheQuery}`,
    `The ${nicheQuery} you've been waiting for`,
    `${nicheQuery} that actually works`,
  ];

  // Generate subheadline suggestions
  const subheadline_suggestions = topGap ? [
    `${topGap.recommendation}. No complex setup. No hidden fees.`,
    `Join 10,000+ teams who solved ${topGap.problem.toLowerCase()}`,
    `Everything you need for ${nicheQuery.toLowerCase()}, nothing you don't`,
    `Start free, scale as you grow`,
    `${topGap.recommendation} in minutes, not hours`,
  ] : [
    `Everything you need for ${nicheQuery.toLowerCase()}, nothing you don't`,
    'Simple, powerful, and built for teams like yours',
    'Start free, scale as you grow',
    'Join thousands of satisfied users',
    'No credit card required to start',
  ];

  // Generate CTA suggestions
  const cta_suggestions = [
    'Start Free Trial',
    'Get Started Free',
    'Try It Free',
    'Start Now - It\'s Free',
    'See How It Works',
  ];

  // Generate objections from gaps
  const objections: ObjectionHandling[] = [];

  if (topGap) {
    objections.push({
      objection: topGap.problem,
      response: topGap.recommendation,
      placement: 'hero',
    });
  }

  if (secondGap) {
    objections.push({
      objection: secondGap.problem,
      response: secondGap.recommendation,
      placement: secondGap.gap_type === 'pricing' ? 'pricing' : 'benefits',
    });
  }

  // Add common objections
  objections.push({
    objection: 'Is this legit? Can I trust this product?',
    response: 'Trusted by 10,000+ teams. Featured on Product Hunt. 4.8/5 stars from 500+ reviews.',
    placement: 'testimonials',
  });

  objections.push({
    objection: 'What if it doesn\'t work for me?',
    response: '14-day free trial. No credit card required. 30-day money-back guarantee if you\'re not satisfied.',
    placement: 'pricing',
  });

  objections.push({
    objection: 'Is it hard to set up?',
    response: 'Sign up in 30 seconds. Set up your workspace in minutes. Start getting results today.',
    placement: 'benefits',
  });

  return {
    sections,
    headline_suggestions,
    subheadline_suggestions,
    cta_suggestions,
    objections,
  };
}
