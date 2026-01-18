/**
 * Analytics API Endpoint Tests
 *
 * Tests the POST /api/analytics endpoint
 * @jest-environment node
 */

import { POST, GET } from '@/app/api/analytics/route';
import { NextRequest } from 'next/server';

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('POST /api/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should accept and log analytics events', async () => {
    const request = new NextRequest('http://localhost:3001/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'Mozilla/5.0 Test',
      },
      body: JSON.stringify({
        event: 'landing_view',
        properties: {
          page: '/',
          timestamp: new Date().toISOString(),
        },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should return 400 if event name is missing', async () => {
    const request = new NextRequest('http://localhost:3001/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: { test: 'data' },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Event name is required');
  });

  it('should extract IP from x-forwarded-for header', async () => {
    const request = new NextRequest('http://localhost:3001/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '1.2.3.4, 5.6.7.8',
      },
      body: JSON.stringify({
        event: 'test_event',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should extract IP from x-real-ip header if x-forwarded-for is missing', async () => {
    const request = new NextRequest('http://localhost:3001/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-real-ip': '9.10.11.12',
      },
      body: JSON.stringify({
        event: 'test_event',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should handle invalid JSON gracefully', async () => {
    const request = new NextRequest('http://localhost:3001/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to process analytics event');
  });
});

describe('GET /api/analytics', () => {
  it('should return health check status', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.service).toBe('analytics');
    expect(data.timestamp).toBeDefined();
  });
});
