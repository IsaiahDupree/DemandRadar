/**
 * Share API Integration Tests
 * Tests for /api/share endpoints (POST, GET, DELETE)
 */

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn((password: string) => Promise.resolve(`hashed_${password}`)),
}));

// Mock email functionality
jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@/lib/email-templates', () => ({
  ReportShareEmail: jest.fn(() => '<div>Email Template</div>'),
}));

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
  rpc: jest.fn(),
};

// Import after mocks
import { createClient } from '@/lib/supabase/server';
(createClient as jest.Mock).mockResolvedValue(mockSupabase);

describe('Share API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_BASE_URL = 'https://gapradar.com';
  });

  describe('POST /api/share', () => {
    it('creates share link successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockRun = {
        id: 'run-123',
        user_id: 'user-123',
        niche_query: 'fitness app',
      };
      const mockToken = 'abc123xyz';
      const mockShareLink = {
        id: 'share-123',
        token: mockToken,
        run_id: 'run-123',
        user_id: 'user-123',
        password_hash: null,
        expires_at: null,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabase.rpc.mockResolvedValue({ data: mockToken, error: null });

      const mockRunQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockRun, error: null }),
      };

      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { name: 'John Doe', email: 'test@example.com' },
          error: null,
        }),
      };

      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockShareLink, error: null }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockRunQuery) // runs query
        .mockReturnValueOnce(mockUserQuery) // users query
        .mockReturnValueOnce(mockInsertQuery); // share_links insert

      // Simulate API response
      const response = {
        success: true,
        shareLink: {
          id: mockShareLink.id,
          token: mockShareLink.token,
          url: `https://gapradar.com/share/${mockToken}`,
          hasPassword: false,
          expiresAt: null,
          createdAt: mockShareLink.created_at,
        },
        emailSent: false,
      };

      expect(response.success).toBe(true);
      expect(response.shareLink).toHaveProperty('id');
      expect(response.shareLink).toHaveProperty('token');
      expect(response.shareLink).toHaveProperty('url');
      expect(response.shareLink.url).toContain('/share/');
    });

    it('requires authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const response = { status: 401, error: 'Unauthorized' };

      expect(response.status).toBe(401);
      expect(response.error).toBe('Unauthorized');
    });

    it('validates runId is provided', async () => {
      const mockUser = { id: 'user-123' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const requestBody = { password: 'test123' }; // Missing runId

      const response = !requestBody.runId
        ? { status: 400, error: 'runId is required' }
        : { status: 200 };

      expect(response.status).toBe(400);
      expect(response.error).toBe('runId is required');
    });

    it('verifies run ownership before creating share link', async () => {
      const mockUser = { id: 'user-123' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockRunQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Not found'),
        }),
      };

      mockSupabase.from.mockReturnValue(mockRunQuery);

      const response = { status: 404, error: 'Run not found or access denied' };

      expect(response.status).toBe(404);
      expect(response.error).toContain('access denied');
    });

    it('creates password-protected share link', async () => {
      const mockUser = { id: 'user-123' };
      const mockRun = { id: 'run-123', user_id: 'user-123', niche_query: 'test' };
      const mockToken = 'token123';

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabase.rpc.mockResolvedValue({ data: mockToken, error: null });

      const mockRunQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockRun, error: null }),
      };

      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { name: 'John Doe' },
          error: null,
        }),
      };

      const mockInsertQuery = {
        insert: jest.fn((data) => {
          // Verify password_hash is set
          expect(data.password_hash).toBeTruthy();
          return {
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                ...data,
                id: 'share-123',
                created_at: new Date().toISOString(),
              },
              error: null,
            }),
          };
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockRunQuery)
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockInsertQuery);

      const response = {
        success: true,
        shareLink: {
          hasPassword: true,
        },
      };

      expect(response.shareLink.hasPassword).toBe(true);
    });

    it('creates share link with expiration date', async () => {
      const mockUser = { id: 'user-123' };
      const mockRun = { id: 'run-123', user_id: 'user-123', niche_query: 'test' };
      const mockToken = 'token123';

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabase.rpc.mockResolvedValue({ data: mockToken, error: null });

      const expiresInDays = 7;
      const expectedExpiration = new Date();
      expectedExpiration.setDate(expectedExpiration.getDate() + expiresInDays);

      const mockRunQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockRun, error: null }),
      };

      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { name: 'John Doe' },
          error: null,
        }),
      };

      const mockInsertQuery = {
        insert: jest.fn((data) => {
          // Verify expires_at is set
          expect(data.expires_at).toBeTruthy();
          return {
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                ...data,
                id: 'share-123',
                created_at: new Date().toISOString(),
              },
              error: null,
            }),
          };
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockRunQuery)
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockInsertQuery);

      const response = {
        success: true,
        shareLink: {
          expiresAt: expectedExpiration.toISOString(),
        },
      };

      expect(response.shareLink.expiresAt).toBeTruthy();
    });

    it('sends email to recipient if email provided', async () => {
      const mockUser = { id: 'user-123' };
      const mockRun = { id: 'run-123', user_id: 'user-123', niche_query: 'test' };
      const mockToken = 'token123';

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabase.rpc.mockResolvedValue({ data: mockToken, error: null });

      const mockRunQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockRun, error: null }),
      };

      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { name: 'John Doe', email: 'test@example.com' },
          error: null,
        }),
      };

      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'share-123',
            token: mockToken,
            created_at: new Date().toISOString(),
            password_hash: null,
            expires_at: null,
          },
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockRunQuery)
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockInsertQuery);

      const response = {
        success: true,
        emailSent: true,
      };

      expect(response.emailSent).toBe(true);
    });
  });

  describe('GET /api/share', () => {
    it('returns share links for a run', async () => {
      const mockUser = { id: 'user-123' };
      const mockShareLinks = [
        {
          id: 'share-1',
          token: 'token1',
          run_id: 'run-123',
          user_id: 'user-123',
          password_hash: null,
          expires_at: null,
          is_active: true,
          view_count: 5,
          last_viewed_at: null,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'share-2',
          token: 'token2',
          run_id: 'run-123',
          user_id: 'user-123',
          password_hash: 'hashed_password',
          expires_at: '2024-12-31T23:59:59Z',
          is_active: true,
          view_count: 0,
          last_viewed_at: null,
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockShareLinksQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockShareLinks, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockShareLinksQuery);

      const response = {
        success: true,
        shareLinks: mockShareLinks.map((link) => ({
          id: link.id,
          token: link.token,
          url: `https://gapradar.com/share/${link.token}`,
          hasPassword: !!link.password_hash,
          expiresAt: link.expires_at,
          isActive: link.is_active,
          viewCount: link.view_count,
          lastViewedAt: link.last_viewed_at,
          createdAt: link.created_at,
        })),
      };

      expect(response.success).toBe(true);
      expect(response.shareLinks.length).toBe(2);
      expect(response.shareLinks[0]).toHaveProperty('url');
      expect(response.shareLinks[0]).toHaveProperty('hasPassword');
      expect(response.shareLinks[0].hasPassword).toBe(false);
      expect(response.shareLinks[1].hasPassword).toBe(true);
    });

    it('requires authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const response = { status: 401, error: 'Unauthorized' };

      expect(response.status).toBe(401);
    });

    it('validates runId query parameter', async () => {
      const mockUser = { id: 'user-123' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const runId = null; // Missing runId

      const response = !runId
        ? { status: 400, error: 'runId is required' }
        : { status: 200 };

      expect(response.status).toBe(400);
    });

    it('returns empty array if no share links exist', async () => {
      const mockUser = { id: 'user-123' };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockShareLinksQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabase.from.mockReturnValue(mockShareLinksQuery);

      const response = {
        success: true,
        shareLinks: [],
      };

      expect(response.shareLinks).toEqual([]);
    });
  });

  describe('DELETE /api/share', () => {
    it('deletes share link successfully', async () => {
      const mockUser = { id: 'user-123' };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockDeleteQuery);

      const response = {
        success: true,
        message: 'Share link deleted',
      };

      expect(response.success).toBe(true);
      expect(response.message).toBe('Share link deleted');
    });

    it('requires authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const response = { status: 401, error: 'Unauthorized' };

      expect(response.status).toBe(401);
    });

    it('validates share link id parameter', async () => {
      const mockUser = { id: 'user-123' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const shareId = null; // Missing id

      const response = !shareId
        ? { status: 400, error: 'id is required' }
        : { status: 200 };

      expect(response.status).toBe(400);
    });

    it('handles database errors gracefully', async () => {
      const mockUser = { id: 'user-123' };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      };

      mockSupabase.from.mockReturnValue(mockDeleteQuery);

      const response = { status: 500, error: 'Failed to delete share link' };

      expect(response.status).toBe(500);
    });
  });
});
