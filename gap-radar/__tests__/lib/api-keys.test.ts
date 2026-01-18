/**
 * @jest-environment node
 */
import {
  generateAPIKey,
  hashAPIKey,
  verifyAPIKey,
  getKeyPrefix,
  createAPIKey,
  validateAPIKey,
  listAPIKeys,
  revokeAPIKey,
  deleteAPIKey,
  checkRateLimit,
  logAPIUsage,
} from '@/lib/api-keys';

// Mock Supabase
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockGte = jest.fn();
const mockSingle = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockOrder = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

// Mock subscription permissions
jest.mock('@/lib/subscription/permissions', () => ({
  canUseAPI: jest.fn(),
}));

import { canUseAPI } from '@/lib/subscription/permissions';

describe('API Key Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAPIKey', () => {
    it('should generate a valid API key with correct prefix', () => {
      const key = generateAPIKey();
      expect(key).toMatch(/^dr_live_[a-z0-9]{32}$/);
    });

    it('should generate unique keys on each call', () => {
      const key1 = generateAPIKey();
      const key2 = generateAPIKey();
      expect(key1).not.toBe(key2);
    });

    it('should generate keys with consistent length', () => {
      const key = generateAPIKey();
      expect(key.length).toBe(40); // dr_live_ (8) + 32 chars
    });
  });

  describe('hashAPIKey and verifyAPIKey', () => {
    it('should hash an API key', async () => {
      const key = 'dr_live_abc123xyz789';
      const hash = await hashAPIKey(key);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(key);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are ~60 chars
    });

    it('should verify a valid API key against its hash', async () => {
      const key = 'dr_live_abc123xyz789';
      const hash = await hashAPIKey(key);

      const isValid = await verifyAPIKey(key, hash);
      expect(isValid).toBe(true);
    });

    it('should reject an invalid API key against a hash', async () => {
      const key = 'dr_live_abc123xyz789';
      const wrongKey = 'dr_live_wrong_key_here';
      const hash = await hashAPIKey(key);

      const isValid = await verifyAPIKey(wrongKey, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('getKeyPrefix', () => {
    it('should return first 12 characters plus ellipsis', () => {
      const key = 'dr_live_abc123xyz789012345678';
      const prefix = getKeyPrefix(key);

      expect(prefix).toBe('dr_live_abc1...');
      expect(prefix.length).toBe(15); // 12 chars + '...'
    });

    it('should handle short keys', () => {
      const key = 'short';
      const prefix = getKeyPrefix(key);

      expect(prefix).toBe('short...');
    });
  });

  describe('createAPIKey', () => {
    it('should create a new API key for authorized user', async () => {
      const mockSupabase = { from: mockFrom } as any;
      (canUseAPI as jest.Mock).mockResolvedValue({
        allowed: true,
        rateLimit: 100,
      });

      mockFrom.mockReturnValue({ insert: mockInsert });
      mockInsert.mockResolvedValue({ error: null });

      const result = await createAPIKey(mockSupabase, 'user-123', 'Test API Key');

      expect(canUseAPI).toHaveBeenCalledWith(mockSupabase, 'user-123');
      expect(result.success).toBe(true);
      expect(result.key).toMatch(/^dr_live_[a-z0-9]{32}$/);
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should reject API key creation for users without API access', async () => {
      const mockSupabase = { from: mockFrom } as any;
      (canUseAPI as jest.Mock).mockResolvedValue({
        allowed: false,
        message: 'API access not available on your plan',
      });

      const result = await createAPIKey(mockSupabase, 'user-123', 'Test API Key');

      expect(result.success).toBe(false);
      expect(result.error).toBe('API access not available on your plan');
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('should create API key with expiration date', async () => {
      const mockSupabase = { from: mockFrom } as any;
      (canUseAPI as jest.Mock).mockResolvedValue({
        allowed: true,
        rateLimit: 100,
      });

      let capturedData: any;
      mockFrom.mockReturnValue({ insert: mockInsert });
      mockInsert.mockImplementation((data) => {
        capturedData = data;
        return Promise.resolve({ error: null });
      });

      const expiresInDays = 30;
      const result = await createAPIKey(mockSupabase, 'user-123', 'Test API Key', expiresInDays);

      expect(result.success).toBe(true);
      expect(capturedData.expires_at).toBeDefined();

      const expiresAt = new Date(capturedData.expires_at);
      const expectedExpiry = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
      expect(Math.abs(expiresAt.getTime() - expectedExpiry.getTime())).toBeLessThan(1000);
    });

    it('should handle database errors', async () => {
      const mockSupabase = { from: mockFrom } as any;
      (canUseAPI as jest.Mock).mockResolvedValue({
        allowed: true,
        rateLimit: 100,
      });

      mockFrom.mockReturnValue({ insert: mockInsert });
      mockInsert.mockResolvedValue({ error: { message: 'Database error' } });

      const result = await createAPIKey(mockSupabase, 'user-123', 'Test API Key');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create API key');
    });
  });

  describe('validateAPIKey', () => {
    it('should validate a correct API key', async () => {
      const apiKey = 'dr_live_test123456789012345678901';
      const hash = await hashAPIKey(apiKey);

      const mockSupabase = { from: mockFrom } as any;

      // First call - select query for keys
      const selectMock1 = jest.fn().mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValueOnce({
        data: [{
          id: 'key-123',
          user_id: 'user-123',
          key_hash: hash,
          rate_limit: 100,
          expires_at: null,
          is_active: true,
        }],
        error: null,
      });

      // Second call - update for last_used_at
      const updateMock = jest.fn().mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValueOnce({ error: null });

      mockFrom
        .mockReturnValueOnce({ select: selectMock1 })
        .mockReturnValueOnce({ update: updateMock });

      const result = await validateAPIKey(mockSupabase, apiKey);

      expect(result.valid).toBe(true);
      expect(result.userId).toBe('user-123');
      expect(result.rateLimit).toBe(100);
    });

    it('should reject invalid API key', async () => {
      const mockSupabase = { from: mockFrom } as any;

      const selectMock = jest.fn().mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValue({
        data: [],
        error: null,
      });

      mockFrom.mockReturnValue({ select: selectMock });

      const result = await validateAPIKey(mockSupabase, 'dr_live_invalid');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });

    it('should reject expired API key', async () => {
      const apiKey = 'dr_live_test123456789012345678901';
      const hash = await hashAPIKey(apiKey);
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const mockSupabase = { from: mockFrom } as any;

      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValue({
        data: [{
          id: 'key-123',
          user_id: 'user-123',
          key_hash: hash,
          rate_limit: 100,
          expires_at: yesterday.toISOString(),
          is_active: true,
        }],
        error: null,
      });

      const result = await validateAPIKey(mockSupabase, apiKey);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('API key has expired');
    });
  });

  describe('listAPIKeys', () => {
    it('should list all API keys for a user', async () => {
      const mockSupabase = { from: mockFrom } as any;

      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ order: mockOrder });
      mockOrder.mockResolvedValue({
        data: [
          {
            id: 'key-1',
            name: 'Production Key',
            key_prefix: 'dr_live_abc1...',
            last_used_at: '2026-01-15T10:00:00Z',
            created_at: '2026-01-01T00:00:00Z',
            expires_at: null,
            is_active: true,
          },
          {
            id: 'key-2',
            name: 'Development Key',
            key_prefix: 'dr_live_xyz2...',
            last_used_at: null,
            created_at: '2026-01-10T00:00:00Z',
            expires_at: '2026-02-10T00:00:00Z',
            is_active: false,
          },
        ],
        error: null,
      });

      const result = await listAPIKeys(mockSupabase, 'user-123');

      expect(result.success).toBe(true);
      expect(result.keys).toHaveLength(2);
      expect(result.keys![0].name).toBe('Production Key');
      expect(result.keys![1].name).toBe('Development Key');
    });

    it('should handle empty API key list', async () => {
      const mockSupabase = { from: mockFrom } as any;

      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ order: mockOrder });
      mockOrder.mockResolvedValue({ data: [], error: null });

      const result = await listAPIKeys(mockSupabase, 'user-123');

      expect(result.success).toBe(true);
      expect(result.keys).toHaveLength(0);
    });
  });

  describe('revokeAPIKey', () => {
    it('should revoke an API key', async () => {
      const mockSupabase = { from: mockFrom } as any;

      mockFrom.mockReturnValue({ update: mockUpdate });
      mockUpdate.mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: mockEq }) });
      mockEq.mockResolvedValue({ error: null });

      const result = await revokeAPIKey(mockSupabase, 'user-123', 'key-123');

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({ is_active: false });
    });

    it('should handle errors when revoking', async () => {
      const mockSupabase = { from: mockFrom } as any;

      mockFrom.mockReturnValue({ update: mockUpdate });
      mockUpdate.mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: mockEq }) });
      mockEq.mockResolvedValue({ error: { message: 'Database error' } });

      const result = await revokeAPIKey(mockSupabase, 'user-123', 'key-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to revoke API key');
    });
  });

  describe('deleteAPIKey', () => {
    it('should delete an API key permanently', async () => {
      const mockSupabase = { from: mockFrom } as any;

      mockFrom.mockReturnValue({ delete: mockDelete });
      mockDelete.mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: mockEq }) });
      mockEq.mockResolvedValue({ error: null });

      const result = await deleteAPIKey(mockSupabase, 'user-123', 'key-123');

      expect(result.success).toBe(true);
    });
  });

  describe('checkRateLimit', () => {
    it('should allow request when under rate limit', async () => {
      const mockSupabase = { from: mockFrom } as any;

      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ gte: mockGte });
      mockGte.mockResolvedValue({ count: 50, error: null });

      const result = await checkRateLimit(mockSupabase, 'key-123', 100);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(50);
      expect(result.resetAt).toBeInstanceOf(Date);
    });

    it('should block request when rate limit exceeded', async () => {
      const mockSupabase = { from: mockFrom } as any;

      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ gte: mockGte });
      mockGte.mockResolvedValue({ count: 100, error: null });

      const result = await checkRateLimit(mockSupabase, 'key-123', 100);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should fail open on database error', async () => {
      const mockSupabase = { from: mockFrom } as any;

      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ gte: mockGte });
      mockGte.mockResolvedValue({ count: null, error: { message: 'Database error' } });

      const result = await checkRateLimit(mockSupabase, 'key-123', 100);

      expect(result.allowed).toBe(true);
    });
  });

  describe('logAPIUsage', () => {
    it('should log API usage without throwing', async () => {
      const mockSupabase = { from: mockFrom } as any;

      mockFrom.mockReturnValue({ insert: mockInsert });
      mockInsert.mockResolvedValue({ error: null });

      await expect(
        logAPIUsage(
          mockSupabase,
          'key-123',
          'user-123',
          '/api/v1/runs',
          'POST',
          201,
          150,
          {
            ipAddress: '127.0.0.1',
            userAgent: 'Test Agent',
            requestId: 'req-123',
          }
        )
      ).resolves.not.toThrow();

      expect(mockInsert).toHaveBeenCalledWith({
        api_key_id: 'key-123',
        user_id: 'user-123',
        endpoint: '/api/v1/runs',
        method: 'POST',
        status_code: 201,
        response_time_ms: 150,
        ip_address: '127.0.0.1',
        user_agent: 'Test Agent',
        request_id: 'req-123',
      });
    });

    it('should not throw on logging failure', async () => {
      const mockSupabase = { from: mockFrom } as any;

      mockFrom.mockReturnValue({ insert: mockInsert });
      mockInsert.mockRejectedValue(new Error('Database error'));

      await expect(
        logAPIUsage(
          mockSupabase,
          'key-123',
          'user-123',
          '/api/v1/runs',
          'GET',
          200,
          100
        )
      ).resolves.not.toThrow();
    });
  });
});
