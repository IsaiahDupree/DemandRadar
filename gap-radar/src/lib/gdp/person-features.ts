/**
 * GDP-011: Person Features Computation
 *
 * Computes engagement metrics from unified events for segmentation
 * and personalization.
 *
 * Features computed:
 * - Active days (7d, 30d, 90d)
 * - Event counts
 * - Core actions (runs, reports, gaps)
 * - Engagement indicators (pricing views, checkouts)
 * - Email engagement (opens, clicks, rates)
 * - Subscription metrics
 * - Revenue metrics
 * - Computed scores (engagement, activation, churn risk)
 */

import { createServiceClient } from '@/lib/supabase/service';

export interface PersonFeatures {
  person_id: string;

  // Activity metrics
  active_days_7d: number;
  active_days_30d: number;
  active_days_90d: number;

  // Event counts
  total_events: number;
  events_7d: number;
  events_30d: number;

  // Core action counts (GapRadar-specific)
  runs_created: number;
  runs_completed: number;
  reports_downloaded: number;
  gaps_discovered: number;
  avg_demand_score: number | null;

  // Engagement indicators
  pricing_views: number;
  checkout_starts: number;

  // Email engagement
  emails_sent: number;
  emails_opened: number;
  emails_clicked: number;
  email_open_rate: number | null;
  email_click_rate: number | null;

  // Subscription metrics
  is_subscriber: boolean;
  subscription_mrr_cents: number | null;

  // Revenue metrics
  total_revenue_cents: number;
  first_purchase_at: string | null;
  last_purchase_at: string | null;

  // Computed scores (0-100)
  engagement_score: number;
  activation_score: number;
  churn_risk_score: number;

  // Last activity
  last_active_at: string | null;

  // Computed timestamp
  computed_at: string;
}

/**
 * Compute person features for a given person
 *
 * This calls the database function compute_person_features which:
 * - Counts active days from unified_event
 * - Counts specific events (runs, pricing views, etc.)
 * - Computes email engagement rates
 * - Calculates engagement and activation scores
 * - Upserts the results to person_features table
 *
 * @param personId - The person_id to compute features for
 */
export async function computePersonFeatures(personId: string): Promise<void> {
  const serviceClient = createServiceClient();

  try {
    const { error } = await serviceClient.rpc('compute_person_features', {
      p_person_id: personId,
    });

    if (error) {
      throw new Error(`RPC error: ${error.message}`);
    }

    console.log('✅ Person features computed for:', personId);
  } catch (error) {
    console.error('⚠️ Failed to compute person features:', error);
    throw new Error('Failed to compute person features');
  }
}

/**
 * Get person features from the database
 *
 * Returns the pre-computed features for a person.
 * If features haven't been computed yet, returns null.
 *
 * @param personId - The person_id to get features for
 * @returns PersonFeatures object or null if not found
 */
export async function getPersonFeatures(
  personId: string
): Promise<PersonFeatures | null> {
  const serviceClient = createServiceClient();

  try {
    const { data, error } = await serviceClient
      .from('person_features')
      .select('*')
      .eq('person_id', personId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return data as PersonFeatures;
  } catch (error) {
    console.error('⚠️ Failed to get person features:', error);
    throw new Error('Failed to get person features');
  }
}

/**
 * Compute features for multiple persons
 *
 * Useful for batch processing or scheduled jobs.
 *
 * @param personIds - Array of person_ids to compute features for
 * @returns Number of successful computations
 */
export async function computePersonFeaturesForMany(
  personIds: string[]
): Promise<number> {
  let successCount = 0;

  for (const personId of personIds) {
    try {
      await computePersonFeatures(personId);
      successCount++;
    } catch (error) {
      console.error(
        `Failed to compute features for person ${personId}:`,
        error
      );
      // Continue with next person
    }
  }

  console.log(
    `✅ Computed features for ${successCount}/${personIds.length} persons`
  );

  return successCount;
}

/**
 * Get features for multiple persons
 *
 * @param personIds - Array of person_ids to get features for
 * @returns Map of person_id to PersonFeatures
 */
export async function getPersonFeaturesForMany(
  personIds: string[]
): Promise<Map<string, PersonFeatures>> {
  const serviceClient = createServiceClient();
  const featuresMap = new Map<string, PersonFeatures>();

  try {
    const { data, error } = await serviceClient
      .from('person_features')
      .select('*')
      .in('person_id', personIds);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (data) {
      data.forEach((features) => {
        featuresMap.set(features.person_id, features as PersonFeatures);
      });
    }

    return featuresMap;
  } catch (error) {
    console.error('⚠️ Failed to get person features:', error);
    throw new Error('Failed to get person features');
  }
}

/**
 * Check if person features need recomputation
 *
 * Features should be recomputed if:
 * - Never computed before
 * - Last computed more than 24 hours ago
 * - Person has new events since last computation
 *
 * @param personId - The person_id to check
 * @returns true if features should be recomputed
 */
export async function shouldRecomputeFeatures(
  personId: string
): Promise<boolean> {
  const features = await getPersonFeatures(personId);

  if (!features) {
    // Never computed
    return true;
  }

  // Check if computed more than 24 hours ago
  const computedAt = new Date(features.computed_at);
  const hoursSinceComputed =
    (Date.now() - computedAt.getTime()) / (1000 * 60 * 60);

  if (hoursSinceComputed > 24) {
    return true;
  }

  // Could also check for new events since last computation
  // For now, assume 24h refresh is sufficient

  return false;
}

/**
 * Compute features if needed
 *
 * Only computes if features are stale or missing.
 *
 * @param personId - The person_id to compute features for
 * @returns true if features were computed, false if skipped
 */
export async function computePersonFeaturesIfNeeded(
  personId: string
): Promise<boolean> {
  const shouldCompute = await shouldRecomputeFeatures(personId);

  if (shouldCompute) {
    await computePersonFeatures(personId);
    return true;
  }

  return false;
}
