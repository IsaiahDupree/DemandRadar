/**
 * Run Orchestrator
 *
 * Coordinates all collectors and normalizers to execute a full market analysis run.
 * Manages the lifecycle of a run from queued → running → complete/failed.
 */

import { createClient } from '@/lib/supabase/server';
import { collectMetaAds, type MetaAd } from '../collectors/meta';
import { collectRedditMentions, type RedditMention } from '../collectors/reddit';
import { collectAppStoreResults, type AppStoreResult } from '../collectors/appstore';
import { collectGoogleAds, type GoogleAd } from '../collectors/google';
import { extractInsights, type Extraction, type Cluster } from '../ai/extractor';
import { generateGaps, type GapOpportunity } from '../ai/gap-generator';
import { generateConcepts, type ConceptIdea } from '../ai/concept-generator';
import { generateThreePercentBetterPlans, type ThreePercentBetterPlan } from '../ai/three-percent-better';
import { calculateRunScores, type RunData, type RunScores } from '../scoring/formulas';

export interface RunConfig {
  runId: string;
  userId: string;
  nicheQuery: string;
  seedTerms: string[];
  competitors: string[];
  geo: string;
  runType: 'light' | 'deep';
}

export interface RunResult {
  success: boolean;
  runId: string;
  stats: {
    adsCollected: number;
    redditMentions: number;
    appStoreResults: number;
    extractionsCreated: number;
    clustersCreated: number;
    gapsIdentified: number;
    conceptsGenerated: number;
    plansCreated: number;
  };
  scores?: RunScores;
  error?: string;
}

/**
 * Execute a full market analysis run
 */
export async function executeRun(config: RunConfig): Promise<RunResult> {
  const supabase = await createClient();

  try {
    // Update run status to 'running'
    await updateRunStatus(config.runId, 'running', { started_at: new Date().toISOString() });

    // Phase 1: Data Collection
    console.log(`[Run ${config.runId}] Phase 1: Data Collection...`);

    const [metaAdsResult, googleAdsResult, redditMentions, appStoreResults] = await Promise.allSettled([
      collectMetaAds(config.nicheQuery, config.seedTerms, config.geo),
      collectGoogleAds(config.nicheQuery, config.seedTerms, { country: config.geo }),
      collectRedditMentions(config.nicheQuery, config.seedTerms, config.competitors),
      collectAppStoreResults(config.nicheQuery, config.seedTerms),
    ]);

    // Extract results (use empty arrays if any failed)
    const metaAds = metaAdsResult.status === 'fulfilled' ? metaAdsResult.value : [];
    const googleAds = googleAdsResult.status === 'fulfilled' ? googleAdsResult.value : [];
    const allAds = [...metaAds, ...googleAds];
    const mentions = redditMentions.status === 'fulfilled' ? redditMentions.value : [];
    const apps = appStoreResults.status === 'fulfilled' ? appStoreResults.value : [];

    console.log(`[Run ${config.runId}] Collected: ${allAds.length} ads (${metaAds.length} Meta + ${googleAds.length} Google), ${mentions.length} Reddit mentions, ${apps.length} apps`);

    // Phase 2: Normalize and save to database
    console.log(`[Run ${config.runId}] Phase 2: Saving to database...`);
    await Promise.all([
      saveAdCreatives(config.runId, allAds, supabase),
      saveRedditMentions(config.runId, mentions, supabase),
      saveAppStoreResults(config.runId, apps, supabase),
    ]);

    // Phase 3: AI Analysis (Extraction + Clustering)
    console.log(`[Run ${config.runId}] Phase 3: AI Analysis...`);
    const { extractions, clusters } = await extractInsights(allAds, mentions, config.nicheQuery);
    console.log(`[Run ${config.runId}] Created ${extractions.length} extractions, ${clusters.length} clusters`);

    await Promise.all([
      saveExtractions(config.runId, extractions, supabase),
      saveClusters(config.runId, clusters, supabase),
    ]);

    // Phase 4: Gap Detection
    console.log(`[Run ${config.runId}] Phase 4: Gap Detection...`);
    const gaps = await generateGaps(clusters, allAds, mentions, config.nicheQuery);
    console.log(`[Run ${config.runId}] Identified ${gaps.length} gap opportunities`);

    await saveGaps(config.runId, gaps, supabase);

    // Phase 5: Scoring
    console.log(`[Run ${config.runId}] Phase 5: Calculating Scores...`);
    const scores = calculateScores(allAds, mentions, extractions, clusters, gaps);
    console.log(`[Run ${config.runId}] Opportunity Score: ${scores.opportunity}`);

    // Phase 6: Concept Generation
    console.log(`[Run ${config.runId}] Phase 6: Generating Concepts...`);
    const concepts = await generateConcepts(gaps, clusters, apps, config.nicheQuery);
    console.log(`[Run ${config.runId}] Generated ${concepts.length} concept ideas`);

    await saveConcepts(config.runId, concepts, supabase);

    // Phase 7: 3% Better Plans
    console.log(`[Run ${config.runId}] Phase 7: Generating 3% Better Plans...`);
    const plans = await generateThreePercentBetterPlans(gaps, clusters, config.nicheQuery);
    console.log(`[Run ${config.runId}] Created ${plans.length} action plans`);

    // Save plans as JSONB in gaps table or separate table
    await savePlans(config.runId, plans, supabase);

    // Phase 8: Complete
    console.log(`[Run ${config.runId}] Complete! Finalizing...`);
    await updateRunStatus(config.runId, 'complete', {
      finished_at: new Date().toISOString(),
      scores: {
        ads_collected: allAds.length,
        reddit_mentions: mentions.length,
        app_store_results: apps.length,
        extractions: extractions.length,
        clusters: clusters.length,
        gaps: gaps.length,
        concepts: concepts.length,
        opportunity_score: scores.opportunity,
        confidence: scores.confidence,
      },
    });

    return {
      success: true,
      runId: config.runId,
      stats: {
        adsCollected: allAds.length,
        redditMentions: mentions.length,
        appStoreResults: apps.length,
        extractionsCreated: extractions.length,
        clustersCreated: clusters.length,
        gapsIdentified: gaps.length,
        conceptsGenerated: concepts.length,
        plansCreated: plans.length,
      },
      scores,
    };
  } catch (error) {
    console.error(`[Run ${config.runId}] Error:`, error);

    await updateRunStatus(config.runId, 'failed', {
      finished_at: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      runId: config.runId,
      stats: {
        adsCollected: 0,
        redditMentions: 0,
        appStoreResults: 0,
        extractionsCreated: 0,
        clustersCreated: 0,
        gapsIdentified: 0,
        conceptsGenerated: 0,
        plansCreated: 0,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update run status in the database
 */
async function updateRunStatus(
  runId: string,
  status: 'queued' | 'running' | 'complete' | 'failed',
  additionalData?: Record<string, unknown>
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('runs')
    .update({
      status,
      ...additionalData,
    })
    .eq('id', runId);

  if (error) {
    console.error(`Failed to update run ${runId} status:`, error);
    throw error;
  }
}

/**
 * Save Meta/Google ad creatives to database
 */
async function saveAdCreatives(
  runId: string,
  ads: (MetaAd | GoogleAd)[],
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  if (ads.length === 0) return;

  const records = ads.map(ad => ({
    run_id: runId,
    source: ad.source,
    advertiser_name: ad.advertiser_name,
    creative_text: 'creative_text' in ad ? ad.creative_text : (ad.headline || ad.description),
    headline: ad.headline,
    description: ad.description,
    cta: 'cta' in ad ? ad.cta : undefined,
    landing_url: 'landing_url' in ad ? ad.landing_url : ('final_url' in ad ? ad.final_url : undefined),
    first_seen: ad.first_seen,
    last_seen: ad.last_seen,
    is_active: 'is_active' in ad ? ad.is_active : undefined,
    media_type: 'media_type' in ad ? ad.media_type : ('ad_type' in ad ? ad.ad_type : undefined),
    raw_payload: ad.raw_payload,
  }));

  const { error } = await supabase
    .from('ad_creatives')
    .insert(records);

  if (error) {
    console.error('Failed to save ad creatives:', error);
    throw error;
  }

  console.log(`Saved ${ads.length} ad creatives`);
}

/**
 * Save Reddit mentions to database
 */
async function saveRedditMentions(
  runId: string,
  mentions: RedditMention[],
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  if (mentions.length === 0) return;

  const records = mentions.map(mention => ({
    run_id: runId,
    subreddit: mention.subreddit,
    type: mention.type,
    title: mention.title,
    body: mention.body,
    score: mention.score,
    num_comments: mention.num_comments,
    permalink: mention.permalink,
    matched_entities: mention.matched_entities,
    posted_at: mention.posted_at,
    raw_payload: mention.raw_payload,
  }));

  const { error } = await supabase
    .from('reddit_mentions')
    .insert(records);

  if (error) {
    console.error('Failed to save Reddit mentions:', error);
    throw error;
  }

  console.log(`Saved ${mentions.length} Reddit mentions`);
}

/**
 * Save app store results to database
 */
async function saveAppStoreResults(
  runId: string,
  apps: AppStoreResult[],
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  if (apps.length === 0) return;

  const records = apps.map(app => ({
    run_id: runId,
    platform: app.platform,
    app_name: app.app_name,
    app_id: app.app_id,
    developer: app.developer,
    rating: app.rating,
    review_count: app.review_count,
    description: app.description,
    category: app.category,
    price: app.price,
    raw_payload: app.raw_payload,
  }));

  const { error } = await supabase
    .from('app_store_results')
    .insert(records);

  if (error) {
    console.error('Failed to save app store results:', error);
    throw error;
  }

  console.log(`Saved ${apps.length} app store results`);
}

/**
 * Save LLM extractions to database
 */
async function saveExtractions(
  runId: string,
  extractions: Extraction[],
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  if (extractions.length === 0) return;

  const records = extractions.map(ext => ({
    run_id: runId,
    source_type: ext.source_type,
    source_id: ext.source_id,
    offers: ext.offers,
    claims: ext.claims,
    angles: ext.angles,
    objections: ext.objections,
    desired_features: ext.desired_features,
    sentiment: ext.sentiment,
  }));

  const { error } = await supabase
    .from('extractions')
    .insert(records);

  if (error) {
    console.error('Failed to save extractions:', error);
    throw error;
  }

  console.log(`Saved ${extractions.length} extractions`);
}

/**
 * Save clusters to database
 */
async function saveClusters(
  runId: string,
  clusters: Cluster[],
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  if (clusters.length === 0) return;

  const records = clusters.map(cluster => ({
    run_id: runId,
    cluster_type: cluster.cluster_type,
    label: cluster.label,
    examples: cluster.examples,
    frequency: cluster.frequency,
    intensity: cluster.intensity,
  }));

  const { error } = await supabase
    .from('clusters')
    .insert(records);

  if (error) {
    console.error('Failed to save clusters:', error);
    throw error;
  }

  console.log(`Saved ${clusters.length} clusters`);
}

/**
 * Save gap opportunities to database
 */
async function saveGaps(
  runId: string,
  gaps: GapOpportunity[],
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  if (gaps.length === 0) return;

  const records = gaps.map(gap => ({
    run_id: runId,
    gap_type: gap.gap_type,
    title: gap.title,
    problem: gap.problem,
    evidence_ads: gap.evidence_ads,
    evidence_reddit: gap.evidence_reddit,
    recommendation: gap.recommendation,
    opportunity_score: gap.opportunity_score,
    confidence: gap.confidence,
  }));

  const { error } = await supabase
    .from('gap_opportunities')
    .insert(records);

  if (error) {
    console.error('Failed to save gaps:', error);
    throw error;
  }

  console.log(`Saved ${gaps.length} gap opportunities`);
}

/**
 * Save concept ideas to database
 */
async function saveConcepts(
  runId: string,
  concepts: ConceptIdea[],
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  if (concepts.length === 0) return;

  for (const concept of concepts) {
    // Insert concept idea
    const { data: conceptData, error: conceptError } = await supabase
      .from('concept_ideas')
      .insert({
        run_id: runId,
        name: concept.name,
        one_liner: concept.one_liner,
        platform_recommendation: concept.platform_recommendation,
        platform_reasoning: concept.platform_reasoning,
        industry: concept.industry,
        icp: concept.icp,
        business_model: concept.business_model,
        gap_thesis: concept.gap_thesis,
        mvp_spec: concept.mvp_spec,
      })
      .select()
      .single();

    if (conceptError) {
      console.error('Failed to save concept:', conceptError);
      continue;
    }

    // Insert concept metrics if available
    if (concept.metrics && conceptData) {
      const { error: metricsError } = await supabase
        .from('concept_metrics')
        .insert({
          concept_id: conceptData.id,
          cpc_low: concept.metrics.cpc_low,
          cpc_expected: concept.metrics.cpc_expected,
          cpc_high: concept.metrics.cpc_high,
          cac_low: concept.metrics.cac_low,
          cac_expected: concept.metrics.cac_expected,
          cac_high: concept.metrics.cac_high,
          tam_low: concept.metrics.tam_low,
          tam_expected: concept.metrics.tam_expected,
          tam_high: concept.metrics.tam_high,
          implementation_difficulty: concept.metrics.implementation_difficulty,
          human_touch_level: concept.metrics.human_touch_level,
          autonomous_suitability: concept.metrics.autonomous_suitability,
          build_difficulty: concept.metrics.build_difficulty,
          distribution_difficulty: concept.metrics.distribution_difficulty,
          opportunity_score: concept.metrics.opportunity_score,
          confidence: concept.metrics.confidence,
        });

      if (metricsError) {
        console.error('Failed to save concept metrics:', metricsError);
      }
    }
  }

  console.log(`Saved ${concepts.length} concept ideas`);
}

/**
 * Save 3% Better Plans as JSONB in run metadata
 */
async function savePlans(
  runId: string,
  plans: ThreePercentBetterPlan[],
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  if (plans.length === 0) return;

  // Store plans in run metadata
  const { error } = await supabase
    .from('runs')
    .update({
      three_percent_better_plans: plans,
    })
    .eq('id', runId);

  if (error) {
    console.error('Failed to save plans:', error);
    // Don't throw - plans are optional
  } else {
    console.log(`Saved ${plans.length} 3% better plans`);
  }
}

/**
 * Calculate all scores for a run
 */
function calculateScores(
  ads: (MetaAd | GoogleAd)[],
  mentions: RedditMention[],
  extractions: Extraction[],
  clusters: Cluster[],
  gaps: GapOpportunity[]
): RunScores {
  // Calculate days running for each ad
  const daysRunning = ads.map(ad => {
    if (!ad.first_seen) return 0;
    const firstSeen = new Date(ad.first_seen);
    const lastSeen = ad.last_seen ? new Date(ad.last_seen) : new Date();
    return Math.floor((lastSeen.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24));
  });

  // Extract angles and pains from clusters
  const angleClusters = clusters.filter(c => c.cluster_type === 'angle');
  const objectionClusters = clusters.filter(c => c.cluster_type === 'objection');

  const topAngles = angleClusters.map(c => c.label);
  const topPains = objectionClusters.map(c => c.label);

  // Calculate repetition index (top 3 angles' share)
  const totalAngleFrequency = angleClusters.reduce((sum, c) => sum + c.frequency, 0);
  const top3AngleFrequency = angleClusters.slice(0, 3).reduce((sum, c) => sum + c.frequency, 0);
  const repetitionIndex = totalAngleFrequency > 0 ? top3AngleFrequency / totalAngleFrequency : 0;

  // Extract sentiment data from Reddit extractions
  const redditExtractions = extractions.filter(e => e.source_type === 'reddit');
  const avgNegSentiment = redditExtractions.length > 0
    ? redditExtractions.reduce((sum, e) => sum + e.sentiment.negative, 0) / redditExtractions.length
    : 0;
  const avgIntensity = objectionClusters.length > 0
    ? objectionClusters.reduce((sum, c) => sum + c.intensity, 0) / objectionClusters.length
    : 0;

  const runData: RunData = {
    ads: {
      count: ads.length,
      uniqueAdvertisers: new Set(ads.map(a => a.advertiser_name)).size,
      totalCreatives: ads.length,
      topAngles,
      daysRunning,
      repetitionIndex,
    },
    reddit: {
      count: mentions.length,
      topPains,
      painFrequency: objectionClusters.reduce((sum, c) => sum + c.frequency, 0),
      painIntensity: avgIntensity,
      negSentimentRatio: avgNegSentiment,
      weightedScore: mentions.reduce((sum, m) => sum + m.score, 0),
    },
    gaps: {
      promiseCoverage: calculatePromiseCoverage(topAngles, topPains),
      missingFeatureRate: calculateMissingFeatureRate(clusters),
      trustGap: calculateTrustGap(gaps),
    },
    meta: {
      oldestDataDate: ads.length > 0 && ads[0].first_seen ? new Date(Math.min(...ads.filter(a => a.first_seen).map(a => new Date(a.first_seen!).getTime()))) : new Date(),
      newestDataDate: new Date(),
    },
  };

  return calculateRunScores(runData);
}

function calculatePromiseCoverage(angles: string[], pains: string[]): number {
  if (angles.length === 0 || pains.length === 0) return 0.5;

  const angleWords = new Set(angles.flatMap(a => a.toLowerCase().split(/\s+/)));
  const painWords = new Set(pains.flatMap(p => p.toLowerCase().split(/\s+/)));

  const overlap = [...angleWords].filter(w => painWords.has(w)).length;
  return Math.min(overlap / painWords.size, 1);
}

function calculateMissingFeatureRate(clusters: Cluster[]): number {
  const featureClusters = clusters.filter(c => c.cluster_type === 'feature');
  const angleClusters = clusters.filter(c => c.cluster_type === 'angle');

  if (featureClusters.length === 0) return 0;
  if (angleClusters.length === 0) return 1;

  return Math.min(featureClusters.length / (angleClusters.length + featureClusters.length), 1);
}

function calculateTrustGap(gaps: GapOpportunity[]): number {
  const trustGaps = gaps.filter(g => g.gap_type === 'trust');
  if (trustGaps.length === 0) return 0;

  const avgScore = trustGaps.reduce((sum, g) => sum + g.opportunity_score, 0) / trustGaps.length;
  return avgScore / 100;
}
