/**
 * Gap Opportunity Generator
 * 
 * Uses LLM to identify market gaps from clusters and evidence.
 */

import OpenAI from 'openai';
import { Cluster } from './extractor';
import { MetaAd } from '../collectors/meta';
import { GoogleAd } from '../collectors/google';
import { RedditMention } from '../collectors/reddit';

export interface GapOpportunity {
  gap_type: 'product' | 'offer' | 'positioning' | 'trust' | 'pricing';
  title: string;
  problem: string;
  evidence_ads: { id: string; snippet: string }[];
  evidence_reddit: { id: string; snippet: string }[];
  recommendation: string;
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

export async function generateGaps(
  clusters: Cluster[],
  ads: (MetaAd | GoogleAd)[],
  mentions: RedditMention[],
  nicheQuery: string
): Promise<GapOpportunity[]> {

  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not set, using mock gaps');
    return generateMockGaps(clusters, nicheQuery);
  }

  const objectionClusters = clusters.filter(c => c.cluster_type === 'objection');
  const angleClusters = clusters.filter(c => c.cluster_type === 'angle');
  const featureClusters = clusters.filter(c => c.cluster_type === 'feature');

  const prompt = `Analyze this market data for "${nicheQuery}" and identify 3-5 gap opportunities.

AD ANGLES (what advertisers claim):
${angleClusters.map(c => `- ${c.label} (frequency: ${c.frequency})`).join('\n')}

USER OBJECTIONS (complaints from Reddit):
${objectionClusters.map(c => `- ${c.label} (frequency: ${c.frequency}, intensity: ${c.intensity})`).join('\n')}

DESIRED FEATURES (what users want):
${featureClusters.map(c => `- ${c.label} (frequency: ${c.frequency})`).join('\n')}

For each gap, provide:
- gap_type: product | offer | positioning | trust | pricing
- title: Short descriptive title
- problem: What's the mismatch between ads and user reality?
- recommendation: Specific "3% better" action to take
- opportunity_score: 0-100 based on gap size and addressability
- confidence: 0-1 based on evidence strength

Return JSON: { gaps: [...] }`;

  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return generateMockGaps(clusters, nicheQuery);

    const parsed = JSON.parse(content);
    const gaps = parsed.gaps || [];

    return gaps.map((gap: Partial<GapOpportunity>) => ({
      gap_type: gap.gap_type || 'product',
      title: gap.title || 'Untitled Gap',
      problem: gap.problem || '',
      evidence_ads: ads.slice(0, 2).map((ad, i) => {
        const snippet = ad.source === 'google'
          ? `${ad.headline} ${ad.description}`.slice(0, 100)
          : (ad as MetaAd).creative_text?.slice(0, 100) || '';
        return {
          id: `ad-${i}`,
          snippet,
        };
      }),
      evidence_reddit: mentions.slice(0, 2).map((m, i) => ({
        id: `mention-${i}`,
        snippet: m.body?.slice(0, 100) || '',
      })),
      recommendation: gap.recommendation || '',
      opportunity_score: gap.opportunity_score || 70,
      confidence: gap.confidence || 0.7,
    }));
  } catch (error) {
    console.error('Gap generation error:', error);
    return generateMockGaps(clusters, nicheQuery);
  }
}

function generateMockGaps(clusters: Cluster[], niche: string): GapOpportunity[] {
  const objections = clusters.filter(c => c.cluster_type === 'objection');
  
  return [
    {
      gap_type: 'product',
      title: `Quality is the #1 complaint but no ads address it`,
      problem: `Users complain about poor quality, but advertisers focus on speed and price instead.`,
      evidence_ads: [{ id: 'ad-1', snippet: `Fast ${niche} in seconds` }],
      evidence_reddit: [{ id: 'reddit-1', snippet: objections[0]?.examples[0]?.snippet || 'Quality issues' }],
      recommendation: `Build quality-first messaging. Show before/after comparisons. Lead with "Quality guaranteed."`,
      opportunity_score: 85,
      confidence: 0.82,
    },
    {
      gap_type: 'pricing',
      title: 'Pricing feels exploitative',
      problem: `Users feel subscription pricing is too high for the value. Ads hide pricing.`,
      evidence_ads: [{ id: 'ad-2', snippet: 'Try free now' }],
      evidence_reddit: [{ id: 'reddit-2', snippet: 'Too expensive for what it does' }],
      recommendation: `Show transparent pricing in ads. Consider one-time payment or generous free tier.`,
      opportunity_score: 78,
      confidence: 0.79,
    },
    {
      gap_type: 'trust',
      title: 'No proof in ads',
      problem: `Ads make claims but don't show evidence. Users are skeptical.`,
      evidence_ads: [{ id: 'ad-3', snippet: 'Best results guaranteed' }],
      evidence_reddit: [{ id: 'reddit-3', snippet: 'Seems like a scam' }],
      recommendation: `Show real examples in every ad. Add social proof and testimonials.`,
      opportunity_score: 72,
      confidence: 0.75,
    },
  ];
}
