/**
 * Tests for Demand Brief Web View API (BRIEF-010)
 *
 * Acceptance Criteria:
 * - All email sections rendered
 * - Actions clickable
 * - Export option
 */

// Mock modules before imports
const mockCreateClient = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/briefs/[id]/route';

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
  user?: any;
  snapshot?: any;
  authError?: boolean;
  snapshotError?: boolean;
}) {
  const { user, snapshot, authError = false, snapshotError = false } = config;

  const client = {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: authError ? null : user },
        error: authError ? new Error('Auth failed') : null,
      }),
    },
    from: jest.fn((tableName: string) => {
      const query: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      // Setup chainable methods
      query.select.mockImplementation(() => query);
      query.eq.mockImplementation(() => query);

      if (tableName === 'demand_snapshots') {
        query.single.mockResolvedValue({
          data: snapshotError ? null : snapshot,
          error: snapshotError ? new Error('Not found') : null,
        });
      }

      return query;
    }),
  };

  return client;
}

describe('GET /api/briefs/[id]', () => {
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

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockCreateClient.mockResolvedValue(
        createSupabaseMock({ authError: true })
      );

      const request = new NextRequest('http://localhost/api/briefs/test-id');
      const response = await GET(request, {
        params: Promise.resolve({ id: 'test-id' }),
      });

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe('Unauthorized');
    });

    it('should return 403 when user does not own the niche', async () => {
      const mockUser = { id: 'user-1' };
      const mockSnapshot = {
        id: 'snapshot-1',
        niche_id: 'niche-1',
        week_start: '2026-01-13',
        demand_score: 75,
        demand_score_change: 5,
        opportunity_score: 80,
        message_market_fit_score: 70,
        ad_signals: {
          advertiserCount: 10,
          topAngles: ['Hook 1'],
          topOffers: ['Free trial'],
        },
        search_signals: {
          buyerIntentKeywords: [{ keyword: 'best ai tool', volume: 1000 }],
        },
        forum_signals: {
          complaints: [{ text: 'expensive', count: 5 }],
          desires: [{ text: 'better pricing', count: 3 }],
        },
        competitor_signals: {
          activeCompetitors: 5,
        },
        plays: [],
        ad_hooks: ['Hook 1'],
        subject_lines: ['Subject 1'],
        landing_copy: 'Landing copy',
        why_score_changed: ['Reason 1'],
        created_at: '2026-01-13T00:00:00Z',
        user_niches: {
          id: 'niche-1',
          offering_name: 'AI Tool',
          user_id: 'user-2', // Different user
        },
      };

      mockCreateClient.mockResolvedValue(
        createSupabaseMock({ user: mockUser, snapshot: mockSnapshot })
      );

      const request = new NextRequest('http://localhost/api/briefs/snapshot-1');
      const response = await GET(request, {
        params: Promise.resolve({ id: 'snapshot-1' }),
      });

      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error).toBe('Forbidden');
    });
  });

  describe('Fetching Snapshots', () => {
    it('should return 404 when snapshot does not exist', async () => {
      const mockUser = { id: 'user-1' };

      mockCreateClient.mockResolvedValue(
        createSupabaseMock({ user: mockUser, snapshotError: true })
      );

      const request = new NextRequest('http://localhost/api/briefs/nonexistent');
      const response = await GET(request, {
        params: Promise.resolve({ id: 'nonexistent' }),
      });

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toBe('Snapshot not found');
    });

    it('should return snapshot when user owns the niche', async () => {
      const mockUser = { id: 'user-1' };
      const mockSnapshot = {
        id: 'snapshot-1',
        niche_id: 'niche-1',
        week_start: '2026-01-13',
        demand_score: 75,
        demand_score_change: 5,
        opportunity_score: 80,
        message_market_fit_score: 70,
        ad_signals: {
          advertiserCount: 10,
          avgLongevityDays: 30,
          topAngles: ['Hook 1', 'Hook 2'],
          topOffers: ['Free trial', '50% off'],
        },
        search_signals: {
          buyerIntentKeywords: [
            { keyword: 'best ai tool', volume: 1000 },
            { keyword: 'ai alternative', volume: 500 },
          ],
          totalVolume: 1500,
        },
        ugc_signals: {},
        forum_signals: {
          complaints: [
            { text: 'expensive', count: 5 },
            { text: 'slow', count: 3 },
          ],
          desires: [
            { text: 'better pricing', count: 3 },
            { text: 'faster performance', count: 2 },
          ],
          purchaseTriggers: 10,
        },
        competitor_signals: {
          activeCompetitors: 5,
          pricingChanges: [],
          featureChanges: [],
        },
        plays: [
          {
            type: 'product',
            action: 'Add feature X',
            evidence: 'Users are asking for it',
            priority: 'high',
          },
        ],
        ad_hooks: ['Hook 1', 'Hook 2', 'Hook 3'],
        subject_lines: ['Subject 1', 'Subject 2'],
        landing_copy: 'Landing copy text',
        why_score_changed: ['Reason 1', 'Reason 2'],
        created_at: '2026-01-13T00:00:00Z',
        user_niches: {
          id: 'niche-1',
          offering_name: 'AI Content Tool',
          user_id: 'user-1',
        },
      };

      mockCreateClient.mockResolvedValue(
        createSupabaseMock({ user: mockUser, snapshot: mockSnapshot })
      );

      const request = new NextRequest('http://localhost/api/briefs/snapshot-1');
      const response = await GET(request, {
        params: Promise.resolve({ id: 'snapshot-1' }),
      });

      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json.id).toBe('snapshot-1');
      expect(json.offering_name).toBe('AI Content Tool');
      expect(json.demand_score).toBe(75);
      expect(json.trend).toBe('stable'); // change is 5, not > 5
      expect(json.plays).toHaveLength(1);
      expect(json.ad_hooks).toHaveLength(3);
      expect(json.subject_lines).toHaveLength(2);
    });

    it('should set trend to "up" when demand_score_change > 5', async () => {
      const mockUser = { id: 'user-1' };
      const mockSnapshot = {
        id: 'snapshot-1',
        niche_id: 'niche-1',
        week_start: '2026-01-13',
        demand_score: 75,
        demand_score_change: 10, // > 5
        opportunity_score: 80,
        message_market_fit_score: 70,
        ad_signals: { advertiserCount: 10, topAngles: [], topOffers: [] },
        search_signals: { buyerIntentKeywords: [] },
        ugc_signals: {},
        forum_signals: { complaints: [], desires: [] },
        competitor_signals: { activeCompetitors: 5 },
        plays: [],
        ad_hooks: [],
        subject_lines: [],
        landing_copy: '',
        why_score_changed: [],
        created_at: '2026-01-13T00:00:00Z',
        user_niches: {
          id: 'niche-1',
          offering_name: 'AI Tool',
          user_id: 'user-1',
        },
      };

      mockCreateClient.mockResolvedValue(
        createSupabaseMock({ user: mockUser, snapshot: mockSnapshot })
      );

      const request = new NextRequest('http://localhost/api/briefs/snapshot-1');
      const response = await GET(request, {
        params: Promise.resolve({ id: 'snapshot-1' }),
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.trend).toBe('up');
    });

    it('should set trend to "down" when demand_score_change < -5', async () => {
      const mockUser = { id: 'user-1' };
      const mockSnapshot = {
        id: 'snapshot-1',
        niche_id: 'niche-1',
        week_start: '2026-01-13',
        demand_score: 65,
        demand_score_change: -10, // < -5
        opportunity_score: 60,
        message_market_fit_score: 50,
        ad_signals: { advertiserCount: 10, topAngles: [], topOffers: [] },
        search_signals: { buyerIntentKeywords: [] },
        ugc_signals: {},
        forum_signals: { complaints: [], desires: [] },
        competitor_signals: { activeCompetitors: 5 },
        plays: [],
        ad_hooks: [],
        subject_lines: [],
        landing_copy: '',
        why_score_changed: [],
        created_at: '2026-01-13T00:00:00Z',
        user_niches: {
          id: 'niche-1',
          offering_name: 'AI Tool',
          user_id: 'user-1',
        },
      };

      mockCreateClient.mockResolvedValue(
        createSupabaseMock({ user: mockUser, snapshot: mockSnapshot })
      );

      const request = new NextRequest('http://localhost/api/briefs/snapshot-1');
      const response = await GET(request, {
        params: Promise.resolve({ id: 'snapshot-1' }),
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.trend).toBe('down');
    });
  });

  describe('Data Formatting', () => {
    it('should format snapshot data correctly', async () => {
      const mockUser = { id: 'user-1' };
      const mockSnapshot = {
        id: 'snapshot-1',
        niche_id: 'niche-1',
        week_start: '2026-01-13',
        demand_score: 82,
        demand_score_change: 3,
        opportunity_score: 85,
        message_market_fit_score: 78,
        ad_signals: { advertiserCount: 15, topAngles: ['Angle 1'], topOffers: [] },
        search_signals: { buyerIntentKeywords: [{ keyword: 'test', volume: 100 }] },
        ugc_signals: {},
        forum_signals: { complaints: [], desires: [] },
        competitor_signals: { activeCompetitors: 8 },
        plays: [
          { type: 'offer', action: 'Test action', evidence: 'Test evidence', priority: 'medium' },
        ],
        ad_hooks: ['Test hook'],
        subject_lines: ['Test subject'],
        landing_copy: 'Test copy',
        why_score_changed: null, // Should be converted to []
        created_at: '2026-01-13T12:00:00Z',
        user_niches: {
          id: 'niche-1',
          offering_name: 'Test Niche',
          user_id: 'user-1',
        },
      };

      mockCreateClient.mockResolvedValue(
        createSupabaseMock({ user: mockUser, snapshot: mockSnapshot })
      );

      const request = new NextRequest('http://localhost/api/briefs/snapshot-1');
      const response = await GET(request, {
        params: Promise.resolve({ id: 'snapshot-1' }),
      });

      expect(response.status).toBe(200);
      const json = await response.json();

      // Check all required fields are present
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('niche_id');
      expect(json).toHaveProperty('offering_name');
      expect(json).toHaveProperty('week_start');
      expect(json).toHaveProperty('demand_score');
      expect(json).toHaveProperty('demand_score_change');
      expect(json).toHaveProperty('opportunity_score');
      expect(json).toHaveProperty('message_market_fit_score');
      expect(json).toHaveProperty('trend');
      expect(json).toHaveProperty('ad_signals');
      expect(json).toHaveProperty('search_signals');
      expect(json).toHaveProperty('forum_signals');
      expect(json).toHaveProperty('competitor_signals');
      expect(json).toHaveProperty('plays');
      expect(json).toHaveProperty('ad_hooks');
      expect(json).toHaveProperty('subject_lines');
      expect(json).toHaveProperty('landing_copy');
      expect(json).toHaveProperty('why_score_changed');
      expect(json).toHaveProperty('created_at');

      // Check null why_score_changed is converted to empty array
      expect(json.why_score_changed).toEqual([]);
    });
  });
});
