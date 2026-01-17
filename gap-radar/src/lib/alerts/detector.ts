/**
 * Alert Detection System
 *
 * Detects significant changes in demand signals and generates alerts
 * for users between weekly briefs.
 */

import { createClient } from '@/lib/supabase/server';

export type AlertType =
  | 'competitor_price'
  | 'trend_spike'
  | 'new_angle'
  | 'pain_surge'
  | 'feature_change';

export type AlertUrgency = 'low' | 'medium' | 'high';

export interface Alert {
  niche_id: string;
  alert_type: AlertType;
  title: string;
  body: string;
  urgency: AlertUrgency;
}

export interface DemandSnapshot {
  id: string;
  niche_id: string;
  week_start: string;
  demand_score: number;
  demand_score_change: number;
  trend: 'up' | 'down' | 'stable';
  ad_signals: {
    new_advertisers: number;
    top_angles: string[];
    top_offers: string[];
    avg_longevity_days: number;
  };
  search_signals: {
    rising_keywords: string[];
    buyer_intent_keywords: string[];
    volume_change_pct: number;
  };
  ugc_signals: {
    top_formats: string[];
    engagement_rates: Record<string, number>;
    trending_hooks: string[];
  };
  forum_signals: {
    top_complaints: string[];
    top_desires: string[];
    sentiment_breakdown: Record<string, number>;
  };
  competitor_signals: {
    pricing_changes: Array<{ competitor: string; old_price: number; new_price: number }>;
    feature_changes: Array<{ competitor: string; feature: string }>;
    new_entrants: string[];
  };
}

/**
 * Detect trend spikes in demand score
 */
function detectTrendSpike(
  current: DemandSnapshot,
  previous: DemandSnapshot | null
): Alert | null {
  if (!previous) return null;

  const scoreChange = current.demand_score - previous.demand_score;

  // Spike: >15 point increase
  if (scoreChange >= 15) {
    return {
      niche_id: current.niche_id,
      alert_type: 'trend_spike',
      title: `Demand spike detected (+${scoreChange} points)`,
      body: `Your niche is showing a significant demand increase. Score jumped from ${previous.demand_score} to ${current.demand_score}. This could be a great time to increase ad spend or launch new campaigns.`,
      urgency: scoreChange >= 25 ? 'high' : 'medium',
    };
  }

  // Search volume spike
  if (current.search_signals.volume_change_pct >= 50) {
    return {
      niche_id: current.niche_id,
      alert_type: 'trend_spike',
      title: `Search volume spike (+${current.search_signals.volume_change_pct}%)`,
      body: `Search interest in your niche has surged. Rising keywords: ${current.search_signals.rising_keywords.slice(0, 3).join(', ')}. Consider capitalizing on this momentum.`,
      urgency: current.search_signals.volume_change_pct >= 100 ? 'high' : 'medium',
    };
  }

  return null;
}

/**
 * Detect new advertising angles competitors are using
 */
function detectNewAngles(
  current: DemandSnapshot,
  previous: DemandSnapshot | null
): Alert | null {
  if (!previous) return null;

  const currentAngles = new Set(current.ad_signals.top_angles);
  const previousAngles = new Set(previous.ad_signals.top_angles);

  const newAngles = [...currentAngles].filter((angle) => !previousAngles.has(angle));

  if (newAngles.length >= 2) {
    return {
      niche_id: current.niche_id,
      alert_type: 'new_angle',
      title: `${newAngles.length} new messaging angles spotted`,
      body: `Competitors are testing new approaches: "${newAngles.slice(0, 3).join('", "')}". Consider whether these angles address pain points you're missing.`,
      urgency: newAngles.length >= 5 ? 'high' : 'medium',
    };
  }

  return null;
}

/**
 * Detect competitor pricing changes
 */
function detectPricingChanges(current: DemandSnapshot): Alert | null {
  const pricingChanges = current.competitor_signals.pricing_changes;

  if (pricingChanges.length === 0) return null;

  const significantChanges = pricingChanges.filter((change) => {
    const percentChange = Math.abs(
      ((change.new_price - change.old_price) / change.old_price) * 100
    );
    return percentChange >= 10;
  });

  if (significantChanges.length > 0) {
    const change = significantChanges[0];
    const direction = change.new_price > change.old_price ? 'increased' : 'decreased';
    const percentChange = (
      Math.abs((change.new_price - change.old_price) / change.old_price) * 100
    ).toFixed(0);

    return {
      niche_id: current.niche_id,
      alert_type: 'competitor_price',
      title: `${change.competitor} ${direction} pricing by ${percentChange}%`,
      body: `${change.competitor} changed pricing from $${change.old_price} to $${change.new_price}. ${
        significantChanges.length > 1
          ? `${significantChanges.length - 1} other competitor(s) also changed pricing.`
          : ''
      } Consider reviewing your own pricing strategy.`,
      urgency: parseFloat(percentChange) >= 20 ? 'high' : 'medium',
    };
  }

  return null;
}

/**
 * Detect pain point surges (user complaints increasing)
 */
function detectPainSurge(
  current: DemandSnapshot,
  previous: DemandSnapshot | null
): Alert | null {
  if (!previous) return null;

  const currentComplaints = current.forum_signals.top_complaints.slice(0, 5);
  const previousComplaints = previous.forum_signals.top_complaints.slice(0, 5);

  // Check if new complaints emerged in top 5
  const newTopComplaints = currentComplaints.filter(
    (complaint) => !previousComplaints.includes(complaint)
  );

  if (newTopComplaints.length >= 2) {
    return {
      niche_id: current.niche_id,
      alert_type: 'pain_surge',
      title: `${newTopComplaints.length} new pain points trending`,
      body: `Users are increasingly complaining about: ${newTopComplaints.slice(0, 3).join('; ')}. These could be opportunities to differentiate your offering.`,
      urgency: 'medium',
    };
  }

  return null;
}

/**
 * Detect competitor feature changes
 */
function detectFeatureChanges(current: DemandSnapshot): Alert | null {
  const featureChanges = current.competitor_signals.feature_changes;

  if (featureChanges.length === 0) return null;

  const uniqueCompetitors = new Set(featureChanges.map((fc) => fc.competitor));

  return {
    niche_id: current.niche_id,
    alert_type: 'feature_change',
    title: `${uniqueCompetitors.size} competitor(s) shipped new features`,
    body: `Recent updates detected: ${featureChanges
      .slice(0, 3)
      .map((fc) => `${fc.competitor} - ${fc.feature}`)
      .join('; ')}. Monitor how the market responds to these changes.`,
    urgency: uniqueCompetitors.size >= 3 ? 'high' : 'low',
  };
}

/**
 * Analyze snapshots and generate alerts
 */
export async function detectAlertsForNiche(
  currentSnapshot: DemandSnapshot,
  previousSnapshot: DemandSnapshot | null
): Promise<Alert[]> {
  const alerts: Alert[] = [];

  // Run all detection functions
  const detectors = [
    detectTrendSpike,
    detectNewAngles,
    detectPainSurge,
  ];

  for (const detector of detectors) {
    const alert = detector(currentSnapshot, previousSnapshot);
    if (alert) alerts.push(alert);
  }

  // These don't need previous snapshot
  const pricingAlert = detectPricingChanges(currentSnapshot);
  if (pricingAlert) alerts.push(pricingAlert);

  const featureAlert = detectFeatureChanges(currentSnapshot);
  if (featureAlert) alerts.push(featureAlert);

  return alerts;
}

/**
 * Save alerts to database
 */
export async function saveAlerts(alerts: Alert[]): Promise<void> {
  if (alerts.length === 0) return;

  const supabase = await createClient();

  const { error } = await supabase
    .from('niche_alerts')
    .insert(alerts.map((alert) => ({
      ...alert,
      created_at: new Date().toISOString(),
    })));

  if (error) {
    console.error('Error saving alerts:', error);
    throw error;
  }
}

/**
 * Process alerts for all active niches
 * This would be called by a cron job
 */
export async function processAlertsForAllNiches(): Promise<{
  processed: number;
  alertsGenerated: number;
}> {
  const supabase = await createClient();

  // Get all active niches
  const { data: niches, error: nichesError } = await supabase
    .from('user_niches')
    .select('id')
    .eq('is_active', true);

  if (nichesError) throw nichesError;
  if (!niches || niches.length === 0) {
    return { processed: 0, alertsGenerated: 0 };
  }

  let totalAlerts = 0;

  for (const niche of niches) {
    // Get last two snapshots
    const { data: snapshots, error: snapshotsError } = await supabase
      .from('demand_snapshots')
      .select('*')
      .eq('niche_id', niche.id)
      .order('week_start', { ascending: false })
      .limit(2);

    if (snapshotsError) {
      console.error(`Error fetching snapshots for niche ${niche.id}:`, snapshotsError);
      continue;
    }

    if (!snapshots || snapshots.length === 0) continue;

    const current = snapshots[0] as DemandSnapshot;
    const previous = snapshots.length > 1 ? (snapshots[1] as DemandSnapshot) : null;

    // Detect alerts
    const alerts = await detectAlertsForNiche(current, previous);

    // Save alerts
    if (alerts.length > 0) {
      await saveAlerts(alerts);
      totalAlerts += alerts.length;
    }
  }

  return {
    processed: niches.length,
    alertsGenerated: totalAlerts,
  };
}
