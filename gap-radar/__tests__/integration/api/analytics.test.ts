/**
 * Analytics API Integration Tests
 * Tests for /api/analytics endpoint
 */

// Mock Next.js modules
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    url: string;
    method: string;
    headers: Map<string, string>;
    private body: any;

    constructor(url: string, init?: any) {
      this.url = url;
      this.method = init?.method || 'GET';
      this.headers = new Map();

      if (init?.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value as string);
        });
      }

      this.body = init?.body;
    }

    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }
  },
  NextResponse: {
    json: (data: any, init?: ResponseInit) => ({
      json: async () => data,
      status: init?.status || 200,
      ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
    }),
  },
}));

import { GET, POST } from '@/app/api/analytics/route';
import { NextRequest } from 'next/server';

describe('Analytics API Integration Tests', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    // Set to development to enable console logging
    process.env.NODE_ENV = 'development';
    // Spy on console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  describe('GET /api/analytics', () => {
    it('should return 200 with status ok', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics');
      const response = await GET();

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toMatchObject({
        status: 'ok',
        service: 'analytics',
        timestamp: expect.any(String),
      });
    });

    it('should return current timestamp in ISO format', async () => {
      const response = await GET();
      const body = await response.json();

      expect(body.timestamp).toBeDefined();
      expect(() => new Date(body.timestamp)).not.toThrow();

      // Verify it's a recent timestamp
      const timestamp = new Date(body.timestamp);
      const now = new Date();
      const diffMs = now.getTime() - timestamp.getTime();
      expect(diffMs).toBeLessThan(1000);
    });
  });

  describe('POST /api/analytics', () => {
    it('should accept and process analytics event', async () => {
      const eventData = {
        event: 'page_view',
        properties: {
          page: '/dashboard',
          userId: 'user123',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-agent': 'Mozilla/5.0',
        },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toEqual({ success: true });
    });

    it('should return 400 when event name is missing', async () => {
      const eventData = {
        properties: {
          page: '/dashboard',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body).toEqual({ error: 'Event name is required' });
    });

    it('should capture IP address from x-forwarded-for header', async () => {
      const eventData = {
        event: 'button_click',
        properties: {
          button: 'signup',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(console.log).toHaveBeenCalledWith(
        '[Analytics Event]',
        expect.stringContaining('"ip": "192.168.1.1"')
      );
    });

    it('should capture IP address from x-real-ip header if x-forwarded-for is not present', async () => {
      const eventData = {
        event: 'button_click',
        properties: {},
      };

      const request = new NextRequest('http://localhost:3000/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-real-ip': '203.0.113.1',
        },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(console.log).toHaveBeenCalledWith(
        '[Analytics Event]',
        expect.stringContaining('"ip": "203.0.113.1"')
      );
    });

    it('should capture user agent', async () => {
      const eventData = {
        event: 'page_load',
        properties: {},
      };

      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
      const request = new NextRequest('http://localhost:3000/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-agent': userAgent,
        },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(console.log).toHaveBeenCalledWith(
        '[Analytics Event]',
        expect.stringContaining(userAgent)
      );
    });

    it('should add receivedAt timestamp to event properties', async () => {
      const eventData = {
        event: 'conversion',
        properties: {
          plan: 'pro',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(console.log).toHaveBeenCalledWith(
        '[Analytics Event]',
        expect.stringContaining('"receivedAt"')
      );
    });

    it('should handle malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'not valid json',
      });

      const response = await POST(request);

      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body).toEqual({ error: 'Failed to process analytics event' });
    });

    it('should preserve custom properties in event', async () => {
      const eventData = {
        event: 'feature_used',
        properties: {
          feature: 'gap_analysis',
          duration: 1234,
          success: true,
        },
      };

      const request = new NextRequest('http://localhost:3000/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(console.log).toHaveBeenCalledWith(
        '[Analytics Event]',
        expect.stringContaining('"feature": "gap_analysis"')
      );
      expect(console.log).toHaveBeenCalledWith(
        '[Analytics Event]',
        expect.stringContaining('"duration": 1234')
      );
    });

    it('should handle events with no properties', async () => {
      const eventData = {
        event: 'app_opened',
      };

      const request = new NextRequest('http://localhost:3000/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toEqual({ success: true });
    });
  });
});
