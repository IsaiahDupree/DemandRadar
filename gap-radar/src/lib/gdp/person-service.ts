/**
 * Person & Identity Service (GDP-002)
 *
 * Service layer for managing persons and their identity links across platforms.
 * Implements the Growth Data Plane person and identity_link tables.
 */

import { createClient } from '@supabase/supabase-js';

// Types based on the database schema
export type LifecycleStage = 'lead' | 'activated' | 'engaged' | 'customer' | 'churned';
export type Platform = 'posthog' | 'stripe' | 'meta' | 'resend' | 'auth';

export interface Person {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  phone?: string | null;
  timezone?: string | null;
  country_code?: string | null;
  city?: string | null;
  properties?: Record<string, any>;
  lifecycle_stage: LifecycleStage;
  first_seen_at: string;
  last_seen_at: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  referrer?: string | null;
  landing_page?: string | null;
  created_at: string;
  updated_at: string;
}

export interface IdentityLink {
  id: string;
  person_id: string;
  platform: Platform;
  external_id: string;
  properties?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreatePersonInput {
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
  timezone?: string;
  country_code?: string;
  city?: string;
  properties?: Record<string, any>;
  lifecycle_stage?: LifecycleStage;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
  landing_page?: string;
}

export interface LinkIdentityInput {
  person_id: string;
  platform: Platform;
  external_id: string;
  properties?: Record<string, any>;
}

/**
 * Get Supabase service role client for GDP operations
 * Uses service_role key to bypass RLS policies
 */
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration for GDP service');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Get or create a person by email
 * If person exists, returns existing record. Otherwise creates new person.
 */
export async function getOrCreatePerson(
  input: CreatePersonInput
): Promise<Person> {
  const supabase = getServiceClient();

  // Try to find existing person by email
  const { data: existingPerson, error: findError } = await supabase
    .from('person')
    .select('*')
    .eq('email', input.email)
    .single();

  if (existingPerson && !findError) {
    // Update last_seen_at
    const { data: updatedPerson, error: updateError } = await supabase
      .from('person')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', existingPerson.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update person: ${updateError.message}`);
    }

    return updatedPerson as Person;
  }

  // Create new person
  const newPersonData = {
    email: input.email,
    first_name: input.first_name,
    last_name: input.last_name,
    full_name: input.full_name || (input.first_name && input.last_name
      ? `${input.first_name} ${input.last_name}`
      : null),
    phone: input.phone,
    timezone: input.timezone,
    country_code: input.country_code,
    city: input.city,
    properties: input.properties || {},
    lifecycle_stage: input.lifecycle_stage || 'lead',
    utm_source: input.utm_source,
    utm_medium: input.utm_medium,
    utm_campaign: input.utm_campaign,
    utm_content: input.utm_content,
    utm_term: input.utm_term,
    referrer: input.referrer,
    landing_page: input.landing_page,
  };

  const { data: newPerson, error: createError } = await supabase
    .from('person')
    .insert(newPersonData)
    .select()
    .single();

  if (createError) {
    throw new Error(`Failed to create person: ${createError.message}`);
  }

  return newPerson as Person;
}

/**
 * Link a person to an external platform identity
 * Uses upsert to handle duplicate links gracefully
 */
export async function linkPersonIdentity(
  input: LinkIdentityInput
): Promise<IdentityLink> {
  const supabase = getServiceClient();

  const linkData = {
    person_id: input.person_id,
    platform: input.platform,
    external_id: input.external_id,
    properties: input.properties || {},
  };

  // Upsert: if link exists, update it; otherwise create new
  const { data, error } = await supabase
    .from('identity_link')
    .upsert(linkData, {
      onConflict: 'platform,external_id',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to link identity: ${error.message}`);
  }

  return data as IdentityLink;
}

/**
 * Get person by email
 */
export async function getPersonByEmail(
  email: string
): Promise<Person | null> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('person')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Failed to get person by email: ${error.message}`);
  }

  return data as Person;
}

/**
 * Get person by ID
 */
export async function getPersonById(
  personId: string
): Promise<Person | null> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('person')
    .select('*')
    .eq('id', personId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Failed to get person by ID: ${error.message}`);
  }

  return data as Person;
}

/**
 * Get person by external platform ID
 * Looks up identity_link and returns associated person
 */
export async function getPersonByExternalId(
  platform: string,
  externalId: string
): Promise<Person | null> {
  const supabase = getServiceClient();

  // First find the identity link
  const { data: link, error: linkError } = await supabase
    .from('identity_link')
    .select('person_id')
    .eq('platform', platform)
    .eq('external_id', externalId)
    .single();

  if (linkError) {
    if (linkError.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Failed to find identity link: ${linkError.message}`);
  }

  // Then get the person
  return getPersonById(link.person_id);
}

/**
 * Unlink an identity from a person
 */
export async function unlinkPersonIdentity(
  identityLinkId: string
): Promise<void> {
  const supabase = getServiceClient();

  const { error } = await supabase
    .from('identity_link')
    .delete()
    .eq('id', identityLinkId);

  if (error) {
    throw new Error(`Failed to unlink identity: ${error.message}`);
  }
}

/**
 * Get all identity links for a person
 */
export async function getPersonIdentities(
  personId: string
): Promise<IdentityLink[]> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('identity_link')
    .select('*')
    .eq('person_id', personId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get person identities: ${error.message}`);
  }

  return data as IdentityLink[];
}

/**
 * Update person lifecycle stage
 */
export async function updatePersonLifecycleStage(
  personId: string,
  stage: LifecycleStage
): Promise<Person> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('person')
    .update({ lifecycle_stage: stage })
    .eq('id', personId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update lifecycle stage: ${error.message}`);
  }

  return data as Person;
}
