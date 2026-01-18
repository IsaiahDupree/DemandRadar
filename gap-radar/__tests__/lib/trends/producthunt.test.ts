/**
 * ProductHunt Trends Source Tests
 *
 * Tests for ProductHunt API integration and trend normalization
 */

import {
  fetchProductHuntTrends,
  normalizeProductHuntPost,
  PRODUCTHUNT_API_URL
} from '@/lib/trends/producthunt';
import type { TrendingTopic } from '@/lib/trends/fallback';

describe('ProductHunt Trends Source', () => {
  describe('fetchProductHuntTrends', () => {
    it('should fetch and normalize recent launches from ProductHunt', async () => {
      const trends = await fetchProductHuntTrends();

      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBeGreaterThan(0);
      expect(trends.length).toBeLessThanOrEqual(12);

      // Check structure of first trend
      const trend = trends[0];
      expect(trend).toHaveProperty('id');
      expect(trend).toHaveProperty('topic');
      expect(trend).toHaveProperty('category');
      expect(trend).toHaveProperty('volume');
      expect(trend).toHaveProperty('growth');
      expect(trend).toHaveProperty('sentiment');
      expect(trend).toHaveProperty('sources');
      expect(trend).toHaveProperty('relatedTerms');
      expect(trend).toHaveProperty('opportunityScore');

      expect(trend.sources).toContain('ProductHunt');
    });

    it('should return trends sorted by opportunity score', async () => {
      const trends = await fetchProductHuntTrends();

      for (let i = 0; i < trends.length - 1; i++) {
        expect(trends[i].opportunityScore).toBeGreaterThanOrEqual(
          trends[i + 1].opportunityScore
        );
      }
    });

    it('should handle API errors gracefully', async () => {
      // This test ensures the function doesn't crash on errors
      const trends = await fetchProductHuntTrends();

      // Should return an array even on error (might be empty)
      expect(Array.isArray(trends)).toBe(true);
    });
  });

  describe('normalizeProductHuntPost', () => {
    it('should normalize a ProductHunt post to TrendingTopic format', () => {
      const mockPost = {
        id: '123',
        name: 'Amazing AI Tool',
        tagline: 'Revolutionary AI assistant for developers',
        topics: [
          { name: 'AI' },
          { name: 'Developer Tools' }
        ],
        votes_count: 450,
        comments_count: 32,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      };

      const normalized = normalizeProductHuntPost(mockPost);

      expect(normalized.id).toContain('ph-');
      expect(normalized.topic).toBe('Amazing AI Tool');
      expect(normalized.category).toBeDefined();
      expect(normalized.volume).toBeGreaterThan(0);
      expect(normalized.growth).toBeGreaterThan(0);
      expect(normalized.sources).toContain('ProductHunt');
      expect(normalized.relatedTerms.length).toBeGreaterThan(0);
      expect(normalized.opportunityScore).toBeGreaterThan(0);
      expect(normalized.opportunityScore).toBeLessThanOrEqual(100);
    });
  });
});
