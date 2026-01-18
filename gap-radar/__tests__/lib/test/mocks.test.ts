/**
 * Mock Utilities Tests
 * Tests for reusable mock data generators
 */

import {
  mockAdCreative,
  mockRedditMention,
  mockRun,
  mockProject,
  mockExtraction,
  mockCluster,
  mockGapOpportunity,
  mockMetaAdResponse,
  mockGoogleAdResponse,
  mockRedditPostResponse,
  mockRedditCommentResponse,
  mockIOSAppResponse,
  mockAndroidAppResponse,
} from '@/lib/test/mocks';

describe('Mock Utilities', () => {
  describe('mockAdCreative', () => {
    it('generates valid ad creative with defaults', () => {
      const ad = mockAdCreative();

      expect(ad).toHaveProperty('id');
      expect(ad).toHaveProperty('runId');
      expect(ad).toHaveProperty('source');
      expect(ad).toHaveProperty('advertiserName');
      expect(ad).toHaveProperty('creativeText');
      expect(ad).toHaveProperty('mediaType');
      expect(ad.source).toMatch(/meta|google/);
    });

    it('accepts custom overrides', () => {
      const ad = mockAdCreative({
        source: 'meta',
        advertiserName: 'CustomCo',
        creativeText: 'Custom ad text',
      });

      expect(ad.source).toBe('meta');
      expect(ad.advertiserName).toBe('CustomCo');
      expect(ad.creativeText).toBe('Custom ad text');
    });
  });

  describe('mockRedditMention', () => {
    it('generates valid reddit mention', () => {
      const mention = mockRedditMention();

      expect(mention).toHaveProperty('id');
      expect(mention).toHaveProperty('runId');
      expect(mention).toHaveProperty('subreddit');
      expect(mention).toHaveProperty('type');
      expect(mention).toHaveProperty('text');
      expect(mention).toHaveProperty('score');
      expect(mention).toHaveProperty('createdAt');
      expect(mention).toHaveProperty('permalink');
      expect(mention.type).toMatch(/post|comment/);
    });

    it('accepts custom overrides', () => {
      const mention = mockRedditMention({
        subreddit: 'SaaS',
        type: 'post',
        text: 'Custom post text',
        score: 500,
      });

      expect(mention.subreddit).toBe('SaaS');
      expect(mention.type).toBe('post');
      expect(mention.text).toBe('Custom post text');
      expect(mention.score).toBe(500);
    });
  });

  describe('mockRun', () => {
    it('generates valid run', () => {
      const run = mockRun();

      expect(run).toHaveProperty('id');
      expect(run).toHaveProperty('projectId');
      expect(run).toHaveProperty('nicheQuery');
      expect(run).toHaveProperty('seedTerms');
      expect(run).toHaveProperty('competitors');
      expect(run).toHaveProperty('status');
      expect(Array.isArray(run.seedTerms)).toBe(true);
      expect(Array.isArray(run.competitors)).toBe(true);
      expect(run.status).toMatch(/queued|running|complete|failed/);
    });

    it('accepts custom overrides', () => {
      const run = mockRun({
        nicheQuery: 'AI watermark remover',
        status: 'complete',
        seedTerms: ['watermark', 'AI'],
      });

      expect(run.nicheQuery).toBe('AI watermark remover');
      expect(run.status).toBe('complete');
      expect(run.seedTerms).toEqual(['watermark', 'AI']);
    });
  });

  describe('mockProject', () => {
    it('generates valid project', () => {
      const project = mockProject();

      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('ownerId');
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('createdAt');
      expect(project.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('mockExtraction', () => {
    it('generates valid extraction', () => {
      const extraction = mockExtraction();

      expect(extraction).toHaveProperty('id');
      expect(extraction).toHaveProperty('runId');
      expect(extraction).toHaveProperty('sourceType');
      expect(extraction).toHaveProperty('sourceId');
      expect(extraction).toHaveProperty('offers');
      expect(extraction).toHaveProperty('claims');
      expect(extraction).toHaveProperty('angles');
      expect(extraction).toHaveProperty('objections');
      expect(extraction).toHaveProperty('desiredFeatures');
      expect(extraction).toHaveProperty('sentiment');
      expect(Array.isArray(extraction.offers)).toBe(true);
      expect(extraction.sourceType).toMatch(/ad|reddit/);
    });
  });

  describe('mockCluster', () => {
    it('generates valid cluster', () => {
      const cluster = mockCluster();

      expect(cluster).toHaveProperty('id');
      expect(cluster).toHaveProperty('runId');
      expect(cluster).toHaveProperty('clusterType');
      expect(cluster).toHaveProperty('label');
      expect(cluster).toHaveProperty('examples');
      expect(cluster).toHaveProperty('frequency');
      expect(cluster).toHaveProperty('intensity');
      expect(Array.isArray(cluster.examples)).toBe(true);
      expect(cluster.clusterType).toMatch(/angle|objection|feature|offer/);
    });
  });

  describe('mockGapOpportunity', () => {
    it('generates valid gap opportunity', () => {
      const gap = mockGapOpportunity();

      expect(gap).toHaveProperty('id');
      expect(gap).toHaveProperty('runId');
      expect(gap).toHaveProperty('gapType');
      expect(gap).toHaveProperty('title');
      expect(gap).toHaveProperty('problem');
      expect(gap).toHaveProperty('recommendation');
      expect(gap).toHaveProperty('opportunityScore');
      expect(gap).toHaveProperty('confidence');
      expect(gap.gapType).toMatch(/product|offer|positioning|trust|pricing/);
      expect(gap.opportunityScore).toBeGreaterThanOrEqual(0);
      expect(gap.opportunityScore).toBeLessThanOrEqual(100);
    });
  });

  describe('API Response Mocks', () => {
    describe('mockMetaAdResponse', () => {
      it('generates valid Meta API response', () => {
        const response = mockMetaAdResponse();

        expect(response).toHaveProperty('data');
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBeGreaterThan(0);
        expect(response.data[0]).toHaveProperty('page_name');
        expect(response.data[0]).toHaveProperty('ad_creative_bodies');
      });

      it('accepts custom count', () => {
        const response = mockMetaAdResponse({ count: 5 });

        expect(response.data.length).toBe(5);
      });
    });

    describe('mockGoogleAdResponse', () => {
      it('generates valid Google Ads response', () => {
        const response = mockGoogleAdResponse();

        expect(Array.isArray(response)).toBe(true);
        expect(response.length).toBeGreaterThan(0);
        expect(response[0]).toHaveProperty('advertiser');
        expect(response[0]).toHaveProperty('creative');
      });
    });

    describe('mockRedditPostResponse', () => {
      it('generates valid Reddit post response', () => {
        const response = mockRedditPostResponse();

        expect(response).toHaveProperty('data');
        expect(response.data).toHaveProperty('children');
        expect(Array.isArray(response.data.children)).toBe(true);
        expect(response.data.children[0]).toHaveProperty('kind', 't3');
        expect(response.data.children[0].data).toHaveProperty('title');
        expect(response.data.children[0].data).toHaveProperty('subreddit');
      });
    });

    describe('mockRedditCommentResponse', () => {
      it('generates valid Reddit comment response', () => {
        const response = mockRedditCommentResponse();

        expect(response).toHaveProperty('data');
        expect(response.data).toHaveProperty('children');
        expect(Array.isArray(response.data.children)).toBe(true);
        expect(response.data.children[0]).toHaveProperty('kind', 't1');
        expect(response.data.children[0].data).toHaveProperty('body');
      });
    });

    describe('mockIOSAppResponse', () => {
      it('generates valid iOS App Store response', () => {
        const response = mockIOSAppResponse();

        expect(response).toHaveProperty('resultCount');
        expect(response).toHaveProperty('results');
        expect(Array.isArray(response.results)).toBe(true);
        expect(response.results[0]).toHaveProperty('trackName');
        expect(response.results[0]).toHaveProperty('artistName');
        expect(response.results[0]).toHaveProperty('averageUserRating');
      });
    });

    describe('mockAndroidAppResponse', () => {
      it('generates valid Android Play Store response', () => {
        const response = mockAndroidAppResponse();

        expect(Array.isArray(response)).toBe(true);
        expect(response[0]).toHaveProperty('title');
        expect(response[0]).toHaveProperty('developer');
        expect(response[0]).toHaveProperty('rating');
      });
    });
  });
});
