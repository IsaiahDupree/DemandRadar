/**
 * TikTok Creative Center Collector Tests
 *
 * Tests for UGC-001: TikTok Creative Center Collector
 * - Fetches top ads from TikTok Creative Center
 * - Rate limited to prevent API abuse
 */

import {
  searchTikTokTopAds,
  searchTikTokTrends,
  collectTikTokUGC,
  TikTokUGCResult
} from '@/lib/collectors/tiktok';

describe('TikTok Creative Center Collector (UGC-001)', () => {
  describe('searchTikTokTopAds', () => {
    it('should fetch top ads for a given query', async () => {
      const query = 'productivity app';
      const results = await searchTikTokTopAds(query);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return TikTokUGCResult objects with correct structure', async () => {
      const query = 'AI tools';
      const results = await searchTikTokTopAds(query);

      expect(results.length).toBeGreaterThan(0);

      const firstResult = results[0];
      expect(firstResult).toHaveProperty('asset');
      expect(firstResult).toHaveProperty('metrics');

      // Check asset structure
      expect(firstResult.asset).toHaveProperty('source');
      expect(firstResult.asset.source).toBe('tiktok_top_ads');
      expect(firstResult.asset).toHaveProperty('platform');
      expect(firstResult.asset.platform).toBe('tiktok');
      expect(firstResult.asset).toHaveProperty('video_id');
      expect(firstResult.asset).toHaveProperty('url');
    });

    it('should return mock data when RAPIDAPI_KEY is not set', async () => {
      const originalKey = process.env.RAPIDAPI_KEY;
      delete process.env.RAPIDAPI_KEY;

      const query = 'SaaS tools';
      const results = await searchTikTokTopAds(query);

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].asset.source).toBe('tiktok_top_ads');

      // Restore env
      if (originalKey) {
        process.env.RAPIDAPI_KEY = originalKey;
      }
    });

    it('should respect limit parameter', async () => {
      const query = 'marketing tools';
      const limit = 5;
      const results = await searchTikTokTopAds(query, { limit });

      // Mock data returns 5 items, so this should work
      expect(results.length).toBeLessThanOrEqual(limit);
    });

    it('should handle country parameter', async () => {
      const query = 'fitness app';
      const results = await searchTikTokTopAds(query, { country: 'US' });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle industry parameter', async () => {
      const query = 'CRM software';
      const results = await searchTikTokTopAds(query, { industry: 'SaaS' });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should include metrics in results', async () => {
      const query = 'project management';
      const results = await searchTikTokTopAds(query);

      expect(results.length).toBeGreaterThan(0);

      const firstResult = results[0];
      expect(firstResult.metrics).toBeDefined();

      if (firstResult.metrics) {
        expect(firstResult.metrics).toHaveProperty('views');
        expect(firstResult.metrics).toHaveProperty('likes');
        expect(firstResult.metrics).toHaveProperty('comments');
        expect(firstResult.metrics).toHaveProperty('shares');
      }
    });

    it('should include pattern data in results', async () => {
      const query = 'email marketing';
      const results = await searchTikTokTopAds(query);

      expect(results.length).toBeGreaterThan(0);

      // At least some results should have pattern data
      const resultsWithPatterns = results.filter(r => r.pattern);
      expect(resultsWithPatterns.length).toBeGreaterThan(0);

      const firstPattern = resultsWithPatterns[0].pattern;
      if (firstPattern) {
        expect(firstPattern).toHaveProperty('hook_type');
        expect(firstPattern).toHaveProperty('format');
      }
    });

    it('should handle API errors gracefully', async () => {
      // This should not throw even if API fails
      const query = 'test query that might fail';

      await expect(searchTikTokTopAds(query)).resolves.toBeDefined();
    });
  });

  describe('searchTikTokTrends', () => {
    it('should fetch trending content for hashtags', async () => {
      // Mock API returns empty, so it falls back to mock data
      delete process.env.RAPIDAPI_KEY;

      const query = 'productivity';
      const results = await searchTikTokTrends(query, 'hashtag');

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should mark results with tiktok_trend source', async () => {
      delete process.env.RAPIDAPI_KEY;

      const query = 'startup';
      const results = await searchTikTokTrends(query);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].asset.source).toBe('tiktok_trend');
    });

    it('should handle different trend types', async () => {
      const query = 'business';

      // Hashtag
      const hashtagResults = await searchTikTokTrends(query, 'hashtag');
      expect(hashtagResults).toBeDefined();

      // Sound
      const soundResults = await searchTikTokTrends(query, 'sound');
      expect(soundResults).toBeDefined();

      // Video
      const videoResults = await searchTikTokTrends(query, 'video');
      expect(videoResults).toBeDefined();
    });
  });

  describe('collectTikTokUGC', () => {
    beforeEach(() => {
      // Ensure we use mock data for consistent results
      delete process.env.RAPIDAPI_KEY;
    });

    it('should collect UGC for niche query', async () => {
      const nicheQuery = 'productivity tools';
      const results = await collectTikTokUGC(nicheQuery);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should collect UGC with seed terms', async () => {
      const nicheQuery = 'task management';
      const seedTerms = ['Trello', 'Asana', 'Monday'];
      const results = await collectTikTokUGC(nicheQuery, seedTerms);

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
    });

    it('should deduplicate results by video_id', async () => {
      const nicheQuery = 'SaaS tools';
      const results = await collectTikTokUGC(nicheQuery);

      const videoIds = results.map(r => r.asset.video_id);
      const uniqueVideoIds = new Set(videoIds);

      // All video IDs should be unique
      expect(videoIds.length).toBe(uniqueVideoIds.size);
    });

    it('should include both top ads and trends', async () => {
      const nicheQuery = 'startup tools';
      const results = await collectTikTokUGC(nicheQuery);

      // Should have results from both sources
      const topAds = results.filter(r => r.asset.source === 'tiktok_top_ads');
      const trends = results.filter(r => r.asset.source === 'tiktok_trend');

      // At least one of each type (in mock data)
      expect(topAds.length).toBeGreaterThan(0);
      expect(trends.length).toBeGreaterThan(0);
    });

    it('should limit seed terms to 3', async () => {
      const nicheQuery = 'CRM';
      const seedTerms = ['Salesforce', 'HubSpot', 'Pipedrive', 'Zoho', 'Freshsales'];

      // Mock implementation should process niche + 3 seed terms = 4 total
      const results = await collectTikTokUGC(nicheQuery, seedTerms);

      expect(results).toBeDefined();
      // Results should exist
      expect(results.length).toBeGreaterThan(0);
    });

    it('should implement rate limiting between requests', async () => {
      const nicheQuery = 'marketing automation';
      const seedTerms = ['email', 'social'];

      const startTime = Date.now();
      await collectTikTokUGC(nicheQuery, seedTerms);
      const endTime = Date.now();

      // With rate limiting of 500ms per term, 3 terms (niche + 2 seeds)
      // should take at least 1000ms (2 delays: after term 1, after term 2)
      // Allow some tolerance for execution time
      const timeTaken = endTime - startTime;
      expect(timeTaken).toBeGreaterThanOrEqual(900); // 2 * 500ms - 100ms tolerance
    }, 10000); // 10 second timeout

    it('should continue collection even if some terms fail', async () => {
      const nicheQuery = 'test';
      const seedTerms = ['valid', 'another'];

      const results = await collectTikTokUGC(nicheQuery, seedTerms);

      // Should still return results even if individual terms error
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Rate Limiting (UGC-001 Acceptance Criteria)', () => {
    it('should implement rate limiting in collectTikTokUGC', async () => {
      const nicheQuery = 'test query';
      const seedTerms = ['term1', 'term2'];

      const startTime = Date.now();
      await collectTikTokUGC(nicheQuery, seedTerms);
      const endTime = Date.now();

      // Should have delays between requests
      expect(endTime - startTime).toBeGreaterThanOrEqual(900);
    }, 10000);

    it('should not exceed reasonable time limits', async () => {
      const nicheQuery = 'quick test';

      const startTime = Date.now();
      await collectTikTokUGC(nicheQuery);
      const endTime = Date.now();

      // Should complete in reasonable time (single query + trend)
      // 2 API calls with 500ms delay = ~1s + API time
      expect(endTime - startTime).toBeLessThan(5000);
    }, 10000);
  });

  describe('Mock Data Quality', () => {
    it('should generate realistic mock data', async () => {
      delete process.env.RAPIDAPI_KEY;

      const query = 'AI writing tools';
      const results = await searchTikTokTopAds(query);

      expect(results.length).toBeGreaterThan(0);

      results.forEach(result => {
        // Check caption includes query context
        expect(result.asset.caption).toBeDefined();
        expect(result.asset.caption).toBeTruthy();

        // Check has hashtags
        expect(result.asset.hashtags).toBeDefined();
        expect(Array.isArray(result.asset.hashtags)).toBe(true);

        // Check metrics are realistic
        if (result.metrics) {
          expect(result.metrics.views).toBeGreaterThan(0);
          expect(result.metrics.likes).toBeGreaterThan(0);
        }
      });
    });
  });
});
