/**
 * Health Check Endpoint Tests
 *
 * Tests the /api/health endpoint for monitoring and load balancing.
 * @jest-environment node
 */

import { GET } from '@/app/api/health/route';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 when healthy', async () => {
    // Mock successful DB connection
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    };

    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValue(mockSupabase);

    const request = new Request('http://localhost:3000/api/health') as any;
    const response = await GET(request);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('status', 'healthy');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('checks');
    expect(data.checks).toHaveProperty('database');
  });

  it('should check database connection', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    };

    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValue(mockSupabase);

    const request = new Request('http://localhost:3000/api/health') as any;
    const response = await GET(request);

    const data = await response.json();
    expect(data.checks.database).toBe('ok');
    expect(mockSupabase.from).toHaveBeenCalled();
  });

  it('should return 503 when database is unhealthy', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Connection failed' },
          }),
        }),
      }),
    };

    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValue(mockSupabase);

    const request = new Request('http://localhost:3000/api/health') as any;
    const response = await GET(request);

    expect(response.status).toBe(503);

    const data = await response.json();
    expect(data).toHaveProperty('status', 'unhealthy');
    expect(data.checks.database).toContain('error');
  });

  it('should return 503 when database connection throws', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockRejectedValue(new Error('Connection timeout'));

    const request = new Request('http://localhost:3000/api/health') as any;
    const response = await GET(request);

    expect(response.status).toBe(503);

    const data = await response.json();
    expect(data).toHaveProperty('status', 'unhealthy');
  });

  it('should include timestamp in response', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    };

    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValue(mockSupabase);

    const beforeTimestamp = new Date().toISOString();

    const request = new Request('http://localhost:3000/api/health') as any;
    const response = await GET(request);

    const afterTimestamp = new Date().toISOString();
    const data = await response.json();

    expect(data.timestamp).toBeDefined();
    expect(new Date(data.timestamp).getTime()).toBeGreaterThanOrEqual(new Date(beforeTimestamp).getTime());
    expect(new Date(data.timestamp).getTime()).toBeLessThanOrEqual(new Date(afterTimestamp).getTime());
  });

  it('should include service version', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    };

    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValue(mockSupabase);

    const request = new Request('http://localhost:3000/api/health') as any;
    const response = await GET(request);

    const data = await response.json();
    expect(data).toHaveProperty('version');
  });
});
