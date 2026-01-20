/**
 * Demand Intelligence Signal Collector
 * 
 * Aggregates signals from multiple sources to identify market opportunities
 */

import { createClient } from '@supabase/supabase-js';
import { collectRedditMentions, RedditMention } from '../collectors/reddit';
import { collectMetaAds, MetaAd } from '../collectors/meta';
import { collectGoogleTrends } from '../collectors/google-trends';
import { calculateSearchScore } from '../scoring/search-score';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// TYPES
// ============================================

export interface DemandSignal {
  niche: string;
  signal_type: 'pain_point' | 'ad_spend' | 'search' | 'content' | 'app' | 'social';
  source: 'reddit' | 'meta' | 'google' | 'youtube' | 'appstore' | 'tiktok';
  title?: string;
  content?: string;
  url?: string;
  score: number;
  raw_data?: Record<string, unknown>;
}

export interface NicheOpportunity {
  niche: string;
  demand_score: number;
  trend: 'rising' | 'stable' | 'declining' | 'new';
  pain_score: number;
  spend_score: number;
  search_score: number;
  content_score: number;
  app_score: number;
  signal_count: number;
}

export interface BuildRecommendation {
  niche: string;
  product_idea: string;
  product_type: string;
  target_audience: string;
  pain_points: string[];
  recommended_hooks: string[];
  confidence_score: number;
  reasoning: string;
}

// ============================================
// SIGNAL COLLECTION
// ============================================

/**
 * Collect pain point signals from Reddit
 */
export async function collectPainPointSignals(niche: string): Promise<DemandSignal[]> {
  const signals: DemandSignal[] = [];
  
  try {
    // Collect Reddit mentions
    const mentions = await collectRedditMentions(niche, [], []);
    
    for (const mention of mentions) {
      // Score based on engagement and relevance
      const score = calculatePainPointScore(mention);
      
      if (score > 20) { // Minimum threshold
        signals.push({
          niche,
          signal_type: 'pain_point',
          source: 'reddit',
          title: mention.title,
          content: mention.body,
          url: `https://reddit.com${mention.permalink}`,
          score,
          raw_data: mention.raw_payload,
        });
      }
    }
  } catch (error) {
    console.error(`Error collecting pain points for ${niche}:`, error);
  }
  
  return signals;
}

/**
 * Collect ad spend signals from Meta Ad Library
 */
export async function collectAdSpendSignals(niche: string): Promise<DemandSignal[]> {
  const signals: DemandSignal[] = [];
  
  try {
    const ads = await collectMetaAds(niche, [], 'US');
    
    // Group by advertiser
    const advertiserCounts = new Map<string, number>();
    for (const ad of ads) {
      const count = advertiserCounts.get(ad.advertiser_name) || 0;
      advertiserCounts.set(ad.advertiser_name, count + 1);
    }
    
    // Calculate ad spend score
    const score = calculateAdSpendScore(ads, advertiserCounts.size);
    
    signals.push({
      niche,
      signal_type: 'ad_spend',
      source: 'meta',
      title: `${ads.length} active ads from ${advertiserCounts.size} advertisers`,
      content: `Top advertisers: ${[...advertiserCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => `${name} (${count})`)
        .join(', ')}`,
      score,
      raw_data: {
        total_ads: ads.length,
        unique_advertisers: advertiserCounts.size,
        sample_ads: ads.slice(0, 10),
      },
    });
  } catch (error) {
    console.error(`Error collecting ad signals for ${niche}:`, error);
  }
  
  return signals;
}

/**
 * Collect search demand signals from Google Trends
 */
export async function collectSearchSignals(niche: string): Promise<DemandSignal[]> {
  const signals: DemandSignal[] = [];

  try {
    const trendsData = await collectGoogleTrends(niche);
    const score = calculateSearchScore(trendsData);

    signals.push({
      niche,
      signal_type: 'search',
      source: 'google',
      title: `${trendsData.searchVolume.toLocaleString()} monthly searches`,
      content: `Growth: ${(trendsData.growthRate * 100).toFixed(0)}%, Top queries: ${trendsData.relatedQueries.slice(0, 5).join(', ')}`,
      score,
      raw_data: {
        searchVolume: trendsData.searchVolume,
        growthRate: trendsData.growthRate,
        relatedQueries: trendsData.relatedQueries,
      },
    });
  } catch (error) {
    console.error(`Error collecting search signals for ${niche}:`, error);
  }

  return signals;
}

// ============================================
// SCORING FUNCTIONS
// ============================================

function calculatePainPointScore(mention: RedditMention): number {
  let score = 0;
  
  // Engagement score (0-40)
  score += Math.min(mention.score * 0.5, 20);
  score += Math.min((mention.num_comments || 0) * 0.5, 20);
  
  // Recency score (0-20)
  const daysAgo = (Date.now() - new Date(mention.posted_at).getTime()) / (1000 * 60 * 60 * 24);
  score += Math.max(0, 20 - daysAgo);
  
  // Content quality score (0-40)
  const bodyLength = mention.body.length;
  if (bodyLength > 200) score += 10;
  if (bodyLength > 500) score += 10;
  
  // Pain point indicators
  const painIndicators = [
    'struggling', 'frustrated', 'looking for', 'need help',
    'alternative to', 'better than', 'wish there was',
    'hate', 'annoying', 'terrible', 'problem with',
    'is there a tool', 'any recommendations', 'what do you use'
  ];
  
  const lowerBody = mention.body.toLowerCase();
  for (const indicator of painIndicators) {
    if (lowerBody.includes(indicator)) {
      score += 5;
    }
  }
  
  return Math.min(score, 100);
}

function calculateAdSpendScore(ads: MetaAd[], uniqueAdvertisers: number): number {
  let score = 0;
  
  // Volume score (0-40)
  score += Math.min(ads.length * 2, 40);
  
  // Advertiser diversity (0-30)
  score += Math.min(uniqueAdvertisers * 3, 30);
  
  // Active ads bonus (0-30)
  const activeAds = ads.filter(ad => ad.is_active).length;
  score += Math.min((activeAds / Math.max(ads.length, 1)) * 30, 30);
  
  return Math.min(score, 100);
}

// ============================================
// DATABASE OPERATIONS
// ============================================

/**
 * Store demand signals in database
 */
export async function storeSignals(signals: DemandSignal[]): Promise<void> {
  if (signals.length === 0) return;
  
  const { error } = await supabase
    .from('demand_signals')
    .insert(signals.map(s => ({
      niche: s.niche,
      signal_type: s.signal_type,
      source: s.source,
      title: s.title,
      content: s.content,
      url: s.url,
      score: s.score,
      raw_data: s.raw_data,
    })));
  
  if (error) {
    console.error('Error storing signals:', error);
    throw error;
  }
}

/**
 * Update niche opportunity scores
 */
export async function updateNicheScores(niche: string): Promise<void> {
  const { error } = await supabase.rpc('update_niche_scores', { p_niche: niche });
  
  if (error) {
    console.error('Error updating niche scores:', error);
    throw error;
  }
}

/**
 * Get top opportunities
 */
export async function getTopOpportunities(
  limit: number = 10,
  minScore: number = 50,
  trend?: string
): Promise<NicheOpportunity[]> {
  const { data, error } = await supabase.rpc('get_top_opportunities', {
    p_limit: limit,
    p_min_score: minScore,
    p_trend: trend || null,
  });
  
  if (error) {
    console.error('Error getting opportunities:', error);
    throw error;
  }
  
  return data || [];
}

// ============================================
// MAIN COLLECTION PIPELINE
// ============================================

/**
 * Run full signal collection for a niche
 */
export async function collectAllSignals(niche: string): Promise<{
  painPoints: DemandSignal[];
  adSpend: DemandSignal[];
  totalSignals: number;
}> {
  console.log(`Collecting signals for: ${niche}`);
  
  // Collect from all sources in parallel
  const [painPoints, adSpend] = await Promise.all([
    collectPainPointSignals(niche),
    collectAdSpendSignals(niche),
  ]);
  
  // Store all signals
  const allSignals = [...painPoints, ...adSpend];
  await storeSignals(allSignals);
  
  // Update niche scores
  await updateNicheScores(niche);
  
  console.log(`Collected ${allSignals.length} signals for ${niche}`);
  
  return {
    painPoints,
    adSpend,
    totalSignals: allSignals.length,
  };
}

/**
 * Run collection for all monitored niches
 */
export async function collectAllNicheSignals(): Promise<void> {
  // Get all niches to monitor
  const { data: niches, error } = await supabase
    .from('niche_opportunities')
    .select('niche')
    .eq('is_watching', true);
  
  if (error) {
    console.error('Error getting niches:', error);
    return;
  }
  
  // Collect for each niche
  for (const { niche } of niches || []) {
    try {
      await collectAllSignals(niche);
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error collecting for ${niche}:`, error);
    }
  }
}

// ============================================
// "WHAT TO BUILD NEXT" GENERATOR
// ============================================

/**
 * Generate build recommendations based on demand signals
 */
export async function generateBuildRecommendations(
  niche: string
): Promise<BuildRecommendation | null> {
  // Get recent signals for this niche
  const { data: signals, error: signalError } = await supabase
    .from('demand_signals')
    .select('*')
    .eq('niche', niche)
    .gte('detected_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('score', { ascending: false })
    .limit(20);
  
  if (signalError || !signals?.length) {
    return null;
  }
  
  // Extract pain points
  const painPoints = signals
    .filter(s => s.signal_type === 'pain_point')
    .map(s => s.content)
    .filter(Boolean)
    .slice(0, 5);
  
  // Extract winning ad hooks
  const adData = signals.find(s => s.signal_type === 'ad_spend')?.raw_data as any;
  const sampleAds = adData?.sample_ads || [];
  const hooks = sampleAds
    .map((ad: any) => ad.headline || ad.creative_text?.slice(0, 100))
    .filter(Boolean)
    .slice(0, 5);
  
  // Get niche score
  const { data: opportunity } = await supabase
    .from('niche_opportunities')
    .select('*')
    .eq('niche', niche)
    .single();
  
  // Generate recommendation
  const recommendation: BuildRecommendation = {
    niche,
    product_idea: generateProductIdea(niche, painPoints),
    product_type: inferProductType(niche),
    target_audience: inferTargetAudience(niche, painPoints),
    pain_points: painPoints as string[],
    recommended_hooks: hooks,
    confidence_score: opportunity?.demand_score || 50,
    reasoning: generateReasoning(niche, signals.length, opportunity),
  };
  
  // Store recommendation
  await supabase.from('build_recommendations').insert({
    niche,
    product_idea: recommendation.product_idea,
    product_type: recommendation.product_type,
    target_audience: recommendation.target_audience,
    pain_points: recommendation.pain_points,
    recommended_hooks: recommendation.recommended_hooks,
    confidence_score: recommendation.confidence_score,
    reasoning: recommendation.reasoning,
  });
  
  return recommendation;
}

// Helper functions for recommendation generation
function generateProductIdea(niche: string, painPoints: (string | null | undefined)[]): string {
  const nicheFormatted = niche.replace(/-/g, ' ');
  if (painPoints.length > 0) {
    return `A ${nicheFormatted} solution that addresses: ${painPoints[0]?.slice(0, 100)}...`;
  }
  return `A modern ${nicheFormatted} platform with AI-powered features`;
}

function inferProductType(niche: string): string {
  if (niche.includes('api') || niche.includes('tool')) return 'tool';
  if (niche.includes('marketplace')) return 'marketplace';
  return 'saas';
}

function inferTargetAudience(niche: string, painPoints: (string | null | undefined)[]): string {
  const nicheFormatted = niche.replace(/-/g, ' ');
  return `Professionals and businesses looking for ${nicheFormatted} solutions`;
}

function generateReasoning(niche: string, signalCount: number, opportunity: any): string {
  const score = opportunity?.demand_score || 0;
  const trend = opportunity?.trend || 'unknown';
  
  return `Based on ${signalCount} demand signals, this niche has a demand score of ${score}/100 with a ${trend} trend. ` +
    `Pain score: ${opportunity?.pain_score || 0}, Ad spend score: ${opportunity?.spend_score || 0}.`;
}
