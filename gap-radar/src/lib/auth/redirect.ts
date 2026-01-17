/**
 * Auth redirect utilities
 *
 * Handles redirecting users through auth flows while preserving context
 */

const QUERY_STORAGE_KEY = 'demandradar_pending_query';

/**
 * Store a search query to be used after authentication
 */
export function storePendingQuery(query: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(QUERY_STORAGE_KEY, query);
    } catch (error) {
      console.error('Failed to store pending query:', error);
    }
  }
}

/**
 * Retrieve and clear the pending search query
 */
export function retrievePendingQuery(): string | null {
  if (typeof window !== 'undefined') {
    try {
      const query = localStorage.getItem(QUERY_STORAGE_KEY);
      if (query) {
        localStorage.removeItem(QUERY_STORAGE_KEY);
        return query;
      }
    } catch (error) {
      console.error('Failed to retrieve pending query:', error);
    }
  }
  return null;
}

/**
 * Build a signup URL with query preserved
 */
export function buildSignupURL(query?: string): string {
  const url = new URL('/signup', window.location.origin);
  if (query) {
    url.searchParams.set('query', query);
  }
  return url.pathname + url.search;
}

/**
 * Build a login URL with query preserved
 */
export function buildLoginURL(query?: string): string {
  const url = new URL('/login', window.location.origin);
  if (query) {
    url.searchParams.set('query', query);
  }
  return url.pathname + url.search;
}

/**
 * Build a create run URL with query prefilled
 */
export function buildCreateRunURL(query: string): string {
  const url = new URL('/runs/new', window.location.origin);
  url.searchParams.set('query', query);
  return url.pathname + url.search;
}

/**
 * Check if user is authenticated (placeholder - implement with your auth provider)
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // TODO: Replace with actual auth check
  // Examples:
  // - Check Supabase session: const { data: { session } } = await supabase.auth.getSession()
  // - Check JWT in localStorage/cookie
  // - Check NextAuth session

  // For now, return false (all users are unauthenticated)
  return false;
}
