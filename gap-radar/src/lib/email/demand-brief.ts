/**
 * Demand Brief Email Service (BRIEF-003)
 *
 * Generates and sends weekly demand score + insights email via Resend
 *
 * Acceptance Criteria:
 * - Email renders correctly
 * - Demand score shown
 * - What changed section
 * - Copy-pasteable hooks
 */

import { sendDemandBriefEmail, DemandSnapshot } from './resend';

/**
 * Parameters for generating and sending a demand brief
 */
export interface GenerateDemandBriefParams {
  userId: string;
  nicheId: string;
  recipientEmail: string;
  recipientName?: string;
}

/**
 * Result of sending a demand brief
 */
export interface DemandBriefResult {
  success: boolean;
  emailId?: string;
  error?: string;
  snapshot?: DemandSnapshot;
}

/**
 * Generate and send a weekly demand brief email
 *
 * This function:
 * 1. Fetches the latest demand snapshot for the niche
 * 2. Generates the email using the demand-brief template
 * 3. Sends via Resend
 * 4. Returns the result with delivery tracking
 */
export async function generateAndSendDemandBrief(
  params: GenerateDemandBriefParams
): Promise<DemandBriefResult> {
  try {
    // Fetch the latest demand snapshot for this niche
    const snapshot = await fetchLatestDemandSnapshot(params.nicheId);

    if (!snapshot) {
      return {
        success: false,
        error: 'No demand snapshot found for this niche',
      };
    }

    // Send the demand brief email
    const result = await sendDemandBriefEmail({
      to: params.recipientEmail,
      name: params.recipientName,
      snapshot,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to send demand brief',
      };
    }

    return {
      success: true,
      emailId: result.id,
      snapshot,
    };
  } catch (error) {
    console.error('💥 Error generating demand brief:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Fetch the latest demand snapshot for a niche
 *
 * This queries the demand_snapshots table and returns the most recent
 * snapshot with all required fields populated
 */
async function fetchLatestDemandSnapshot(nicheId: string): Promise<DemandSnapshot | null> {
  try {
    // Import Supabase client
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    // Fetch the latest snapshot for this niche
    const { data, error } = await supabase
      .from('demand_snapshots')
      .select('*')
      .eq('niche_id', nicheId)
      .order('week_start', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching demand snapshot:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    // Transform database row to DemandSnapshot format
    return {
      id: data.id,
      niche_id: data.niche_id,
      offering_name: data.offering_name || 'Unknown Offering',
      week_start: data.week_start,
      demand_score: data.demand_score || 0,
      demand_score_change: data.demand_score_change || 0,
      opportunity_score: data.opportunity_score || 0,
      message_market_fit_score: data.message_market_fit_score || 0,
      trend: data.trend || 'stable',
      ad_signals: data.ad_signals || {},
      search_signals: data.search_signals || {},
      ugc_signals: data.ugc_signals || {},
      forum_signals: data.forum_signals || {},
      competitor_signals: data.competitor_signals || {},
      plays: data.plays || [],
      ad_hooks: data.ad_hooks || [],
      subject_lines: data.subject_lines || [],
      landing_copy: data.landing_copy || '',
      why_score_changed: data.why_score_changed || [],
    };
  } catch (error) {
    console.error('💥 Critical error fetching snapshot:', error);
    return null;
  }
}

/**
 * Re-export types for convenience
 */
export type { DemandSnapshot } from './resend';
