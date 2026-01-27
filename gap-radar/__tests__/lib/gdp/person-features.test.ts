/**
 * GDP-011: Person Features Computation Tests
 *
 * Tests for computing engagement metrics from unified events
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  computePersonFeatures,
  getPersonFeatures,
} from '@/lib/gdp/person-features';
import { createServiceClient } from '@/lib/supabase/service';

// Mock Supabase service client
jest.mock('@/lib/supabase/service', () => ({
  createServiceClient: jest.fn(),
}));

describe('GDP-011: Person Features Computation', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock Supabase client
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      rpc: jest.fn(),
    };

    (createServiceClient as any).mockReturnValue(mockSupabaseClient);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('computePersonFeatures', () => {
    it('should call compute_person_features RPC function', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: null,
      });

      await computePersonFeatures(personId);

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('compute_person_features', {
        p_person_id: personId,
      });
    });

    it('should throw error if RPC call fails', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(computePersonFeatures(personId)).rejects.toThrow(
        'Failed to compute person features'
      );
    });
  });

  describe('getPersonFeatures', () => {
    it('should retrieve person features from database', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const mockFeatures = {
        person_id: personId,
        active_days_7d: 5,
        active_days_30d: 15,
        active_days_90d: 45,
        total_events: 150,
        events_7d: 25,
        events_30d: 75,
        runs_created: 10,
        runs_completed: 8,
        reports_downloaded: 6,
        gaps_discovered: 25,
        avg_demand_score: 72.5,
        pricing_views: 3,
        checkout_starts: 1,
        emails_sent: 5,
        emails_opened: 4,
        emails_clicked: 2,
        email_open_rate: 80.0,
        email_click_rate: 40.0,
        is_subscriber: true,
        subscription_mrr_cents: 2900,
        total_revenue_cents: 2900,
        first_purchase_at: '2024-01-15T10:30:00.000Z',
        last_purchase_at: '2024-01-15T10:30:00.000Z',
        engagement_score: 85,
        activation_score: 100,
        churn_risk_score: 10,
        last_active_at: '2024-02-01T14:20:00.000Z',
        computed_at: '2024-02-01T14:25:00.000Z',
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockFeatures,
        error: null,
      });

      const features = await getPersonFeatures(personId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('person_features');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('person_id', personId);
      expect(features).toEqual(mockFeatures);
    });

    it('should return null if person features not found', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const features = await getPersonFeatures(personId);

      expect(features).toBeNull();
    });

    it('should throw error for other database errors', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'OTHER', message: 'Database connection failed' },
      });

      await expect(getPersonFeatures(personId)).rejects.toThrow(
        'Failed to get person features'
      );
    });
  });

  describe('Feature computation logic', () => {
    it('should compute features based on unified events', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock RPC call success
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock features retrieval
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          person_id: personId,
          active_days_7d: 3,
          runs_created: 2,
          runs_completed: 2,
          engagement_score: 65,
          activation_score: 70,
        },
        error: null,
      });

      // Compute features
      await computePersonFeatures(personId);

      // Verify it was called
      expect(mockSupabaseClient.rpc).toHaveBeenCalled();

      // Retrieve computed features
      const features = await getPersonFeatures(personId);

      expect(features).toHaveProperty('active_days_7d');
      expect(features).toHaveProperty('runs_created');
      expect(features).toHaveProperty('engagement_score');
    });

    it('should handle person with no events gracefully', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabaseClient.single.mockResolvedValue({
        data: {
          person_id: personId,
          active_days_7d: 0,
          active_days_30d: 0,
          total_events: 0,
          runs_created: 0,
          runs_completed: 0,
          engagement_score: 0,
          activation_score: 0,
        },
        error: null,
      });

      await computePersonFeatures(personId);
      const features = await getPersonFeatures(personId);

      expect(features?.active_days_7d).toBe(0);
      expect(features?.engagement_score).toBe(0);
    });
  });
});
