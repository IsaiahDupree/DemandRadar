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
  };
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
    console.log(`[Run ${config.runId}] Starting data collection...`);

    const [metaAds, redditMentions, appStoreResults] = await Promise.allSettled([
      collectMetaAds(config.nicheQuery, config.seedTerms, config.geo),
      collectRedditMentions(config.nicheQuery, config.seedTerms, config.competitors),
      collectAppStoreResults(config.nicheQuery, config.seedTerms),
    ]);

    // Extract results (use empty arrays if any failed)
    const ads = metaAds.status === 'fulfilled' ? metaAds.value : [];
    const mentions = redditMentions.status === 'fulfilled' ? redditMentions.value : [];
    const apps = appStoreResults.status === 'fulfilled' ? appStoreResults.value : [];

    console.log(`[Run ${config.runId}] Collected: ${ads.length} ads, ${mentions.length} Reddit mentions, ${apps.length} apps`);

    // Phase 2: Normalize and save to database
    await Promise.all([
      saveAdCreatives(config.runId, ads, supabase),
      saveRedditMentions(config.runId, mentions, supabase),
      saveAppStoreResults(config.runId, apps, supabase),
    ]);

    // Phase 3: Update run status to complete
    await updateRunStatus(config.runId, 'complete', {
      finished_at: new Date().toISOString(),
      scores: {
        ads_collected: ads.length,
        reddit_mentions: mentions.length,
        app_store_results: apps.length,
      },
    });

    return {
      success: true,
      runId: config.runId,
      stats: {
        adsCollected: ads.length,
        redditMentions: mentions.length,
        appStoreResults: apps.length,
      },
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
  ads: MetaAd[],
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  if (ads.length === 0) return;

  const records = ads.map(ad => ({
    run_id: runId,
    source: ad.source,
    advertiser_name: ad.advertiser_name,
    creative_text: ad.creative_text,
    headline: ad.headline,
    description: ad.description,
    cta: ad.cta,
    landing_url: ad.landing_url,
    first_seen: ad.first_seen,
    last_seen: ad.last_seen,
    is_active: ad.is_active,
    media_type: ad.media_type,
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
