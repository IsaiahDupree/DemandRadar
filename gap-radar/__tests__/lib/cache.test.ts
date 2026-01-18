import { CacheManager } from '@/lib/cache';

describe('CacheManager', () => {
  let cache: CacheManager<string>;

  beforeEach(() => {
    cache = new CacheManager<string>({ ttl: 1000 }); // 1 second TTL
  });

  afterEach(() => {
    cache.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should overwrite existing values', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      expect(cache.get('key1')).toBe('value2');
    });

    it('should support multiple keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      const shortCache = new CacheManager<string>({ ttl: 50 }); // 50ms TTL

      shortCache.set('key1', 'value1');
      expect(shortCache.get('key1')).toBe('value1');

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(shortCache.get('key1')).toBeUndefined();
    });

    it('should not expire entries before TTL', async () => {
      cache.set('key1', 'value1');

      // Wait less than TTL
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(cache.get('key1')).toBe('value1');
    });

    it('should support custom TTL per entry', async () => {
      const customCache = new CacheManager<string>({ ttl: 1000 });

      customCache.set('shortLived', 'value', { ttl: 50 });
      customCache.set('longLived', 'value', { ttl: 2000 });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(customCache.get('shortLived')).toBeUndefined();
      expect(customCache.get('longLived')).toBe('value');
    });
  });

  describe('has', () => {
    it('should return true for existing keys', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should return false for expired keys', async () => {
      const shortCache = new CacheManager<string>({ ttl: 50 });
      shortCache.set('key1', 'value1');

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(shortCache.has('key1')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should remove entries', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);

      cache.delete('key1');
      expect(cache.has('key1')).toBe(false);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should not affect other entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.delete('key1');

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(false);
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if it exists', () => {
      cache.set('key1', 'cached');

      const result = cache.getOrSet('key1', () => 'fresh');

      expect(result).toBe('cached');
    });

    it('should compute and cache value if not exists', () => {
      const factory = jest.fn(() => 'fresh');

      const result = cache.getOrSet('key1', factory);

      expect(result).toBe('fresh');
      expect(factory).toHaveBeenCalledTimes(1);
      expect(cache.get('key1')).toBe('fresh');
    });

    it('should not call factory if value is cached', () => {
      cache.set('key1', 'cached');
      const factory = jest.fn(() => 'fresh');

      cache.getOrSet('key1', factory);

      expect(factory).not.toHaveBeenCalled();
    });

    it('should recompute if cached value expired', async () => {
      const shortCache = new CacheManager<string>({ ttl: 50 });
      shortCache.set('key1', 'old');

      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = shortCache.getOrSet('key1', () => 'new');

      expect(result).toBe('new');
      expect(shortCache.get('key1')).toBe('new');
    });
  });

  describe('async getOrSetAsync', () => {
    it('should return cached value if it exists', async () => {
      cache.set('key1', 'cached');

      const result = await cache.getOrSetAsync('key1', async () => 'fresh');

      expect(result).toBe('cached');
    });

    it('should compute and cache async value if not exists', async () => {
      const factory = jest.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'fresh';
      });

      const result = await cache.getOrSetAsync('key1', factory);

      expect(result).toBe('fresh');
      expect(factory).toHaveBeenCalledTimes(1);
      expect(cache.get('key1')).toBe('fresh');
    });
  });

  describe('size', () => {
    it('should return the number of entries', () => {
      expect(cache.size()).toBe(0);

      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);

      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);

      cache.delete('key1');
      expect(cache.size()).toBe(1);

      cache.clear();
      expect(cache.size()).toBe(0);
    });

    it('should not count expired entries', async () => {
      const shortCache = new CacheManager<string>({ ttl: 50 });

      shortCache.set('key1', 'value1');
      shortCache.set('key2', 'value2');

      expect(shortCache.size()).toBe(2);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(shortCache.size()).toBe(0);
    });
  });

  describe('Complex types', () => {
    it('should support object values', () => {
      interface User {
        id: number;
        name: string;
      }

      const userCache = new CacheManager<User>({ ttl: 1000 });

      const user = { id: 1, name: 'John' };
      userCache.set('user1', user);

      expect(userCache.get('user1')).toEqual(user);
    });

    it('should support array values', () => {
      const arrayCache = new CacheManager<number[]>({ ttl: 1000 });

      arrayCache.set('numbers', [1, 2, 3, 4, 5]);

      expect(arrayCache.get('numbers')).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('Singleton instances', () => {
    it('should provide a default trends cache instance', () => {
      const { trendsCache } = require('@/lib/cache');
      expect(trendsCache).toBeDefined();
      expect(trendsCache).toBeInstanceOf(CacheManager);
    });

    it('should provide a default reports cache instance', () => {
      const { reportsCache } = require('@/lib/cache');
      expect(reportsCache).toBeDefined();
      expect(reportsCache).toBeInstanceOf(CacheManager);
    });
  });
});
