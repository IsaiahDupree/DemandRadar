import { createClient } from '@/lib/supabase/server';

export interface UserNiche {
  id: string;
  user_id: string;
  offering_name: string;
  category?: string | null;
  niche_tags?: string[] | null;
  customer_profile?: {
    type: string;
    segment: string;
    price_point: string;
  } | null;
  competitors?: string[] | null;
  keywords?: string[] | null;
  geo?: string | null;
  sources_enabled?: string[] | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNicheParams {
  offering_name: string;
  category?: string;
  niche_tags?: string[];
  customer_profile?: {
    type: string;
    segment: string;
    price_point: string;
  };
  competitors?: string[];
  keywords?: string[];
  geo?: string;
  sources_enabled?: string[];
}

export interface UpdateNicheParams {
  offering_name?: string;
  category?: string;
  niche_tags?: string[];
  customer_profile?: {
    type: string;
    segment: string;
    price_point: string;
  };
  competitors?: string[];
  keywords?: string[];
  geo?: string;
  sources_enabled?: string[];
  is_active?: boolean;
}

export interface ListNichesOptions {
  activeOnly?: boolean;
}

/**
 * Create a new niche for the authenticated user
 */
export async function createNiche(params: CreateNicheParams): Promise<UserNiche> {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('User not authenticated');
  }

  // Insert niche
  const { data, error } = await supabase
    .from('user_niches')
    .insert({
      user_id: user.id,
      ...params,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as UserNiche;
}

/**
 * Get a single niche by ID
 */
export async function getNiche(nicheId: string): Promise<UserNiche | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_niches')
    .select('*')
    .eq('id', nicheId)
    .single();

  if (error) {
    // Not found error is acceptable
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data as UserNiche;
}

/**
 * List all niches for the authenticated user
 */
export async function listUserNiches(options: ListNichesOptions = {}): Promise<UserNiche[]> {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('User not authenticated');
  }

  // Build query
  let query = supabase.from('user_niches').select('*').eq('user_id', user.id);

  // Apply filters
  if (options.activeOnly) {
    query = query.eq('is_active', true);
  }

  // Order by most recent
  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data as UserNiche[]) || [];
}

/**
 * Update a niche
 */
export async function updateNiche(
  nicheId: string,
  updates: UpdateNicheParams
): Promise<UserNiche> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_niches')
    .update(updates)
    .eq('id', nicheId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as UserNiche;
}

/**
 * Delete a niche
 */
export async function deleteNiche(nicheId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('user_niches').delete().eq('id', nicheId);

  if (error) {
    throw error;
  }
}

/**
 * Count user's active niches (for plan limit enforcement)
 */
export async function countUserNiches(): Promise<number> {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('User not authenticated');
  }

  const { count, error } = await supabase
    .from('user_niches')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (error) {
    throw error;
  }

  return count || 0;
}
