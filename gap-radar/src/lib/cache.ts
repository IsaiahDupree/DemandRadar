/**
 * Generic Cache Manager
 *
 * A flexible caching layer for expensive API calls and computations.
 * Supports TTL (Time To Live), lazy evaluation, and async operations.
 *
 * @example
 * ```ts
 * const cache = new CacheManager<User>({ ttl: 60000 }); // 1 minute
 *
 * // Set a value
 * cache.set('user:123', user);
 *
 * // Get a value
 * const user = cache.get('user:123');
 *
 * // Get or compute if missing
 * const user = await cache.getOrSetAsync('user:123', async () => {
 *   return await fetchUser(123);
 * });
 * ```
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface CacheOptions {
  /**
   * Time to live in milliseconds
   * Default: 5 minutes (300000ms)
   */
  ttl?: number;
}

interface SetOptions {
  /**
   * Custom TTL for this entry (overrides default)
   */
  ttl?: number;
}

/**
 * Generic in-memory cache with TTL support
 */
export class CacheManager<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private defaultTTL: number;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl ?? 5 * 60 * 1000; // Default: 5 minutes
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: T, options?: SetOptions): void {
    const ttl = options?.ttl ?? this.defaultTTL;
    const expiresAt = Date.now() + ttl;

    this.cache.set(key, {
      value,
      expiresAt,
    });
  }

  /**
   * Get a value from the cache
   * Returns undefined if not found or expired
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from the cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the number of entries (excluding expired)
   */
  size(): number {
    // Clean up expired entries first
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }

    return this.cache.size;
  }

  /**
   * Get a value from cache, or compute and cache it if missing
   *
   * @example
   * ```ts
   * const value = cache.getOrSet('key', () => expensiveComputation());
   * ```
   */
  getOrSet(key: string, factory: () => T, options?: SetOptions): T {
    const cached = this.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const value = factory();
    this.set(key, value, options);
    return value;
  }

  /**
   * Get a value from cache, or compute and cache it if missing (async version)
   *
   * @example
   * ```ts
   * const data = await cache.getOrSetAsync('trends', async () => {
   *   return await fetchTrends();
   * });
   * ```
   */
  async getOrSetAsync(
    key: string,
    factory: () => Promise<T>,
    options?: SetOptions
  ): Promise<T> {
    const cached = this.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, options);
    return value;
  }

  /**
   * Get all keys (excluding expired)
   */
  keys(): string[] {
    const now = Date.now();
    const validKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now <= entry.expiresAt) {
        validKeys.push(key);
      } else {
        this.cache.delete(key);
      }
    }

    return validKeys;
  }

  /**
   * Get all values (excluding expired)
   */
  values(): T[] {
    const now = Date.now();
    const validValues: T[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now <= entry.expiresAt) {
        validValues.push(entry.value);
      } else {
        this.cache.delete(key);
      }
    }

    return validValues;
  }
}

/**
 * Singleton cache instances for common use cases
 */

/**
 * Cache for trending topics (5 minute TTL)
 */
export const trendsCache = new CacheManager<any>({
  ttl: 5 * 60 * 1000, // 5 minutes
});

/**
 * Cache for reports (10 minute TTL)
 */
export const reportsCache = new CacheManager<any>({
  ttl: 10 * 60 * 1000, // 10 minutes
});

/**
 * Cache for API responses (1 minute TTL)
 */
export const apiCache = new CacheManager<any>({
  ttl: 1 * 60 * 1000, // 1 minute
});

/**
 * Cache for expensive computations (30 minute TTL)
 */
export const computationCache = new CacheManager<any>({
  ttl: 30 * 60 * 1000, // 30 minutes
});
