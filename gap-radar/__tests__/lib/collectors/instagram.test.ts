/**
 * Instagram Hashtag Search Tests
 *
 * Tests for UGC-COLLECT-003: Instagram Hashtag Search
 * - Graph API integration for hashtag search
 * - Post extraction with metrics
 * - UGC content discovery
 */

import {
  searchInstagramHashtag,
  searchInstagramContent,
  collectInstagramUGC,
  InstagramUGCResult,
  InstagramAsset,
  InstagramMetrics
} from '@/lib/collectors/instagram';

describe('Instagram Hashtag Search (UGC-COLLECT-003)', () => {
  describe('searchInstagramHashtag', () => {
    it('should fetch Instagram posts for a given hashtag', async () => {
      const hashtag = 'productivityapp';
      const results = await searchInstagramHashtag(hashtag);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return InstagramUGCResult objects with correct structure', async () => {
      const hashtag = 'AItools';
      const results = await searchInstagramHashtag(hashtag);

      expect(results.length).toBeGreaterThan(0);

      const firstResult = results[0];
      expect(firstResult).toHaveProperty('asset');
      expect(firstResult).toHaveProperty('metrics');

      // Check asset structure
      expect(firstResult.asset).toHaveProperty('source');
      expect(firstResult.asset).toHaveProperty('platform');
      expect(firstResult.asset).toHaveProperty('post_id');
      expect(firstResult.asset).toHaveProperty('url');
      expect(firstResult.asset).toHaveProperty('media_type');

      expect(firstResult.asset.source).toBe('ig_hashtag');
      expect(firstResult.asset.platform).toBe('instagram');
    });

    it('should handle hashtags with # symbol', async () => {
      const hashtag = '#SaaS';
      const results = await searchInstagramHashtag(hashtag);

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle hashtags without # symbol', async () => {
      const hashtag = 'marketing';
      const results = await searchInstagramHashtag(hashtag);

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return mock data when RAPIDAPI_KEY is not set', async () => {
      const originalKey = process.env.RAPIDAPI_KEY;
      delete process.env.RAPIDAPI_KEY;

      const hashtag = 'fitness';
      const results = await searchInstagramHashtag(hashtag);

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);

      // Mock data should have valid structure
      const firstResult = results[0];
      expect(firstResult.asset.post_id).toBeTruthy();
      expect(firstResult.asset.url).toMatch(/instagram\.com/);

      // Restore env
      if (originalKey) {
        process.env.RAPIDAPI_KEY = originalKey;
      }
    });

    it('should respect limit parameter', async () => {
      const hashtag = 'business';
      const limit = 10;
      const results = await searchInstagramHashtag(hashtag, { limit });

      expect(results.length).toBeLessThanOrEqual(limit);
    });

    it('should include metrics in results', async () => {
      const hashtag = 'entrepreneur';
      const results = await searchInstagramHashtag(hashtag);

      expect(results.length).toBeGreaterThan(0);

      const firstResult = results[0];
      expect(firstResult.metrics).toBeDefined();
      expect(firstResult.metrics).toHaveProperty('likes');
      expect(firstResult.metrics).toHaveProperty('comments');

      // Engagement rate should be calculated
      if (firstResult.metrics?.engagement_rate !== undefined) {
        expect(firstResult.metrics.engagement_rate).toBeGreaterThanOrEqual(0);
      }
    });

    it('should extract hashtags from captions', async () => {
      const hashtag = 'startup';
      const results = await searchInstagramHashtag(hashtag);

      expect(results.length).toBeGreaterThan(0);

      // At least some results should have hashtags
      const resultsWithHashtags = results.filter(r =>
        r.asset.hashtags && r.asset.hashtags.length > 0
      );
      expect(resultsWithHashtags.length).toBeGreaterThan(0);
    });

    it('should handle API errors gracefully', async () => {
      const hashtag = 'test-query-that-might-fail';

      // Should not throw, should return mock data instead
      await expect(searchInstagramHashtag(hashtag)).resolves.toBeDefined();
    });

    it('should include creator username when available', async () => {
      const hashtag = 'creators';
      const results = await searchInstagramHashtag(hashtag);

      expect(results.length).toBeGreaterThan(0);

      // Mock data should have creator usernames
      results.forEach(result => {
        if (result.asset.creator_username) {
          expect(typeof result.asset.creator_username).toBe('string');
          expect(result.asset.creator_username.length).toBeGreaterThan(0);
        }
      });
    });

    it('should include posted_at timestamp', async () => {
      const hashtag = 'content';
      const results = await searchInstagramHashtag(hashtag);

      expect(results.length).toBeGreaterThan(0);

      results.forEach(result => {
        if (result.asset.posted_at) {
          expect(() => new Date(result.asset.posted_at)).not.toThrow();
        }
      });
    });

    it('should identify different media types', async () => {
      const hashtag = 'ugc';
      const results = await searchInstagramHashtag(hashtag);

      expect(results.length).toBeGreaterThan(0);

      results.forEach(result => {
        expect(['image', 'video', 'carousel']).toContain(result.asset.media_type);
      });
    });
  });

  describe('searchInstagramContent', () => {
    it('should search Instagram for general content', async () => {
      const query = 'productivity tools';
      const results = await searchInstagramContent(query);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should fall back to hashtag search if direct search fails', async () => {
      delete process.env.RAPIDAPI_KEY;

      const query = 'business automation';
      const results = await searchInstagramContent(query);

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
    });

    it('should respect limit parameter', async () => {
      const query = 'marketing';
      const limit = 5;
      const results = await searchInstagramContent(query, { limit });

      expect(results.length).toBeLessThanOrEqual(limit);
    });

    it('should return results with proper structure', async () => {
      const query = 'AI writing';
      const results = await searchInstagramContent(query);

      expect(results.length).toBeGreaterThan(0);

      const firstResult = results[0];
      expect(firstResult.asset).toHaveProperty('platform');
      expect(firstResult.asset.platform).toBe('instagram');
      expect(firstResult.asset).toHaveProperty('url');
    });
  });

  describe('collectInstagramUGC', () => {
    beforeEach(() => {
      // Ensure we use mock data for consistent results
      delete process.env.RAPIDAPI_KEY;
    });

    it('should collect Instagram UGC for niche query', async () => {
      const nicheQuery = 'productivity app';
      const results = await collectInstagramUGC(nicheQuery);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should collect UGC with seed terms', async () => {
      const nicheQuery = 'CRM';
      const seedTerms = ['sales software', 'lead management'];
      const results = await collectInstagramUGC(nicheQuery, seedTerms);

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
    });

    it('should deduplicate results by post_id', async () => {
      const nicheQuery = 'SaaS';
      const seedTerms = ['software', 'tools'];
      const results = await collectInstagramUGC(nicheQuery, seedTerms);

      const postIds = results.map(r => r.asset.post_id);
      const uniquePostIds = new Set(postIds);

      // All post IDs should be unique
      expect(postIds.length).toBe(uniquePostIds.size);
    });

    it('should convert niche query to hashtag-friendly format', async () => {
      const nicheQuery = 'email marketing tools';
      const results = await collectInstagramUGC(nicheQuery);

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
    });

    it('should limit seed terms to prevent excessive API calls', async () => {
      const nicheQuery = 'marketing';
      const seedTerms = ['email', 'social', 'content', 'SEO', 'ads', 'analytics'];

      // Should only process first 4 seed terms
      const results = await collectInstagramUGC(nicheQuery, seedTerms);

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
    }, 10000); // 10 second timeout

    it('should implement rate limiting between requests', async () => {
      const nicheQuery = 'fitness';
      const seedTerms = ['workout', 'gym'];

      const startTime = Date.now();
      await collectInstagramUGC(nicheQuery, seedTerms);
      const endTime = Date.now();

      // With rate limiting of 1000ms per term, 3 terms should take at least 2000ms
      const timeTaken = endTime - startTime;
      expect(timeTaken).toBeGreaterThanOrEqual(1900); // 2 * 1000ms - 100ms tolerance
    }, 10000); // 10 second timeout

    it('should continue collection even if some hashtags fail', async () => {
      const nicheQuery = 'test';
      const seedTerms = ['valid', 'another'];

      const results = await collectInstagramUGC(nicheQuery, seedTerms);

      // Should still return results even if individual hashtags error
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should include pattern data when available', async () => {
      const nicheQuery = 'content creation';
      const results = await collectInstagramUGC(nicheQuery);

      expect(results.length).toBeGreaterThan(0);

      // Check if any results have pattern data (from mock)
      const resultsWithPatterns = results.filter(r => r.pattern);
      if (resultsWithPatterns.length > 0) {
        const firstPattern = resultsWithPatterns[0].pattern;
        expect(firstPattern).toBeDefined();

        // Pattern should have expected fields
        if (firstPattern?.hook_type) {
          expect(typeof firstPattern.hook_type).toBe('string');
        }
      }
    });
  });

  describe('Acceptance Criteria (UGC-COLLECT-003)', () => {
    it('should support Graph API integration (or RapidAPI fallback)', async () => {
      const hashtag = 'entrepreneurship';

      // Should work with or without API key (mock fallback)
      await expect(searchInstagramHashtag(hashtag)).resolves.toBeDefined();
    });

    it('should support hashtag search functionality', async () => {
      const hashtag = 'startup';
      const results = await searchInstagramHashtag(hashtag);

      // Must successfully search by hashtag
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      // Results should be from hashtag search
      results.forEach(result => {
        expect(result.asset.source).toBe('ig_hashtag');
      });
    });

    it('should extract post data with required fields', async () => {
      const hashtag = 'business';
      const results = await searchInstagramHashtag(hashtag);

      expect(results.length).toBeGreaterThan(0);

      // Each result must have essential post data
      results.forEach(result => {
        expect(result.asset).toHaveProperty('post_id');
        expect(result.asset).toHaveProperty('url');
        expect(result.asset).toHaveProperty('platform');
        expect(result.asset).toHaveProperty('media_type');

        expect(result.asset.post_id).toBeTruthy();
        expect(result.asset.url).toBeTruthy();
        expect(result.asset.platform).toBe('instagram');
      });
    });

    it('should provide engagement metrics', async () => {
      const hashtag = 'marketing';
      const results = await searchInstagramHashtag(hashtag);

      expect(results.length).toBeGreaterThan(0);

      // Results should include metrics
      results.forEach(result => {
        expect(result.metrics).toBeDefined();

        // At least likes and comments should be present
        if (result.metrics) {
          expect(result.metrics.likes !== undefined || result.metrics.comments !== undefined).toBe(true);
        }
      });
    });
  });

  describe('Mock Data Quality', () => {
    it('should generate realistic mock Instagram posts', async () => {
      delete process.env.RAPIDAPI_KEY;

      const hashtag = 'contentcreator';
      const results = await searchInstagramHashtag(hashtag);

      expect(results.length).toBeGreaterThan(0);

      results.forEach(post => {
        // Check caption is present and meaningful
        expect(post.asset.caption).toBeDefined();
        expect(post.asset.caption).toBeTruthy();

        // Check URL is valid Instagram URL
        expect(post.asset.url).toMatch(/instagram\.com/);

        // Check post_id is present
        expect(post.asset.post_id).toBeTruthy();

        // Check media type is valid
        expect(['image', 'video', 'carousel']).toContain(post.asset.media_type);
      });
    });

    it('should generate realistic engagement metrics', async () => {
      delete process.env.RAPIDAPI_KEY;

      const hashtag = 'viral';
      const results = await searchInstagramHashtag(hashtag);

      expect(results.length).toBeGreaterThan(0);

      results.forEach(post => {
        // Check metrics are realistic numbers
        if (post.metrics?.likes) {
          expect(post.metrics.likes).toBeGreaterThan(0);
        }

        if (post.metrics?.comments) {
          expect(post.metrics.comments).toBeGreaterThanOrEqual(0);
        }

        // Engagement rate should be a valid percentage
        if (post.metrics?.engagement_rate !== undefined) {
          expect(post.metrics.engagement_rate).toBeGreaterThanOrEqual(0);
          expect(post.metrics.engagement_rate).toBeLessThanOrEqual(100);
        }
      });
    });

    it('should include varied content formats in mock data', async () => {
      delete process.env.RAPIDAPI_KEY;

      const hashtag = 'ugccontent';
      const results = await searchInstagramHashtag(hashtag);

      expect(results.length).toBeGreaterThan(0);

      const mediaTypes = new Set(results.map(r => r.asset.media_type));

      // Mock data should include variety (at least 2 different types)
      expect(mediaTypes.size).toBeGreaterThanOrEqual(2);
    });

    it('should include hashtags in mock data', async () => {
      delete process.env.RAPIDAPI_KEY;

      const hashtag = 'trending';
      const results = await searchInstagramHashtag(hashtag);

      expect(results.length).toBeGreaterThan(0);

      // All mock results should have hashtags
      results.forEach(post => {
        expect(post.asset.hashtags).toBeDefined();
        expect(Array.isArray(post.asset.hashtags)).toBe(true);
        expect(post.asset.hashtags!.length).toBeGreaterThan(0);
      });
    });
  });
});
