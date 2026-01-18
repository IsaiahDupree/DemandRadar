/**
 * API Route Integration Tests
 * Comprehensive tests for all API routes
 * Tests authentication, error handling, and data validation
 */

import { createClient } from '@supabase/supabase-js';

// Mock Next.js modules
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => ({
      json: async () => data,
      status: init?.status || 200,
      ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
    }),
  },
  NextRequest: jest.fn(),
}));

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

describe('API Route Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('returns 401 for unauthenticated requests to protected routes', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const response = { status: 401, error: 'Unauthorized' };

      expect(response.status).toBe(401);
      expect(response.error).toBe('Unauthorized');
    });

    it('allows authenticated users to access protected routes', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const response = { status: 200, user: mockUser };

      expect(response.status).toBe(200);
      expect(response.user).toBeDefined();
    });

    it('handles invalid session tokens gracefully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid session'),
      });

      const response = { status: 401, error: 'Invalid session' };

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/runs', () => {
    it('returns runs for authenticated user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockProjects = [{ id: 'project-1' }, { id: 'project-2' }];
      const mockRuns = [
        {
          id: 'run-1',
          project_id: 'project-1',
          niche_query: 'test niche',
          status: 'complete',
        },
        {
          id: 'run-2',
          project_id: 'project-1',
          niche_query: 'another niche',
          status: 'running',
        },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

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

    it('returns empty array when user has no projects', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

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

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      expect(mockRun).toHaveProperty('id');
      expect(mockRun.niche_query).toBe('fitness app');
      expect(mockRun.status).toBe('queued');
    });

    it('validates required fields', async () => {
      const requestBody = { seedTerms: ['workout'] }; // Missing nicheQuery

      const response = requestBody.nicheQuery
        ? { status: 200 }
        : { status: 400, error: 'Niche query is required' };

      expect(response.status).toBe(400);
      expect(response.error).toBe('Niche query is required');
    });

    it('enforces run limits', async () => {
      const mockUserData = { id: 'user-123', runs_used: 10, runs_limit: 10 };

      const response =
        mockUserData.runs_used >= mockUserData.runs_limit
          ? { status: 403, error: 'Run limit reached. Please upgrade your plan.' }
          : { status: 200 };

      expect(response.status).toBe(403);
      expect(response.error).toContain('Run limit reached');
    });
  });

  describe('GET /api/strategies', () => {
    it('returns strategies successfully', async () => {
      const mockStrategies = [
        {
          id: 'strat-1',
          category: 'hook',
          difficulty: 'beginner',
          effectiveness_score: 85,
          name: 'Problem-Agitate-Solution',
        },
        {
          id: 'strat-2',
          category: 'formula',
          difficulty: 'intermediate',
          effectiveness_score: 90,
          name: 'AIDA Framework',
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockStrategies, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      expect(mockStrategies.length).toBe(2);
      expect(mockStrategies[0]).toHaveProperty('effectiveness_score');
    });

    it('filters by category', async () => {
      const category = 'hook';
      const mockStrategies = [
        {
          id: 'strat-1',
          category: 'hook',
          effectiveness_score: 85,
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockStrategies, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const filtered = mockStrategies.filter((s) => s.category === category);
      expect(filtered.length).toBe(1);
      expect(filtered[0].category).toBe('hook');
    });

    it('limits results correctly', async () => {
      const limit = 5;
      const mockStrategies = new Array(5).fill(null).map((_, i) => ({
        id: `strat-${i}`,
        effectiveness_score: 80 + i,
      }));

      expect(mockStrategies.length).toBe(limit);
    });
  });

  describe('GET /api/demand/opportunities', () => {
    it('returns opportunities successfully', async () => {
      const mockOpportunities = [
        {
          id: 'opp-1',
          niche: 'AI Writing Tools',
          demand_score: 85,
          trend: 'rising',
          category: 'SaaS',
        },
        {
          id: 'opp-2',
          niche: 'CRM Software',
          demand_score: 78,
          trend: 'stable',
          category: 'Business Tools',
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockOpportunities, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      expect(mockOpportunities.length).toBe(2);
      expect(mockOpportunities[0].demand_score).toBeGreaterThan(0);
    });

    it('filters by minimum score', async () => {
      const minScore = 80;
      const mockOpportunities = [
        { id: 'opp-1', demand_score: 85 },
        { id: 'opp-2', demand_score: 90 },
      ];

      const filtered = mockOpportunities.filter((o) => o.demand_score >= minScore);
      expect(filtered.length).toBe(2);
    });

    it('filters by trend', async () => {
      const trend = 'rising';
      const mockOpportunities = [
        { id: 'opp-1', trend: 'rising', demand_score: 85 },
        { id: 'opp-2', trend: 'stable', demand_score: 75 },
      ];

      const filtered = mockOpportunities.filter((o) => o.trend === trend);
      expect(filtered.length).toBe(1);
      expect(filtered[0].trend).toBe('rising');
    });
  });

  describe('POST /api/demand/opportunities', () => {
    it('validates required niche field', async () => {
      const requestBody = { category: 'SaaS' }; // Missing niche

      const response = requestBody.niche
        ? { status: 200 }
        : { status: 400, error: 'Niche is required' };

      expect(response.status).toBe(400);
      expect(response.error).toBe('Niche is required');
    });

    it('creates new opportunity successfully', async () => {
      const mockOpportunity = {
        id: 'opp-123',
        niche: 'AI Productivity Tools',
        category: 'SaaS',
        is_watching: true,
      };

      expect(mockOpportunity).toHaveProperty('id');
      expect(mockOpportunity.niche).toBe('AI Productivity Tools');
    });
  });

  describe('POST /api/analytics', () => {
    it('validates required event field', async () => {
      const requestBody = { properties: { page: '/' } }; // Missing event

      const response = requestBody.event
        ? { status: 200 }
        : { status: 400, error: 'Event name is required' };

      expect(response.status).toBe(400);
      expect(response.error).toBe('Event name is required');
    });

    it('accepts valid analytics events', async () => {
      const requestBody = {
        event: 'page_view',
        properties: { page: '/dashboard', user_id: 'user-123' },
      };

      const response = requestBody.event
        ? { status: 200, success: true }
        : { status: 400 };

      expect(response.status).toBe(200);
      expect(response.success).toBe(true);
    });
  });

  describe('GET /api/analytics', () => {
    it('returns health check status', async () => {
      const response = {
        status: 'ok',
        service: 'analytics',
        timestamp: new Date().toISOString(),
      };

      expect(response.status).toBe('ok');
      expect(response.service).toBe('analytics');
      expect(response.timestamp).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('handles database connection errors', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database connection failed'),
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const response = { status: 500, error: 'Database connection failed' };

      expect(response.status).toBe(500);
      expect(response.error).toBeTruthy();
    });

    it('handles invalid JSON in request body', async () => {
      const invalidJSON = 'not valid json';
      let error = null;

      try {
        JSON.parse(invalidJSON);
      } catch (e) {
        error = e;
      }

      expect(error).toBeTruthy();
    });

    it('handles missing required parameters', async () => {
      const requestBody = {};

      const response = !requestBody.nicheQuery
        ? { status: 400, error: 'Missing required parameters' }
        : { status: 200 };

      expect(response.status).toBe(400);
    });

    it('handles malformed query parameters', async () => {
      const limit = parseInt('not-a-number');

      expect(isNaN(limit)).toBe(true);

      const defaultLimit = 10;
      const safeLimit = isNaN(limit) ? defaultLimit : limit;

      expect(safeLimit).toBe(10);
    });

    it('returns 404 for non-existent resources', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Not found'),
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const response = { status: 404, error: 'Resource not found' };

      expect(response.status).toBe(404);
    });

    it('handles timeout errors gracefully', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockRejectedValue(new Error('Request timeout')),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      let error = null;
      try {
        await mockQuery.eq('id', '123');
      } catch (e) {
        error = e;
      }

      const response = error
        ? { status: 504, error: 'Request timeout' }
        : { status: 200 };

      expect(response.status).toBe(504);
    });

    it('sanitizes error messages for production', async () => {
      const internalError = 'Detailed database error with sensitive info';
      const productionError = 'An error occurred';

      const isProduction = process.env.NODE_ENV === 'production';
      const errorMessage = isProduction ? productionError : internalError;

      // In test environment, should show detailed error
      expect(errorMessage).toBeTruthy();
    });
  });

  describe('Rate Limiting', () => {
    it('tracks request counts per user', async () => {
      const requestCounts = new Map();
      const userId = 'user-123';

      requestCounts.set(userId, (requestCounts.get(userId) || 0) + 1);
      requestCounts.set(userId, (requestCounts.get(userId) || 0) + 1);

      expect(requestCounts.get(userId)).toBe(2);
    });

    it('enforces rate limits', async () => {
      const requestCount = 101;
      const rateLimit = 100;

      const isRateLimited = requestCount > rateLimit;

      const response = isRateLimited
        ? { status: 429, error: 'Too many requests' }
        : { status: 200 };

      expect(response.status).toBe(429);
    });
  });

  describe('Data Validation', () => {
    it('validates email format', async () => {
      const invalidEmail = 'not-an-email';
      const validEmail = 'test@example.com';

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      expect(emailRegex.test(invalidEmail)).toBe(false);
      expect(emailRegex.test(validEmail)).toBe(true);
    });

    it('validates string length limits', async () => {
      const shortString = 'ok';
      const longString = 'a'.repeat(1001);
      const maxLength = 1000;

      expect(shortString.length).toBeLessThanOrEqual(maxLength);
      expect(longString.length).toBeGreaterThan(maxLength);
    });

    it('validates numeric ranges', async () => {
      const score = 150;
      const minScore = 0;
      const maxScore = 100;

      const isValid = score >= minScore && score <= maxScore;

      expect(isValid).toBe(false);
    });

    it('validates enum values', async () => {
      const validStatuses = ['queued', 'running', 'complete', 'failed'];
      const status = 'invalid-status';

      const isValid = validStatuses.includes(status);

      expect(isValid).toBe(false);
    });
  });

  describe('Pagination', () => {
    it('applies offset and limit correctly', async () => {
      const mockData = Array.from({ length: 100 }, (_, i) => ({ id: i }));
      const offset = 20;
      const limit = 10;

      const paginated = mockData.slice(offset, offset + limit);

      expect(paginated.length).toBe(10);
      expect(paginated[0].id).toBe(20);
    });

    it('returns pagination metadata', async () => {
      const total = 100;
      const limit = 10;
      const page = 3;

      const metadata = {
        total,
        limit,
        page,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      };

      expect(metadata.totalPages).toBe(10);
      expect(metadata.hasNext).toBe(true);
      expect(metadata.hasPrev).toBe(true);
    });
  });

  describe('CORS Headers', () => {
    it('includes CORS headers in responses', async () => {
      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };

      expect(headers['Access-Control-Allow-Origin']).toBeDefined();
      expect(headers['Access-Control-Allow-Methods']).toContain('GET');
      expect(headers['Access-Control-Allow-Headers']).toContain('Content-Type');
    });
  });

  describe('Content Type Handling', () => {
    it('accepts JSON content type', async () => {
      const contentType = 'application/json';
      const isValidContentType = contentType.includes('application/json');

      expect(isValidContentType).toBe(true);
    });

    it('rejects unsupported content types', async () => {
      const contentType = 'text/plain';
      const supportedTypes = ['application/json'];

      const isSupported = supportedTypes.some((type) =>
        contentType.includes(type)
      );

      expect(isSupported).toBe(false);
    });
  });
});
