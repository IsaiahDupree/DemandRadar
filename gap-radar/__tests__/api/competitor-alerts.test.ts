/**
 * Competitor Alerts API Tests
 *
 * Tests the competitor alerts endpoints:
 * - GET /api/competitors/alerts (list alerts)
 * - PATCH /api/competitors/alerts/[id] (mark read/dismiss)
 *
 * Validates INTEL-011 acceptance criteria:
 * - List alerts
 * - Mark read
 * - Dismiss alert
 *
 * @jest-environment node
 */

import { GET } from '@/app/api/competitors/alerts/route';
import { PATCH } from '@/app/api/competitors/alerts/[id]/route';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('/api/competitors/alerts', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/competitors/alerts - List Alerts', () => {
    it('should list all alerts for authenticated user', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          user_id: mockUserId,
          competitor_id: 'comp-1',
          alert_type: 'new_campaign',
          title: 'Competitor A launched 5 new ads',
          description: 'New campaign detected',
          data: { count: 5 },
          is_read: false,
          is_dismissed: false,
          created_at: new Date().toISOString(),
        },
        {
          id: 'alert-2',
          user_id: mockUserId,
          competitor_id: 'comp-2',
          alert_type: 'ad_spike',
          title: 'Competitor B ad volume up 50%',
          description: 'Significant increase in ad activity',
          data: { percent_change: 50 },
          is_read: true,
          is_dismissed: false,
          created_at: new Date().toISOString(),
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
                data: mockAlerts,
                error: null,
              }),
            }),
          }),
        }),
      };

      const { createClient } = require('@/lib/supabase/server');
      createClient.mockResolvedValue(mockSupabase);

      const request = new Request('http://localhost:3000/api/competitors/alerts') as any;
      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('alerts');
      expect(data.alerts).toHaveLength(2);
      expect(data.alerts[0]).toHaveProperty('alert_type', 'new_campaign');
      expect(data.alerts[0]).toHaveProperty('is_read', false);
    });

    it('should filter unread alerts when unread=true', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          user_id: mockUserId,
          alert_type: 'new_campaign',
          is_read: false,
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
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockAlerts,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      const { createClient } = require('@/lib/supabase/server');
      createClient.mockResolvedValue(mockSupabase);

      const request = new Request('http://localhost:3000/api/competitors/alerts?unread=true') as any;
      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.alerts).toHaveLength(1);
      expect(data.alerts[0].is_read).toBe(false);
    });

    it('should filter by competitor_id if provided', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          competitor_id: 'comp-1',
          alert_type: 'new_campaign',
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
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockAlerts,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      const { createClient } = require('@/lib/supabase/server');
      createClient.mockResolvedValue(mockSupabase);

      const request = new Request('http://localhost:3000/api/competitors/alerts?competitor_id=comp-1') as any;
      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.alerts[0].competitor_id).toBe('comp-1');
    });

    it('should return empty array if no alerts', async () => {
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

      const request = new Request('http://localhost:3000/api/competitors/alerts') as any;
      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.alerts).toEqual([]);
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

      const request = new Request('http://localhost:3000/api/competitors/alerts') as any;
      const response = await GET(request);
      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/competitors/alerts/[id] - Update Alert', () => {
    it('should mark alert as read', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: 'alert-1',
                      is_read: true,
                      is_dismissed: false,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      };

      const { createClient } = require('@/lib/supabase/server');
      createClient.mockResolvedValue(mockSupabase);

      const request = new Request('http://localhost:3000/api/competitors/alerts/alert-1', {
        method: 'PATCH',
        body: JSON.stringify({ is_read: true }),
      }) as any;

      const params = { id: 'alert-1' };
      const response = await PATCH(request, { params });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('is_read', true);
      expect(data).toHaveProperty('is_dismissed', false);
    });

    it('should dismiss alert', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: 'alert-1',
                      is_read: true,
                      is_dismissed: true,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      };

      const { createClient } = require('@/lib/supabase/server');
      createClient.mockResolvedValue(mockSupabase);

      const request = new Request('http://localhost:3000/api/competitors/alerts/alert-1', {
        method: 'PATCH',
        body: JSON.stringify({ is_dismissed: true }),
      }) as any;

      const params = { id: 'alert-1' };
      const response = await PATCH(request, { params });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('is_dismissed', true);
    });

    it('should mark read and dismiss in same request', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: 'alert-1',
                      is_read: true,
                      is_dismissed: true,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      };

      const { createClient } = require('@/lib/supabase/server');
      createClient.mockResolvedValue(mockSupabase);

      const request = new Request('http://localhost:3000/api/competitors/alerts/alert-1', {
        method: 'PATCH',
        body: JSON.stringify({ is_read: true, is_dismissed: true }),
      }) as any;

      const params = { id: 'alert-1' };
      const response = await PATCH(request, { params });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('is_read', true);
      expect(data).toHaveProperty('is_dismissed', true);
    });

    it('should return 400 if no fields to update', async () => {
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

      const request = new Request('http://localhost:3000/api/competitors/alerts/alert-1', {
        method: 'PATCH',
        body: JSON.stringify({}),
      }) as any;

      const params = { id: 'alert-1' };
      const response = await PATCH(request, { params });
      expect(response.status).toBe(400);
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

      const request = new Request('http://localhost:3000/api/competitors/alerts/alert-1', {
        method: 'PATCH',
        body: JSON.stringify({ is_read: true }),
      }) as any;

      const params = { id: 'alert-1' };
      const response = await PATCH(request, { params });
      expect(response.status).toBe(401);
    });

    it('should return 404 if alert not found', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null,
          }),
        },
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  }),
                }),
              }),
            }),
          }),
        }),
      };

      const { createClient } = require('@/lib/supabase/server');
      createClient.mockResolvedValue(mockSupabase);

      const request = new Request('http://localhost:3000/api/competitors/alerts/nonexistent', {
        method: 'PATCH',
        body: JSON.stringify({ is_read: true }),
      }) as any;

      const params = { id: 'nonexistent' };
      const response = await PATCH(request, { params });
      expect(response.status).toBe(404);
    });
  });
});
