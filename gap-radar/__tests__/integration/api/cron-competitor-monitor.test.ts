/**
 * Tests for Competitor Monitoring Cron Job (INTEL-008)
 *
 * Acceptance Criteria:
 * - Cron runs daily
 * - All competitors checked
 * - Alerts created
 */

// Mock modules before imports
const mockCreateClient = jest.fn();
const mockCollectCompetitorSnapshot = jest.fn();
const mockDetectCompetitorChanges = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}));

jest.mock('@/lib/competitors/snapshot-collector', () => ({
  collectCompetitorSnapshot: mockCollectCompetitorSnapshot,
}));

jest.mock('@/lib/competitors/change-detector', () => ({
  detectCompetitorChanges: mockDetectCompetitorChanges,
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/cron/competitor-monitor/route';

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
  competitors?: any[];
  previousSnapshot?: any;
  insertSnapshotError?: string | null;
  insertAlertError?: string | null;
}) {
  const {
    competitors = [],
    previousSnapshot = null,
    insertSnapshotError = null,
    insertAlertError = null,
  } = config;

  const client = {
    from: jest.fn((tableName: string) => {
      const query: any = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      // Setup chainable methods
      query.select.mockImplementation(() => query);
      query.insert.mockImplementation(() => query);
      query.update.mockImplementation(() => query);
      query.eq.mockImplementation(() => query);
      query.order.mockImplementation(() => query);
      query.limit.mockImplementation(() => query);

      // Handle different table queries
      if (tableName === 'tracked_competitors') {
        // For selecting active competitors
        query.eq.mockResolvedValue({ data: competitors, error: null });
      } else if (tableName === 'competitor_snapshots') {
        // For inserting new snapshots
        if (insertSnapshotError) {
          query.insert.mockResolvedValue({
            error: new Error(insertSnapshotError),
          });
        } else {
          query.insert.mockResolvedValue({ error: null });
        }

        // For selecting previous snapshot
        query.single.mockResolvedValue({
          data: previousSnapshot,
          error: previousSnapshot ? null : new Error('Not found'),
        });
      } else if (tableName === 'competitor_alerts') {
        // For inserting alerts
        if (insertAlertError) {
          query.insert.mockResolvedValue({
            error: new Error(insertAlertError),
          });
        } else {
          query.insert.mockResolvedValue({ error: null });
        }
      }

      return query;
    }),
  };

  return client;
}

describe('Competitor Monitoring Cron Job', () => {
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

      const request = new NextRequest(
        'http://localhost/api/cron/competitor-monitor'
      );

      const response = await GET(request);

      expect(response.status).toBe(401);
      const text = await response.text();
      expect(text).toBe('Unauthorized');
    });

    it('should allow requests with correct authorization', async () => {
      process.env.CRON_SECRET = 'test-secret';

      const request = new NextRequest(
        'http://localhost/api/cron/competitor-monitor',
        {
          headers: {
            authorization: 'Bearer test-secret',
          },
        }
      );

      mockCreateClient.mockResolvedValue(createSupabaseMock({ competitors: [] }));

      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('All Competitors Checked', () => {
    beforeEach(() => {
      delete process.env.CRON_SECRET; // Disable auth for tests
    });

    it('should process all active tracked competitors', async () => {
      const mockCompetitors = [
        {
          id: 'comp-1',
          user_id: 'user-1',
          competitor_name: 'Competitor A',
          competitor_domain: 'competitor-a.com',
          meta_page_id: '12345',
          track_ads: true,
          is_active: true,
        },
        {
          id: 'comp-2',
          user_id: 'user-2',
          competitor_name: 'Competitor B',
          competitor_domain: 'competitor-b.com',
          meta_page_id: '67890',
          track_ads: true,
          is_active: true,
        },
      ];

      mockCreateClient.mockResolvedValue(
        createSupabaseMock({ competitors: mockCompetitors })
      );

      mockCollectCompetitorSnapshot.mockResolvedValue({
        competitor_id: 'comp-1',
        active_ads_count: 10,
        new_ads_count: 2,
        stopped_ads_count: 1,
        ads: [{ id: 'ad-1', headline: 'Test Ad', body: 'Body' }],
      });

      mockDetectCompetitorChanges.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost/api/cron/competitor-monitor'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json.processed).toBe(2);
      expect(mockCollectCompetitorSnapshot).toHaveBeenCalledTimes(2);
    });

    it('should handle no competitors gracefully', async () => {
      mockCreateClient.mockResolvedValue(createSupabaseMock({ competitors: [] }));

      const request = new NextRequest(
        'http://localhost/api/cron/competitor-monitor'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json.processed).toBe(0);
    });

    it('should skip inactive competitors', async () => {
      const mockCompetitors = [
        {
          id: 'comp-1',
          user_id: 'user-1',
          competitor_name: 'Active Competitor',
          is_active: true,
          track_ads: true,
        },
        {
          id: 'comp-2',
          user_id: 'user-2',
          competitor_name: 'Inactive Competitor',
          is_active: false, // Should be skipped by query
          track_ads: true,
        },
      ];

      // Only active competitors should be returned by the query
      mockCreateClient.mockResolvedValue(
        createSupabaseMock({
          competitors: mockCompetitors.filter((c) => c.is_active),
        })
      );

      mockCollectCompetitorSnapshot.mockResolvedValue({
        competitor_id: 'comp-1',
        active_ads_count: 5,
        new_ads_count: 0,
        stopped_ads_count: 0,
        ads: [],
      });

      mockDetectCompetitorChanges.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost/api/cron/competitor-monitor'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();

      // Only 1 competitor processed (the active one)
      expect(json.processed).toBe(1);
    });
  });

  describe('Alerts Created', () => {
    beforeEach(() => {
      delete process.env.CRON_SECRET;
    });

    it('should create alerts for detected changes', async () => {
      const mockCompetitor = {
        id: 'comp-1',
        user_id: 'user-1',
        competitor_name: 'Competitor A',
        competitor_domain: 'competitor-a.com',
        meta_page_id: '12345',
        track_ads: true,
        is_active: true,
      };

      const mockClient = createSupabaseMock({
        competitors: [mockCompetitor],
        previousSnapshot: {
          snapshot_date: '2026-01-19',
          ads_data: [{ id: 'ad-1', headline: 'Old Ad', body: 'Body' }],
        },
      });

      mockCreateClient.mockResolvedValue(mockClient);

      mockCollectCompetitorSnapshot.mockResolvedValue({
        competitor_id: 'comp-1',
        active_ads_count: 12,
        new_ads_count: 7,
        stopped_ads_count: 0,
        ads: [
          { id: 'ad-1', headline: 'Old Ad', body: 'Body' },
          { id: 'ad-2', headline: 'New Ad 1', body: 'Body' },
          { id: 'ad-3', headline: 'New Ad 2', body: 'Body' },
        ],
      });

      // Mock detected changes
      mockDetectCompetitorChanges.mockResolvedValue([
        {
          type: 'new_campaign',
          competitor_id: 'comp-1',
          detected_at: new Date(),
          data: { count: 7 },
          significance: 'high',
        },
      ]);

      const request = new NextRequest(
        'http://localhost/api/cron/competitor-monitor'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json.changes_detected).toBe(1);
      expect(json.alerts_created).toBe(1);
      expect(mockClient.from).toHaveBeenCalledWith('competitor_alerts');
    });

    it('should only create alerts for medium and high significance changes', async () => {
      const mockCompetitor = {
        id: 'comp-1',
        user_id: 'user-1',
        competitor_name: 'Competitor A',
        track_ads: true,
        is_active: true,
      };

      mockCreateClient.mockResolvedValue(
        createSupabaseMock({
          competitors: [mockCompetitor],
          previousSnapshot: {
            snapshot_date: '2026-01-19',
            ads_data: [{ id: 'ad-1', headline: 'Old Ad', body: 'Body' }],
            active_ads_count: 8,
          },
        })
      );

      mockCollectCompetitorSnapshot.mockResolvedValue({
        competitor_id: 'comp-1',
        active_ads_count: 10,
        new_ads_count: 0,
        stopped_ads_count: 0,
        ads: [],
      });

      // Mock changes with different significance levels
      mockDetectCompetitorChanges.mockResolvedValue([
        {
          type: 'new_campaign',
          competitor_id: 'comp-1',
          detected_at: new Date(),
          data: {},
          significance: 'low', // Should NOT create alert
        },
        {
          type: 'ad_spike',
          competitor_id: 'comp-1',
          detected_at: new Date(),
          data: {},
          significance: 'high', // Should create alert
        },
      ]);

      const request = new NextRequest(
        'http://localhost/api/cron/competitor-monitor'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json.changes_detected).toBe(2);
      expect(json.alerts_created).toBe(1); // Only 1 alert for high significance
    });

    it('should handle errors gracefully when creating alerts fails', async () => {
      const mockCompetitor = {
        id: 'comp-1',
        user_id: 'user-1',
        competitor_name: 'Competitor A',
        track_ads: true,
        is_active: true,
      };

      mockCreateClient.mockResolvedValue(
        createSupabaseMock({
          competitors: [mockCompetitor],
          previousSnapshot: {
            snapshot_date: '2026-01-19',
            ads_data: [{ id: 'ad-1', headline: 'Old Ad', body: 'Body' }],
            active_ads_count: 5,
          },
          insertAlertError: 'Database error',
        })
      );

      mockCollectCompetitorSnapshot.mockResolvedValue({
        competitor_id: 'comp-1',
        active_ads_count: 10,
        new_ads_count: 5,
        stopped_ads_count: 0,
        ads: [],
      });

      mockDetectCompetitorChanges.mockResolvedValue([
        {
          type: 'new_campaign',
          competitor_id: 'comp-1',
          detected_at: new Date(),
          data: {},
          significance: 'high',
        },
      ]);

      const request = new NextRequest(
        'http://localhost/api/cron/competitor-monitor'
      );
      const response = await GET(request);

      // Should still return 200 but with error logged
      expect(response.status).toBe(200);
      expect(console.error).toHaveBeenCalled();
    });
  });
});
