/**
 * Competitor Change Detection Engine
 *
 * Detects significant changes in competitor ad activity:
 * - New campaigns (new ads launched)
 * - Stopped campaigns (long-running ads stopped)
 * - Ad volume spikes (significant increase in ad count)
 * - Creative shifts (major messaging changes)
 *
 * Feature: INTEL-005
 */

export type ChangeType =
  | 'new_campaign' // New ad creative launched
  | 'campaign_ended' // Long-running ad stopped
  | 'ad_spike' // Significant increase in ad count
  | 'creative_shift' // Major change in creative style
  | 'messaging_change' // New value props or hooks
  | 'pricing_change' // Pricing page update
  | 'new_feature'; // Feature announcement

export type Significance = 'low' | 'medium' | 'high';

export interface CompetitorChange {
  type: ChangeType;
  competitor_id: string;
  detected_at: Date;
  data: any;
  significance: Significance;
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

interface Snapshot {
  competitor_id: string;
  active_ads_count: number;
  ads: Ad[];
}

interface Ad {
  id: string;
  headline: string;
  body?: string;
  run_days?: number;
}

/**
 * Detect changes between two competitor snapshots
 */
export async function detectCompetitorChanges(
  competitor: TrackedCompetitor,
  previousSnapshot: Snapshot,
  currentSnapshot: Snapshot
): Promise<CompetitorChange[]> {
  const changes: CompetitorChange[] = [];

  // 1. Detect new campaigns (new ads)
  const newAdsChange = detectNewCampaigns(
    competitor,
    previousSnapshot,
    currentSnapshot
  );
  if (newAdsChange) {
    changes.push(newAdsChange);
  }

  // 2. Detect stopped campaigns (especially long-running ones)
  const stoppedAdsChange = detectStoppedCampaigns(
    competitor,
    previousSnapshot,
    currentSnapshot
  );
  if (stoppedAdsChange) {
    changes.push(stoppedAdsChange);
  }

  // 3. Detect ad volume spikes
  const adSpikeChange = detectAdSpike(
    competitor,
    previousSnapshot,
    currentSnapshot
  );
  if (adSpikeChange) {
    changes.push(adSpikeChange);
  }

  return changes;
}

/**
 * Detect new campaigns (new ads launched)
 */
function detectNewCampaigns(
  competitor: TrackedCompetitor,
  previousSnapshot: Snapshot,
  currentSnapshot: Snapshot
): CompetitorChange | null {
  const previousAdIds = new Set(previousSnapshot.ads.map((ad) => ad.id));
  const newAds = currentSnapshot.ads.filter(
    (ad) => !previousAdIds.has(ad.id)
  );

  if (newAds.length === 0) {
    return null;
  }

  return {
    type: 'new_campaign',
    competitor_id: competitor.id,
    detected_at: new Date(),
    data: {
      ads: newAds,
      count: newAds.length,
    },
    significance: newAds.length > 5 ? 'high' : 'medium',
  };
}

/**
 * Detect stopped campaigns (especially long-running winners)
 */
function detectStoppedCampaigns(
  competitor: TrackedCompetitor,
  previousSnapshot: Snapshot,
  currentSnapshot: Snapshot
): CompetitorChange | null {
  const currentAdIds = new Set(currentSnapshot.ads.map((ad) => ad.id));
  const stoppedAds = previousSnapshot.ads.filter(
    (ad) => !currentAdIds.has(ad.id)
  );

  // Only flag stopped ads that were running for 30+ days (winners)
  const stoppedWinners = stoppedAds.filter(
    (ad) => (ad.run_days || 0) > 30
  );

  if (stoppedWinners.length === 0) {
    return null;
  }

  return {
    type: 'campaign_ended',
    competitor_id: competitor.id,
    detected_at: new Date(),
    data: {
      ads: stoppedWinners,
      count: stoppedWinners.length,
    },
    significance: 'medium',
  };
}

/**
 * Detect ad volume spikes (>50% increase)
 */
function detectAdSpike(
  competitor: TrackedCompetitor,
  previousSnapshot: Snapshot,
  currentSnapshot: Snapshot
): CompetitorChange | null {
  const adCountChange =
    currentSnapshot.active_ads_count - previousSnapshot.active_ads_count;

  if (previousSnapshot.active_ads_count === 0) {
    return null; // Can't calculate percentage change
  }

  const percentChange =
    (adCountChange / previousSnapshot.active_ads_count) * 100;

  // Only flag spikes >50%
  if (percentChange <= 50) {
    return null;
  }

  return {
    type: 'ad_spike',
    competitor_id: competitor.id,
    detected_at: new Date(),
    data: {
      previous: previousSnapshot.active_ads_count,
      current: currentSnapshot.active_ads_count,
      percent_change: Math.round(percentChange),
    },
    significance: 'high',
  };
}

/**
 * Analyze creative shifts using LLM (optional advanced feature)
 * This would require OpenAI integration
 */
export async function analyzeCreativeShift(
  previousAds: Ad[],
  newAds: Ad[]
): Promise<{ detected: boolean; summary?: string; details?: any }> {
  // Placeholder for LLM integration
  // In a full implementation, this would call OpenAI GPT-4o
  // to analyze if there's a significant messaging or creative shift

  // For now, return a simple heuristic check
  if (newAds.length < 3) {
    return { detected: false };
  }

  // Could analyze:
  // - Common themes in headlines
  // - Shift in tone/messaging
  // - New value propositions
  // - Different target audiences

  return {
    detected: false,
    summary: 'LLM analysis not yet implemented',
  };
}
