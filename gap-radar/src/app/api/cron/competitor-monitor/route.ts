/**
 * Competitor Monitoring Cron Job
 *
 * Daily scheduled job that:
 * 1. Fetches all active tracked competitors
 * 2. Collects current ad snapshots
 * 3. Detects changes vs previous snapshot
 * 4. Creates alerts for significant changes
 *
 * Feature: INTEL-008
 * PRD: PRD_COMPETITIVE_INTELLIGENCE.md
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { collectCompetitorSnapshot } from '@/lib/competitors/snapshot-collector';
import {
  detectCompetitorChanges,
  type CompetitorChange,
  type ChangeType,
} from '@/lib/competitors/change-detector';

interface TrackedCompetitor {
  id: string;
  user_id: string;
  competitor_name: string;
  competitor_domain: string | null;
  meta_page_id: string | null;
  track_ads: boolean;
  track_pricing: boolean;
  track_features: boolean;
  is_active: boolean;
  last_checked: string | null;
  created_at: string;
}

interface PreviousSnapshot {
  id: string;
  competitor_id: string;
  snapshot_date: string;
  active_ads_count: number;
  ads_data: any[];
  changes: any;
}

/**
 * GET /api/cron/competitor-monitor
 *
 * Runs daily to monitor all tracked competitors
 */
export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET) {
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  try {
    const supabase = await createClient();

    // Get all active tracked competitors
    const { data: competitors, error: competitorsError } = await supabase
      .from('tracked_competitors')
      .select('*')
      .eq('is_active', true);

    if (competitorsError) {
      console.error('Error fetching competitors:', competitorsError);
      return Response.json(
        { error: 'Failed to fetch competitors' },
        { status: 500 }
      );
    }

    if (!competitors || competitors.length === 0) {
      return Response.json({
        message: 'No niches to process',
        processed: 0,
        changes_detected: 0,
        alerts_created: 0,
      });
    }

    const results = {
      processed: 0,
      changes_detected: 0,
      alerts_created: 0,
    };

    // Process each competitor
    for (const competitor of competitors as TrackedCompetitor[]) {
      try {
        // Collect current snapshot
        const currentSnapshot = await collectCompetitorSnapshot(competitor);

        // Get previous snapshot for comparison
        const { data: previousSnapshot } = await supabase
          .from('competitor_snapshots')
          .select('*')
          .eq('competitor_id', competitor.id)
          .order('snapshot_date', { ascending: false })
          .limit(1)
          .single();

        // Save current snapshot
        const today = new Date().toISOString().split('T')[0];
        const { error: snapshotError } = await supabase
          .from('competitor_snapshots')
          .insert({
            competitor_id: competitor.id,
            snapshot_date: today,
            active_ads_count: currentSnapshot.active_ads_count,
            new_ads_count: currentSnapshot.new_ads_count,
            stopped_ads_count: currentSnapshot.stopped_ads_count,
            ads_data: currentSnapshot.ads,
            changes: {
              new_ads: currentSnapshot.newAds || [],
              stopped_ads: currentSnapshot.stoppedAds || [],
            },
          });

        if (snapshotError) {
          console.error('Error saving snapshot:', snapshotError);
          // Continue processing other competitors
          continue;
        }

        // Detect changes if we have a previous snapshot
        if (previousSnapshot) {
          const changes = await detectCompetitorChanges(
            competitor,
            {
              competitor_id: competitor.id,
              active_ads_count: previousSnapshot.active_ads_count,
              ads: previousSnapshot.ads_data || [],
            },
            {
              competitor_id: competitor.id,
              active_ads_count: currentSnapshot.active_ads_count,
              ads: currentSnapshot.ads,
            }
          );

          // Create alerts for significant changes
          for (const change of changes) {
            results.changes_detected++;

            // Only create alerts for medium and high significance
            if (change.significance !== 'low') {
              const { error: alertError } = await supabase
                .from('competitor_alerts')
                .insert({
                  user_id: competitor.user_id,
                  competitor_id: competitor.id,
                  alert_type: change.type,
                  title: generateAlertTitle(change, competitor.competitor_name),
                  description: generateAlertDescription(change),
                  data: change.data,
                });

              if (alertError) {
                console.error('Error creating alert:', alertError);
              } else {
                results.alerts_created++;
              }
            }
          }
        }

        // Update last_checked timestamp
        await supabase
          .from('tracked_competitors')
          .update({ last_checked: new Date().toISOString() })
          .eq('id', competitor.id);

        results.processed++;
      } catch (error) {
        console.error(
          `Error processing competitor ${competitor.id}:`,
          error
        );
        // Continue with next competitor
      }
    }

    return Response.json(results);
  } catch (error) {
    console.error('Cron job failed:', error);
    return Response.json(
      { error: 'Cron job failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Generate a human-readable alert title
 */
function generateAlertTitle(change: CompetitorChange, competitorName: string): string {
  switch (change.type) {
    case 'new_campaign':
      return `${competitorName} launched ${change.data.count} new ads`;
    case 'campaign_ended':
      return `${competitorName} stopped ${change.data.count} long-running ads`;
    case 'ad_spike':
      return `${competitorName} ad volume up ${change.data.percent_change}%`;
    case 'creative_shift':
      return `${competitorName} changed creative strategy`;
    case 'messaging_change':
      return `${competitorName} updated messaging`;
    case 'pricing_change':
      return `${competitorName} changed pricing`;
    case 'new_feature':
      return `${competitorName} announced new feature`;
    default:
      return `${competitorName} made a change`;
  }
}

/**
 * Generate a detailed alert description
 */
function generateAlertDescription(change: CompetitorChange): string {
  switch (change.type) {
    case 'new_campaign':
      return `Detected ${change.data.count} new ad creatives. This could indicate a new campaign launch or increased marketing activity.`;
    case 'campaign_ended':
      return `${change.data.count} long-running ads (30+ days) were stopped. These were likely successful campaigns that have run their course.`;
    case 'ad_spike':
      return `Ad volume increased from ${change.data.previous} to ${change.data.current} ads (${change.data.percent_change}% increase). This suggests ramped up marketing efforts.`;
    case 'creative_shift':
      return change.data.summary || 'Major change detected in creative approach or messaging.';
    case 'messaging_change':
      return 'New value propositions or messaging hooks detected in recent ads.';
    case 'pricing_change':
      return 'Pricing page has been updated. Review their new pricing strategy.';
    case 'new_feature':
      return 'New feature or product announcement detected.';
    default:
      return 'A change was detected in competitor activity.';
  }
}
