/**
 * Tests for Credits Balance API
 * Feature: CREDIT-001 - Credits System Backend
 *
 * Acceptance Criteria:
 * 1. Balance API returns current balance
 * 2. Authentication required
 * 3. Optional transaction history
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/credits/route';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock credits functions
jest.mock('@/lib/credits', () => ({
  getCreditBalance: jest.fn(),
  getCreditSummary: jest.fn(),
  getCreditTransactions: jest.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { getCreditBalance, getCreditSummary, getCreditTransactions } from '@/lib/credits';

describe('GET /api/credits', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should return 401 if user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const request = new NextRequest(
      new URL('http://localhost:3000/api/credits')
    );

    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return credit balance for authenticated user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    (getCreditBalance as jest.Mock).mockResolvedValue(50);

    const request = new NextRequest(
      new URL('http://localhost:3000/api/credits')
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.balance).toBe(50);
    expect(getCreditBalance).toHaveBeenCalledWith('user-123');
  });

  it('should include summary when requested', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    (getCreditBalance as jest.Mock).mockResolvedValue(50);
    (getCreditSummary as jest.Mock).mockResolvedValue({
      user_id: 'user-123',
      current_balance: 50,
      total_purchased: 100,
      total_spent: 50,
      total_runs: 15,
    });

    const request = new NextRequest(
      new URL('http://localhost:3000/api/credits?includeSummary=true')
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.balance).toBe(50);
    expect(data.summary).toBeDefined();
    expect(data.summary.total_purchased).toBe(100);
    expect(getCreditSummary).toHaveBeenCalledWith('user-123');
  });

  it('should include transactions when requested', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const mockTransactions = [
      {
        id: 'tx-1',
        user_id: 'user-123',
        amount: -3,
        balance_after: 47,
        transaction_type: 'deduction',
        reference_id: 'run-456',
        reference_type: 'run',
        description: 'Deep run',
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    (getCreditBalance as jest.Mock).mockResolvedValue(47);
    (getCreditTransactions as jest.Mock).mockResolvedValue(mockTransactions);

    const request = new NextRequest(
      new URL('http://localhost:3000/api/credits?includeTransactions=true')
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.balance).toBe(47);
    expect(data.transactions).toBeDefined();
    expect(data.transactions).toHaveLength(1);
    expect(getCreditTransactions).toHaveBeenCalledWith('user-123', 50);
  });

  it('should handle errors gracefully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    (getCreditBalance as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest(
      new URL('http://localhost:3000/api/credits')
    );

    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to fetch credit balance');
  });

  it('should return balance without optional data by default', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    (getCreditBalance as jest.Mock).mockResolvedValue(25);

    const request = new NextRequest(
      new URL('http://localhost:3000/api/credits')
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.balance).toBe(25);
    expect(data.summary).toBeUndefined();
    expect(data.transactions).toBeUndefined();
    expect(getCreditSummary).not.toHaveBeenCalled();
    expect(getCreditTransactions).not.toHaveBeenCalled();
  });
});
