/**
 * Tests for Click Redirect Tracker (GDP-006)
 *
 * Feature: GDP-006 - Click Redirect Tracker
 * Description: Attribution spine: email → click → session → conversion with first-party cookie
 */

// Mock dependencies BEFORE importing the route
jest.mock('@/lib/supabase/service');

import { GET } from '@/app/api/click/route';
import { createServiceClient } from '@/lib/supabase/service';

describe('Click Redirect Tracker (GDP-006)', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Track all from() calls
    const fromCalls: string[] = [];

    // Create chainable mock for Supabase
    mockSupabase = {
      from: jest.fn((table: string) => {
        fromCalls.push(table);
        return mockSupabase;
      }),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      _fromCalls: fromCalls, // Store for assertions
    };

    (createServiceClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('URL Parameter Validation', () => {
    it('should require url parameter', async () => {
      const request = new Request('http://localhost:3000/api/click');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required parameter');
    });

    it('should require person_id or email parameter', async () => {
      const request = new Request(
        'http://localhost:3000/api/click?url=https://gapradar.com/dashboard'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing person_id or email');
    });
  });

  describe('Click Tracking', () => {
    it('should track click event with person_id', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const targetUrl = 'https://gapradar.com/dashboard';

      mockSupabase.single.mockResolvedValue({
        data: { id: personId },
        error: null,
      });
      mockSupabase.insert.mockReturnThis();

      const request = new Request(
        `http://localhost:3000/api/click?url=${encodeURIComponent(targetUrl)}&person_id=${personId}`
      );

      const response = await GET(request);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe(targetUrl);
      expect(mockSupabase._fromCalls).toContain('unified_event');
    });

    it('should track click event with email lookup', async () => {
      const email = 'user@example.com';
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const targetUrl = 'https://gapradar.com/dashboard';

      mockSupabase.single.mockResolvedValue({
        data: { id: personId },
        error: null,
      });
      mockSupabase.insert.mockReturnThis();

      const request = new Request(
        `http://localhost:3000/api/click?url=${encodeURIComponent(targetUrl)}&email=${encodeURIComponent(email)}`
      );

      const response = await GET(request);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe(targetUrl);
      expect(mockSupabase._fromCalls).toContain('person');
      expect(mockSupabase._fromCalls).toContain('unified_event');
    });
  });

  describe('Attribution Cookie', () => {
    it('should set first-party attribution cookie', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const targetUrl = 'https://gapradar.com/dashboard';

      mockSupabase.single.mockResolvedValue({
        data: { id: personId },
        error: null,
      });
      mockSupabase.insert.mockReturnThis();

      const request = new Request(
        `http://localhost:3000/api/click?url=${encodeURIComponent(targetUrl)}&person_id=${personId}`
      );

      const response = await GET(request);

      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toBeTruthy();
      expect(setCookieHeader).toContain('gr_attribution');

      // Decode and verify cookie contains person_id
      const cookieMatch = setCookieHeader?.match(/gr_attribution=([^;]+)/);
      expect(cookieMatch).toBeTruthy();
      const cookieValue = Buffer.from(cookieMatch![1], 'base64').toString('utf-8');
      const attributionData = JSON.parse(cookieValue);
      expect(attributionData.person_id).toBe(personId);
    });

    it('should include email_message_id in attribution cookie', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const emailMessageId = 'msg_456';
      const targetUrl = 'https://gapradar.com/dashboard';

      mockSupabase.single.mockResolvedValue({
        data: { id: personId },
        error: null,
      });
      mockSupabase.insert.mockReturnThis();

      const request = new Request(
        `http://localhost:3000/api/click?url=${encodeURIComponent(targetUrl)}&person_id=${personId}&email_message_id=${emailMessageId}`
      );

      const response = await GET(request);

      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toBeTruthy();

      // Decode and verify cookie contains email_message_id
      const cookieMatch = setCookieHeader?.match(/gr_attribution=([^;]+)/);
      expect(cookieMatch).toBeTruthy();
      const cookieValue = Buffer.from(cookieMatch![1], 'base64').toString('utf-8');
      const attributionData = JSON.parse(cookieValue);
      expect(attributionData.email_message_id).toBe(emailMessageId);
    });
  });

  describe('Redirect Behavior', () => {
    it('should redirect to target URL', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const targetUrl = 'https://gapradar.com/pricing';

      mockSupabase.single.mockResolvedValue({
        data: { id: personId },
        error: null,
      });
      mockSupabase.insert.mockReturnThis();

      const request = new Request(
        `http://localhost:3000/api/click?url=${encodeURIComponent(targetUrl)}&person_id=${personId}`
      );

      const response = await GET(request);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe(targetUrl);
    });

    it('should handle invalid URLs gracefully', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const invalidUrl = 'not-a-valid-url';

      const request = new Request(
        `http://localhost:3000/api/click?url=${encodeURIComponent(invalidUrl)}&person_id=${personId}`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid URL');
    });
  });
});
