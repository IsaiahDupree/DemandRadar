/**
 * TikTok Trend Discovery Tests
 *
 * Tests for UGC-002: TikTok Trend Discovery
 * - Fetches trending hashtags and sounds from TikTok
 * - Scores relevance to niche
 */

import {
  fetchTikTokTrends,
  scoreTrendRelevance,
  TikTokTrend,
  TrendType
} from '@/lib/collectors/tiktok-trends';

describe('TikTok Trend Discovery (UGC-002)', () => {
  describe('fetchTikTokTrends', () => {
    beforeEach(() => {
      // Ensure we use mock data for consistent results
      delete process.env.RAPIDAPI_KEY;
    });

    it('should fetch trending hashtags for a niche', async () => {
      const niche = 'productivity apps';
      const trends = await fetchTikTokTrends(niche, 'hashtag');

      expect(trends).toBeDefined();
      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBeGreaterThan(0);
    });

    it('should fetch trending sounds for a niche', async () => {
      const niche = 'SaaS tools';
      const trends = await fetchTikTokTrends(niche, 'sound');

      expect(trends).toBeDefined();
      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBeGreaterThan(0);
    });

    it('should return TikTokTrend objects with correct structure', async () => {
      const niche = 'AI writing';
      const trends = await fetchTikTokTrends(niche, 'hashtag');

      expect(trends.length).toBeGreaterThan(0);

      const firstTrend = trends[0];
      expect(firstTrend).toHaveProperty('id');
      expect(firstTrend).toHaveProperty('name');
      expect(firstTrend).toHaveProperty('type');
      expect(firstTrend).toHaveProperty('volume');
      expect(firstTrend).toHaveProperty('relevanceScore');
      expect(firstTrend).toHaveProperty('url');
    });

    it('should include relevance scores for all trends', async () => {
      const niche = 'startup tools';
      const trends = await fetchTikTokTrends(niche);

      expect(trends.length).toBeGreaterThan(0);

      trends.forEach(trend => {
        expect(trend.relevanceScore).toBeDefined();
        expect(typeof trend.relevanceScore).toBe('number');
        expect(trend.relevanceScore).toBeGreaterThanOrEqual(0);
        expect(trend.relevanceScore).toBeLessThanOrEqual(100);
      });
    });

    it('should sort trends by relevance score descending', async () => {
      const niche = 'marketing automation';
      const trends = await fetchTikTokTrends(niche);

      expect(trends.length).toBeGreaterThan(1);

      for (let i = 1; i < trends.length; i++) {
        expect(trends[i - 1].relevanceScore).toBeGreaterThanOrEqual(
          trends[i].relevanceScore
        );
      }
    });

    it('should handle different trend types', async () => {
      const niche = 'project management';

      const hashtagTrends = await fetchTikTokTrends(niche, 'hashtag');
      expect(hashtagTrends.every(t => t.type === 'hashtag')).toBe(true);

      const soundTrends = await fetchTikTokTrends(niche, 'sound');
      expect(soundTrends.every(t => t.type === 'sound')).toBe(true);
    });

    it('should use mock data when API key is not set', async () => {
      const originalKey = process.env.RAPIDAPI_KEY;
      delete process.env.RAPIDAPI_KEY;

      const niche = 'email marketing';
      const trends = await fetchTikTokTrends(niche);

      expect(trends).toBeDefined();
      expect(trends.length).toBeGreaterThan(0);

      // Restore env
      if (originalKey) {
        process.env.RAPIDAPI_KEY = originalKey;
      }
    });

    it('should limit results to specified count', async () => {
      const niche = 'CRM software';
      const limit = 5;
      const trends = await fetchTikTokTrends(niche, 'hashtag', { limit });

      expect(trends.length).toBeLessThanOrEqual(limit);
    });
  });

  describe('scoreTrendRelevance', () => {
    it('should score exact match hashtags highest', () => {
      const niche = 'productivity app';
      const trend: TikTokTrend = {
        id: 'test1',
        name: 'productivityapp',
        type: 'hashtag',
        volume: 1000000,
        url: 'https://tiktok.com/tag/productivityapp',
        relevanceScore: 0,
      };

      const score = scoreTrendRelevance(trend, niche);
      expect(score).toBeGreaterThan(80);
    });

    it('should score partial matches moderately', () => {
      const niche = 'productivity tools';
      const trend: TikTokTrend = {
        id: 'test2',
        name: 'productivity',
        type: 'hashtag',
        volume: 500000,
        url: 'https://tiktok.com/tag/productivity',
        relevanceScore: 0,
      };

      const score = scoreTrendRelevance(trend, niche);
      expect(score).toBeGreaterThan(50);
      expect(score).toBeLessThan(90);
    });

    it('should score unrelated trends low', () => {
      const niche = 'productivity app';
      const trend: TikTokTrend = {
        id: 'test3',
        name: 'cooking',
        type: 'hashtag',
        volume: 2000000,
        url: 'https://tiktok.com/tag/cooking',
        relevanceScore: 0,
      };

      const score = scoreTrendRelevance(trend, niche);
      expect(score).toBeLessThan(30);
    });

    it('should factor in trend volume for relevance', () => {
      const niche = 'AI tools';

      const highVolumeTrend: TikTokTrend = {
        id: 'test4',
        name: 'aitools',
        type: 'hashtag',
        volume: 5000000,
        url: 'https://tiktok.com/tag/aitools',
        relevanceScore: 0,
      };

      const lowVolumeTrend: TikTokTrend = {
        id: 'test5',
        name: 'aitools',
        type: 'hashtag',
        volume: 10000,
        url: 'https://tiktok.com/tag/aitools',
        relevanceScore: 0,
      };

      const highScore = scoreTrendRelevance(highVolumeTrend, niche);
      const lowScore = scoreTrendRelevance(lowVolumeTrend, niche);

      expect(highScore).toBeGreaterThan(lowScore);
    });

    it('should return score between 0 and 100', () => {
      const niche = 'business tools';
      const trend: TikTokTrend = {
        id: 'test6',
        name: 'business',
        type: 'hashtag',
        volume: 1000000,
        url: 'https://tiktok.com/tag/business',
        relevanceScore: 0,
      };

      const score = scoreTrendRelevance(trend, niche);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle sounds similarly to hashtags', () => {
      const niche = 'startup growth';
      const soundTrend: TikTokTrend = {
        id: 'sound1',
        name: 'startup motivation audio',
        type: 'sound',
        volume: 800000,
        url: 'https://tiktok.com/sound/12345',
        relevanceScore: 0,
      };

      const score = scoreTrendRelevance(soundTrend, niche);
      expect(score).toBeGreaterThan(50);
    });
  });

  describe('UGC-002 Acceptance Criteria', () => {
    it('should fetch trends successfully', async () => {
      const niche = 'productivity';
      const trends = await fetchTikTokTrends(niche);

      expect(trends).toBeDefined();
      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBeGreaterThan(0);
    });

    it('should score relevance to niche for all trends', async () => {
      const niche = 'marketing tools';
      const trends = await fetchTikTokTrends(niche);

      expect(trends.length).toBeGreaterThan(0);

      trends.forEach(trend => {
        expect(trend.relevanceScore).toBeDefined();
        expect(typeof trend.relevanceScore).toBe('number');
        expect(trend.relevanceScore).toBeGreaterThanOrEqual(0);
        expect(trend.relevanceScore).toBeLessThanOrEqual(100);
      });
    });

    it('should return trends sorted by relevance', async () => {
      const niche = 'SaaS';
      const trends = await fetchTikTokTrends(niche);

      expect(trends.length).toBeGreaterThan(1);

      // Verify descending order
      for (let i = 1; i < trends.length; i++) {
        expect(trends[i - 1].relevanceScore).toBeGreaterThanOrEqual(
          trends[i].relevanceScore
        );
      }
    });
  });
});
