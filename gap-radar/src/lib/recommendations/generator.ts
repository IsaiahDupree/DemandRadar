/**
 * Build Recommendation Generator
 * Feature: BUILD-002
 *
 * AI-powered product idea generation from market signals using GPT-4o.
 * Analyzes pain points, competitor ads, search data, and content gaps
 * to generate 3-5 vetted product recommendations.
 */

import OpenAI from 'openai';

export interface MarketSignals {
  niche: string;
  pain_points: Array<{ text: string; frequency: number }>;
  competitor_ads: Array<{ advertiser: string; headline: string; run_days: number }>;
  search_queries: Array<{ query: string; volume: number }>;
  content_gaps: string[];
  demand_score: number;
}

export interface TargetPersona {
  name: string;
  role: string;
  pain_points: string[];
  goals: string[];
}

export type ProductType = 'saas' | 'tool' | 'api' | 'marketplace' | 'content' | 'service' | 'plugin';

export interface BuildRecommendation {
  product_name: string;
  product_idea: string;
  product_type: ProductType;
  tagline: string;
  target_audience: string;
  target_persona: TargetPersona;
  pain_points: string[];
  competitor_ads: Array<{ advertiser: string; hook: string }>;
  search_queries: string[];
  content_gaps: string[];
  recommended_hooks: string[];
  recommended_channels: string[];
  estimated_cac_range: string;
  pricing_suggestion: string;
  confidence_score: number;
  reasoning: string;
  risks: string[];
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
 * Generate 3-5 vetted product recommendations from market signals
 */
export async function generateRecommendations(
  signals: MarketSignals
): Promise<BuildRecommendation[]> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not set, using mock recommendations');
    return generateMockRecommendations(signals);
  }

  const prompt = buildPrompt(signals);

  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a product strategy expert who analyzes market signals to generate actionable product recommendations.

Your recommendations should be:
- Specific and actionable (not generic)
- Based on the actual market signals provided
- Include realistic personas with concrete pain points and goals
- Provide 2-5 marketing hooks that would resonate
- Suggest realistic CAC ranges and pricing
- Include confidence scores based on signal strength
- Highlight specific risks to consider

Format your response as JSON with a "recommendations" array containing 3-5 product ideas.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn('No response from OpenAI, using mock recommendations');
      return generateMockRecommendations(signals);
    }

    const parsed = JSON.parse(content);
    const recommendations = parsed.recommendations || [];

    return recommendations.map((rec: Partial<BuildRecommendation>) =>
      normalizeRecommendation(rec, signals)
    );
  } catch (error) {
    console.error('Recommendation generation error:', error);
    return generateMockRecommendations(signals);
  }
}

/**
 * Build the prompt for GPT-4o based on market signals
 */
function buildPrompt(signals: MarketSignals): string {
  const topPainPoints = signals.pain_points
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5)
    .map((p) => `- ${p.text} (mentioned ${p.frequency} times)`)
    .join('\n');

  const topCompetitorAds = signals.competitor_ads
    .sort((a, b) => b.run_days - a.run_days)
    .slice(0, 5)
    .map((ad) => `- ${ad.advertiser}: "${ad.headline}" (running ${ad.run_days} days)`)
    .join('\n');

  const topSearchQueries = signals.search_queries
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5)
    .map((q) => `- "${q.query}" (${q.volume.toLocaleString()} monthly searches)`)
    .join('\n');

  const contentGaps = signals.content_gaps.slice(0, 5).map((gap) => `- ${gap}`).join('\n');

  return `Analyze these market signals for the "${signals.niche}" niche and generate 3-5 specific product recommendations.

MARKET SIGNALS (Demand Score: ${signals.demand_score}/100):

Top Pain Points:
${topPainPoints || 'No pain points provided'}

Competitor Ads (Long-Running = Profitable):
${topCompetitorAds || 'No competitor ads provided'}

High-Volume Search Queries:
${topSearchQueries || 'No search data provided'}

Content Gaps:
${contentGaps || 'No content gaps identified'}

For each product recommendation, provide:

1. product_name: A catchy, memorable product name
2. product_idea: 1-2 sentence description of what it does
3. product_type: One of: saas, tool, api, marketplace, content, service, plugin
4. tagline: A compelling one-liner value proposition
5. target_audience: Who this is for (be specific)
6. target_persona: {
   name: A realistic persona name
   role: Their job title
   pain_points: Array of 2-3 specific pain points they face
   goals: Array of 2-3 specific goals they want to achieve
}
7. pain_points: Top 2-3 pain points this product addresses
8. competitor_ads: Examples from the competitor ads provided (format: { advertiser, hook })
9. search_queries: Relevant keywords from the search data
10. content_gaps: Which content gaps this addresses
11. recommended_hooks: 2-5 ad hooks/angles that would work for this product
12. recommended_channels: 2-4 marketing channels to focus on
13. estimated_cac_range: Realistic customer acquisition cost range (e.g., "$5-$15")
14. pricing_suggestion: Suggested pricing model (e.g., "Freemium: $0 + $29/mo Pro")
15. confidence_score: 0-100 based on signal strength
16. reasoning: Why this is a good opportunity (2-3 sentences)
17. risks: Array of 1-3 specific risks to consider

Return JSON format:
{
  "recommendations": [...]
}`;
}

/**
 * Normalize and validate a recommendation from GPT-4o
 */
function normalizeRecommendation(
  rec: Partial<BuildRecommendation>,
  signals: MarketSignals
): BuildRecommendation {
  const validTypes: ProductType[] = ['saas', 'tool', 'api', 'marketplace', 'content', 'service', 'plugin'];
  const productType = validTypes.includes(rec.product_type as ProductType)
    ? (rec.product_type as ProductType)
    : 'saas';

  return {
    product_name: rec.product_name || `${signals.niche} Solution`,
    product_idea: rec.product_idea || 'A solution for this market',
    product_type: productType,
    tagline: rec.tagline || 'The best solution for your needs',
    target_audience: rec.target_audience || 'Businesses and professionals',
    target_persona: {
      name: rec.target_persona?.name || 'Professional User',
      role: rec.target_persona?.role || 'Manager',
      pain_points: rec.target_persona?.pain_points || ['Generic pain point'],
      goals: rec.target_persona?.goals || ['Achieve better results'],
    },
    pain_points: rec.pain_points || [],
    competitor_ads: rec.competitor_ads || [],
    search_queries: rec.search_queries || [],
    content_gaps: rec.content_gaps || [],
    recommended_hooks: rec.recommended_hooks || ['Solve your problems faster'],
    recommended_channels: rec.recommended_channels || ['Google Ads', 'Content marketing'],
    estimated_cac_range: rec.estimated_cac_range || '$10-$50',
    pricing_suggestion: rec.pricing_suggestion || 'Subscription: $29/mo',
    confidence_score: Math.max(0, Math.min(100, rec.confidence_score || 50)),
    reasoning: rec.reasoning || 'Based on market signals',
    risks: rec.risks || ['Market competition'],
  };
}

/**
 * Generate mock recommendations for testing or when API key is missing
 */
function generateMockRecommendations(signals: MarketSignals): BuildRecommendation[] {
  const confidenceBase = Math.min(100, Math.max(40, signals.demand_score));

  return [
    {
      product_name: `${signals.niche} Pro`,
      product_idea: `A professional-grade solution for ${signals.niche.toLowerCase()} that addresses the top market pain points`,
      product_type: 'saas',
      tagline: `The best ${signals.niche.toLowerCase()} platform for professionals`,
      target_audience: 'Small to medium businesses and professionals',
      target_persona: {
        name: 'Professional User',
        role: 'Manager',
        pain_points: signals.pain_points.slice(0, 2).map((p) => p.text),
        goals: ['Improve efficiency', 'Reduce costs', 'Scale operations'],
      },
      pain_points: signals.pain_points.slice(0, 3).map((p) => p.text),
      competitor_ads: signals.competitor_ads.slice(0, 2).map((ad) => ({
        advertiser: ad.advertiser,
        hook: ad.headline,
      })),
      search_queries: signals.search_queries.slice(0, 3).map((q) => q.query),
      content_gaps: signals.content_gaps.slice(0, 2),
      recommended_hooks: [
        `Finally, ${signals.niche.toLowerCase()} that works`,
        'Stop wasting time and money',
        'Get results in minutes, not hours',
      ],
      recommended_channels: ['Google Ads', 'Content marketing', 'LinkedIn'],
      estimated_cac_range: '$10-$30',
      pricing_suggestion: 'Freemium: Free tier + $29/mo Pro',
      confidence_score: Math.round(confidenceBase * 0.95),
      reasoning: `High demand signals (${signals.demand_score}/100) indicate strong market opportunity with clear pain points`,
      risks: ['Competitive market', 'Need clear differentiation'],
    },
    {
      product_name: `${signals.niche} Starter Kit`,
      product_idea: `An accessible entry-level solution for ${signals.niche.toLowerCase()} beginners`,
      product_type: 'tool',
      tagline: `Get started with ${signals.niche.toLowerCase()} in minutes`,
      target_audience: 'Freelancers and small business owners',
      target_persona: {
        name: 'Solo Entrepreneur',
        role: 'Freelancer / Founder',
        pain_points: ['Too expensive alternatives', 'Complex to set up'],
        goals: ['Quick setup', 'Affordable solution', 'Easy to use'],
      },
      pain_points: ['Existing tools are too complex', 'High pricing barriers'],
      competitor_ads: [],
      search_queries: signals.search_queries.slice(0, 2).map((q) => q.query),
      content_gaps: signals.content_gaps.slice(0, 1),
      recommended_hooks: [
        'Simple, affordable, effective',
        'No learning curve required',
        'Start for free today',
      ],
      recommended_channels: ['SEO/Content', 'Reddit', 'ProductHunt'],
      estimated_cac_range: '$3-$10',
      pricing_suggestion: 'One-time payment: $49 or $9/mo',
      confidence_score: Math.round(confidenceBase * 0.85),
      reasoning: 'Strong opportunity for affordable alternative targeting price-sensitive segment',
      risks: ['Lower revenue per customer', 'Need volume'],
    },
    {
      product_name: `${signals.niche} Analytics`,
      product_idea: `Advanced analytics and insights for ${signals.niche.toLowerCase()} optimization`,
      product_type: 'saas',
      tagline: `Data-driven ${signals.niche.toLowerCase()} decisions`,
      target_audience: 'Data-driven teams and agencies',
      target_persona: {
        name: 'Analytics Manager',
        role: 'Marketing Analytics Manager',
        pain_points: ['Lack of actionable insights', 'Disconnected data sources'],
        goals: ['Better reporting', 'Data-driven decisions', 'ROI tracking'],
      },
      pain_points: ['No good analytics for this space', 'Hard to measure ROI'],
      competitor_ads: [],
      search_queries: [],
      content_gaps: [],
      recommended_hooks: [
        "Finally know what's working",
        'Stop guessing, start measuring',
        'See ROI in real-time',
      ],
      recommended_channels: ['LinkedIn Ads', 'Webinars', 'Content marketing'],
      estimated_cac_range: '$50-$150',
      pricing_suggestion: 'Tiered: $99/mo Starter, $299/mo Pro',
      confidence_score: Math.round(confidenceBase * 0.75),
      reasoning: 'Analytics is a common gap in emerging markets, good upsell opportunity',
      risks: ['Need strong data integrations', 'Longer time to value'],
    },
  ];
}
