/**
 * @jest-environment node
 */
import {
  trackRunUsage,
  trackExportUsage,
  trackAlertUsage,
  getUserUsage,
  checkUsageLimit,
  resetUsageForPeriod,
  getUsageStats,
} from '@/lib/billing/usage';

// Mock Supabase
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockGte = jest.fn();
const mockLte = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

describe('Subscription Usage Tracking (BILL-009)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock chain for select queries
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
    });
    mockSelect.mockReturnValue({
      eq: mockEq,
      gte: mockGte,
      lte: mockLte,
      order: mockOrder,
    });
    mockEq.mockReturnValue({
      single: mockSingle,
      gte: mockGte,
      lte: mockLte,
    });
    mockGte.mockReturnValue({
      lte: mockLte,
    });
    mockLte.mockReturnValue({
      order: mockOrder,
    });
    mockOrder.mockResolvedValue({ data: [], error: null });

    // Default resolved values
    mockSingle.mockResolvedValue({ data: null, error: null });
    mockInsert.mockResolvedValue({ data: null, error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });
  });

  describe('trackRunUsage', () => {
    it('should track run usage for a user', async () => {
      const userId = 'user-123';
      const runId = 'run-456';
      const runType = 'light';

      mockInsert.mockResolvedValue({
        data: {
          id: 'usage-1',
          user_id: userId,
          run_id: runId,
          usage_type: 'run',
          metadata: { run_type: runType },
        },
        error: null,
      });

      await trackRunUsage(userId, runId, runType);

      expect(mockFrom).toHaveBeenCalledWith('subscription_usage');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: userId,
        run_id: runId,
        usage_type: 'run',
        metadata: { run_type: runType },
        created_at: expect.any(String),
      });
    });

    it('should throw error if tracking fails', async () => {
      mockInsert.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(trackRunUsage('user-123', 'run-456', 'full'))
        .rejects.toThrow('Database error');
    });
  });

  describe('trackExportUsage', () => {
    it('should track export usage for a user', async () => {
      const userId = 'user-123';
      const runId = 'run-456';
      const exportType = 'pdf';

      mockInsert.mockResolvedValue({
        data: {
          id: 'usage-2',
          user_id: userId,
          run_id: runId,
          usage_type: 'export',
          metadata: { export_type: exportType },
        },
        error: null,
      });

      await trackExportUsage(userId, runId, exportType);

      expect(mockFrom).toHaveBeenCalledWith('subscription_usage');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: userId,
        run_id: runId,
        usage_type: 'export',
        metadata: { export_type: exportType },
        created_at: expect.any(String),
      });
    });
  });

  describe('trackAlertUsage', () => {
    it('should track alert usage for a user', async () => {
      const userId = 'user-123';
      const alertType = 'competitor_change';

      mockInsert.mockResolvedValue({
        data: {
          id: 'usage-3',
          user_id: userId,
          usage_type: 'alert',
          metadata: { alert_type: alertType },
        },
        error: null,
      });

      await trackAlertUsage(userId, alertType);

      expect(mockFrom).toHaveBeenCalledWith('subscription_usage');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: userId,
        usage_type: 'alert',
        metadata: { alert_type: alertType },
        created_at: expect.any(String),
      });
    });
  });

  describe('getUserUsage', () => {
    it('should retrieve usage for current billing period', async () => {
      const userId = 'user-123';
      const mockUsage = [
        { usage_type: 'run', created_at: new Date().toISOString() },
        { usage_type: 'run', created_at: new Date().toISOString() },
        { usage_type: 'export', created_at: new Date().toISOString() },
      ];

      // Mock the full chain for getUserUsage
      mockOrder.mockResolvedValueOnce({ data: mockUsage, error: null });

      const result = await getUserUsage(userId);

      expect(result).toEqual({
        runs: 2,
        exports: 1,
        alerts: 0,
        periodStart: expect.any(String),
        periodEnd: expect.any(String),
      });
    });

    it('should count different usage types correctly', async () => {
      const userId = 'user-123';
      const mockUsage = [
        { usage_type: 'run', created_at: new Date().toISOString() },
        { usage_type: 'export', created_at: new Date().toISOString() },
        { usage_type: 'alert', created_at: new Date().toISOString() },
        { usage_type: 'alert', created_at: new Date().toISOString() },
      ];

      // Mock the full chain for getUserUsage
      mockOrder.mockResolvedValueOnce({ data: mockUsage, error: null });

      const result = await getUserUsage(userId);

      expect(result.runs).toBe(1);
      expect(result.exports).toBe(1);
      expect(result.alerts).toBe(2);
    });
  });

  describe('checkUsageLimit', () => {
    it('should return true if user has not exceeded limit', async () => {
      const userId = 'user-123';
      const plan = 'builder'; // 10 runs per month

      // Mock user has used 5 runs
      mockOrder.mockResolvedValueOnce({
        data: Array(5).fill({ usage_type: 'run' }),
        error: null,
      });

      const canUse = await checkUsageLimit(userId, 'run', plan);

      expect(canUse).toBe(true);
    });

    it('should return false if user has exceeded limit', async () => {
      const userId = 'user-123';
      const plan = 'starter'; // 2 runs per month

      // Mock user has used 2 runs
      mockOrder.mockResolvedValueOnce({
        data: Array(2).fill({ usage_type: 'run' }),
        error: null,
      });

      const canUse = await checkUsageLimit(userId, 'run', plan);

      expect(canUse).toBe(false);
    });

    it('should check export limits correctly', async () => {
      const userId = 'user-123';
      const plan = 'agency'; // 35 runs, unlimited exports

      mockOrder.mockResolvedValueOnce({
        data: Array(100).fill({ usage_type: 'export' }),
        error: null,
      });

      const canUse = await checkUsageLimit(userId, 'export', plan);

      expect(canUse).toBe(true); // Exports are unlimited
    });
  });

  describe('getUsageStats', () => {
    it('should return usage statistics with percentages', async () => {
      const userId = 'user-123';
      const plan = 'builder'; // 10 runs

      mockOrder.mockResolvedValueOnce({
        data: Array(7).fill({ usage_type: 'run' }),
        error: null,
      });

      const stats = await getUsageStats(userId, plan);

      expect(stats).toEqual({
        runs: {
          used: 7,
          limit: 10,
          remaining: 3,
          percentage: 70,
        },
        exports: {
          used: 0,
          limit: -1, // unlimited
          remaining: -1,
          percentage: 0,
        },
        alerts: {
          used: 0,
          limit: -1, // unlimited
          remaining: -1,
          percentage: 0,
        },
      });
    });

    it('should handle 100% usage correctly', async () => {
      const userId = 'user-123';
      const plan = 'starter'; // 2 runs

      mockOrder.mockResolvedValueOnce({
        data: Array(2).fill({ usage_type: 'run' }),
        error: null,
      });

      const stats = await getUsageStats(userId, plan);

      expect(stats.runs.percentage).toBe(100);
      expect(stats.runs.remaining).toBe(0);
    });
  });

  describe('resetUsageForPeriod', () => {
    it('should reset usage for next billing period', async () => {
      // This function should be called by a cron job
      // It doesn't actually delete records, just marks the period
      const result = await resetUsageForPeriod();

      // For now, this is a no-op since we track by date range
      expect(result).toBe(true);
    });
  });
});
