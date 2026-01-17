/**
 * Scoring Module Tests
 * 
 * Tests for all scoring formulas defined in PRD §5
 */

import {
  calculateSaturationScore,
  calculateLongevityScore,
  calculateDissatisfactionScore,
  calculateMisalignmentScore,
  calculateOpportunityScore,
  calculateConfidenceScore,
  calculateUGCAdTestedScore,
  calculateUGCTrendScore,
  calculateUGCConnectedScore,
  calculateScores,
} from '@/lib/scoring';

// Test fixtures
const createMockAd = (overrides: Partial<{
  advertiser_name: string;
  creative_text: string;
  first_seen: string;
  is_active: boolean;
}> = {}) => ({
  source: 'meta' as const,
  advertiser_name: overrides.advertiser_name || 'Test Advertiser',
  creative_text: overrides.creative_text || 'Test creative text',
  first_seen: overrides.first_seen || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  is_active: overrides.is_active ?? true,
  media_type: 'video' as const,
});

const createMockMention = (overrides: Partial<{
  score: number;
  body: string;
  posted_at: string;
}> = {}) => ({
  subreddit: 'r/test',
  type: 'post' as const,
  title: 'Test post',
  body: overrides.body || 'Test body',
  score: overrides.score ?? 100,
  num_comments: 25,
  permalink: '/r/test/123',
  matched_entities: ['test'],
  posted_at: overrides.posted_at || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
});

const createMockCluster = (overrides: Partial<{
  cluster_type: 'angle' | 'objection' | 'feature' | 'offer';
  label: string;
  frequency: number;
  intensity: number;
}> = {}) => ({
  cluster_type: overrides.cluster_type || 'angle',
  label: overrides.label || 'Test cluster',
  examples: ['example 1', 'example 2'],
  frequency: overrides.frequency ?? 10,
  intensity: overrides.intensity ?? 0.7,
});

const createMockGap = (overrides: Partial<{
  evidence_ads: string[];
  evidence_reddit: string[];
}> = {}) => ({
  id: 'gap-1',
  run_id: 'run-1',
  gap_type: 'product' as const,
  title: 'Test gap',
  problem: 'Test problem',
  evidence_ads: overrides.evidence_ads || ['ad-1'],
  evidence_reddit: overrides.evidence_reddit || ['mention-1'],
  recommendation: 'Test recommendation',
  opportunity_score: 75,
  confidence: 0.8,
});

describe('Scoring Module', () => {
  
  describe('calculateSaturationScore', () => {
    it('returns 0 for empty ads array', () => {
      const score = calculateSaturationScore([], []);
      expect(score).toBe(0);
    });

    it('returns score between 0-100', () => {
      const ads = [createMockAd(), createMockAd({ advertiser_name: 'Other' })];
      const clusters = [createMockCluster()];
      const score = calculateSaturationScore(ads, clusters);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('increases with more unique advertisers', () => {
      const fewAds = [createMockAd()];
      const manyAds = [
        createMockAd({ advertiser_name: 'A' }),
        createMockAd({ advertiser_name: 'B' }),
        createMockAd({ advertiser_name: 'C' }),
        createMockAd({ advertiser_name: 'D' }),
        createMockAd({ advertiser_name: 'E' }),
      ];
      const clusters = [createMockCluster()];
      
      const scoreFew = calculateSaturationScore(fewAds, clusters);
      const scoreMany = calculateSaturationScore(manyAds, clusters);
      
      expect(scoreMany).toBeGreaterThan(scoreFew);
    });

    it('considers angle cluster repetition', () => {
      const ads = [createMockAd(), createMockAd()];
      const lowRepetition = [createMockCluster({ intensity: 0.2 })];
      const highRepetition = [createMockCluster({ intensity: 0.9, frequency: 50 })];
      
      const scoreLow = calculateSaturationScore(ads, lowRepetition);
      const scoreHigh = calculateSaturationScore(ads, highRepetition);
      
      expect(scoreHigh).toBeGreaterThanOrEqual(scoreLow);
    });
  });

  describe('calculateLongevityScore', () => {
    it('returns 0 for empty ads array', () => {
      const score = calculateLongevityScore([]);
      expect(score).toBe(0);
    });

    it('returns score between 0-100', () => {
      const ads = [createMockAd()];
      const score = calculateLongevityScore(ads);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('returns higher score for older ads', () => {
      const newAd = createMockAd({ 
        first_seen: new Date().toISOString() 
      });
      const oldAd = createMockAd({ 
        first_seen: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString() 
      });
      
      const newScore = calculateLongevityScore([newAd]);
      const oldScore = calculateLongevityScore([oldAd]);
      
      expect(oldScore).toBeGreaterThan(newScore);
    });

    it('uses max days across all ads', () => {
      const ads = [
        createMockAd({ first_seen: new Date().toISOString() }),
        createMockAd({ first_seen: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() }),
      ];
      
      const score = calculateLongevityScore(ads);
      const singleOldScore = calculateLongevityScore([ads[1]]);
      
      // Score should reflect the oldest ad
      expect(score).toBeCloseTo(singleOldScore, 0);
    });

    it('handles ads without first_seen date', () => {
      const adWithoutDate = { ...createMockAd(), first_seen: undefined };
      const score = calculateLongevityScore([adWithoutDate as any]);
      
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateDissatisfactionScore', () => {
    it('returns 0 for empty inputs', () => {
      const score = calculateDissatisfactionScore([], []);
      expect(score).toBe(0);
    });

    it('returns score between 0-100', () => {
      const mentions = [createMockMention()];
      const clusters = [createMockCluster({ cluster_type: 'objection' })];
      const score = calculateDissatisfactionScore(mentions, clusters);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('increases with more objection clusters', () => {
      const mentions = [createMockMention(), createMockMention()];
      const fewObjections = [createMockCluster({ cluster_type: 'objection' })];
      const manyObjections = [
        createMockCluster({ cluster_type: 'objection', frequency: 30, intensity: 0.9 }),
        createMockCluster({ cluster_type: 'objection', frequency: 25, intensity: 0.8 }),
        createMockCluster({ cluster_type: 'objection', frequency: 20, intensity: 0.7 }),
      ];
      
      const scoreFew = calculateDissatisfactionScore(mentions, fewObjections);
      const scoreMany = calculateDissatisfactionScore(mentions, manyObjections);
      
      expect(scoreMany).toBeGreaterThan(scoreFew);
    });

    it('weights by mention score (upvotes)', () => {
      const lowScoreMentions = [createMockMention({ score: 5 })];
      const highScoreMentions = [createMockMention({ score: 500 })];
      const clusters = [createMockCluster({ cluster_type: 'objection' })];
      
      const scoreLow = calculateDissatisfactionScore(lowScoreMentions, clusters);
      const scoreHigh = calculateDissatisfactionScore(highScoreMentions, clusters);
      
      expect(scoreHigh).toBeGreaterThanOrEqual(scoreLow);
    });
  });

  describe('calculateMisalignmentScore', () => {
    it('returns score between 0-100', () => {
      const ads = [createMockAd()];
      const clusters = [createMockCluster()];
      const score = calculateMisalignmentScore(ads, clusters);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('handles empty inputs', () => {
      const score = calculateMisalignmentScore([], []);
      expect(typeof score).toBe('number');
    });
  });

  describe('calculateOpportunityScore', () => {
    it('combines component scores correctly', () => {
      // Formula: 0.35*longevity + 0.35*dissatisfaction + 0.30*misalignment - 0.15*saturation
      const score = calculateOpportunityScore(100, 100, 100, 0);
      // 0.35*100 + 0.35*100 + 0.30*100 - 0.15*0 = 35 + 35 + 30 = 100
      expect(score).toBeCloseTo(100, 0);
    });

    it('subtracts saturation penalty', () => {
      const withoutSaturation = calculateOpportunityScore(50, 50, 50, 0);
      const withSaturation = calculateOpportunityScore(50, 50, 50, 100);
      
      expect(withSaturation).toBeLessThan(withoutSaturation);
    });

    it('clamps between 0-100', () => {
      const lowScore = calculateOpportunityScore(0, 0, 0, 100);
      const highScore = calculateOpportunityScore(100, 100, 100, 0);
      
      expect(lowScore).toBeGreaterThanOrEqual(0);
      expect(highScore).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateConfidenceScore', () => {
    it('returns value between 0-1', () => {
      const ads = [createMockAd()];
      const mentions = [createMockMention()];
      const gaps = [createMockGap()];
      
      const score = calculateConfidenceScore(ads, mentions, gaps);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('increases with more data', () => {
      const fewAds = [createMockAd()];
      const manyAds = Array(50).fill(null).map(() => createMockAd());
      const mentions = Array(100).fill(null).map(() => createMockMention());
      const gaps = [createMockGap()];
      
      const scoreFew = calculateConfidenceScore(fewAds, mentions, gaps);
      const scoreMany = calculateConfidenceScore(manyAds, mentions, gaps);
      
      expect(scoreMany).toBeGreaterThanOrEqual(scoreFew);
    });

    it('considers cross-source alignment', () => {
      const ads = [createMockAd()];
      const mentions = [createMockMention()];
      const gapsWithEvidence = [createMockGap({ 
        evidence_ads: ['a1', 'a2'], 
        evidence_reddit: ['r1', 'r2'] 
      })];
      const gapsWithoutEvidence = [createMockGap({ 
        evidence_ads: [], 
        evidence_reddit: [] 
      })];
      
      const scoreWith = calculateConfidenceScore(ads, mentions, gapsWithEvidence);
      const scoreWithout = calculateConfidenceScore(ads, mentions, gapsWithoutEvidence);
      
      expect(scoreWith).toBeGreaterThanOrEqual(scoreWithout);
    });
  });

  describe('calculateScores (integration)', () => {
    it('returns all score types', () => {
      const ads = [createMockAd()];
      const mentions = [createMockMention()];
      const clusters = [createMockCluster()];
      const gaps = [createMockGap()];
      
      const scores = calculateScores(ads, mentions, clusters, gaps);
      
      expect(scores).toHaveProperty('saturation');
      expect(scores).toHaveProperty('longevity');
      expect(scores).toHaveProperty('dissatisfaction');
      expect(scores).toHaveProperty('misalignment');
      expect(scores).toHaveProperty('opportunity');
      expect(scores).toHaveProperty('confidence');
    });

    it('all scores are within valid ranges', () => {
      const ads = [createMockAd(), createMockAd()];
      const mentions = [createMockMention()];
      const clusters = [createMockCluster({ cluster_type: 'objection' })];
      const gaps = [createMockGap()];
      
      const scores = calculateScores(ads, mentions, clusters, gaps);
      
      expect(scores.saturation).toBeGreaterThanOrEqual(0);
      expect(scores.saturation).toBeLessThanOrEqual(100);
      expect(scores.longevity).toBeGreaterThanOrEqual(0);
      expect(scores.longevity).toBeLessThanOrEqual(100);
      expect(scores.dissatisfaction).toBeGreaterThanOrEqual(0);
      expect(scores.dissatisfaction).toBeLessThanOrEqual(100);
      expect(scores.misalignment).toBeGreaterThanOrEqual(0);
      expect(scores.misalignment).toBeLessThanOrEqual(100);
      expect(scores.opportunity).toBeGreaterThanOrEqual(0);
      expect(scores.opportunity).toBeLessThanOrEqual(100);
      expect(scores.confidence).toBeGreaterThanOrEqual(0);
      expect(scores.confidence).toBeLessThanOrEqual(1);
    });
  });
});

describe('UGC Scoring', () => {
  
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
});
