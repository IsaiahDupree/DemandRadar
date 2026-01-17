/**
 * Concept Idea Generator
 * 
 * Generates vetted product ideas from gaps and market data.
 */

import OpenAI from 'openai';
import { Cluster } from './extractor';
import { GapOpportunity } from './gap-generator';
import { AppStoreResult } from '../collectors/appstore';

export interface ConceptIdea {
  name: string;
  one_liner: string;
  platform_recommendation: 'web' | 'mobile' | 'hybrid';
  platform_reasoning: string;
  industry: string;
  icp: string;
  business_model: 'b2b' | 'b2c' | 'b2b2c';
  gap_thesis: string;
  mvp_spec: {
    must_haves: string[];
    non_goals: string[];
    differentiator: string;
    pricing_model: string;
    success_criteria: string[];
  };
  metrics?: ConceptMetrics;
}

export interface ConceptMetrics {
  cpc_low: number;
  cpc_expected: number;
  cpc_high: number;
  cac_low: number;
  cac_expected: number;
  cac_high: number;
  tam_low: number;
  tam_expected: number;
  tam_high: number;
  implementation_difficulty: number;
  human_touch_level: 'high' | 'medium' | 'low';
  autonomous_suitability: 'high' | 'medium' | 'low';
  build_difficulty: number;
  distribution_difficulty: number;
  opportunity_score: number;
  confidence: number;
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

export async function generateConcepts(
  gaps: GapOpportunity[],
  clusters: Cluster[],
  appStoreResults: AppStoreResult[],
  nicheQuery: string
): Promise<ConceptIdea[]> {
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not set, using mock concepts');
    return generateMockConcepts(gaps, appStoreResults, nicheQuery);
  }

  // Analyze platform saturation
  const iosSaturation = appStoreResults.filter(a => a.platform === 'ios').length;
  const androidSaturation = appStoreResults.filter(a => a.platform === 'android').length;
  const webSaturation = appStoreResults.filter(a => a.platform === 'web').length;

  const prompt = `Based on this market analysis for "${nicheQuery}", generate 2-3 vetted product concepts.

TOP GAPS:
${gaps.slice(0, 3).map(g => `- ${g.title}: ${g.problem}`).join('\n')}

PLATFORM SATURATION:
- iOS apps: ${iosSaturation}
- Android apps: ${androidSaturation}
- Web tools: ${webSaturation}

For each concept provide:
1. name: Catchy product name
2. one_liner: Value proposition in one sentence
3. platform_recommendation: web | mobile | hybrid (choose least saturated with best fit)
4. platform_reasoning: Why this platform
5. business_model: b2b | b2c
6. gap_thesis: The specific wedge/advantage
7. mvp_spec: { must_haves: [], non_goals: [], differentiator, pricing_model, success_criteria: [] }
8. metrics estimates (reasonable ranges based on industry)

Return JSON: { concepts: [...] }`;

  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return generateMockConcepts(gaps, appStoreResults, nicheQuery);

    const parsed = JSON.parse(content);
    const concepts = parsed.concepts || [];

    return concepts.map((c: Partial<ConceptIdea>) => ({
      name: c.name || `${nicheQuery} Tool`,
      one_liner: c.one_liner || `The best ${nicheQuery.toLowerCase()} solution`,
      platform_recommendation: c.platform_recommendation || 'web',
      platform_reasoning: c.platform_reasoning || 'Web allows fastest iteration',
      industry: c.industry || 'Software Tools',
      icp: c.icp || 'Small businesses and freelancers',
      business_model: c.business_model || 'b2c',
      gap_thesis: c.gap_thesis || gaps[0]?.problem || 'Address unmet needs',
      mvp_spec: {
        must_haves: c.mvp_spec?.must_haves || ['Core functionality', 'Simple UI'],
        non_goals: c.mvp_spec?.non_goals || ['Mobile app', 'Enterprise features'],
        differentiator: c.mvp_spec?.differentiator || 'Quality focus',
        pricing_model: c.mvp_spec?.pricing_model || 'Freemium',
        success_criteria: c.mvp_spec?.success_criteria || ['100 users in month 1'],
      },
      metrics: generateMetrics(c, gaps),
    }));
  } catch (error) {
    console.error('Concept generation error:', error);
    return generateMockConcepts(gaps, appStoreResults, nicheQuery);
  }
}

function generateMetrics(concept: Partial<ConceptIdea>, gaps: GapOpportunity[]): ConceptMetrics {
  const isB2B = concept.business_model === 'b2b';
  const avgGapScore = gaps.reduce((a, g) => a + g.opportunity_score, 0) / gaps.length || 70;

  return {
    cpc_low: isB2B ? 2.0 : 0.4,
    cpc_expected: isB2B ? 4.5 : 0.8,
    cpc_high: isB2B ? 8.0 : 1.5,
    cac_low: isB2B ? 150 : 4,
    cac_expected: isB2B ? 300 : 8,
    cac_high: isB2B ? 600 : 15,
    tam_low: isB2B ? 50000000 : 100000000,
    tam_expected: isB2B ? 120000000 : 250000000,
    tam_high: isB2B ? 250000000 : 500000000,
    implementation_difficulty: concept.platform_recommendation === 'mobile' ? 55 : 35,
    human_touch_level: isB2B ? 'medium' : 'low',
    autonomous_suitability: isB2B ? 'medium' : 'high',
    build_difficulty: concept.platform_recommendation === 'mobile' ? 50 : 35,
    distribution_difficulty: 50,
    opportunity_score: Math.round(avgGapScore * 1.1),
    confidence: 0.75,
  };
}

function generateMockConcepts(
  gaps: GapOpportunity[],
  appStoreResults: AppStoreResult[],
  niche: string
): ConceptIdea[] {
  const webCount = appStoreResults.filter(a => a.platform === 'web').length;
  const mobileCount = appStoreResults.filter(a => a.platform !== 'web').length;
  const recommendPlatform = webCount < mobileCount ? 'web' : 'mobile';

  return [
    {
      name: `${niche} Pro`,
      one_liner: `The only ${niche.toLowerCase()} that guarantees quality - or your money back.`,
      platform_recommendation: recommendPlatform as 'web' | 'mobile',
      platform_reasoning: recommendPlatform === 'web' 
        ? 'Web allows faster iteration. Users upload files anyway - no native features needed.'
        : 'Mobile has less competition. Great for on-the-go use cases.',
      industry: 'Software Tools',
      icp: 'Freelancers, designers, content creators',
      business_model: 'b2c',
      gap_thesis: gaps[0]?.problem || 'Focus on quality over speed',
      mvp_spec: {
        must_haves: [
          'Core AI processing',
          'Quality preview before export',
          'Transparent pricing',
          '10 free uses per month',
        ],
        non_goals: [
          'Mobile app (v2)',
          'API access (v2)',
          'Team features',
        ],
        differentiator: 'Quality score shown before/after',
        pricing_model: 'Credits-based, no subscription',
        success_criteria: [
          '< 3% refund rate',
          '40%+ return user rate',
          'CAC < $8',
        ],
      },
      metrics: {
        cpc_low: 0.45,
        cpc_expected: 0.72,
        cpc_high: 1.20,
        cac_low: 4.50,
        cac_expected: 7.20,
        cac_high: 12.00,
        tam_low: 150000000,
        tam_expected: 280000000,
        tam_high: 450000000,
        implementation_difficulty: 42,
        human_touch_level: 'low',
        autonomous_suitability: 'high',
        build_difficulty: 38,
        distribution_difficulty: 55,
        opportunity_score: 84,
        confidence: 0.81,
      },
    },
  ];
}
