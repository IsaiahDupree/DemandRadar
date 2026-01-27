/**
 * GDP-012: Segment Engine
 *
 * Evaluates segment membership and triggers automations (Resend, Meta, outbound).
 *
 * Segments are user cohorts defined by filter criteria on person_features.
 * When a person enters/exits a segment, automations can be triggered.
 */

import { createServiceClient } from '@/lib/supabase/service';
import type { PersonFeatures } from './person-features';

export interface Segment {
  id: string;
  segment_name: string;
  segment_key: string;
  description: string | null;
  filter_criteria: Record<string, any>;
  segment_type: string;
  is_active: boolean;
  member_count: number;
  last_computed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SegmentMembership {
  id: string;
  segment_id: string;
  person_id: string;
  entered_at: string;
  exited_at: string | null;
  properties: Record<string, any>;
}

/**
 * Evaluate if a person meets segment criteria
 *
 * Checks person_features against the segment's filter_criteria.
 * Supports operators: $eq, $ne, $gt, $gte, $lt, $lte, $in, $nin
 *
 * @param personId - The person to evaluate
 * @param segmentId - The segment to check against
 * @returns true if person meets criteria, false otherwise
 */
export async function evaluateSegmentMembership(
  personId: string,
  segmentId: string
): Promise<boolean> {
  const serviceClient = createServiceClient();

  try {
    // Get person features
    const { data: personFeatures, error: featuresError } = await serviceClient
      .from('person_features')
      .select('*')
      .eq('person_id', personId)
      .single();

    if (featuresError || !personFeatures) {
      console.warn('Person features not found for:', personId);
      return false;
    }

    // Get segment definition
    const { data: segment, error: segmentError } = await serviceClient
      .from('segment')
      .select('*')
      .eq('id', segmentId)
      .single();

    if (segmentError || !segment) {
      throw new Error('Segment not found');
    }

    // Evaluate filter criteria
    return evaluateFilterCriteria(
      personFeatures as PersonFeatures,
      segment.filter_criteria
    );
  } catch (error) {
    console.error('Failed to evaluate segment membership:', error);
    return false;
  }
}

/**
 * Evaluate filter criteria against person features
 *
 * @param features - Person features to evaluate
 * @param criteria - Filter criteria from segment definition
 * @returns true if all criteria are met
 */
function evaluateFilterCriteria(
  features: PersonFeatures,
  criteria: Record<string, any>
): boolean {
  for (const [field, condition] of Object.entries(criteria)) {
    const featureValue = (features as any)[field];

    // Handle different condition types
    if (typeof condition === 'object' && condition !== null) {
      // Operators: $gte, $lte, $gt, $lt, $eq, $ne, $in, $nin
      for (const [operator, value] of Object.entries(condition)) {
        if (!evaluateCondition(featureValue, operator, value)) {
          return false;
        }
      }
    } else {
      // Direct equality check
      if (featureValue !== condition) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Evaluate a single condition
 */
function evaluateCondition(
  featureValue: any,
  operator: string,
  value: any
): boolean {
  switch (operator) {
    case '$eq':
      return featureValue === value;
    case '$ne':
      return featureValue !== value;
    case '$gt':
      return featureValue > value;
    case '$gte':
      return featureValue >= value;
    case '$lt':
      return featureValue < value;
    case '$lte':
      return featureValue <= value;
    case '$in':
      return Array.isArray(value) && value.includes(featureValue);
    case '$nin':
      return Array.isArray(value) && !value.includes(featureValue);
    default:
      console.warn('Unknown operator:', operator);
      return false;
  }
}

/**
 * Add person to segment
 *
 * Creates a segment_membership record with entered_at timestamp.
 *
 * @param personId - Person to add
 * @param segmentId - Segment to add to
 */
export async function addPersonToSegment(
  personId: string,
  segmentId: string,
  properties: Record<string, any> = {}
): Promise<void> {
  const serviceClient = createServiceClient();

  try {
    const { data, error } = await serviceClient
      .from('segment_membership')
      .insert({
        person_id: personId,
        segment_id: segmentId,
        entered_at: new Date().toISOString(),
        properties,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('✅ Person added to segment:', { personId, segmentId });
  } catch (error) {
    console.error('Failed to add person to segment:', error);
    throw new Error('Failed to add person to segment');
  }
}

/**
 * Remove person from segment
 *
 * Sets exited_at timestamp on the segment_membership record.
 *
 * @param personId - Person to remove
 * @param segmentId - Segment to remove from
 */
export async function removePersonFromSegment(
  personId: string,
  segmentId: string
): Promise<void> {
  const serviceClient = createServiceClient();

  try {
    const { error } = await serviceClient
      .from('segment_membership')
      .update({ exited_at: new Date().toISOString() })
      .eq('person_id', personId)
      .eq('segment_id', segmentId)
      .is('exited_at', null);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('✅ Person removed from segment:', { personId, segmentId });
  } catch (error) {
    console.error('Failed to remove person from segment:', error);
    throw new Error('Failed to remove person from segment');
  }
}

/**
 * Get all active segments for a person
 *
 * @param personId - Person to get segments for
 * @returns Array of segment memberships with segment details
 */
export async function getPersonSegments(
  personId: string
): Promise<SegmentMembership[]> {
  const serviceClient = createServiceClient();

  try {
    const { data, error } = await serviceClient
      .from('segment_membership')
      .select('*, segment(*)')
      .eq('person_id', personId)
      .is('exited_at', null);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data || []) as SegmentMembership[];
  } catch (error) {
    console.error('Failed to get person segments:', error);
    throw new Error('Failed to get person segments');
  }
}

/**
 * Get all active members of a segment
 *
 * @param segmentId - Segment to get members for
 * @returns Array of segment memberships
 */
export async function getSegmentMembers(
  segmentId: string
): Promise<SegmentMembership[]> {
  const serviceClient = createServiceClient();

  try {
    const { data, error } = await serviceClient
      .from('segment_membership')
      .select('*')
      .eq('segment_id', segmentId)
      .is('exited_at', null);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data || []) as SegmentMembership[];
  } catch (error) {
    console.error('Failed to get segment members:', error);
    throw new Error('Failed to get segment members');
  }
}

/**
 * Update segment membership for a person
 *
 * Evaluates all segments and updates membership accordingly.
 * Adds person to segments they qualify for, removes from segments they no longer qualify for.
 *
 * @param personId - Person to update segment membership for
 * @returns Object with added and removed segment IDs
 */
export async function updatePersonSegmentMembership(
  personId: string
): Promise<{ added: string[]; removed: string[] }> {
  const serviceClient = createServiceClient();
  const added: string[] = [];
  const removed: string[] = [];

  try {
    // Get all active segments
    const { data: segments, error: segmentsError } = await serviceClient
      .from('segment')
      .select('*')
      .eq('is_active', true);

    if (segmentsError) {
      throw new Error(`Failed to fetch segments: ${segmentsError.message}`);
    }

    if (!segments || segments.length === 0) {
      return { added, removed };
    }

    // Get current memberships
    const currentSegments = await getPersonSegments(personId);
    const currentSegmentIds = new Set(
      currentSegments.map((m) => m.segment_id)
    );

    // Evaluate each segment
    for (const segment of segments) {
      const qualifies = await evaluateSegmentMembership(personId, segment.id);
      const isMember = currentSegmentIds.has(segment.id);

      if (qualifies && !isMember) {
        // Add to segment
        await addPersonToSegment(personId, segment.id);
        added.push(segment.id);
      } else if (!qualifies && isMember) {
        // Remove from segment
        await removePersonFromSegment(personId, segment.id);
        removed.push(segment.id);
      }
    }

    console.log('✅ Segment membership updated:', {
      personId,
      added: added.length,
      removed: removed.length,
    });

    return { added, removed };
  } catch (error) {
    console.error('Failed to update segment membership:', error);
    throw new Error('Failed to update segment membership');
  }
}

/**
 * Get segment by key
 *
 * @param segmentKey - Segment key to look up
 * @returns Segment or null if not found
 */
export async function getSegmentByKey(
  segmentKey: string
): Promise<Segment | null> {
  const serviceClient = createServiceClient();

  try {
    const { data, error } = await serviceClient
      .from('segment')
      .select('*')
      .eq('segment_key', segmentKey)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return data as Segment;
  } catch (error) {
    console.error('Failed to get segment by key:', error);
    return null;
  }
}
