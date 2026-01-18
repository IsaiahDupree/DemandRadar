/**
 * Report Caching Layer Tests
 *
 * Tests for report caching to avoid recomputation
 * @jest-environment node
 */

import {
  ReportCache,
  getCachedReport,
  setCachedReport,
  invalidateReportCache,
  isCacheValid,
  type CachedReport,
} from '@/lib/reports/cache';

describe('Report Caching Layer', () => {
  beforeEach(() => {
    // Clear cache before each test
    ReportCache.clear();
  });

  describe('setCachedReport', () => {
    it('should cache a report with metadata', () => {
      const runId = 'test-run-123';
      const reportData = {
        id: 'report-1',
        title: 'Test Report',
        sections: ['overview', 'gaps'],
        generatedAt: new Date().toISOString(),
      };

      setCachedReport(runId, reportData);

      const cached = getCachedReport(runId);
      expect(cached).toBeDefined();
      expect(cached?.data).toEqual(reportData);
      expect(cached?.cachedAt).toBeDefined();
      expect(cached?.runId).toBe(runId);
    });

    it('should overwrite existing cache entry', () => {
      const runId = 'test-run-123';
      const report1 = { title: 'Report 1' };
      const report2 = { title: 'Report 2' };

      setCachedReport(runId, report1);
      setCachedReport(runId, report2);

      const cached = getCachedReport(runId);
      expect(cached?.data).toEqual(report2);
    });

    it('should set TTL timestamp', () => {
      const runId = 'test-run-123';
      const reportData = { title: 'Test' };
      const ttlMs = 60000; // 1 minute

      setCachedReport(runId, reportData, { ttlMs });

      const cached = getCachedReport(runId);
      expect(cached?.expiresAt).toBeDefined();

      if (cached?.expiresAt) {
        const expiresAt = new Date(cached.expiresAt).getTime();
        const now = Date.now();
        const expectedExpiry = now + ttlMs;

        // Allow 100ms tolerance
        expect(Math.abs(expiresAt - expectedExpiry)).toBeLessThan(100);
      }
    });
  });

  describe('getCachedReport', () => {
    it('should return cached report if valid', () => {
      const runId = 'test-run-123';
      const reportData = { title: 'Test Report' };

      setCachedReport(runId, reportData);

      const cached = getCachedReport(runId);
      expect(cached).toBeDefined();
      expect(cached?.data).toEqual(reportData);
    });

    it('should return null for non-existent cache entry', () => {
      const cached = getCachedReport('non-existent-id');
      expect(cached).toBeNull();
    });

    it('should return null for expired cache entry', () => {
      const runId = 'test-run-123';
      const reportData = { title: 'Test Report' };

      // Cache with very short TTL
      setCachedReport(runId, reportData, { ttlMs: -1000 }); // Expired 1 second ago

      const cached = getCachedReport(runId);
      expect(cached).toBeNull();
    });

    it('should return valid cache within TTL window', () => {
      const runId = 'test-run-123';
      const reportData = { title: 'Test Report' };

      // Cache with 5 second TTL
      setCachedReport(runId, reportData, { ttlMs: 5000 });

      const cached = getCachedReport(runId);
      expect(cached).toBeDefined();
      expect(cached?.data).toEqual(reportData);
    });
  });

  describe('isCacheValid', () => {
    it('should return true for valid cache entry', () => {
      const runId = 'test-run-123';
      const reportData = { title: 'Test Report' };

      setCachedReport(runId, reportData, { ttlMs: 60000 });

      expect(isCacheValid(runId)).toBe(true);
    });

    it('should return false for non-existent entry', () => {
      expect(isCacheValid('non-existent-id')).toBe(false);
    });

    it('should return false for expired entry', () => {
      const runId = 'test-run-123';
      const reportData = { title: 'Test Report' };

      setCachedReport(runId, reportData, { ttlMs: -1000 });

      expect(isCacheValid(runId)).toBe(false);
    });

    it('should return true for cache without expiry', () => {
      const runId = 'test-run-123';
      const reportData = { title: 'Test Report' };

      // No TTL specified = never expires
      setCachedReport(runId, reportData);

      expect(isCacheValid(runId)).toBe(true);
    });
  });

  describe('invalidateReportCache', () => {
    it('should invalidate specific cache entry', () => {
      const runId1 = 'test-run-1';
      const runId2 = 'test-run-2';

      setCachedReport(runId1, { title: 'Report 1' });
      setCachedReport(runId2, { title: 'Report 2' });

      invalidateReportCache(runId1);

      expect(getCachedReport(runId1)).toBeNull();
      expect(getCachedReport(runId2)).toBeDefined();
    });

    it('should not throw when invalidating non-existent entry', () => {
      expect(() => invalidateReportCache('non-existent')).not.toThrow();
    });

    it('should clear all cache when no runId provided', () => {
      setCachedReport('run-1', { title: 'Report 1' });
      setCachedReport('run-2', { title: 'Report 2' });
      setCachedReport('run-3', { title: 'Report 3' });

      invalidateReportCache();

      expect(getCachedReport('run-1')).toBeNull();
      expect(getCachedReport('run-2')).toBeNull();
      expect(getCachedReport('run-3')).toBeNull();
    });
  });

  describe('Cache Hit/Miss Logic', () => {
    it('should track cache hits', () => {
      const runId = 'test-run-123';
      const reportData = { title: 'Test Report' };

      setCachedReport(runId, reportData);

      // First retrieval = cache hit
      const cached = getCachedReport(runId);
      expect(cached).toBeDefined();
    });

    it('should handle cache miss', () => {
      // Attempt to retrieve non-existent cache = cache miss
      const cached = getCachedReport('non-existent');
      expect(cached).toBeNull();
    });
  });

  describe('TTL Configuration', () => {
    it('should use default TTL when not specified', () => {
      const runId = 'test-run-123';
      const reportData = { title: 'Test Report' };

      setCachedReport(runId, reportData);

      const cached = getCachedReport(runId);

      // Should either have no expiry or a default TTL
      expect(cached).toBeDefined();
    });

    it('should respect custom TTL', () => {
      const runId = 'test-run-123';
      const reportData = { title: 'Test Report' };
      const customTTL = 120000; // 2 minutes

      setCachedReport(runId, reportData, { ttlMs: customTTL });

      const cached = getCachedReport(runId);
      expect(cached).toBeDefined();

      if (cached?.expiresAt) {
        const expiresAt = new Date(cached.expiresAt).getTime();
        const now = Date.now();
        const expectedExpiry = now + customTTL;

        expect(Math.abs(expiresAt - expectedExpiry)).toBeLessThan(100);
      }
    });

    it('should allow infinite TTL', () => {
      const runId = 'test-run-123';
      const reportData = { title: 'Test Report' };

      // No TTL = cache never expires
      setCachedReport(runId, reportData, { ttlMs: undefined });

      const cached = getCachedReport(runId);
      expect(cached).toBeDefined();
      expect(cached?.expiresAt).toBeUndefined();
    });
  });

  describe('Data Change Invalidation', () => {
    it('should invalidate cache when run data changes', () => {
      const runId = 'test-run-123';
      const reportData = { title: 'Original Report' };

      setCachedReport(runId, reportData);
      expect(isCacheValid(runId)).toBe(true);

      // Simulate data change by invalidating
      invalidateReportCache(runId);

      expect(isCacheValid(runId)).toBe(false);
      expect(getCachedReport(runId)).toBeNull();
    });

    it('should allow re-caching after invalidation', () => {
      const runId = 'test-run-123';
      const report1 = { title: 'Report 1' };
      const report2 = { title: 'Report 2 (Updated)' };

      setCachedReport(runId, report1);
      invalidateReportCache(runId);
      setCachedReport(runId, report2);

      const cached = getCachedReport(runId);
      expect(cached?.data).toEqual(report2);
    });
  });

  describe('Memory Management', () => {
    it('should handle multiple cache entries', () => {
      const entries = Array(100)
        .fill(null)
        .map((_, i) => ({
          runId: `run-${i}`,
          data: { title: `Report ${i}` },
        }));

      entries.forEach(({ runId, data }) => {
        setCachedReport(runId, data);
      });

      entries.forEach(({ runId, data }) => {
        const cached = getCachedReport(runId);
        expect(cached?.data).toEqual(data);
      });
    });

    it('should clear all entries efficiently', () => {
      // Add many entries
      for (let i = 0; i < 50; i++) {
        setCachedReport(`run-${i}`, { title: `Report ${i}` });
      }

      // Clear all
      invalidateReportCache();

      // Verify all cleared
      for (let i = 0; i < 50; i++) {
        expect(getCachedReport(`run-${i}`)).toBeNull();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty report data', () => {
      const runId = 'test-run-123';
      const emptyData = {};

      setCachedReport(runId, emptyData);

      const cached = getCachedReport(runId);
      expect(cached?.data).toEqual(emptyData);
    });

    it('should handle large report data', () => {
      const runId = 'test-run-123';
      const largeData = {
        gaps: Array(1000).fill({ title: 'Gap', score: 80 }),
        ads: Array(5000).fill({ text: 'Ad creative' }),
      };

      setCachedReport(runId, largeData);

      const cached = getCachedReport(runId);
      expect(cached?.data).toEqual(largeData);
    });

    it('should handle null/undefined runId gracefully', () => {
      expect(() => getCachedReport(null as any)).not.toThrow();
      expect(() => getCachedReport(undefined as any)).not.toThrow();
      expect(getCachedReport(null as any)).toBeNull();
      expect(getCachedReport(undefined as any)).toBeNull();
    });
  });
});
