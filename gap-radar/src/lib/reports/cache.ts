/**
 * Report Caching Layer
 *
 * Caches generated reports to avoid recomputation.
 * Provides cache hit/miss logic, TTL configuration, and invalidation on data change.
 */

export interface CachedReport<T = any> {
  runId: string;
  data: T;
  cachedAt: string;
  expiresAt?: string;
}

interface CacheOptions {
  ttlMs?: number; // Time to live in milliseconds (undefined = never expires)
}

// In-memory cache store
// In production, this could be replaced with Redis, Memcached, or similar
export const ReportCache = new Map<string, CachedReport>();

/**
 * Default TTL: 1 hour (3600000ms)
 */
const DEFAULT_TTL_MS = 60 * 60 * 1000;

/**
 * Get cached report by run ID
 *
 * @param runId - The run ID to look up
 * @returns Cached report if valid, null otherwise
 */
export function getCachedReport<T = any>(runId: string | null | undefined): CachedReport<T> | null {
  if (!runId) {
    return null;
  }

  const cached = ReportCache.get(runId) as CachedReport<T> | undefined;

  if (!cached) {
    return null;
  }

  // Check if cache has expired
  if (cached.expiresAt) {
    const expiresAt = new Date(cached.expiresAt).getTime();
    const now = Date.now();

    if (now > expiresAt) {
      // Cache expired, remove it
      ReportCache.delete(runId);
      return null;
    }
  }

  return cached;
}

/**
 * Cache a report
 *
 * @param runId - The run ID
 * @param data - The report data to cache
 * @param options - Cache options (TTL, etc.)
 */
export function setCachedReport<T = any>(
  runId: string,
  data: T,
  options?: CacheOptions
): void {
  const now = new Date();
  const ttlMs = options?.ttlMs;

  const cached: CachedReport<T> = {
    runId,
    data,
    cachedAt: now.toISOString(),
  };

  // Set expiration if TTL is provided
  if (ttlMs !== undefined) {
    const expiresAt = new Date(now.getTime() + ttlMs);
    cached.expiresAt = expiresAt.toISOString();
  }

  ReportCache.set(runId, cached);
}

/**
 * Invalidate cached report(s)
 *
 * @param runId - The run ID to invalidate. If not provided, clears all cache.
 */
export function invalidateReportCache(runId?: string): void {
  if (runId) {
    ReportCache.delete(runId);
  } else {
    ReportCache.clear();
  }
}

/**
 * Check if a cached report is valid (exists and not expired)
 *
 * @param runId - The run ID to check
 * @returns true if cache is valid, false otherwise
 */
export function isCacheValid(runId: string): boolean {
  const cached = getCachedReport(runId);
  return cached !== null;
}

/**
 * Get cache statistics
 *
 * @returns Object with cache stats
 */
export function getCacheStats() {
  const entries = Array.from(ReportCache.values());
  const now = Date.now();

  const validEntries = entries.filter(entry => {
    if (!entry.expiresAt) return true;
    return new Date(entry.expiresAt).getTime() > now;
  });

  const expiredEntries = entries.filter(entry => {
    if (!entry.expiresAt) return false;
    return new Date(entry.expiresAt).getTime() <= now;
  });

  return {
    totalEntries: ReportCache.size,
    validEntries: validEntries.length,
    expiredEntries: expiredEntries.length,
  };
}

/**
 * Clean up expired cache entries
 *
 * This should be called periodically to free memory
 */
export function cleanupExpiredCache(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [runId, cached] of ReportCache.entries()) {
    if (cached.expiresAt) {
      const expiresAt = new Date(cached.expiresAt).getTime();
      if (now > expiresAt) {
        ReportCache.delete(runId);
        cleaned++;
      }
    }
  }

  return cleaned;
}
