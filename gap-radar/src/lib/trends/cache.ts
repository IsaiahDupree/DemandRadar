import { TrendingTopic } from './fallback';

interface CacheEntry {
  data: TrendingTopic[];
  timestamp: number;
  sources: string[];
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let trendsCache: CacheEntry | null = null;

export function getCachedTrends(): CacheEntry | null {
  if (!trendsCache) return null;
  
  const now = Date.now();
  if (now - trendsCache.timestamp > CACHE_TTL_MS) {
    trendsCache = null;
    return null;
  }
  
  return trendsCache;
}

export function setCachedTrends(trends: TrendingTopic[], sources: string[]): void {
  trendsCache = {
    data: trends,
    timestamp: Date.now(),
    sources,
  };
}

export function clearTrendsCache(): void {
  trendsCache = null;
}

export function getCacheTTL(): number {
  return CACHE_TTL_MS;
}
