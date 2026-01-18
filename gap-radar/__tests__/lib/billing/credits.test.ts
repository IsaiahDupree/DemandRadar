/**
 * @jest-environment node
 */
import {
  getCredits,
  deductCredits,
  addCredits,
  hasCredits,
  getCreditLimitForPlan,
  resetMonthlyCredits,
} from '@/lib/billing/credits';

// Mock Supabase
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

describe('Credits System', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock chain
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
    mockSingle.mockResolvedValue({ data: null, error: null });
  });

  describe('getCreditLimitForPlan', () => {
    it('should return correct credit limit for free plan', () => {
      expect(getCreditLimitForPlan('free')).toBe(2);
    });

    it('should return correct credit limit for starter plan', () => {
      expect(getCreditLimitForPlan('starter')).toBe(2);
    });

    it('should return correct credit limit for builder plan', () => {
      expect(getCreditLimitForPlan('builder')).toBe(10);
    });

    it('should return correct credit limit for agency plan', () => {
      expect(getCreditLimitForPlan('agency')).toBe(35);
    });

    it('should return correct credit limit for studio plan', () => {
      expect(getCreditLimitForPlan('studio')).toBe(90);
    });

    it('should return default limit for unknown plan', () => {
      expect(getCreditLimitForPlan('unknown' as any)).toBe(2);
    });
  });

  describe('getCredits', () => {
    it('should retrieve user credits from database', async () => {
      const mockUser = {
        id: 'user-123',
        runs_used: 5,
        runs_limit: 10,
        plan: 'builder',
      };

      mockSingle.mockResolvedValue({ data: mockUser, error: null });

      const result = await getCredits('user-123');

      expect(mockFrom).toHaveBeenCalledWith('users');
      expect(mockSelect).toHaveBeenCalledWith('id, runs_used, runs_limit, plan');
      expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
      expect(result).toEqual({
        used: 5,
        limit: 10,
        remaining: 5,
        plan: 'builder',
      });
    });

    it('should throw error if user not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'User not found' }
      });

      await expect(getCredits('user-invalid')).rejects.toThrow('User not found');
    });

    it('should handle zero used credits', async () => {
      const mockUser = {
        id: 'user-123',
        runs_used: 0,
        runs_limit: 2,
        plan: 'free',
      };

      mockSingle.mockResolvedValue({ data: mockUser, error: null });

      const result = await getCredits('user-123');

      expect(result).toEqual({
        used: 0,
        limit: 2,
        remaining: 2,
        plan: 'free',
      });
    });
  });

  describe('hasCredits', () => {
    it('should return true when user has credits remaining', async () => {
      const mockUser = {
        id: 'user-123',
        runs_used: 5,
        runs_limit: 10,
        plan: 'builder',
      };

      mockSingle.mockResolvedValue({ data: mockUser, error: null });

      const result = await hasCredits('user-123');

      expect(result).toBe(true);
    });

    it('should return false when user has no credits remaining', async () => {
      const mockUser = {
        id: 'user-123',
        runs_used: 10,
        runs_limit: 10,
        plan: 'builder',
      };

      mockSingle.mockResolvedValue({ data: mockUser, error: null });

      const result = await hasCredits('user-123');

      expect(result).toBe(false);
    });

    it('should return false when user exceeded credits', async () => {
      const mockUser = {
        id: 'user-123',
        runs_used: 12,
        runs_limit: 10,
        plan: 'builder',
      };

      mockSingle.mockResolvedValue({ data: mockUser, error: null });

      const result = await hasCredits('user-123');

      expect(result).toBe(false);
    });
  });

  describe('deductCredits', () => {
    it('should deduct 1 credit from user account', async () => {
      const mockUser = {
        id: 'user-123',
        runs_used: 5,
        runs_limit: 10,
        plan: 'builder',
      };

      // First call - getCredits query
      const selectEq = jest.fn().mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: mockUser, error: null });
      const selectMock = jest.fn().mockReturnValue({ eq: selectEq });

      // Second call - update query
      const updateEq = jest.fn().mockResolvedValue({ data: { runs_used: 6 }, error: null });
      const updateMock = jest.fn().mockReturnValue({ eq: updateEq });

      mockFrom
        .mockReturnValueOnce({ select: selectMock })
        .mockReturnValueOnce({ update: updateMock });

      const result = await deductCredits('user-123');

      expect(updateMock).toHaveBeenCalledWith({ runs_used: 6 });
      expect(result).toEqual({
        used: 6,
        remaining: 4,
      });
    });

    it('should throw error if user has no credits', async () => {
      const mockUser = {
        id: 'user-123',
        runs_used: 10,
        runs_limit: 10,
        plan: 'builder',
      };

      const selectEq = jest.fn().mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({ data: mockUser, error: null });
      const selectMock = jest.fn().mockReturnValue({ eq: selectEq });

      mockFrom.mockReturnValue({ select: selectMock });

      await expect(deductCredits('user-123')).rejects.toThrow('Insufficient credits');
    });

    it('should enforce credit limit', async () => {
      const mockUser = {
        id: 'user-123',
        runs_used: 35,
        runs_limit: 35,
        plan: 'agency',
      };

      mockSingle.mockResolvedValue({ data: mockUser, error: null });

      await expect(deductCredits('user-123')).rejects.toThrow('Insufficient credits');
    });
  });

  describe('addCredits', () => {
    it('should add credits to user account', async () => {
      const mockUser = {
        id: 'user-123',
        runs_used: 5,
        runs_limit: 10,
        plan: 'builder',
      };

      // First call - getCredits query
      const selectEq = jest.fn().mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: mockUser, error: null });
      const selectMock = jest.fn().mockReturnValue({ eq: selectEq });

      // Second call - update query
      const updateEq = jest.fn().mockResolvedValue({ data: { runs_limit: 15 }, error: null });
      const updateMock = jest.fn().mockReturnValue({ eq: updateEq });

      mockFrom
        .mockReturnValueOnce({ select: selectMock })
        .mockReturnValueOnce({ update: updateMock });

      const result = await addCredits('user-123', 5);

      expect(updateMock).toHaveBeenCalledWith({ runs_limit: 15 });
      expect(result).toEqual({
        limit: 15,
        remaining: 10,
      });
    });

    it('should handle adding zero credits', async () => {
      const mockUser = {
        id: 'user-123',
        runs_used: 5,
        runs_limit: 10,
        plan: 'builder',
      };

      mockSingle.mockResolvedValue({ data: mockUser, error: null });

      const result = await addCredits('user-123', 0);

      expect(result).toEqual({
        limit: 10,
        remaining: 5,
      });
    });

    it('should throw error for negative credits', async () => {
      await expect(addCredits('user-123', -5)).rejects.toThrow('Credits must be non-negative');
    });
  });

  describe('resetMonthlyCredits', () => {
    it('should reset runs_used to 0 and update runs_limit based on plan', async () => {
      const mockUser = {
        id: 'user-123',
        runs_used: 10,
        runs_limit: 10,
        plan: 'builder',
      };

      // First call - getCredits query
      const selectEq = jest.fn().mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: mockUser, error: null });
      const selectMock = jest.fn().mockReturnValue({ eq: selectEq });

      // Second call - update query
      const updateEq = jest.fn().mockResolvedValue({
        data: { runs_used: 0, runs_limit: 10 },
        error: null
      });
      const updateMock = jest.fn().mockReturnValue({ eq: updateEq });

      mockFrom
        .mockReturnValueOnce({ select: selectMock })
        .mockReturnValueOnce({ update: updateMock });

      const result = await resetMonthlyCredits('user-123');

      expect(updateMock).toHaveBeenCalledWith({
        runs_used: 0,
        runs_limit: 10,
      });
      expect(result).toEqual({
        used: 0,
        limit: 10,
        remaining: 10,
      });
    });

    it('should update limit when user upgraded plans', async () => {
      const mockUser = {
        id: 'user-123',
        runs_used: 8,
        runs_limit: 10,
        plan: 'agency', // User upgraded to agency (35 runs)
      };

      // First call - getCredits query
      const selectEq = jest.fn().mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValueOnce({ data: mockUser, error: null });
      const selectMock = jest.fn().mockReturnValue({ eq: selectEq });

      // Second call - update query
      const updateEq = jest.fn().mockResolvedValue({
        data: { runs_used: 0, runs_limit: 35 },
        error: null
      });
      const updateMock = jest.fn().mockReturnValue({ eq: updateEq });

      mockFrom
        .mockReturnValueOnce({ select: selectMock })
        .mockReturnValueOnce({ update: updateMock });

      const result = await resetMonthlyCredits('user-123');

      expect(updateMock).toHaveBeenCalledWith({
        runs_used: 0,
        runs_limit: 35,
      });
      expect(result).toEqual({
        used: 0,
        limit: 35,
        remaining: 35,
      });
    });
  });
});
