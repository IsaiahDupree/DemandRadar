/**
 * YouTube Collector Tests
 *
 * Tests for COLL-010: YouTube Collector
 * - Video search works
 * - Channel analysis works
 * - Metrics extracted
 */

import {
  searchYouTubeVideos,
  getYouTubeChannelData,
  collectYouTubeUGC,
  YouTubeAsset,
  YouTubeMetrics,
  YouTubeUGCResult,
} from '@/lib/collectors/youtube';

describe('YouTube Collector (COLL-010)', () => {
  describe('searchYouTubeVideos', () => {
    beforeEach(() => {
      // Ensure we use mock data for consistent test results
      delete process.env.YOUTUBE_API_KEY;
    });

    it('should search for videos by keyword', async () => {
      const query = 'productivity apps';
      const results = await searchYouTubeVideos(query);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return YouTubeUGCResult objects with correct structure', async () => {
      const query = 'SaaS tools';
      const results = await searchYouTubeVideos(query);

      expect(results.length).toBeGreaterThan(0);

      const firstResult = results[0];
      expect(firstResult).toHaveProperty('asset');
      expect(firstResult.asset).toHaveProperty('video_id');
      expect(firstResult.asset).toHaveProperty('channel_id');
      expect(firstResult.asset).toHaveProperty('url');
      expect(firstResult.asset).toHaveProperty('title');
      expect(firstResult.asset).toHaveProperty('channel_title');
      expect(firstResult.asset.source).toMatch(/youtube/);
      expect(firstResult.asset.platform).toBe('youtube');
    });

    it('should include metrics when available', async () => {
      const query = 'AI writing tools';
      const results = await searchYouTubeVideos(query);

      expect(results.length).toBeGreaterThan(0);

      const resultWithMetrics = results.find(r => r.metrics);
      if (resultWithMetrics) {
        expect(resultWithMetrics.metrics).toHaveProperty('views');
        expect(resultWithMetrics.metrics).toHaveProperty('likes');
        expect(resultWithMetrics.metrics).toHaveProperty('comments');
        expect(typeof resultWithMetrics.metrics.views).toBe('number');
      }
    });

    it('should include pattern analysis when available', async () => {
      const query = 'startup tips';
      const results = await searchYouTubeVideos(query);

      expect(results.length).toBeGreaterThan(0);

      const resultWithPattern = results.find(r => r.pattern);
      if (resultWithPattern) {
        expect(resultWithPattern.pattern).toBeDefined();
        // Pattern should have at least one field
        expect(
          resultWithPattern.pattern.video_format ||
          resultWithPattern.pattern.title_pattern ||
          resultWithPattern.pattern.duration_category
        ).toBeDefined();
      }
    });

    it('should respect maxResults option', async () => {
      const query = 'marketing automation';
      const maxResults = 5;
      const results = await searchYouTubeVideos(query, { maxResults });

      expect(results.length).toBeLessThanOrEqual(maxResults);
    });

    it('should support different ordering options', async () => {
      const query = 'project management tools';

      // Test relevance ordering (default)
      const relevanceResults = await searchYouTubeVideos(query, {
        order: 'relevance',
        maxResults: 3,
      });
      expect(relevanceResults.length).toBeGreaterThan(0);

      // Test view count ordering
      const viewCountResults = await searchYouTubeVideos(query, {
        order: 'viewCount',
        maxResults: 3,
      });
      expect(viewCountResults.length).toBeGreaterThan(0);
    });

    it('should handle video duration filtering', async () => {
      const query = 'email marketing';

      const shortResults = await searchYouTubeVideos(query, {
        videoDuration: 'short',
        maxResults: 3,
      });
      expect(shortResults.length).toBeGreaterThan(0);

      const longResults = await searchYouTubeVideos(query, {
        videoDuration: 'long',
        maxResults: 3,
      });
      expect(longResults.length).toBeGreaterThan(0);
    });

    it('should use mock data when API key is not set', async () => {
      const originalKey = process.env.YOUTUBE_API_KEY;
      delete process.env.YOUTUBE_API_KEY;

      const query = 'CRM software';
      const results = await searchYouTubeVideos(query);

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);

      // Restore env
      if (originalKey) {
        process.env.YOUTUBE_API_KEY = originalKey;
      }
    });
  });

  describe('getYouTubeChannelData', () => {
    beforeEach(() => {
      delete process.env.YOUTUBE_API_KEY;
    });

    it('should retrieve channel information', async () => {
      const channelId = 'UCtest123';
      const result = await getYouTubeChannelData(channelId);

      expect(result).toBeDefined();
      expect(result.channel).toBeDefined();
      expect(result.channel.id).toBe(channelId);
      expect(result.channel).toHaveProperty('title');
      expect(result.channel).toHaveProperty('description');
    });

    it('should include channel statistics', async () => {
      const channelId = 'UCstats456';
      const result = await getYouTubeChannelData(channelId);

      expect(result.channel).toHaveProperty('subscriber_count');
      expect(result.channel).toHaveProperty('video_count');
      expect(result.channel).toHaveProperty('view_count');
    });

    it('should optionally include recent videos', async () => {
      const channelId = 'UCvideos789';
      const result = await getYouTubeChannelData(channelId, {
        includeVideos: true,
        maxVideos: 5,
      });

      expect(result).toHaveProperty('videos');
      if (result.videos) {
        expect(Array.isArray(result.videos)).toBe(true);
      }
    });

    it('should not include videos when includeVideos is false', async () => {
      const channelId = 'UCnovideos999';
      const result = await getYouTubeChannelData(channelId, {
        includeVideos: false,
      });

      // videos should be undefined or empty when not requested
      expect(!result.videos || result.videos.length === 0).toBe(true);
    });

    it('should limit video count when specified', async () => {
      const channelId = 'UClimit111';
      const maxVideos = 3;
      const result = await getYouTubeChannelData(channelId, {
        includeVideos: true,
        maxVideos,
      });

      if (result.videos) {
        expect(result.videos.length).toBeLessThanOrEqual(maxVideos);
      }
    });
  });

  describe('collectYouTubeUGC', () => {
    beforeEach(() => {
      delete process.env.YOUTUBE_API_KEY;
    });

    it('should collect YouTube UGC for a niche', async () => {
      const nicheQuery = 'productivity tools';
      const results = await collectYouTubeUGC(nicheQuery);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should use seed terms for broader collection', async () => {
      const nicheQuery = 'task management';
      const seedTerms = ['project planning', 'team collaboration'];
      const results = await collectYouTubeUGC(nicheQuery, seedTerms);

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
    });

    it('should deduplicate videos by video_id', async () => {
      const nicheQuery = 'marketing automation';
      const seedTerms = ['marketing automation tools'];
      const results = await collectYouTubeUGC(nicheQuery, seedTerms);

      const videoIds = results.map(r => r.asset.video_id);
      const uniqueVideoIds = new Set(videoIds);

      // All video IDs should be unique
      expect(videoIds.length).toBe(uniqueVideoIds.size);
    });

    it('should collect both relevant and popular videos', async () => {
      const nicheQuery = 'email campaigns';
      const results = await collectYouTubeUGC(nicheQuery);

      // Should have results from both relevance and viewCount searches
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle collection errors gracefully', async () => {
      const nicheQuery = 'test niche';
      // Should not throw even if individual searches fail
      await expect(collectYouTubeUGC(nicheQuery)).resolves.toBeDefined();
    });
  });

  describe('COLL-010 Acceptance Criteria', () => {
    it('Video search works', async () => {
      const query = 'SaaS analytics';
      const results = await searchYouTubeVideos(query);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      // Each result should have required video data
      results.forEach(result => {
        expect(result.asset.video_id).toBeTruthy();
        expect(result.asset.title).toBeTruthy();
        expect(result.asset.url).toBeTruthy();
      });
    });

    it('Channel analysis works', async () => {
      const channelId = 'UCanalysis123';
      const result = await getYouTubeChannelData(channelId);

      expect(result).toBeDefined();
      expect(result.channel).toBeDefined();
      expect(result.channel.id).toBe(channelId);
      expect(result.channel.title).toBeTruthy();

      // Should have channel statistics
      expect(typeof result.channel.subscriber_count).toBe('number');
      expect(typeof result.channel.video_count).toBe('number');
      expect(typeof result.channel.view_count).toBe('number');
    });

    it('Metrics extracted', async () => {
      const query = 'business intelligence';
      const results = await searchYouTubeVideos(query);

      expect(results.length).toBeGreaterThan(0);

      // Check if metrics are present in results
      const resultsWithMetrics = results.filter(r => r.metrics);

      // At least some results should have metrics
      expect(resultsWithMetrics.length).toBeGreaterThan(0);

      resultsWithMetrics.forEach(result => {
        expect(result.metrics).toBeDefined();
        expect(typeof result.metrics!.views).toBe('number');
        expect(typeof result.metrics!.likes).toBe('number');
        expect(typeof result.metrics!.comments).toBe('number');
      });
    });
  });
});
