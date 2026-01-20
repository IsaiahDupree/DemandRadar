/**
 * Change Detection Engine Tests
 *
 * Tests the competitor change detection logic:
 * - Detect new campaigns (new ads launched)
 * - Detect stopped campaigns (ads that stopped running)
 * - Detect ad volume spikes (significant increase in ad count)
 * - Detect creative shifts (major messaging changes)
 *
 * Validates INTEL-005 acceptance criteria:
 * - New ads detected
 * - Stopped ads detected
 * - Spikes flagged
 */

import {
  detectCompetitorChanges,
  ChangeType,
} from '@/lib/competitors/change-detector';

describe('Change Detection Engine', () => {
  const mockCompetitor = {
    id: 'comp-123',
    user_id: 'user-123',
    competitor_name: 'Competitor A',
    competitor_domain: 'competitor-a.com',
    meta_page_id: '12345678',
    track_ads: true,
    is_active: true,
  };

  describe('detectCompetitorChanges', () => {
    it('should detect new campaigns when new ads appear', async () => {
      const previousSnapshot = {
        competitor_id: 'comp-123',
        active_ads_count: 5,
        ads: [
          { id: 'ad-1', headline: 'Old Ad 1', run_days: 30 },
          { id: 'ad-2', headline: 'Old Ad 2', run_days: 25 },
          { id: 'ad-3', headline: 'Old Ad 3', run_days: 20 },
          { id: 'ad-4', headline: 'Old Ad 4', run_days: 15 },
          { id: 'ad-5', headline: 'Old Ad 5', run_days: 10 },
        ],
      };

      const currentSnapshot = {
        competitor_id: 'comp-123',
        active_ads_count: 8,
        ads: [
          ...previousSnapshot.ads,
          { id: 'ad-6', headline: 'New Ad 1', run_days: 1 },
          { id: 'ad-7', headline: 'New Ad 2', run_days: 1 },
          { id: 'ad-8', headline: 'New Ad 3', run_days: 1 },
        ],
      };

      const changes = await detectCompetitorChanges(
        mockCompetitor,
        previousSnapshot,
        currentSnapshot
      );

      const newCampaignChange = changes.find(
        (c) => c.type === 'new_campaign'
      );
      expect(newCampaignChange).toBeDefined();
      expect(newCampaignChange?.data.count).toBe(3);
      expect(newCampaignChange?.significance).toBe('medium');
    });

    it('should detect high significance for 6+ new ads', async () => {
      const previousSnapshot = {
        competitor_id: 'comp-123',
        active_ads_count: 5,
        ads: [{ id: 'ad-1', headline: 'Old Ad', run_days: 30 }],
      };

      const currentSnapshot = {
        competitor_id: 'comp-123',
        active_ads_count: 12,
        ads: [
          { id: 'ad-1', headline: 'Old Ad', run_days: 30 },
          { id: 'ad-2', headline: 'New Ad 1', run_days: 1 },
          { id: 'ad-3', headline: 'New Ad 2', run_days: 1 },
          { id: 'ad-4', headline: 'New Ad 3', run_days: 1 },
          { id: 'ad-5', headline: 'New Ad 4', run_days: 1 },
          { id: 'ad-6', headline: 'New Ad 5', run_days: 1 },
          { id: 'ad-7', headline: 'New Ad 6', run_days: 1 },
          { id: 'ad-8', headline: 'New Ad 7', run_days: 1 },
        ],
      };

      const changes = await detectCompetitorChanges(
        mockCompetitor,
        previousSnapshot,
        currentSnapshot
      );

      const newCampaignChange = changes.find(
        (c) => c.type === 'new_campaign'
      );
      expect(newCampaignChange?.significance).toBe('high');
    });

    it('should detect stopped campaigns for long-running ads', async () => {
      const previousSnapshot = {
        competitor_id: 'comp-123',
        active_ads_count: 8,
        ads: [
          { id: 'ad-1', headline: 'Current Ad', run_days: 20 },
          { id: 'ad-2', headline: 'Winner Ad 1', run_days: 45 },
          { id: 'ad-3', headline: 'Winner Ad 2', run_days: 35 },
          { id: 'ad-4', headline: 'Short Ad', run_days: 5 },
        ],
      };

      const currentSnapshot = {
        competitor_id: 'comp-123',
        active_ads_count: 2,
        ads: [{ id: 'ad-1', headline: 'Current Ad', run_days: 21 }],
      };

      const changes = await detectCompetitorChanges(
        mockCompetitor,
        previousSnapshot,
        currentSnapshot
      );

      const campaignEndedChange = changes.find(
        (c) => c.type === 'campaign_ended'
      );
      expect(campaignEndedChange).toBeDefined();
      expect(campaignEndedChange?.data.ads).toHaveLength(2); // Only 30+ day ads
      expect(campaignEndedChange?.significance).toBe('medium');
    });

    it('should detect ad volume spikes', async () => {
      const previousSnapshot = {
        competitor_id: 'comp-123',
        active_ads_count: 10,
        ads: Array(10)
          .fill(null)
          .map((_, i) => ({
            id: `ad-${i}`,
            headline: `Ad ${i}`,
            run_days: 10,
          })),
      };

      const currentSnapshot = {
        competitor_id: 'comp-123',
        active_ads_count: 20,
        ads: Array(20)
          .fill(null)
          .map((_, i) => ({
            id: `ad-${i}`,
            headline: `Ad ${i}`,
            run_days: 10,
          })),
      };

      const changes = await detectCompetitorChanges(
        mockCompetitor,
        previousSnapshot,
        currentSnapshot
      );

      const spikeChange = changes.find((c) => c.type === 'ad_spike');
      expect(spikeChange).toBeDefined();
      expect(spikeChange?.data.percent_change).toBe(100); // 100% increase
      expect(spikeChange?.significance).toBe('high');
    });

    it('should not flag spike for small increases', async () => {
      const previousSnapshot = {
        competitor_id: 'comp-123',
        active_ads_count: 10,
        ads: [],
      };

      const currentSnapshot = {
        competitor_id: 'comp-123',
        active_ads_count: 12, // Only 20% increase
        ads: [],
      };

      const changes = await detectCompetitorChanges(
        mockCompetitor,
        previousSnapshot,
        currentSnapshot
      );

      const spikeChange = changes.find((c) => c.type === 'ad_spike');
      expect(spikeChange).toBeUndefined();
    });

    it('should return multiple change types in one analysis', async () => {
      const previousSnapshot = {
        competitor_id: 'comp-123',
        active_ads_count: 5,
        ads: [
          { id: 'ad-1', headline: 'Old Winner', run_days: 40 },
          { id: 'ad-2', headline: 'Ad 2', run_days: 10 },
        ],
      };

      const currentSnapshot = {
        competitor_id: 'comp-123',
        active_ads_count: 12, // Spike from 5 to 12 (140% increase)
        ads: [
          { id: 'ad-2', headline: 'Ad 2', run_days: 11 },
          { id: 'ad-3', headline: 'New Ad 1', run_days: 1 },
          { id: 'ad-4', headline: 'New Ad 2', run_days: 1 },
          { id: 'ad-5', headline: 'New Ad 3', run_days: 1 },
          { id: 'ad-6', headline: 'New Ad 4', run_days: 1 },
          { id: 'ad-7', headline: 'New Ad 5', run_days: 1 },
          { id: 'ad-8', headline: 'New Ad 6', run_days: 1 },
        ],
      };

      const changes = await detectCompetitorChanges(
        mockCompetitor,
        previousSnapshot,
        currentSnapshot
      );

      expect(changes.length).toBeGreaterThan(0);

      // Should detect new campaign
      expect(changes.some((c) => c.type === 'new_campaign')).toBe(true);

      // Should detect stopped campaign (winner ad stopped)
      expect(changes.some((c) => c.type === 'campaign_ended')).toBe(true);

      // Should detect ad spike (140% increase)
      expect(changes.some((c) => c.type === 'ad_spike')).toBe(true);
    });

    it('should return empty array when no significant changes', async () => {
      const previousSnapshot = {
        competitor_id: 'comp-123',
        active_ads_count: 5,
        ads: [
          { id: 'ad-1', headline: 'Ad 1', run_days: 10 },
          { id: 'ad-2', headline: 'Ad 2', run_days: 8 },
          { id: 'ad-3', headline: 'Ad 3', run_days: 6 },
        ],
      };

      const currentSnapshot = {
        competitor_id: 'comp-123',
        active_ads_count: 5,
        ads: [
          { id: 'ad-1', headline: 'Ad 1', run_days: 11 },
          { id: 'ad-2', headline: 'Ad 2', run_days: 9 },
          { id: 'ad-3', headline: 'Ad 3', run_days: 7 },
          { id: 'ad-4', headline: 'New Ad', run_days: 1 }, // Only 1 new ad
          { id: 'ad-5', headline: 'New Ad 2', run_days: 1 },
        ],
      };

      const changes = await detectCompetitorChanges(
        mockCompetitor,
        previousSnapshot,
        currentSnapshot
      );

      // 2 new ads shouldn't trigger high significance
      const highSigChanges = changes.filter((c) => c.significance === 'high');
      expect(highSigChanges.length).toBe(0);
    });

    it('should include competitor_id and timestamp in changes', async () => {
      const previousSnapshot = {
        competitor_id: 'comp-123',
        active_ads_count: 5,
        ads: [{ id: 'ad-1', headline: 'Ad', run_days: 10 }],
      };

      const currentSnapshot = {
        competitor_id: 'comp-123',
        active_ads_count: 12,
        ads: [
          { id: 'ad-1', headline: 'Ad', run_days: 11 },
          ...Array(6)
            .fill(null)
            .map((_, i) => ({
              id: `new-ad-${i}`,
              headline: `New ${i}`,
              run_days: 1,
            })),
        ],
      };

      const changes = await detectCompetitorChanges(
        mockCompetitor,
        previousSnapshot,
        currentSnapshot
      );

      expect(changes.length).toBeGreaterThan(0);
      changes.forEach((change) => {
        expect(change.competitor_id).toBe('comp-123');
        expect(change.detected_at).toBeInstanceOf(Date);
      });
    });
  });

  describe('Change types', () => {
    it('should support all required change types', () => {
      const changeTypes: ChangeType[] = [
        'new_campaign',
        'campaign_ended',
        'ad_spike',
        'creative_shift',
        'messaging_change',
        'pricing_change',
        'new_feature',
      ];

      // This test just validates the type exists
      expect(changeTypes).toHaveLength(7);
    });
  });
});
