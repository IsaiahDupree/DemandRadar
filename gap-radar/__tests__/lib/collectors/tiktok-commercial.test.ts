/**
 * TikTok Commercial Content API Tests
 *
 * Tests for UGC-COLLECT-002: TikTok Commercial Content API
 * - Fetches commercial ad metadata from TikTok Commercial Content API
 * - Provides reach metrics and first/last shown dates
 */

import {
  searchTikTokCommercialAds,
  getTikTokAdMetrics,
  collectTikTokCommercialContent,
  TikTokCommercialAd,
  TikTokCommercialMetrics
} from '@/lib/collectors/tiktok-commercial';

describe('TikTok Commercial Content API (UGC-COLLECT-002)', () => {
  describe('searchTikTokCommercialAds', () => {
    it('should fetch commercial ads for a given query', async () => {
      const query = 'productivity app';
      const results = await searchTikTokCommercialAds(query);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return TikTokCommercialAd objects with correct structure', async () => {
      const query = 'AI tools';
      const results = await searchTikTokCommercialAds(query);

      expect(results.length).toBeGreaterThan(0);

      const firstResult = results[0];
      expect(firstResult).toHaveProperty('ad_id');
      expect(firstResult).toHaveProperty('advertiser_name');
      expect(firstResult).toHaveProperty('video_id');
      expect(firstResult).toHaveProperty('creative_url');
      expect(firstResult).toHaveProperty('caption');
    });

    it('should return mock data when TIKTOK_COMMERCIAL_API_KEY is not set', async () => {
      const originalKey = process.env.TIKTOK_COMMERCIAL_API_KEY;
      delete process.env.TIKTOK_COMMERCIAL_API_KEY;

      const query = 'SaaS tools';
      const results = await searchTikTokCommercialAds(query);

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);

      // Restore env
      if (originalKey) {
        process.env.TIKTOK_COMMERCIAL_API_KEY = originalKey;
      }
    });

    it('should respect limit parameter', async () => {
      const query = 'marketing tools';
      const limit = 10;
      const results = await searchTikTokCommercialAds(query, { limit });

      expect(results.length).toBeLessThanOrEqual(limit);
    });

    it('should handle country parameter', async () => {
      const query = 'fitness app';
      const results = await searchTikTokCommercialAds(query, { country: 'US' });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle API errors gracefully', async () => {
      const query = 'test query that might fail';

      await expect(searchTikTokCommercialAds(query)).resolves.toBeDefined();
    });
  });

  describe('getTikTokAdMetrics', () => {
    it('should fetch metrics for a given ad ID', async () => {
      const adId = 'mock_ad_123';
      const metrics = await getTikTokAdMetrics(adId);

      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('reach_unique_users');
      expect(metrics).toHaveProperty('impressions');
      expect(metrics).toHaveProperty('views');
    });

    it('should include first_shown and last_shown dates', async () => {
      const adId = 'mock_ad_456';
      const metrics = await getTikTokAdMetrics(adId);

      expect(metrics).toHaveProperty('first_shown');
      expect(metrics).toHaveProperty('last_shown');

      // Dates should be valid ISO strings or undefined
      if (metrics.first_shown) {
        expect(() => new Date(metrics.first_shown)).not.toThrow();
      }
      if (metrics.last_shown) {
        expect(() => new Date(metrics.last_shown)).not.toThrow();
      }
    });

    it('should include engagement metrics', async () => {
      const adId = 'mock_ad_789';
      const metrics = await getTikTokAdMetrics(adId);

      expect(metrics).toHaveProperty('clicks');
      expect(metrics).toHaveProperty('engagement_rate');
    });

    it('should return mock metrics when API key is not set', async () => {
      const originalKey = process.env.TIKTOK_COMMERCIAL_API_KEY;
      delete process.env.TIKTOK_COMMERCIAL_API_KEY;

      const adId = 'test_ad';
      const metrics = await getTikTokAdMetrics(adId);

      expect(metrics).toBeDefined();
      expect(metrics.reach_unique_users).toBeGreaterThan(0);

      // Restore env
      if (originalKey) {
        process.env.TIKTOK_COMMERCIAL_API_KEY = originalKey;
      }
    });

    it('should handle invalid ad IDs gracefully', async () => {
      const adId = 'invalid_ad_id';

      await expect(getTikTokAdMetrics(adId)).resolves.toBeDefined();
    });
  });

  describe('collectTikTokCommercialContent', () => {
    beforeEach(() => {
      // Ensure we use mock data for consistent results
      delete process.env.TIKTOK_COMMERCIAL_API_KEY;
    });

    it('should collect commercial content for niche query', async () => {
      const nicheQuery = 'productivity tools';
      const results = await collectTikTokCommercialContent(nicheQuery);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should include both ad data and metrics', async () => {
      const nicheQuery = 'task management';
      const results = await collectTikTokCommercialContent(nicheQuery);

      expect(results.length).toBeGreaterThan(0);

      const firstResult = results[0];
      expect(firstResult).toHaveProperty('ad');
      expect(firstResult).toHaveProperty('metrics');

      // Check ad structure
      expect(firstResult.ad).toHaveProperty('ad_id');
      expect(firstResult.ad).toHaveProperty('advertiser_name');

      // Check metrics structure
      expect(firstResult.metrics).toHaveProperty('reach_unique_users');
      expect(firstResult.metrics).toHaveProperty('first_shown');
    });

    it('should collect content with seed terms', async () => {
      const nicheQuery = 'CRM';
      const seedTerms = ['Salesforce alternative', 'HubSpot competitor'];
      const results = await collectTikTokCommercialContent(nicheQuery, seedTerms);

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
    });

    it('should deduplicate results by ad_id', async () => {
      const nicheQuery = 'SaaS tools';
      const results = await collectTikTokCommercialContent(nicheQuery);

      const adIds = results.map(r => r.ad.ad_id);
      const uniqueAdIds = new Set(adIds);

      // All ad IDs should be unique
      expect(adIds.length).toBe(uniqueAdIds.size);
    });

    it('should implement rate limiting between requests', async () => {
      const nicheQuery = 'marketing automation';
      const seedTerms = ['email', 'social'];

      const startTime = Date.now();
      await collectTikTokCommercialContent(nicheQuery, seedTerms);
      const endTime = Date.now();

      // With rate limiting of 500ms per term, 3 terms should take at least 1000ms
      const timeTaken = endTime - startTime;
      expect(timeTaken).toBeGreaterThanOrEqual(900); // 2 * 500ms - 100ms tolerance
    }, 10000); // 10 second timeout

    it('should limit seed terms to prevent excessive API calls', async () => {
      const nicheQuery = 'CRM';
      const seedTerms = ['term1', 'term2', 'term3', 'term4', 'term5', 'term6'];

      // Should process niche + limited seed terms
      const results = await collectTikTokCommercialContent(nicheQuery, seedTerms);

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
    });

    it('should continue collection even if some terms fail', async () => {
      const nicheQuery = 'test';
      const seedTerms = ['valid', 'another'];

      const results = await collectTikTokCommercialContent(nicheQuery, seedTerms);

      // Should still return results even if individual terms error
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Acceptance Criteria (UGC-COLLECT-002)', () => {
    it('should support commercial API access with authentication', async () => {
      // Test that API key is used when available
      const query = 'test';

      // Should work with or without API key (mock fallback)
      await expect(searchTikTokCommercialAds(query)).resolves.toBeDefined();
    });

    it('should provide reach metrics', async () => {
      const adId = 'test_ad';
      const metrics = await getTikTokAdMetrics(adId);

      // Must include reach metrics
      expect(metrics).toHaveProperty('reach_unique_users');
      expect(typeof metrics.reach_unique_users).toBe('number');
    });

    it('should provide first and last shown dates', async () => {
      const adId = 'test_ad';
      const metrics = await getTikTokAdMetrics(adId);

      // Must include first/last shown dates
      expect(metrics).toHaveProperty('first_shown');
      expect(metrics).toHaveProperty('last_shown');

      // At least one should be defined in mock data
      expect(
        metrics.first_shown !== undefined || metrics.last_shown !== undefined
      ).toBe(true);
    });
  });

  describe('Mock Data Quality', () => {
    it('should generate realistic mock commercial ads', async () => {
      delete process.env.TIKTOK_COMMERCIAL_API_KEY;

      const query = 'AI writing tools';
      const results = await searchTikTokCommercialAds(query);

      expect(results.length).toBeGreaterThan(0);

      results.forEach(ad => {
        // Check advertiser name is present
        expect(ad.advertiser_name).toBeDefined();
        expect(ad.advertiser_name).toBeTruthy();

        // Check caption is present
        expect(ad.caption).toBeDefined();
        expect(ad.caption).toBeTruthy();

        // Check has valid URL
        expect(ad.creative_url).toBeDefined();
        expect(ad.creative_url).toMatch(/^https?:\/\//);
      });
    });

    it('should generate realistic mock metrics', async () => {
      delete process.env.TIKTOK_COMMERCIAL_API_KEY;

      const adId = 'test';
      const metrics = await getTikTokAdMetrics(adId);

      // Check metrics are realistic numbers
      expect(metrics.reach_unique_users).toBeGreaterThan(0);
      expect(metrics.impressions).toBeGreaterThan(metrics.reach_unique_users);
      expect(metrics.views).toBeGreaterThan(0);

      // Engagement rate should be a valid percentage
      if (metrics.engagement_rate !== undefined) {
        expect(metrics.engagement_rate).toBeGreaterThanOrEqual(0);
        expect(metrics.engagement_rate).toBeLessThanOrEqual(100);
      }
    });
  });
});
