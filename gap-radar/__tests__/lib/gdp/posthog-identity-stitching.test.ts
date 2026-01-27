/**
 * GDP-009: PostHog Identity Stitching Tests
 *
 * Tests for linking PostHog distinct_id with GDP person_id
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  identifyUserInPostHog,
  linkPostHogIdentity,
} from '@/lib/gdp/posthog-integration';
import { createServiceClient } from '@/lib/supabase/service';

// Mock Supabase service client
jest.mock('@/lib/supabase/service', () => ({
  createServiceClient: jest.fn(),
}));

describe('GDP-009: PostHog Identity Stitching', () => {
  let mockSupabaseClient: any;
  let mockPostHog: any;

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

    // Mock window.posthog for browser environment
    mockPostHog = {
      identify: jest.fn(),
      capture: jest.fn(),
      alias: jest.fn(),
      get_distinct_id: jest.fn().mockReturnValue('posthog-distinct-id-123'),
    };

    // Set window.posthog directly (window exists in jsdom environment)
    (global as any).window = (global as any).window || {};
    (global as any).window.posthog = mockPostHog;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Clean up window.posthog
    if ((global as any).window) {
      delete (global as any).window.posthog;
    }
  });

  describe('identifyUserInPostHog', () => {
    it('should call posthog.identify with person_id', () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const email = 'user@example.com';
      const properties = {
        name: 'John Doe',
        plan: 'builder',
      };

      identifyUserInPostHog(personId, email, properties);

      expect(mockPostHog.identify).toHaveBeenCalledWith(personId, {
        email,
        ...properties,
      });
    });

    it('should call posthog.identify with only person_id if no email or properties', () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';

      identifyUserInPostHog(personId);

      expect(mockPostHog.identify).toHaveBeenCalledWith(personId, {});
    });

    it('should call posthog.identify with email but no extra properties', () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const email = 'user@example.com';

      identifyUserInPostHog(personId, email);

      expect(mockPostHog.identify).toHaveBeenCalledWith(personId, { email });
    });
  });

  describe('linkPostHogIdentity', () => {
    it('should create identity link for PostHog distinct_id', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const distinctId = 'posthog-distinct-123';

      mockSupabaseClient.single.mockResolvedValue({
        data: {
          id: 'link-id',
          person_id: personId,
          platform: 'posthog',
          external_id: distinctId,
        },
        error: null,
      });

      const result = await linkPostHogIdentity(personId, distinctId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('identity_link');
      expect(mockSupabaseClient.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          person_id: personId,
          platform: 'posthog',
          external_id: distinctId,
        }),
        expect.objectContaining({
          onConflict: 'platform,external_id',
        })
      );
      expect(result).toEqual(
        expect.objectContaining({
          person_id: personId,
          platform: 'posthog',
          external_id: distinctId,
        })
      );
    });

    it('should handle errors when linking identity', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const distinctId = 'posthog-distinct-456';

      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(linkPostHogIdentity(personId, distinctId)).rejects.toThrow(
        'Failed to link PostHog identity'
      );
    });
  });
});
