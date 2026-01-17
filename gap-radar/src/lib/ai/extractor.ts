/**
 * AI Extraction Module
 * 
 * Uses OpenAI to extract structured insights from ads and Reddit mentions.
 */

import OpenAI from 'openai';
import { MetaAd } from '../collectors/meta';
import { GoogleAd } from '../collectors/google';
import { RedditMention } from '../collectors/reddit';

export interface Extraction {
  source_type: 'ad' | 'reddit';
  source_id: string;
  offers: string[];
  claims: string[];
  angles: string[];
  objections: string[];
  desired_features: string[];
  sentiment: {
    positive: number;
    negative: number;
    intensity: number;
  };
}

export interface Cluster {
  cluster_type: 'angle' | 'objection' | 'feature' | 'offer';
  label: string;
  examples: { id: string; snippet: string }[];
  frequency: number;
  intensity: number;
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

export async function extractInsights(
  ads: (MetaAd | GoogleAd)[],
  mentions: RedditMention[],
  nicheQuery: string
): Promise<{ extractions: Extraction[]; clusters: Cluster[] }> {

  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not set, using mock extractions');
    return generateMockExtractions(ads, mentions, nicheQuery);
  }

  const extractions: Extraction[] = [];
  const allAngles: string[] = [];
  const allObjections: string[] = [];
  const allFeatures: string[] = [];

  // Extract from ads (batch process)
  if (ads.length > 0) {
    const adTexts = ads.slice(0, 20).map(ad => {
      // Handle both MetaAd and GoogleAd formats
      const text = ad.source === 'google'
        ? `${ad.headline} ${ad.description}`.trim()
        : `${(ad as MetaAd).headline || ''} ${(ad as MetaAd).creative_text} ${(ad as MetaAd).cta || ''}`.trim();

      return {
        id: ad.advertiser_name,
        text,
      };
    });

    const adExtractions = await extractFromAds(adTexts, nicheQuery);
    extractions.push(...adExtractions);
    
    adExtractions.forEach(ext => {
      allAngles.push(...ext.angles);
    });
  }

  // Extract from Reddit mentions (batch process)
  if (mentions.length > 0) {
    const mentionTexts = mentions.slice(0, 30).map(m => ({
      id: m.permalink,
      text: `${m.title || ''} ${m.body}`.trim(),
    }));

    const mentionExtractions = await extractFromMentions(mentionTexts, nicheQuery);
    extractions.push(...mentionExtractions);
    
    mentionExtractions.forEach(ext => {
      allObjections.push(...ext.objections);
      allFeatures.push(...ext.desired_features);
    });
  }

  // Cluster similar items
  const clusters = await clusterInsights(allAngles, allObjections, allFeatures);

  return { extractions, clusters };
}

async function extractFromAds(
  ads: { id: string; text: string }[],
  niche: string
): Promise<Extraction[]> {
  const prompt = `Analyze these ${niche} ads and extract for each:
- offers (pricing, trials, guarantees mentioned)
- claims (what the product promises)
- angles (marketing angle: speed, quality, price, ease, etc.)

Ads:
${ads.map((a, i) => `${i + 1}. ${a.text}`).join('\n')}

Return JSON array with objects: { index, offers: [], claims: [], angles: [] }`;

  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    const results = parsed.extractions || parsed.results || [];

    return results.map((r: { index: number; offers?: string[]; claims?: string[]; angles?: string[] }, i: number) => ({
      source_type: 'ad' as const,
      source_id: ads[r.index - 1]?.id || ads[i]?.id || `ad-${i}`,
      offers: r.offers || [],
      claims: r.claims || [],
      angles: r.angles || [],
      objections: [],
      desired_features: [],
      sentiment: { positive: 0.7, negative: 0.1, intensity: 0.5 },
    }));
  } catch (error) {
    console.error('Ad extraction error:', error);
    return [];
  }
}

async function extractFromMentions(
  mentions: { id: string; text: string }[],
  niche: string
): Promise<Extraction[]> {
  const prompt = `Analyze these Reddit discussions about ${niche} and extract:
- objections (complaints, frustrations, problems users mention)
- desired_features (features users wish existed)
- sentiment (positive/negative/intensity 0-1)

Posts:
${mentions.map((m, i) => `${i + 1}. ${m.text.slice(0, 300)}`).join('\n\n')}

Return JSON array with objects: { index, objections: [], desired_features: [], sentiment: { positive, negative, intensity } }`;

  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    const results = parsed.extractions || parsed.results || [];

    return results.map((r: { index: number; objections?: string[]; desired_features?: string[]; sentiment?: { positive: number; negative: number; intensity: number } }, i: number) => ({
      source_type: 'reddit' as const,
      source_id: mentions[r.index - 1]?.id || mentions[i]?.id || `mention-${i}`,
      offers: [],
      claims: [],
      angles: [],
      objections: r.objections || [],
      desired_features: r.desired_features || [],
      sentiment: r.sentiment || { positive: 0.3, negative: 0.5, intensity: 0.6 },
    }));
  } catch (error) {
    console.error('Mention extraction error:', error);
    return [];
  }
}

async function clusterInsights(
  angles: string[],
  objections: string[],
  features: string[]
): Promise<Cluster[]> {
  const clusters: Cluster[] = [];

  // Cluster angles
  const angleGroups = groupSimilar(angles);
  angleGroups.forEach(([label, items]) => {
    clusters.push({
      cluster_type: 'angle',
      label,
      examples: items.map((item, i) => ({ id: `angle-${i}`, snippet: item })),
      frequency: items.length,
      intensity: Math.min(items.length / 10, 1),
    });
  });

  // Cluster objections
  const objectionGroups = groupSimilar(objections);
  objectionGroups.forEach(([label, items]) => {
    clusters.push({
      cluster_type: 'objection',
      label,
      examples: items.map((item, i) => ({ id: `obj-${i}`, snippet: item })),
      frequency: items.length,
      intensity: Math.min(items.length / 5, 1),
    });
  });

  // Cluster features
  const featureGroups = groupSimilar(features);
  featureGroups.forEach(([label, items]) => {
    clusters.push({
      cluster_type: 'feature',
      label,
      examples: items.map((item, i) => ({ id: `feat-${i}`, snippet: item })),
      frequency: items.length,
      intensity: Math.min(items.length / 5, 1),
    });
  });

  return clusters;
}

function groupSimilar(items: string[]): [string, string[]][] {
  // Simple keyword-based grouping (could use embeddings for better results)
  const groups: Map<string, string[]> = new Map();
  
  items.forEach(item => {
    const normalized = item.toLowerCase().trim();
    let matched = false;
    
    for (const [key, group] of groups) {
      if (normalized.includes(key) || key.includes(normalized.split(' ')[0])) {
        group.push(item);
        matched = true;
        break;
      }
    }
    
    if (!matched && normalized.length > 0) {
      const key = normalized.split(' ').slice(0, 2).join(' ');
      groups.set(key, [item]);
    }
  });

  return Array.from(groups.entries())
    .filter(([, items]) => items.length >= 1)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);
}

function generateMockExtractions(
  ads: (MetaAd | GoogleAd)[],
  mentions: RedditMention[],
  niche: string
): { extractions: Extraction[]; clusters: Cluster[] } {
  const extractions: Extraction[] = [
    ...ads.slice(0, 5).map((ad, i) => ({
      source_type: 'ad' as const,
      source_id: `ad-${i}`,
      offers: ['Free trial', '30-day guarantee'],
      claims: [`Fast ${niche}`, 'AI-powered'],
      angles: ['speed', 'ease of use'],
      objections: [],
      desired_features: [],
      sentiment: { positive: 0.8, negative: 0.1, intensity: 0.6 },
    })),
    ...mentions.slice(0, 5).map((m, i) => ({
      source_type: 'reddit' as const,
      source_id: `mention-${i}`,
      offers: [],
      claims: [],
      angles: [],
      objections: ['Too expensive', 'Poor quality'],
      desired_features: ['Better accuracy', 'Lower price'],
      sentiment: { positive: 0.3, negative: 0.6, intensity: 0.7 },
    })),
  ];

  const clusters: Cluster[] = [
    {
      cluster_type: 'angle',
      label: 'Speed / Instant results',
      examples: [{ id: '1', snippet: 'in seconds' }],
      frequency: 8,
      intensity: 0.75,
    },
    {
      cluster_type: 'objection',
      label: 'Pricing concerns',
      examples: [{ id: '1', snippet: 'too expensive' }],
      frequency: 12,
      intensity: 0.85,
    },
    {
      cluster_type: 'feature',
      label: 'Better quality',
      examples: [{ id: '1', snippet: 'wish it worked better' }],
      frequency: 6,
      intensity: 0.65,
    },
  ];

  return { extractions, clusters };
}
