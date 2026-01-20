/**
 * Competitor Snapshot Collector
 *
 * Collects ad data snapshots for tracked competitors from Meta Ad Library.
 * Compares with previous snapshots to detect new and stopped ads.
 *
 * Feature: INTEL-004
 */

import { createClient } from '@/lib/supabase/server';

// Import from meta collector (we'll use internal function via require)
// This is a workaround since searchMetaAdLibrary is not exported
interface MetaAd {
  id?: string;
  advertiser_name: string;
  creative_text: string;
  headline?: string;
  description?: string;
  cta?: string;
  landing_url?: string;
  first_seen?: string;
  last_seen?: string;
  is_active?: boolean;
  media_type?: 'image' | 'video' | 'carousel' | 'unknown';
  run_days?: number;
}

interface TrackedCompetitor {
  id: string;
  user_id: string;
  competitor_name: string;
  competitor_domain: string | null;
  meta_page_id: string | null;
  track_ads: boolean;
  is_active: boolean;
}

interface CompetitorSnapshot {
  competitor_id: string;
  active_ads_count: number;
  new_ads_count: number;
  stopped_ads_count: number;
  ads: AdSummary[];
  newAds?: AdSummary[];
  stoppedAds?: AdSummary[];
}

interface AdSummary {
  id: string;
  headline: string;
  body: string;
  started_running?: string;
  run_days?: number;
}

interface PreviousSnapshot {
  snapshot_date: string;
  ads_data: AdSummary[];
}

/**
 * Collect a snapshot of competitor's current ad activity
 */
export async function collectCompetitorSnapshot(
  competitor: TrackedCompetitor
): Promise<CompetitorSnapshot> {
  // Skip if no Meta page ID configured
  if (!competitor.meta_page_id) {
    return {
      competitor_id: competitor.id,
      active_ads_count: 0,
      new_ads_count: 0,
      stopped_ads_count: 0,
      ads: [],
    };
  }

  // Fetch current ads from Meta Ad Library
  const currentAds = await fetchCompetitorAds(
    competitor.competitor_name,
    'US'
  );

  // Convert to ad summaries
  const currentAdSummaries = currentAds.map(adToSummary);

  // Get previous snapshot for comparison
  const previousSnapshot = await getPreviousSnapshot(competitor.id);

  // Calculate new and stopped ads
  let newAdsCount = 0;
  let stoppedAdsCount = 0;
  const newAds: AdSummary[] = [];
  const stoppedAds: AdSummary[] = [];

  if (previousSnapshot) {
    const previousAdIds = new Set(
      previousSnapshot.ads_data.map((ad) => ad.id)
    );
    const currentAdIds = new Set(currentAdSummaries.map((ad) => ad.id));

    // Find new ads (in current but not in previous)
    for (const ad of currentAdSummaries) {
      if (!previousAdIds.has(ad.id)) {
        newAds.push(ad);
        newAdsCount++;
      }
    }

    // Find stopped ads (in previous but not in current)
    for (const ad of previousSnapshot.ads_data) {
      if (!currentAdIds.has(ad.id)) {
        stoppedAds.push(ad);
        stoppedAdsCount++;
      }
    }
  }

  return {
    competitor_id: competitor.id,
    active_ads_count: currentAdSummaries.length,
    new_ads_count: newAdsCount,
    stopped_ads_count: stoppedAdsCount,
    ads: currentAdSummaries,
    newAds,
    stoppedAds,
  };
}

/**
 * Fetch ads from Meta Ad Library for a competitor
 * This is a wrapper around the internal Meta collector function
 */
async function fetchCompetitorAds(
  competitorName: string,
  country: string = 'US'
): Promise<MetaAd[]> {
  try {
    // Dynamic import to access the internal function
    // In a real implementation, we'd make searchMetaAdLibrary exported
    // For now, we'll use a simplified approach
    const metaModule = await import('@/lib/collectors/meta');

    // Check if the function exists (it's not exported in the current version)
    // @ts-ignore - accessing internal function
    if (typeof metaModule.searchMetaAdLibrary === 'function') {
      // @ts-ignore
      return await metaModule.searchMetaAdLibrary(competitorName, country);
    }

    // Fallback: call the main collectMetaAds function
    const ads = await metaModule.collectMetaAds(competitorName, [], country);
    return ads;
  } catch (error) {
    console.error('Error fetching competitor ads:', error);
    throw error;
  }
}

/**
 * Get the most recent snapshot for a competitor
 */
async function getPreviousSnapshot(
  competitorId: string
): Promise<PreviousSnapshot | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('competitor_snapshots')
      .select('snapshot_date, ads_data')
      .eq('competitor_id', competitorId)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data as PreviousSnapshot;
  } catch (error) {
    // No previous snapshot exists
    return null;
  }
}

/**
 * Convert MetaAd to simplified AdSummary for storage
 */
function adToSummary(ad: MetaAd): AdSummary {
  return {
    id: ad.id || generateAdId(ad),
    headline: ad.headline || ad.advertiser_name,
    body: ad.creative_text || '',
    started_running: ad.first_seen,
    run_days: ad.run_days || 0,
  };
}

/**
 * Generate a unique ID for an ad based on its content
 */
function generateAdId(ad: MetaAd): string {
  const content = `${ad.advertiser_name}-${ad.headline}-${ad.creative_text}`.slice(
    0,
    100
  );
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `ad-${Math.abs(hash)}`;
}

/**
 * Save a snapshot to the database
 */
export async function saveCompetitorSnapshot(
  snapshot: CompetitorSnapshot
): Promise<void> {
  const supabase = await createClient();

  const today = new Date().toISOString().split('T')[0];

  const { error } = await supabase.from('competitor_snapshots').upsert(
    {
      competitor_id: snapshot.competitor_id,
      snapshot_date: today,
      active_ads_count: snapshot.active_ads_count,
      new_ads_count: snapshot.new_ads_count,
      stopped_ads_count: snapshot.stopped_ads_count,
      ads_data: snapshot.ads,
      changes: snapshot.newAds || snapshot.stoppedAds ? {
        new_ads: snapshot.newAds || [],
        stopped_ads: snapshot.stoppedAds || [],
      } : null,
    },
    {
      onConflict: 'competitor_id,snapshot_date',
    }
  );

  if (error) {
    console.error('Error saving snapshot:', error);
    throw error;
  }
}
