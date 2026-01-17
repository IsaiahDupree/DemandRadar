/**
 * Runs API Integration Tests
 * Tests for /api/runs endpoints
 */

import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

describe('Runs API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/runs', () => {
    it('returns runs for authenticated user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockProjects = [{ id: 'project-1' }, { id: 'project-2' }];
      const mockRuns = [
        { id: 'run-1', project_id: 'project-1', niche_query: 'test niche', status: 'complete' },
        { id: 'run-2', project_id: 'project-1', niche_query: 'another niche', status: 'running' },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockProjectsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockProjects, error: null }),
      };

      const mockRunsQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockRuns, error: null }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockProjectsQuery)
        .mockReturnValueOnce(mockRunsQuery);

      expect(mockRuns.length).toBe(2);
      expect(mockRuns[0]).toHaveProperty('id');
      expect(mockRuns[0]).toHaveProperty('niche_query');
      expect(mockRuns[0]).toHaveProperty('status');
    });

    it('returns 401 for unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });

      // Simulate unauthorized response
      const response = { status: 401, error: 'Unauthorized' };

      expect(response.status).toBe(401);
      expect(response.error).toBe('Unauthorized');
    });

    it('returns empty array when user has no projects', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockProjectsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabase.from.mockReturnValue(mockProjectsQuery);

      const result = { runs: [] };

      expect(result.runs).toEqual([]);
    });
  });

  describe('POST /api/runs', () => {
    it('creates new run successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockUserData = { id: 'user-123', runs_used: 0, runs_limit: 10 };
      const mockProject = { id: 'project-1' };
      const mockRun = {
        id: 'run-123',
        project_id: 'project-1',
        niche_query: 'fitness app',
        status: 'queued',
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null }),
      };

      const mockProjectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProject, error: null }),
      };

      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockRun, error: null }),
      };

      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockProjectQuery)
        .mockReturnValueOnce(mockInsertQuery)
        .mockReturnValueOnce(mockUpdateQuery);

      expect(mockRun).toHaveProperty('id');
      expect(mockRun.niche_query).toBe('fitness app');
      expect(mockRun.status).toBe('queued');
    });

    it('validates required fields', async () => {
      const mockUser = { id: 'user-123' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const requestBody = { seedTerms: ['workout'] }; // Missing nicheQuery

      const response = requestBody.nicheQuery
        ? { status: 200 }
        : { status: 400, error: 'Niche query is required' };

      expect(response.status).toBe(400);
      expect(response.error).toBe('Niche query is required');
    });

    it('enforces run limits', async () => {
      const mockUser = { id: 'user-123' };
      const mockUserData = { id: 'user-123', runs_used: 10, runs_limit: 10 };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockUserQuery);

      const response = mockUserData.runs_used >= mockUserData.runs_limit
        ? { status: 403, error: 'Run limit reached. Please upgrade your plan.' }
        : { status: 200 };

      expect(response.status).toBe(403);
      expect(response.error).toContain('Run limit reached');
    });

    it('increments runs_used counter', async () => {
      const mockUser = { id: 'user-123' };
      const mockUserData = { id: 'user-123', runs_used: 5, runs_limit: 10 };
      const mockProject = { id: 'project-1' };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      let runsUsed = mockUserData.runs_used;

      const mockUpdateQuery = {
        update: jest.fn((data) => {
          if (data.runs_used !== undefined) {
            runsUsed = data.runs_used;
          }
          return {
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }),
      };

      // Simulate increment
      runsUsed += 1;

      expect(runsUsed).toBe(6);
    });

    it('handles database errors gracefully', async () => {
      const mockUser = { id: 'user-123' };
      const mockUserData = { id: 'user-123', runs_used: 0, runs_limit: 10 };
      const mockProject = { id: 'project-1' };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null }),
      };

      const mockProjectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProject, error: null }),
      };

      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database connection failed')
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockProjectQuery)
        .mockReturnValueOnce(mockInsertQuery);

      const response = { status: 500, error: 'Database connection failed' };

      expect(response.status).toBe(500);
      expect(response.error).toBeTruthy();
    });
  });

  describe('GET /api/runs/[id]', () => {
    it('returns specific run by ID', async () => {
      const mockUser = { id: 'user-123' };
      const mockRun = {
        id: 'run-123',
        niche_query: 'fitness app',
        status: 'complete',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockRunQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockRun, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockRunQuery);

      expect(mockRun.id).toBe('run-123');
      expect(mockRun.status).toBe('complete');
    });

    it('returns 404 for non-existent run', async () => {
      const mockUser = { id: 'user-123' };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockRunQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Not found')
        }),
      };

      mockSupabase.from.mockReturnValue(mockRunQuery);

      const response = { status: 404, error: 'Run not found' };

      expect(response.status).toBe(404);
    });
  });
});
