/**
 * UGC Scoring Tests
 *
 * Tests for UGC-specific scoring and ranking functions
 */

import {
  calculateUGCAdTestedScore,
  calculateUGCTrendScore,
  calculateUGCConnectedScore,
  rankUGCByScore,
  getUGCLeaderboardByHook,
  getTopUGC,
  type UGCResult,
} from '../../../src/lib/scoring/ugc';

describe('UGC Scoring Module', () => {
  // Test fixtures
  const createMockUGCResult = (overrides?: Partial<UGCResult> & { pattern?: undefined | any }): UGCResult => {
    const result: UGCResult = {
      asset: {
        id: 'test-asset-1',
        platform: 'tiktok',
        url: 'https://tiktok.com/test',
        caption: 'Test caption',
        posted_at: new Date().toISOString(),
        ...overrides?.asset,
      },
      metrics: {
        views: 10000,
        likes: 500,
        comments: 50,
        shares: 25,
        score: 75,
        ...overrides?.metrics,
      },
    };

    // Only add pattern if it's not explicitly set to undefined
    if (overrides?.pattern !== undefined) {
      result.pattern = {
        hookType: 'POV / Relatable',
        format: 'Demo',
        proofType: 'Results shown',
        ctaStyle: 'Link in bio',
        ...overrides?.pattern,
      };
    } else if (!('pattern' in (overrides || {}))) {
      // Default pattern if overrides doesn't specify pattern at all
      result.pattern = {
        hookType: 'POV / Relatable',
        format: 'Demo',
        proofType: 'Results shown',
        ctaStyle: 'Link in bio',
      };
    }

    return result;
  };

  describe('calculateUGCAdTestedScore', () => {
    it('returns score between 0-100', () => {
      const asset = {
        first_shown: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        last_shown: new Date().toISOString(),
      };
      const metrics = {
        views: 100000,
        likes: 5000,
        comments: 500,
        shares: 1000,
        reach_unique_users: 80000,
      };

      const score = calculateUGCAdTestedScore(asset, metrics);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('weights longevity at 45%', () => {
      const shortRun = {
        first_shown: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        last_shown: new Date().toISOString(),
      };
      const longRun = {
        first_shown: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        last_shown: new Date().toISOString(),
      };
      const metrics = { views: 50000, likes: 2000 };

      const shortScore = calculateUGCAdTestedScore(shortRun, metrics);
      const longScore = calculateUGCAdTestedScore(longRun, metrics);

      expect(longScore).toBeGreaterThan(shortScore);
    });
  });

  describe('calculateUGCTrendScore', () => {
    it('returns score between 0-100', () => {
      const asset = {
        posted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const score = calculateUGCTrendScore(asset, 0.8);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('weights recency at 60%', () => {
      const recent = { posted_at: new Date().toISOString() };
      const old = { posted_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() };

      const recentScore = calculateUGCTrendScore(recent, 0.5);
      const oldScore = calculateUGCTrendScore(old, 0.5);

      expect(recentScore).toBeGreaterThan(oldScore);
    });
  });

  describe('calculateUGCConnectedScore', () => {
    it('returns score between 0-100', () => {
      const metrics = {
        views: 10000,
        likes: 1000,
        comments: 100,
        shares: 50,
      };
      const asset = {
        posted_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const score = calculateUGCConnectedScore(metrics, asset);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('weights shares highest (40%)', () => {
      const highShares = { views: 10000, likes: 100, comments: 10, shares: 500 };
      const lowShares = { views: 10000, likes: 100, comments: 10, shares: 5 };
      const asset = { posted_at: new Date().toISOString() };

      const highScore = calculateUGCConnectedScore(highShares, asset);
      const lowScore = calculateUGCConnectedScore(lowShares, asset);

      expect(highScore).toBeGreaterThan(lowScore);
    });
  });

  describe('rankUGCByScore', () => {
    it('ranks results by score in descending order', () => {
      const results: UGCResult[] = [
        createMockUGCResult({ metrics: { score: 50 } }),
        createMockUGCResult({ metrics: { score: 90 } }),
        createMockUGCResult({ metrics: { score: 70 } }),
        createMockUGCResult({ metrics: { score: 30 } }),
      ];

      const ranked = rankUGCByScore(results);

      expect(ranked[0].metrics.score).toBe(90);
      expect(ranked[1].metrics.score).toBe(70);
      expect(ranked[2].metrics.score).toBe(50);
      expect(ranked[3].metrics.score).toBe(30);
    });

    it('filters by platform when specified', () => {
      const results: UGCResult[] = [
        createMockUGCResult({ asset: { platform: 'tiktok' }, metrics: { score: 80 } }),
        createMockUGCResult({ asset: { platform: 'instagram' }, metrics: { score: 90 } }),
        createMockUGCResult({ asset: { platform: 'tiktok' }, metrics: { score: 70 } }),
      ];

      const tiktokOnly = rankUGCByScore(results, { platform: 'tiktok' });

      expect(tiktokOnly).toHaveLength(2);
      expect(tiktokOnly.every(r => r.asset.platform === 'tiktok')).toBe(true);
      expect(tiktokOnly[0].metrics.score).toBe(80);
      expect(tiktokOnly[1].metrics.score).toBe(70);
    });

    it('limits results when specified', () => {
      const results: UGCResult[] = Array(10)
        .fill(null)
        .map((_, i) => createMockUGCResult({ metrics: { score: i * 10 } }));

      const limited = rankUGCByScore(results, { limit: 5 });

      expect(limited).toHaveLength(5);
    });

    it('handles empty results array', () => {
      const ranked = rankUGCByScore([]);

      expect(ranked).toEqual([]);
    });
  });

  describe('getUGCLeaderboardByHook', () => {
    it('groups results by hook type', () => {
      const results: UGCResult[] = [
        createMockUGCResult({ pattern: { hookType: 'POV / Relatable' }, metrics: { score: 80 } }),
        createMockUGCResult({ pattern: { hookType: 'Pain point callout' }, metrics: { score: 90 } }),
        createMockUGCResult({ pattern: { hookType: 'POV / Relatable' }, metrics: { score: 70 } }),
      ];

      const leaderboard = getUGCLeaderboardByHook(results);

      expect(leaderboard['POV / Relatable']).toHaveLength(2);
      expect(leaderboard['Pain point callout']).toHaveLength(1);
    });

    it('sorts each hook type group by score', () => {
      const results: UGCResult[] = [
        createMockUGCResult({ pattern: { hookType: 'POV / Relatable' }, metrics: { score: 60 } }),
        createMockUGCResult({ pattern: { hookType: 'POV / Relatable' }, metrics: { score: 90 } }),
        createMockUGCResult({ pattern: { hookType: 'POV / Relatable' }, metrics: { score: 75 } }),
      ];

      const leaderboard = getUGCLeaderboardByHook(results);

      expect(leaderboard['POV / Relatable'][0].metrics.score).toBe(90);
      expect(leaderboard['POV / Relatable'][1].metrics.score).toBe(75);
      expect(leaderboard['POV / Relatable'][2].metrics.score).toBe(60);
    });

    it('handles results without patterns', () => {
      const results: UGCResult[] = [
        createMockUGCResult({ pattern: undefined }),
      ];

      const leaderboard = getUGCLeaderboardByHook(results);

      expect(leaderboard['Unknown']).toHaveLength(1);
    });
  });

  describe('getTopUGC', () => {
    it('returns top N results by score', () => {
      const results: UGCResult[] = Array(20)
        .fill(null)
        .map((_, i) => createMockUGCResult({ metrics: { score: i * 5 } }));

      const top5 = getTopUGC(results, { limit: 5 });

      expect(top5).toHaveLength(5);
      expect(top5[0].metrics.score).toBe(95);
      expect(top5[4].metrics.score).toBe(75);
    });

    it('filters by minimum score', () => {
      const results: UGCResult[] = [
        createMockUGCResult({ metrics: { score: 95 } }),
        createMockUGCResult({ metrics: { score: 60 } }),
        createMockUGCResult({ metrics: { score: 80 } }),
        createMockUGCResult({ metrics: { score: 45 } }),
      ];

      const topScorers = getTopUGC(results, { minScore: 70 });

      expect(topScorers).toHaveLength(2);
      expect(topScorers.every(r => r.metrics.score >= 70)).toBe(true);
    });

    it('returns up to limit even with min score filter', () => {
      const results: UGCResult[] = Array(20)
        .fill(null)
        .map((_, i) => createMockUGCResult({ metrics: { score: 80 + i } }));

      const top3 = getTopUGC(results, { minScore: 80, limit: 3 });

      expect(top3).toHaveLength(3);
      expect(top3[0].metrics.score).toBe(99);
    });

    it('defaults to top 10 when no limit specified', () => {
      const results: UGCResult[] = Array(20)
        .fill(null)
        .map((_, i) => createMockUGCResult({ metrics: { score: i * 5 } }));

      const top = getTopUGC(results);

      expect(top).toHaveLength(10);
    });
  });
});
