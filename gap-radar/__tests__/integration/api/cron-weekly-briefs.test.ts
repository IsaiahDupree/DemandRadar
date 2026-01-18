/**
 * Tests for Weekly Briefs Cron Job (BRIEF-006)
 *
 * Acceptance Criteria:
 * - Runs weekly
 * - Processes all niches
 * - Sends emails
 * - Stores snapshots
 */

// Mock modules before imports
const mockCreateClient = jest.fn();
const mockCollectWeeklySignals = jest.fn();
const mockGetPreviousWeekData = jest.fn();
const mockTransformToWeeklySignals = jest.fn();
const mockCalculateDemandScore = jest.fn();
const mockGenerateBriefContent = jest.fn();
const mockSendDemandBrief = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}));

jest.mock('@/lib/pipeline/weekly-signals', () => ({
  collectWeeklySignals: mockCollectWeeklySignals,
  getPreviousWeekData: mockGetPreviousWeekData,
  transformToWeeklySignals: mockTransformToWeeklySignals,
}));

jest.mock('@/lib/scoring/demand-score', () => ({
  calculateDemandScore: mockCalculateDemandScore,
}));

jest.mock('@/lib/ai/brief-generator', () => ({
  generateBriefContent: mockGenerateBriefContent,
}));

jest.mock('@/lib/email/send-brief', () => ({
  sendDemandBrief: mockSendDemandBrief,
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/cron/weekly-briefs/route';

// Polyfill Response.json for test environment
if (!Response.json) {
  (Response as any).json = function (data: any, init?: ResponseInit) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        ...init?.headers,
        'content-type': 'application/json',
      },
    });
  };
}

/**
 * Helper to create a complete Supabase mock client
 */
function createSupabaseMock(config: {
  niches?: any[];
  insertError?: string | null;
  updateData?: any;
  profileData?: any;
}) {
  const { niches = [], insertError = null, updateData, profileData } = config;

  let callCount = 0;

  const client = {
    from: jest.fn((tableName: string) => {
      const query: any = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      // Setup chainable methods
      query.select.mockImplementation(() => query);
      query.insert.mockImplementation(() => query);
      query.update.mockImplementation(() => query);
      query.eq.mockImplementation(() => query);
      query.order.mockImplementation(() => query);

      // Handle different table queries
      if (tableName === 'user_niches') {
        query.order.mockResolvedValue({ data: niches, error: null });
      } else if (tableName === 'demand_snapshots') {
        // For insert
        query.insert.mockResolvedValue({ error: insertError ? new Error(insertError) : null });

        // For update
        query.single.mockResolvedValue({
          data: updateData || {
            id: 'snapshot-1',
            ad_signals: {},
            search_signals: {},
            ugc_signals: {},
            forum_signals: {},
            competitor_signals: {},
          },
          error: null,
        });
      } else if (tableName === 'profiles') {
        query.single.mockResolvedValue({
          data: profileData || { email: 'test@example.com', full_name: 'Test User' },
          error: profileData === null ? new Error('Not found') : null,
        });
      }

      return query;
    }),
  };

  return client;
}

describe('Weekly Briefs Cron Job', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up console spies to reduce noise
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Authorization', () => {
    it('should reject requests without proper authorization', async () => {
      process.env.CRON_SECRET = 'test-secret';

      const request = new NextRequest('http://localhost/api/cron/weekly-briefs');

      const response = await GET(request);

      expect(response.status).toBe(401);
      const text = await response.text();
      expect(text).toBe('Unauthorized');
    });

    it('should allow requests with correct authorization', async () => {
      process.env.CRON_SECRET = 'test-secret';

      const request = new NextRequest('http://localhost/api/cron/weekly-briefs', {
        headers: {
          authorization: 'Bearer test-secret',
        },
      });

      mockCreateClient.mockResolvedValue(createSupabaseMock({ niches: [] }));

      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Processing All Niches', () => {
    beforeEach(() => {
      delete process.env.CRON_SECRET; // Disable auth for tests
    });

    it('should process all active niches', async () => {
      const mockNiches = [
        {
          id: 'niche-1',
          user_id: 'user-1',
          offering_name: 'AI Content Tool',
          keywords: ['ai content', 'writing tool'],
          competitors: ['Jasper', 'Copy.ai'],
          geo: 'US',
          sources_enabled: ['meta', 'reddit'],
        },
        {
          id: 'niche-2',
          user_id: 'user-2',
          offering_name: 'Fitness Tracker',
          keywords: ['fitness', 'tracking'],
          competitors: ['MyFitnessPal'],
          geo: 'US',
          sources_enabled: ['meta', 'reddit'],
        },
      ];

      mockCreateClient.mockResolvedValue(createSupabaseMock({ niches: mockNiches }));

      // Mock pipeline functions
      mockCollectWeeklySignals.mockResolvedValue({});
      mockGetPreviousWeekData.mockResolvedValue(null);
      mockTransformToWeeklySignals.mockReturnValue({
        ads: { advertiserCount: 10, avgLongevityDays: 30, topAngles: [], topOffers: [] },
        search: { buyerIntentKeywords: [], totalVolume: 1000 },
        mentions: { sources: [], currentWeekCount: 50 },
        forums: { complaints: [], desires: [], purchaseTriggers: [] },
        competitors: { activeCompetitors: 5, pricingChanges: [], featureChanges: [] },
      });

      mockCalculateDemandScore.mockReturnValue({
        demandScore: 75,
        trendDelta: 5,
        trend: 'up',
        opportunityScore: 80,
        messageMarketFit: 70,
      });

      mockGenerateBriefContent.mockResolvedValue({
        plays: [],
        adHooks: ['Hook 1'],
        subjectLines: ['Subject 1'],
        landingPageCopy: 'Copy',
        whyScoreChanged: ['Reason 1'],
      });

      mockSendDemandBrief.mockResolvedValue({ success: true });

      const request = new NextRequest('http://localhost/api/cron/weekly-briefs');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json.results.processed).toBe(2);
      expect(json.results.succeeded).toBe(2);
      expect(json.results.failed).toBe(0);
    });

    it('should handle no niches gracefully', async () => {
      mockCreateClient.mockResolvedValue(createSupabaseMock({ niches: [] }));

      const request = new NextRequest('http://localhost/api/cron/weekly-briefs');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json.message).toContain('No niches to process');
    });
  });

  describe('Stores Snapshots', () => {
    beforeEach(() => {
      delete process.env.CRON_SECRET;
    });

    it('should store demand snapshots in database', async () => {
      const mockNiche = {
        id: 'niche-1',
        user_id: 'user-1',
        offering_name: 'AI Tool',
        keywords: ['ai'],
        competitors: ['Competitor1'],
        geo: 'US',
        sources_enabled: ['meta'],
      };

      const mockClient = createSupabaseMock({ niches: [mockNiche] });
      mockCreateClient.mockResolvedValue(mockClient);

      mockCollectWeeklySignals.mockResolvedValue({});
      mockGetPreviousWeekData.mockResolvedValue(null);
      mockTransformToWeeklySignals.mockReturnValue({
        ads: { advertiserCount: 10, avgLongevityDays: 30, topAngles: [], topOffers: [] },
        search: { buyerIntentKeywords: [], totalVolume: 1000 },
        mentions: { sources: [], currentWeekCount: 50 },
        forums: { complaints: [], desires: [], purchaseTriggers: [] },
        competitors: { activeCompetitors: 5, pricingChanges: [], featureChanges: [] },
      });

      mockCalculateDemandScore.mockReturnValue({
        demandScore: 78,
        trendDelta: 3,
        trend: 'up',
        opportunityScore: 82,
        messageMarketFit: 74,
      });

      mockGenerateBriefContent.mockResolvedValue({
        plays: [],
        adHooks: [],
        subjectLines: [],
        landingPageCopy: '',
        whyScoreChanged: [],
      });

      mockSendDemandBrief.mockResolvedValue({ success: true });

      const request = new NextRequest('http://localhost/api/cron/weekly-briefs');
      const response = await GET(request);

      expect(response.status).toBe(200);

      // Verify insert was called
      expect(mockClient.from).toHaveBeenCalledWith('demand_snapshots');
    });
  });

  describe('Sends Emails', () => {
    beforeEach(() => {
      delete process.env.CRON_SECRET;
    });

    it('should send demand brief emails', async () => {
      const mockNiche = {
        id: 'niche-1',
        user_id: 'user-1',
        offering_name: 'AI Tool',
        keywords: ['ai'],
        competitors: [],
        geo: 'US',
        sources_enabled: ['meta'],
      };

      mockCreateClient.mockResolvedValue(
        createSupabaseMock({
          niches: [mockNiche],
          profileData: { email: 'user@example.com', full_name: 'John Doe' },
        })
      );

      mockCollectWeeklySignals.mockResolvedValue({});
      mockGetPreviousWeekData.mockResolvedValue(null);
      mockTransformToWeeklySignals.mockReturnValue({
        ads: { advertiserCount: 10, avgLongevityDays: 30, topAngles: [], topOffers: [] },
        search: { buyerIntentKeywords: [], totalVolume: 1000 },
        mentions: { sources: [], currentWeekCount: 50 },
        forums: { complaints: [], desires: [], purchaseTriggers: [] },
        competitors: { activeCompetitors: 5, pricingChanges: [], featureChanges: [] },
      });

      mockCalculateDemandScore.mockReturnValue({
        demandScore: 75,
        trendDelta: 5,
        trend: 'up',
        opportunityScore: 80,
        messageMarketFit: 70,
      });

      mockGenerateBriefContent.mockResolvedValue({
        plays: [{ type: 'positioning', title: 'Test Play', evidence: 'Evidence', priority: 'high' }],
        adHooks: ['Hook 1', 'Hook 2'],
        subjectLines: ['Subject 1'],
        landingPageCopy: 'Landing copy',
        whyScoreChanged: ['Reason'],
      });

      mockSendDemandBrief.mockResolvedValue({ success: true });

      const request = new NextRequest('http://localhost/api/cron/weekly-briefs');
      await GET(request);

      expect(mockSendDemandBrief).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
          name: 'John Doe',
        }),
        expect.objectContaining({
          offering_name: 'AI Tool',
          demand_score: 75,
        })
      );
    });

    it('should handle email send failures gracefully', async () => {
      const mockNiche = {
        id: 'niche-1',
        user_id: 'user-1',
        offering_name: 'AI Tool',
        keywords: ['ai'],
        competitors: [],
        geo: 'US',
        sources_enabled: ['meta'],
      };

      mockCreateClient.mockResolvedValue(
        createSupabaseMock({
          niches: [mockNiche],
          profileData: { email: 'user@example.com' },
        })
      );

      mockCollectWeeklySignals.mockResolvedValue({});
      mockGetPreviousWeekData.mockResolvedValue(null);
      mockTransformToWeeklySignals.mockReturnValue({
        ads: { advertiserCount: 10, avgLongevityDays: 30, topAngles: [], topOffers: [] },
        search: { buyerIntentKeywords: [], totalVolume: 1000 },
        mentions: { sources: [], currentWeekCount: 50 },
        forums: { complaints: [], desires: [], purchaseTriggers: [] },
        competitors: { activeCompetitors: 5, pricingChanges: [], featureChanges: [] },
      });

      mockCalculateDemandScore.mockReturnValue({
        demandScore: 75,
        trendDelta: 5,
        trend: 'up',
        opportunityScore: 80,
        messageMarketFit: 70,
      });

      mockGenerateBriefContent.mockResolvedValue({
        plays: [],
        adHooks: [],
        subjectLines: [],
        landingPageCopy: '',
        whyScoreChanged: [],
      });

      // Email fails but cron should continue
      mockSendDemandBrief.mockResolvedValue({ success: false, error: 'SMTP error' });

      const request = new NextRequest('http://localhost/api/cron/weekly-briefs');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.results.succeeded).toBe(1); // Should still count as succeeded
    });
  });
});
