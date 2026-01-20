/**
 * Competitor Tracking API Tests
 *
 * Tests the competitor tracking CRUD endpoints:
 * - POST /api/competitors (add competitor)
 * - GET /api/competitors (list competitors)
 * - DELETE /api/competitors/[id] (remove competitor)
 *
 * Validates INTEL-003 acceptance criteria:
 * - Add competitor
 * - List competitors
 * - Delete competitor
 *
 * @jest-environment node
 */

import { GET, POST } from '@/app/api/competitors/route';
import { DELETE } from '@/app/api/competitors/[id]/route';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('/api/competitors', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/competitors - Add Competitor', () => {
    it('should add a new competitor successfully', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'comp-123',
                  user_id: mockUserId,
                  competitor_name: 'Competitor A',
                  competitor_domain: 'competitor-a.com',
                  meta_page_id: '12345678',
                  track_ads: true,
                  track_pricing: false,
                  track_features: false,
                  is_active: true,
                  created_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        }),
      };

      const { createClient } = require('@/lib/supabase/server');
      createClient.mockResolvedValue(mockSupabase);

      const request = new Request('http://localhost:3000/api/competitors', {
        method: 'POST',
        body: JSON.stringify({
          competitor_name: 'Competitor A',
          competitor_domain: 'competitor-a.com',
          meta_page_id: '12345678',
          track_ads: true,
        }),
      }) as any;

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('id', 'comp-123');
      expect(data).toHaveProperty('competitor_name', 'Competitor A');
      expect(data).toHaveProperty('track_ads', true);
    });

    it('should add competitor to watchlist if provided', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'comp-123',
                  watchlist_id: 'watchlist-123',
                  competitor_name: 'Competitor B',
                },
                error: null,
              }),
            }),
          }),
        }),
      };

      const { createClient } = require('@/lib/supabase/server');
      createClient.mockResolvedValue(mockSupabase);

      const request = new Request('http://localhost:3000/api/competitors', {
        method: 'POST',
        body: JSON.stringify({
          watchlist_id: 'watchlist-123',
          competitor_name: 'Competitor B',
          competitor_domain: 'competitor-b.com',
        }),
      }) as any;

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('watchlist_id', 'watchlist-123');
    });

    it('should return 401 if user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      };

      const { createClient } = require('@/lib/supabase/server');
      createClient.mockResolvedValue(mockSupabase);

      const request = new Request('http://localhost:3000/api/competitors', {
        method: 'POST',
        body: JSON.stringify({
          competitor_name: 'Test',
        }),
      }) as any;

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should return 400 if competitor_name is missing', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null,
          }),
        },
      };

      const { createClient } = require('@/lib/supabase/server');
      createClient.mockResolvedValue(mockSupabase);

      const request = new Request('http://localhost:3000/api/competitors', {
        method: 'POST',
        body: JSON.stringify({}),
      }) as any;

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/competitors - List Competitors', () => {
    it('should list all competitors for authenticated user', async () => {
      const mockCompetitors = [
        {
          id: 'comp-1',
          user_id: mockUserId,
          competitor_name: 'Competitor A',
          competitor_domain: 'competitor-a.com',
          track_ads: true,
          is_active: true,
        },
        {
          id: 'comp-2',
          user_id: mockUserId,
          competitor_name: 'Competitor B',
          competitor_domain: 'competitor-b.com',
          track_ads: true,
          is_active: true,
        },
      ];

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockCompetitors,
                error: null,
              }),
            }),
          }),
        }),
      };

      const { createClient } = require('@/lib/supabase/server');
      createClient.mockResolvedValue(mockSupabase);

      const request = new Request('http://localhost:3000/api/competitors') as any;
      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('competitors');
      expect(data.competitors).toHaveLength(2);
      expect(data).toHaveProperty('total', 2);
      expect(data.competitors[0]).toHaveProperty('competitor_name', 'Competitor A');
    });

    it('should filter by watchlist_id if provided', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [{ id: 'comp-1', watchlist_id: 'watchlist-123' }],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      const { createClient } = require('@/lib/supabase/server');
      createClient.mockResolvedValue(mockSupabase);

      const request = new Request('http://localhost:3000/api/competitors?watchlist_id=watchlist-123') as any;
      const response = await GET(request);
      expect(response.status).toBe(200);
    });

    it('should return empty array if no competitors', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      };

      const { createClient } = require('@/lib/supabase/server');
      createClient.mockResolvedValue(mockSupabase);

      const request = new Request('http://localhost:3000/api/competitors') as any;
      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.competitors).toEqual([]);
      expect(data.total).toBe(0);
    });

    it('should return 401 if user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      };

      const { createClient } = require('@/lib/supabase/server');
      createClient.mockResolvedValue(mockSupabase);

      const request = new Request('http://localhost:3000/api/competitors') as any;
      const response = await GET(request);
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/competitors/[id] - Delete Competitor', () => {
    it('should delete competitor successfully', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                error: null,
              }),
            }),
          }),
        }),
      };

      const { createClient } = require('@/lib/supabase/server');
      createClient.mockResolvedValue(mockSupabase);

      const request = new Request('http://localhost:3000/api/competitors/comp-123') as any;
      const params = { id: 'comp-123' };
      const response = await DELETE(request, { params });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('success', true);
    });

    it('should return 401 if user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      };

      const { createClient } = require('@/lib/supabase/server');
      createClient.mockResolvedValue(mockSupabase);

      const request = new Request('http://localhost:3000/api/competitors/comp-123') as any;
      const params = { id: 'comp-123' };
      const response = await DELETE(request, { params });
      expect(response.status).toBe(401);
    });
  });
});
