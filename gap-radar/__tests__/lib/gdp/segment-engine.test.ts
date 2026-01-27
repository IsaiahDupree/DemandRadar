/**
 * GDP-012: Segment Engine Tests
 *
 * Tests for evaluating segment membership and triggering automations
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  evaluateSegmentMembership,
  addPersonToSegment,
  removePersonFromSegment,
  getPersonSegments,
  getSegmentMembers,
} from '@/lib/gdp/segment-engine';
import { createServiceClient } from '@/lib/supabase/service';

// Mock Supabase service client
jest.mock('@/lib/supabase/service', () => ({
  createServiceClient: jest.fn(),
}));

describe('GDP-012: Segment Engine', () => {
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
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      single: jest.fn(),
      rpc: jest.fn(),
    };

    (createServiceClient as any).mockReturnValue(mockSupabaseClient);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('evaluateSegmentMembership', () => {
    it('should evaluate if person meets segment criteria', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const segmentId = 'seg-activated-users';

      const mockPersonFeatures = {
        person_id: personId,
        runs_completed: 2,
        activation_score: 80,
      };

      const mockSegment = {
        id: segmentId,
        segment_key: 'activated',
        filter_criteria: {
          runs_completed: { $gte: 1 },
        },
      };

      // Mock person features fetch
      const personFeaturesMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockPersonFeatures,
          error: null,
        }),
      };

      // Mock segment fetch
      const segmentMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockSegment,
          error: null,
        }),
      };

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'person_features') return personFeaturesMock;
        if (table === 'segment') return segmentMock;
        return mockSupabaseClient;
      });

      const result = await evaluateSegmentMembership(personId, segmentId);

      expect(result).toBe(true);
    });

    it('should return false if person does not meet criteria', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const segmentId = 'seg-high-intent';

      const mockPersonFeatures = {
        person_id: personId,
        pricing_views: 0,
        is_subscriber: false,
      };

      const mockSegment = {
        id: segmentId,
        segment_key: 'pricing_viewed_2plus_not_paid',
        filter_criteria: {
          pricing_views: { $gte: 2 },
          is_subscriber: false,
        },
      };

      const personFeaturesMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockPersonFeatures,
          error: null,
        }),
      };

      const segmentMock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockSegment,
          error: null,
        }),
      };

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'person_features') return personFeaturesMock;
        if (table === 'segment') return segmentMock;
        return mockSupabaseClient;
      });

      const result = await evaluateSegmentMembership(personId, segmentId);

      expect(result).toBe(false);
    });
  });

  describe('addPersonToSegment', () => {
    it('should add person to segment_membership table', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const segmentId = 'seg-activated';

      mockSupabaseClient.single.mockResolvedValue({
        data: {
          id: 'membership-id',
          person_id: personId,
          segment_id: segmentId,
          entered_at: new Date().toISOString(),
        },
        error: null,
      });

      await addPersonToSegment(personId, segmentId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('segment_membership');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          person_id: personId,
          segment_id: segmentId,
        })
      );
    });

    it('should handle errors when adding person to segment', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const segmentId = 'seg-activated';

      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Duplicate entry' },
      });

      await expect(addPersonToSegment(personId, segmentId)).rejects.toThrow(
        'Failed to add person to segment'
      );
    });
  });

  describe('removePersonFromSegment', () => {
    it('should remove person from segment by setting exited_at', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const segmentId = 'seg-activated';

      // Need to chain: update -> eq -> eq -> is
      mockSupabaseClient.is.mockResolvedValue({
        data: {},
        error: null,
      });

      await removePersonFromSegment(personId, segmentId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('segment_membership');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          exited_at: expect.any(String),
        })
      );
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('person_id', personId);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('segment_id', segmentId);
      expect(mockSupabaseClient.is).toHaveBeenCalledWith('exited_at', null);
    });
  });

  describe('getPersonSegments', () => {
    it('should retrieve all active segments for a person', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';

      const mockSegments = [
        {
          segment_id: 'seg-1',
          segment: {
            segment_key: 'activated',
            segment_name: 'Activated Users',
          },
        },
        {
          segment_id: 'seg-2',
          segment: {
            segment_key: 'high_intent',
            segment_name: 'High Intent Users',
          },
        },
      ];

      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.is.mockResolvedValue({
        data: mockSegments,
        error: null,
      });

      const segments = await getPersonSegments(personId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('segment_membership');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('person_id', personId);
      expect(segments).toHaveLength(2);
    });
  });

  describe('getSegmentMembers', () => {
    it('should retrieve all active members of a segment', async () => {
      const segmentId = 'seg-activated';

      const mockMembers = [
        {
          person_id: 'person-1',
          entered_at: '2024-01-01T00:00:00.000Z',
        },
        {
          person_id: 'person-2',
          entered_at: '2024-01-02T00:00:00.000Z',
        },
      ];

      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.is.mockResolvedValue({
        data: mockMembers,
        error: null,
      });

      const members = await getSegmentMembers(segmentId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('segment_membership');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('segment_id', segmentId);
      expect(members).toHaveLength(2);
    });
  });
});
