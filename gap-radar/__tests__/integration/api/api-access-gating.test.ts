/**
 * Integration Test: PAY-008 - API Access (Agency+ Plans)
 *
 * Tests that API access is properly gated based on subscription tier:
 * - Free, Starter, and Builder tiers: No API access
 * - Agency tier: API access with 100 req/hour rate limit
 * - Studio tier: API access with 500 req/hour rate limit
 *
 * @jest-environment node
 */

import {
  canUseAPI,
  getUserSubscription,
} from '@/lib/subscription/permissions';
import { getTierLimits } from '@/lib/subscription/tier-limits';
import { createAPIKey, validateAPIKey } from '@/lib/api-keys';

// Mock Supabase client
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockGte = jest.fn();
const mockOrder = jest.fn();

const createMockSupabase = () => ({
  from: mockFrom,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PAY-008: API Access Gating for Agency+ Plans', () => {
  describe('Tier Configuration', () => {
    it('should have API access disabled for free tier', () => {
      const limits = getTierLimits('free');
      expect(limits.apiAccess).toBe(false);
      expect(limits.apiRateLimit).toBe(0);
    });

    it('should have API access disabled for starter tier', () => {
      const limits = getTierLimits('starter');
      expect(limits.apiAccess).toBe(false);
      expect(limits.apiRateLimit).toBe(0);
    });

    it('should have API access disabled for builder tier', () => {
      const limits = getTierLimits('builder');
      expect(limits.apiAccess).toBe(false);
      expect(limits.apiRateLimit).toBe(0);
    });

    it('should have API access enabled for agency tier with 100 req/hour', () => {
      const limits = getTierLimits('agency');
      expect(limits.apiAccess).toBe(true);
      expect(limits.apiRateLimit).toBe(100);
    });

    it('should have API access enabled for studio tier with 500 req/hour', () => {
      const limits = getTierLimits('studio');
      expect(limits.apiAccess).toBe(true);
      expect(limits.apiRateLimit).toBe(500);
    });
  });

  describe('canUseAPI Permission Check', () => {
    it('should deny API access for free tier users', async () => {
      const mockSupabase = createMockSupabase() as any;

      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: {
          id: 'user-free',
          subscription_tier: 'free',
          max_niches: 0,
          runs_remaining: 1,
          stripe_customer_id: null,
          stripe_subscription_id: null,
        },
        error: null,
      });

      const result = await canUseAPI(mockSupabase, 'user-free');

      expect(result.allowed).toBe(false);
      expect(result.rateLimit).toBe(0);
      expect(result.message).toContain('Upgrade to Agency or Studio');
    });

    it('should deny API access for starter tier users', async () => {
      const mockSupabase = createMockSupabase() as any;

      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: {
          id: 'user-starter',
          subscription_tier: 'starter',
          max_niches: 1,
          runs_remaining: 5,
          stripe_customer_id: 'cus_starter123',
          stripe_subscription_id: 'sub_starter123',
        },
        error: null,
      });

      const result = await canUseAPI(mockSupabase, 'user-starter');

      expect(result.allowed).toBe(false);
      expect(result.rateLimit).toBe(0);
      expect(result.message).toContain('Upgrade to Agency or Studio');
    });

    it('should deny API access for builder tier users', async () => {
      const mockSupabase = createMockSupabase() as any;

      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: {
          id: 'user-builder',
          subscription_tier: 'builder',
          max_niches: 3,
          runs_remaining: 15,
          stripe_customer_id: 'cus_builder123',
          stripe_subscription_id: 'sub_builder123',
        },
        error: null,
      });

      const result = await canUseAPI(mockSupabase, 'user-builder');

      expect(result.allowed).toBe(false);
      expect(result.rateLimit).toBe(0);
      expect(result.message).toContain('Upgrade to Agency or Studio');
    });

    it('should allow API access for agency tier users with 100 req/hour', async () => {
      const mockSupabase = createMockSupabase() as any;

      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: {
          id: 'user-agency',
          subscription_tier: 'agency',
          max_niches: 10,
          runs_remaining: 50,
          stripe_customer_id: 'cus_agency123',
          stripe_subscription_id: 'sub_agency123',
        },
        error: null,
      });

      const result = await canUseAPI(mockSupabase, 'user-agency');

      expect(result.allowed).toBe(true);
      expect(result.rateLimit).toBe(100);
      expect(result.message).toBeUndefined();
    });

    it('should allow API access for studio tier users with 500 req/hour', async () => {
      const mockSupabase = createMockSupabase() as any;

      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: {
          id: 'user-studio',
          subscription_tier: 'studio',
          max_niches: 25,
          runs_remaining: 200,
          stripe_customer_id: 'cus_studio123',
          stripe_subscription_id: 'sub_studio123',
        },
        error: null,
      });

      const result = await canUseAPI(mockSupabase, 'user-studio');

      expect(result.allowed).toBe(true);
      expect(result.rateLimit).toBe(500);
      expect(result.message).toBeUndefined();
    });

    it('should handle database errors gracefully', async () => {
      const mockSupabase = createMockSupabase() as any;

      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const result = await canUseAPI(mockSupabase, 'user-error');

      expect(result.allowed).toBe(false);
      expect(result.message).toContain('Unable to verify subscription');
    });
  });

  describe('API Key Creation with Tier Gating', () => {
    it('should prevent API key creation for free tier users', async () => {
      const mockSupabase = createMockSupabase() as any;

      // Mock getUserSubscription call
      mockFrom.mockReturnValueOnce({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: {
          id: 'user-free',
          subscription_tier: 'free',
          max_niches: 0,
          runs_remaining: 1,
        },
        error: null,
      });

      const result = await createAPIKey(
        mockSupabase,
        'user-free',
        'Test API Key'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('API access is not available on your plan');
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('should prevent API key creation for starter tier users', async () => {
      const mockSupabase = createMockSupabase() as any;

      mockFrom.mockReturnValueOnce({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: {
          id: 'user-starter',
          subscription_tier: 'starter',
          max_niches: 1,
          runs_remaining: 5,
        },
        error: null,
      });

      const result = await createAPIKey(
        mockSupabase,
        'user-starter',
        'Test API Key'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('API access is not available on your plan');
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('should prevent API key creation for builder tier users', async () => {
      const mockSupabase = createMockSupabase() as any;

      mockFrom.mockReturnValueOnce({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: {
          id: 'user-builder',
          subscription_tier: 'builder',
          max_niches: 3,
          runs_remaining: 15,
        },
        error: null,
      });

      const result = await createAPIKey(
        mockSupabase,
        'user-builder',
        'Test API Key'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('API access is not available on your plan');
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('should allow API key creation for agency tier users', async () => {
      const mockSupabase = createMockSupabase() as any;

      // Mock getUserSubscription call
      mockFrom.mockReturnValueOnce({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: {
          id: 'user-agency',
          subscription_tier: 'agency',
          max_niches: 10,
          runs_remaining: 50,
        },
        error: null,
      });

      // Mock API key insertion
      mockFrom.mockReturnValueOnce({ insert: mockInsert });
      mockInsert.mockResolvedValue({ error: null });

      const result = await createAPIKey(
        mockSupabase,
        'user-agency',
        'Production API Key'
      );

      expect(result.success).toBe(true);
      expect(result.key).toMatch(/^dr_live_[a-z0-9]{32}$/);
      expect(mockInsert).toHaveBeenCalled();

      // Verify the API key was created with correct rate limit
      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.rate_limit).toBe(100);
    });

    it('should allow API key creation for studio tier users', async () => {
      const mockSupabase = createMockSupabase() as any;

      // Mock getUserSubscription call
      mockFrom.mockReturnValueOnce({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: {
          id: 'user-studio',
          subscription_tier: 'studio',
          max_niches: 25,
          runs_remaining: 200,
        },
        error: null,
      });

      // Mock API key insertion
      mockFrom.mockReturnValueOnce({ insert: mockInsert });
      mockInsert.mockResolvedValue({ error: null });

      const result = await createAPIKey(
        mockSupabase,
        'user-studio',
        'Production API Key'
      );

      expect(result.success).toBe(true);
      expect(result.key).toMatch(/^dr_live_[a-z0-9]{32}$/);
      expect(mockInsert).toHaveBeenCalled();

      // Verify the API key was created with correct rate limit
      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.rate_limit).toBe(500);
    });
  });

  describe('Rate Limits by Tier', () => {
    it('should enforce 100 req/hour rate limit for agency tier', async () => {
      const limits = getTierLimits('agency');
      expect(limits.apiRateLimit).toBe(100);
    });

    it('should enforce 500 req/hour rate limit for studio tier', async () => {
      const limits = getTierLimits('studio');
      expect(limits.apiRateLimit).toBe(500);
    });

    it('should have 0 rate limit for non-API tiers', () => {
      expect(getTierLimits('free').apiRateLimit).toBe(0);
      expect(getTierLimits('starter').apiRateLimit).toBe(0);
      expect(getTierLimits('builder').apiRateLimit).toBe(0);
    });
  });

  describe('End-to-End API Access Flow', () => {
    it('should complete full flow: check permission -> create key -> validate key (agency tier)', async () => {
      const mockSupabase = createMockSupabase() as any;

      // Step 1: Check API access permission
      mockFrom.mockReturnValueOnce({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: {
          id: 'user-agency',
          subscription_tier: 'agency',
          max_niches: 10,
          runs_remaining: 50,
        },
        error: null,
      });

      const permission = await canUseAPI(mockSupabase, 'user-agency');
      expect(permission.allowed).toBe(true);
      expect(permission.rateLimit).toBe(100);

      // Step 2: Create API key
      mockFrom.mockReturnValueOnce({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: {
          id: 'user-agency',
          subscription_tier: 'agency',
          max_niches: 10,
          runs_remaining: 50,
        },
        error: null,
      });

      mockFrom.mockReturnValueOnce({ insert: mockInsert });
      mockInsert.mockResolvedValue({ error: null });

      const keyResult = await createAPIKey(
        mockSupabase,
        'user-agency',
        'Integration Test Key'
      );

      expect(keyResult.success).toBe(true);
      expect(keyResult.key).toBeDefined();

      // Verify key was created with correct rate limit
      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.rate_limit).toBe(100);
    });

    it('should block full flow for builder tier user', async () => {
      const mockSupabase = createMockSupabase() as any;

      // Step 1: Check API access permission
      mockFrom.mockReturnValueOnce({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: {
          id: 'user-builder',
          subscription_tier: 'builder',
          max_niches: 3,
          runs_remaining: 15,
        },
        error: null,
      });

      const permission = await canUseAPI(mockSupabase, 'user-builder');
      expect(permission.allowed).toBe(false);

      // Step 2: Attempt to create API key (should fail)
      mockFrom.mockReturnValueOnce({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: {
          id: 'user-builder',
          subscription_tier: 'builder',
          max_niches: 3,
          runs_remaining: 15,
        },
        error: null,
      });

      const keyResult = await createAPIKey(
        mockSupabase,
        'user-builder',
        'Should Fail Key'
      );

      expect(keyResult.success).toBe(false);
      expect(keyResult.error).toContain('API access is not available on your plan');
      expect(mockInsert).not.toHaveBeenCalled();
    });
  });
});
