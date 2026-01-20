/**
 * Snapshot Collector Tests
 *
 * Tests the competitor snapshot collection functionality:
 * - Fetch ads from Meta Ad Library for a competitor
 * - Count active/new/stopped ads
 * - Store snapshot data
 *
 * Validates INTEL-004 acceptance criteria:
 * - Meta API called
 * - Ads counted
 * - Data stored
 */

import { collectCompetitorSnapshot } from '@/lib/competitors/snapshot-collector';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock Meta Ad Library
jest.mock('@/lib/collectors/meta', () => ({
  searchMetaAdLibrary: jest.fn(),
}));

describe('Competitor Snapshot Collector', () => {
  const mockCompetitor = {
    id: 'comp-123',
    user_id: 'user-123',
    competitor_name: 'Competitor A',
    competitor_domain: 'competitor-a.com',
    meta_page_id: '12345678',
    track_ads: true,
    is_active: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('collectCompetitorSnapshot', () => {
    it('should collect snapshot with ad data from Meta API', async () => {
      const mockAds = [
        {
          id: 'ad-1',
          advertiser_name: 'Competitor A',
          creative_text: 'Amazing product for small businesses',
          headline: 'Grow Your Business',
          first_seen: '2026-01-15',
          last_seen: '2026-01-20',
          is_active: true,
          run_days: 5,
        },
        {
          id: 'ad-2',
          advertiser_name: 'Competitor A',
          creative_text: 'Special offer this week only',
          headline: 'Limited Time Deal',
          first_seen: '2026-01-18',
          last_seen: '2026-01-20',
          is_active: true,
          run_days: 2,
        },
      ];

      const { searchMetaAdLibrary } = require('@/lib/collectors/meta');
      searchMetaAdLibrary.mockResolvedValue(mockAds);

      const snapshot = await collectCompetitorSnapshot(mockCompetitor);

      expect(searchMetaAdLibrary).toHaveBeenCalledWith(
        mockCompetitor.competitor_name,
        'US'
      );
      expect(snapshot).toHaveProperty('competitor_id', 'comp-123');
      expect(snapshot).toHaveProperty('active_ads_count', 2);
      expect(snapshot).toHaveProperty('ads');
      expect(snapshot.ads).toHaveLength(2);
    });

    it('should count new ads since last snapshot', async () => {
      const currentAds = [
        { id: 'ad-1', headline: 'Old Ad', first_seen: '2026-01-10' },
        { id: 'ad-2', headline: 'New Ad', first_seen: '2026-01-19' },
        { id: 'ad-3', headline: 'New Ad 2', first_seen: '2026-01-19' },
      ];

      const previousSnapshot = {
        snapshot_date: '2026-01-18',
        ads_data: [{ id: 'ad-1', headline: 'Old Ad' }],
      };

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: previousSnapshot,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      };

      const { searchMetaAdLibrary } = require('@/lib/collectors/meta');
      searchMetaAdLibrary.mockResolvedValue(currentAds);
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const snapshot = await collectCompetitorSnapshot(mockCompetitor);

      expect(snapshot.active_ads_count).toBe(3);
      expect(snapshot.new_ads_count).toBe(2); // ad-2 and ad-3 are new
    });

    it('should count stopped ads since last snapshot', async () => {
      const currentAds = [
        { id: 'ad-1', headline: 'Still Running' },
      ];

      const previousSnapshot = {
        snapshot_date: '2026-01-18',
        ads_data: [
          { id: 'ad-1', headline: 'Still Running' },
          { id: 'ad-2', headline: 'Stopped Ad' },
          { id: 'ad-3', headline: 'Stopped Ad 2' },
        ],
      };

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: previousSnapshot,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      };

      const { searchMetaAdLibrary } = require('@/lib/collectors/meta');
      searchMetaAdLibrary.mockResolvedValue(currentAds);
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const snapshot = await collectCompetitorSnapshot(mockCompetitor);

      expect(snapshot.stopped_ads_count).toBe(2); // ad-2 and ad-3 stopped
    });

    it('should handle competitor with no previous snapshot', async () => {
      const currentAds = [
        { id: 'ad-1', headline: 'First Ad' },
        { id: 'ad-2', headline: 'Second Ad' },
      ];

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'No previous snapshot' },
                  }),
                }),
              }),
            }),
          }),
        }),
      };

      const { searchMetaAdLibrary } = require('@/lib/collectors/meta');
      searchMetaAdLibrary.mockResolvedValue(currentAds);
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const snapshot = await collectCompetitorSnapshot(mockCompetitor);

      expect(snapshot.active_ads_count).toBe(2);
      expect(snapshot.new_ads_count).toBe(0); // No comparison possible
      expect(snapshot.stopped_ads_count).toBe(0);
    });

    it('should handle Meta API errors gracefully', async () => {
      const { searchMetaAdLibrary } = require('@/lib/collectors/meta');
      searchMetaAdLibrary.mockRejectedValue(new Error('Meta API error'));

      await expect(
        collectCompetitorSnapshot(mockCompetitor)
      ).rejects.toThrow('Meta API error');
    });

    it('should skip competitors without meta_page_id', async () => {
      const competitorWithoutPageId = {
        ...mockCompetitor,
        meta_page_id: null,
      };

      const snapshot = await collectCompetitorSnapshot(competitorWithoutPageId);

      expect(snapshot.active_ads_count).toBe(0);
      expect(snapshot.ads).toEqual([]);
    });
  });

  describe('Snapshot data structure', () => {
    it('should return correctly structured snapshot data', async () => {
      const mockAds = [
        {
          id: 'ad-1',
          advertiser_name: 'Test',
          creative_text: 'Ad text',
          headline: 'Headline',
          run_days: 5,
        },
      ];

      const { searchMetaAdLibrary } = require('@/lib/collectors/meta');
      searchMetaAdLibrary.mockResolvedValue(mockAds);

      const snapshot = await collectCompetitorSnapshot(mockCompetitor);

      expect(snapshot).toMatchObject({
        competitor_id: expect.any(String),
        active_ads_count: expect.any(Number),
        new_ads_count: expect.any(Number),
        stopped_ads_count: expect.any(Number),
        ads: expect.any(Array),
      });

      // Verify ad structure
      expect(snapshot.ads[0]).toMatchObject({
        id: expect.any(String),
        headline: expect.any(String),
      });
    });
  });
});
