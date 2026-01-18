import { createClient } from '@/lib/supabase/client';

export interface FavoriteSearch {
  id: string;
  user_id: string;
  query: string;
  created_at: string;
}

/**
 * Get all favorite searches for the authenticated user
 */
export async function getFavoriteSearches(): Promise<FavoriteSearch[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('favorite_searches')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Add a search query to favorites
 */
export async function addFavoriteSearch(query: string): Promise<FavoriteSearch> {
  const supabase = createClient();
  const trimmedQuery = query.trim();

  const { data, error } = await supabase
    .from('favorite_searches')
    .insert({
      query: trimmedQuery,
    })
    .select();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error('Failed to create favorite search');
  }

  return data[0];
}

/**
 * Remove a favorite search by ID
 */
export async function removeFavoriteSearch(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('favorite_searches')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Check if a query is already favorited
 */
export async function isFavoriteSearch(query: string): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('favorite_searches')
    .select('id')
    .eq('query', query)
    .single();

  // PGRST116 is "not found" error which means not favorited
  if (error && error.code === 'PGRST116') {
    return false;
  }

  if (error) {
    throw new Error(error.message);
  }

  return !!data;
}

/**
 * Find a favorite search by query and return its ID
 */
export async function getFavoriteSearchByQuery(query: string): Promise<FavoriteSearch | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('favorite_searches')
    .select('*')
    .eq('query', query)
    .single();

  // PGRST116 is "not found" error
  if (error && error.code === 'PGRST116') {
    return null;
  }

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
