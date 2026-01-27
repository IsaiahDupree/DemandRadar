/**
 * GDP-009: PostHog Identity Stitching
 *
 * Links PostHog's distinct_id with GDP person_id for unified analytics.
 * Allows cross-platform tracking and segment analysis.
 */

import { createServiceClient } from '@/lib/supabase/service';

export interface PostHogIdentityLinkResult {
  id: string;
  person_id: string;
  platform: string;
  external_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Identify a user in PostHog with their GDP person_id
 *
 * This function should be called:
 * - After successful signup
 * - After successful login
 * - When a person record is created/linked
 *
 * @param personId - The GDP person_id (canonical identity)
 * @param email - Optional email for additional context
 * @param properties - Optional additional properties to send to PostHog
 */
export function identifyUserInPostHog(
  personId: string,
  email?: string,
  properties?: Record<string, any>
): void {
  // Check if we're in a browser environment and PostHog is available
  if (typeof window === 'undefined' || !window.posthog) {
    return;
  }

  try {
    const props: Record<string, any> = {};

    if (email) {
      props.email = email;
    }

    if (properties) {
      Object.assign(props, properties);
    }

    // Call posthog.identify() with person_id as the distinct_id
    window.posthog.identify(personId, props);

    console.log('✅ PostHog identity stitching: identified', personId);
  } catch (error) {
    console.error('⚠️ Failed to identify user in PostHog:', error);
  }
}

/**
 * Link PostHog's distinct_id to a GDP person record in the database
 *
 * This creates an entry in the identity_link table linking the person
 * to their PostHog distinct_id for cross-platform analytics.
 *
 * @param personId - The GDP person_id
 * @param distinctId - PostHog's distinct_id (usually from posthog.get_distinct_id())
 * @returns The created identity link
 */
export async function linkPostHogIdentity(
  personId: string,
  distinctId: string
): Promise<PostHogIdentityLinkResult> {
  const serviceClient = createServiceClient();

  try {
    const linkData = {
      person_id: personId,
      platform: 'posthog',
      external_id: distinctId,
      properties: {},
    };

    // Upsert: if link exists, update it; otherwise create new
    const { data, error } = await serviceClient
      .from('identity_link')
      .upsert(linkData, {
        onConflict: 'platform,external_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('✅ PostHog identity linked:', { personId, distinctId });

    return data as PostHogIdentityLinkResult;
  } catch (error) {
    console.error('⚠️ Failed to link PostHog identity:', error);
    throw new Error('Failed to link PostHog identity');
  }
}

/**
 * Get PostHog distinct_id for a person
 *
 * @param personId - The GDP person_id
 * @returns The PostHog distinct_id, or null if not found
 */
export async function getPostHogDistinctId(
  personId: string
): Promise<string | null> {
  const serviceClient = createServiceClient();

  try {
    const { data, error } = await serviceClient
      .from('identity_link')
      .select('external_id')
      .eq('person_id', personId)
      .eq('platform', 'posthog')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return data.external_id;
  } catch (error) {
    console.error('⚠️ Failed to get PostHog distinct_id:', error);
    return null;
  }
}

/**
 * Identify user on login
 *
 * Call this after a user successfully logs in.
 * Links the authenticated user's email to their GDP person_id in PostHog.
 *
 * @param personId - The GDP person_id
 * @param email - User's email
 * @param additionalProps - Optional additional properties
 */
export async function identifyOnLogin(
  personId: string,
  email: string,
  additionalProps?: Record<string, any>
): Promise<void> {
  // Identify in PostHog (client-side)
  identifyUserInPostHog(personId, email, additionalProps);

  // If we have access to PostHog's distinct_id, link it in the database
  if (typeof window !== 'undefined' && window.posthog) {
    try {
      const distinctId = window.posthog.get_distinct_id();
      if (distinctId) {
        await linkPostHogIdentity(personId, distinctId);
      }
    } catch (error) {
      console.error('⚠️ Failed to link PostHog identity on login:', error);
    }
  }
}

/**
 * Identify user on signup
 *
 * Call this after a user successfully signs up.
 * Creates the initial link between the new user and PostHog.
 *
 * @param personId - The GDP person_id
 * @param email - User's email
 * @param additionalProps - Optional additional properties
 */
export async function identifyOnSignup(
  personId: string,
  email: string,
  additionalProps?: Record<string, any>
): Promise<void> {
  // Same as login - identify and link
  await identifyOnLogin(personId, email, additionalProps);
}

// Type augmentation for window.posthog
declare global {
  interface Window {
    posthog?: {
      identify: (distinctId: string, properties?: Record<string, any>) => void;
      get_distinct_id: () => string;
      capture: (event: string, properties?: Record<string, any>) => void;
      alias: (alias: string, distinctId: string) => void;
    };
  }
}
