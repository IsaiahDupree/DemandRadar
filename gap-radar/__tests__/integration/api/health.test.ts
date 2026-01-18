/**
 * Health API Integration Tests
 * Tests for /api/health endpoint
 */

// Mock Supabase client before importing the route
const mockSupabaseFrom = jest.fn();
const mockSupabaseSelect = jest.fn();
const mockSupabaseLimit = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: mockSupabaseFrom,
  })),
}));

// Mock Next.js modules
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {},
  NextResponse: {
    json: (data: any, init?: ResponseInit) => ({
      json: async () => data,
      status: init?.status || 200,
      ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
      headers: new Map(Object.entries(init?.headers || {})),
    }),
  },
}));

import { GET } from '@/app/api/health/route';
import { NextRequest } from 'next/server';

describe('Health API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseFrom.mockReturnValue({
      select: mockSupabaseSelect,
    });
    mockSupabaseSelect.mockReturnValue({
      limit: mockSupabaseLimit,
    });
  });

  describe('GET /api/health', () => {
    it('should return 200 and healthy status when database is accessible', async () => {
      // Mock successful database check
      mockSupabaseLimit.mockResolvedValue({
        data: [{ id: 'test-id' }],
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toMatchObject({
        status: 'healthy',
        version: expect.any(String),
        timestamp: expect.any(String),
        checks: {
          database: 'ok',
        },
      });

      // Verify no-cache headers
      expect(response.headers.get('Cache-Control')).toBe(
        'no-cache, no-store, must-revalidate'
      );
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');
    });

    it('should return 503 and unhealthy status when database check fails', async () => {
      // Mock database error
      mockSupabaseLimit.mockResolvedValue({
        data: null,
        error: {
          message: 'Connection refused',
          code: 'ECONNREFUSED',
        },
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      expect(response.status).toBe(503);

      const body = await response.json();
      expect(body).toMatchObject({
        status: 'unhealthy',
        version: expect.any(String),
        timestamp: expect.any(String),
        checks: {
          database: 'error: Connection refused',
        },
      });
    });

    it('should return 503 when database throws an exception', async () => {
      // Mock database throwing an error
      mockSupabaseLimit.mockRejectedValue(new Error('Database timeout'));

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      expect(response.status).toBe(503);

      const body = await response.json();
      expect(body).toMatchObject({
        status: 'unhealthy',
        version: expect.any(String),
        timestamp: expect.any(String),
        checks: {
          database: 'error: Database timeout',
        },
      });
    });

    it('should include version information', async () => {
      // Mock successful database check
      mockSupabaseLimit.mockResolvedValue({
        data: [{ id: 'test-id' }],
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      const body = await response.json();
      expect(body.version).toBeDefined();
      expect(typeof body.version).toBe('string');
    });

    it('should include timestamp in ISO format', async () => {
      // Mock successful database check
      mockSupabaseLimit.mockResolvedValue({
        data: [{ id: 'test-id' }],
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      const body = await response.json();
      expect(body.timestamp).toBeDefined();
      expect(() => new Date(body.timestamp)).not.toThrow();

      // Verify it's a recent timestamp (within last 5 seconds)
      const timestamp = new Date(body.timestamp);
      const now = new Date();
      const diffMs = now.getTime() - timestamp.getTime();
      expect(diffMs).toBeLessThan(5000);
    });

    it('should check database connectivity', async () => {
      // Mock successful database check
      mockSupabaseLimit.mockResolvedValue({
        data: [{ id: 'test-id' }],
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      await GET(request);

      // Verify database check was performed
      expect(mockSupabaseFrom).toHaveBeenCalledWith('runs');
      expect(mockSupabaseSelect).toHaveBeenCalledWith('id');
      expect(mockSupabaseLimit).toHaveBeenCalledWith(1);
    });

    it('should handle unknown database errors gracefully', async () => {
      // Mock database throwing a non-Error object
      mockSupabaseLimit.mockRejectedValue({ code: 'UNKNOWN' });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      expect(response.status).toBe(503);

      const body = await response.json();
      expect(body).toMatchObject({
        status: 'unhealthy',
        checks: {
          database: expect.stringContaining('error'),
        },
      });
    });
  });
});
