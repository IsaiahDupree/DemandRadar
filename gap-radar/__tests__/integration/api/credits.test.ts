/**
 * Credits API Integration Tests
 * Tests for /api/credits endpoint
 */

// Mock Supabase and credits lib
const mockSupabaseAuth = jest.fn();
const mockGetCreditBalance = jest.fn();
const mockGetCreditSummary = jest.fn();
const mockGetCreditTransactions = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: mockSupabaseAuth,
    },
  })),
}));

jest.mock('@/lib/credits', () => ({
  getCreditBalance: mockGetCreditBalance,
  getCreditSummary: mockGetCreditSummary,
  getCreditTransactions: mockGetCreditTransactions,
}));

// Mock Next.js modules
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    url: string;
    nextUrl: URL;

    constructor(url: string) {
      this.url = url;
      this.nextUrl = new URL(url);
    }
  },
  NextResponse: {
    json: (data: any, init?: ResponseInit) => ({
      json: async () => data,
      status: init?.status || 200,
      ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
    }),
  },
}));

import { GET } from '@/app/api/credits/route';
import { NextRequest } from 'next/server';

describe('Credits API Integration Tests', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/credits', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabaseAuth.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = new NextRequest('http://localhost:3000/api/credits');
      const response = await GET(request);

      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body).toEqual({ error: 'Unauthorized' });
    });

    it('should return credit balance for authenticated user', async () => {
      mockSupabaseAuth.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockGetCreditBalance.mockResolvedValue(50);

      const request = new NextRequest('http://localhost:3000/api/credits');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toEqual({
        balance: 50,
      });

      expect(mockGetCreditBalance).toHaveBeenCalledWith('user-123');
    });

    it('should include summary when includeSummary=true', async () => {
      mockSupabaseAuth.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockGetCreditBalance.mockResolvedValue(50);
      mockGetCreditSummary.mockResolvedValue({
        balance: 50,
        totalEarned: 100,
        totalSpent: 50,
        thisMonth: {
          earned: 20,
          spent: 15,
        },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/credits?includeSummary=true'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toMatchObject({
        balance: 50,
        summary: {
          balance: 50,
          totalEarned: 100,
          totalSpent: 50,
          thisMonth: {
            earned: 20,
            spent: 15,
          },
        },
      });

      expect(mockGetCreditSummary).toHaveBeenCalledWith('user-123');
    });

    it('should include transactions when includeTransactions=true', async () => {
      mockSupabaseAuth.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockGetCreditBalance.mockResolvedValue(50);

      const mockTransactions = [
        {
          id: 'txn-1',
          type: 'purchase',
          amount: 100,
          balance_after: 100,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'txn-2',
          type: 'usage',
          amount: -50,
          balance_after: 50,
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockGetCreditTransactions.mockResolvedValue(mockTransactions);

      const request = new NextRequest(
        'http://localhost:3000/api/credits?includeTransactions=true'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toMatchObject({
        balance: 50,
        transactions: mockTransactions,
      });

      expect(mockGetCreditTransactions).toHaveBeenCalledWith('user-123', 50);
    });

    it('should include both summary and transactions when both flags are true', async () => {
      mockSupabaseAuth.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockGetCreditBalance.mockResolvedValue(75);
      mockGetCreditSummary.mockResolvedValue({
        balance: 75,
        totalEarned: 200,
        totalSpent: 125,
      });
      mockGetCreditTransactions.mockResolvedValue([
        { id: 'txn-1', amount: 100 },
      ]);

      const request = new NextRequest(
        'http://localhost:3000/api/credits?includeSummary=true&includeTransactions=true'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('balance');
      expect(body).toHaveProperty('summary');
      expect(body).toHaveProperty('transactions');
    });

    it('should return 500 when credit balance fetch fails', async () => {
      mockSupabaseAuth.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockGetCreditBalance.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost:3000/api/credits');
      const response = await GET(request);

      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body).toMatchObject({
        error: 'Failed to fetch credit balance',
        details: 'Database connection failed',
      });
    });

    it('should handle auth error gracefully', async () => {
      mockSupabaseAuth.mockResolvedValue({
        data: { user: null },
        error: { message: 'Session expired' },
      });

      const request = new NextRequest('http://localhost:3000/api/credits');
      const response = await GET(request);

      expect(response.status).toBe(401);
      expect(mockGetCreditBalance).not.toHaveBeenCalled();
    });

    it('should not include summary by default', async () => {
      mockSupabaseAuth.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockGetCreditBalance.mockResolvedValue(50);

      const request = new NextRequest('http://localhost:3000/api/credits');
      const response = await GET(request);

      const body = await response.json();
      expect(body).not.toHaveProperty('summary');
      expect(mockGetCreditSummary).not.toHaveBeenCalled();
    });

    it('should not include transactions by default', async () => {
      mockSupabaseAuth.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockGetCreditBalance.mockResolvedValue(50);

      const request = new NextRequest('http://localhost:3000/api/credits');
      const response = await GET(request);

      const body = await response.json();
      expect(body).not.toHaveProperty('transactions');
      expect(mockGetCreditTransactions).not.toHaveBeenCalled();
    });

    it('should handle zero credit balance', async () => {
      mockSupabaseAuth.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockGetCreditBalance.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/credits');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toEqual({
        balance: 0,
      });
    });

    it('should handle negative credit balance', async () => {
      mockSupabaseAuth.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockGetCreditBalance.mockResolvedValue(-10);

      const request = new NextRequest('http://localhost:3000/api/credits');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toEqual({
        balance: -10,
      });
    });
  });
});
