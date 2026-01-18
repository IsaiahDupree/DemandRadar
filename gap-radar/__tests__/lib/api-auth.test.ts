/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateAPIRequest,
  addRateLimitHeaders,
  logAPIRequest,
} from '@/lib/api-auth';

// Polyfill for NextResponse.json in test environment
if (typeof Response.json === 'undefined') {
  // @ts-ignore
  Response.json = (data: any, init?: ResponseInit) => {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        ...init?.headers,
        'content-type': 'application/json',
      },
    });
  };
}

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/api-keys', () => ({
  validateAPIKey: jest.fn(),
  checkRateLimit: jest.fn(),
  logAPIUsage: jest.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { validateAPIKey, checkRateLimit, logAPIUsage } from '@/lib/api-keys';

describe('API Authentication Middleware', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn(),
          }),
        }),
      }),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('authenticateAPIRequest', () => {
    it('should reject request without Authorization header', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/runs');

      const result = await authenticateAPIRequest(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(401);
        const body = await result.response.json();
        expect(body.error).toBe('Missing Authorization header');
      }
    });

    it('should reject request with invalid Authorization format', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/runs', {
        headers: {
          Authorization: 'InvalidFormat api_key_here',
        },
      });

      const result = await authenticateAPIRequest(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(401);
        const body = await result.response.json();
        expect(body.error).toContain('Invalid Authorization header format');
      }
    });

    it('should reject request with empty API key', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/runs', {
        headers: {
          Authorization: 'Bearer ',
        },
      });

      const result = await authenticateAPIRequest(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(401);
        const body = await result.response.json();
        expect(body.error).toBe('API key is required');
      }
    });

    it('should reject request with invalid API key', async () => {
      (validateAPIKey as jest.Mock).mockResolvedValue({
        valid: false,
        error: 'Invalid API key',
      });

      const request = new NextRequest('http://localhost:3000/api/v1/runs', {
        headers: {
          Authorization: 'Bearer dr_live_invalid_key_123',
        },
      });

      const result = await authenticateAPIRequest(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(401);
        const body = await result.response.json();
        expect(body.error).toBe('Invalid API key');
      }
    });

    it('should reject request with expired API key', async () => {
      (validateAPIKey as jest.Mock).mockResolvedValue({
        valid: false,
        error: 'API key has expired',
      });

      const request = new NextRequest('http://localhost:3000/api/v1/runs', {
        headers: {
          Authorization: 'Bearer dr_live_expired_key_123',
        },
      });

      const result = await authenticateAPIRequest(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(401);
        const body = await result.response.json();
        expect(body.error).toBe('API key has expired');
      }
    });

    it('should accept valid API key and return context', async () => {
      (validateAPIKey as jest.Mock).mockResolvedValue({
        valid: true,
        userId: 'user-123',
        rateLimit: 100,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'key-123' },
                error: null,
              }),
            }),
          }),
        }),
      });

      (checkRateLimit as jest.Mock).mockResolvedValue({
        allowed: true,
        remaining: 50,
        resetAt: new Date('2026-01-18T12:00:00Z'),
      });

      const request = new NextRequest('http://localhost:3000/api/v1/runs', {
        headers: {
          Authorization: 'Bearer dr_live_valid_key_123',
        },
      });

      const result = await authenticateAPIRequest(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.context.userId).toBe('user-123');
        expect(result.context.apiKeyId).toBe('key-123');
        expect(result.context.rateLimit).toBe(100);
      }
    });

    it('should reject request when rate limit exceeded', async () => {
      (validateAPIKey as jest.Mock).mockResolvedValue({
        valid: true,
        userId: 'user-123',
        rateLimit: 100,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'key-123' },
                error: null,
              }),
            }),
          }),
        }),
      });

      const resetAt = new Date('2026-01-18T12:00:00Z');
      (checkRateLimit as jest.Mock).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt,
      });

      const request = new NextRequest('http://localhost:3000/api/v1/runs', {
        headers: {
          Authorization: 'Bearer dr_live_valid_key_123',
        },
      });

      const result = await authenticateAPIRequest(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(429);
        const body = await result.response.json();
        expect(body.error).toBe('Rate limit exceeded');
        expect(body.limit).toBe(100);

        // Check rate limit headers
        expect(result.response.headers.get('X-RateLimit-Limit')).toBe('100');
        expect(result.response.headers.get('X-RateLimit-Remaining')).toBe('0');
        expect(result.response.headers.get('X-RateLimit-Reset')).toBe(
          Math.floor(resetAt.getTime() / 1000).toString()
        );
      }
    });

    it('should handle missing API key data', async () => {
      (validateAPIKey as jest.Mock).mockResolvedValue({
        valid: true,
        userId: 'user-123',
        rateLimit: 100,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/v1/runs', {
        headers: {
          Authorization: 'Bearer dr_live_valid_key_123',
        },
      });

      const result = await authenticateAPIRequest(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(401);
        const body = await result.response.json();
        expect(body.error).toBe('API key not found');
      }
    });
  });

  describe('addRateLimitHeaders', () => {
    it('should add rate limit headers to response', () => {
      const response = NextResponse.json({ data: 'test' });
      const resetAt = new Date('2026-01-18T12:00:00Z');

      addRateLimitHeaders(response, 100, 50, resetAt);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('50');
      expect(response.headers.get('X-RateLimit-Reset')).toBe(
        Math.floor(resetAt.getTime() / 1000).toString()
      );
    });

    it('should add headers with only limit if remaining not provided', () => {
      const response = NextResponse.json({ data: 'test' });

      addRateLimitHeaders(response, 100);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.get('X-RateLimit-Remaining')).toBeNull();
      expect(response.headers.get('X-RateLimit-Reset')).toBeNull();
    });
  });

  describe('logAPIRequest', () => {
    it('should log API request with all metadata', async () => {
      const context = {
        userId: 'user-123',
        apiKeyId: 'key-123',
        rateLimit: 100,
      };

      const request = new NextRequest('http://localhost:3000/api/v1/runs', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Test Client/1.0',
        },
      });

      const response = NextResponse.json({ success: true }, { status: 201 });
      const startTime = Date.now() - 150; // 150ms ago

      await logAPIRequest(context, request, response, startTime);

      expect(logAPIUsage).toHaveBeenCalledWith(
        mockSupabase,
        'key-123',
        'user-123',
        '/api/v1/runs',
        'POST',
        201,
        expect.any(Number),
        expect.objectContaining({
          ipAddress: '192.168.1.1',
          userAgent: 'Test Client/1.0',
          requestId: expect.any(String),
        })
      );
    });

    it('should handle missing optional headers', async () => {
      const context = {
        userId: 'user-123',
        apiKeyId: 'key-123',
        rateLimit: 100,
      };

      const request = new NextRequest('http://localhost:3000/api/v1/runs', {
        method: 'GET',
      });

      const response = NextResponse.json({ data: [] }, { status: 200 });
      const startTime = Date.now();

      await logAPIRequest(context, request, response, startTime);

      expect(logAPIUsage).toHaveBeenCalledWith(
        mockSupabase,
        'key-123',
        'user-123',
        '/api/v1/runs',
        'GET',
        200,
        expect.any(Number),
        expect.objectContaining({
          ipAddress: undefined,
          userAgent: undefined,
          requestId: expect.any(String),
        })
      );
    });
  });
});
