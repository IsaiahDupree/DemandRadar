/**
 * Tests for Meta Conversions API (CAPI) Server-Side Events (META-004)
 */

import { POST } from '@/app/api/meta-capi/route';

describe('Meta CAPI Server-Side Events (META-004)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Mock environment variables
    process.env = {
      ...originalEnv,
      META_PIXEL_ID: 'test_pixel_id_12345',
      META_CAPI_ACCESS_TOKEN: 'test_access_token',
    };

    // Mock fetch globally
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetAllMocks();
  });

  it('should send a Purchase event to Meta CAPI with hashed user data', async () => {
    const mockResponse = {
      events_received: 1,
      messages: [],
      fbtrace_id: 'test_trace_id',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const requestBody = {
      event_name: 'Purchase',
      user_data: {
        email: 'test@example.com',
        phone: '+1234567890',
        fbc: 'fb.1.1234567890.abcdefg',
        fbp: 'fb.1.1234567890.hijklmn',
      },
      custom_data: {
        value: 99,
        currency: 'USD',
        content_ids: ['order-123'],
      },
      event_source_url: 'https://gapradar.com/checkout',
    };

    const request = new Request('http://localhost:3001/api/meta-capi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'Mozilla/5.0 Test Browser',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    // Verify response
    expect(data.events_received).toBe(1);
    expect(data.fbtrace_id).toBe('test_trace_id');

    // Verify fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[0]).toBe('https://graph.facebook.com/v18.0/test_pixel_id_12345/events');

    const fetchOptions = fetchCall[1];
    expect(fetchOptions.method).toBe('POST');

    const sentPayload = JSON.parse(fetchOptions.body);

    // Verify payload structure
    expect(sentPayload.access_token).toBe('test_access_token');
    expect(sentPayload.data).toHaveLength(1);

    const event = sentPayload.data[0];
    expect(event.event_name).toBe('Purchase');
    expect(event.action_source).toBe('website');
    expect(event.event_source_url).toBe('https://gapradar.com/checkout');
    expect(event.event_time).toBeGreaterThan(0);

    // Verify user data includes hashed email and phone
    expect(event.user_data.em).toBeDefined();
    expect(event.user_data.em).not.toBe('test@example.com'); // Should be hashed
    expect(event.user_data.em).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash

    expect(event.user_data.ph).toBeDefined();
    expect(event.user_data.ph).not.toBe('+1234567890'); // Should be hashed
    expect(event.user_data.ph).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash

    // Verify other user data
    expect(event.user_data.fbc).toBe('fb.1.1234567890.abcdefg');
    expect(event.user_data.fbp).toBe('fb.1.1234567890.hijklmn');
    expect(event.user_data.client_ip_address).toBe('192.168.1.1');
    expect(event.user_data.client_user_agent).toBe('Mozilla/5.0 Test Browser');

    // Verify custom data
    expect(event.custom_data.value).toBe(99);
    expect(event.custom_data.currency).toBe('USD');
    expect(event.custom_data.content_ids).toEqual(['order-123']);
  });

  it('should handle events without email/phone (anonymous users)', async () => {
    const mockResponse = {
      events_received: 1,
      messages: [],
      fbtrace_id: 'test_trace_id_2',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const requestBody = {
      event_name: 'PageView',
      user_data: {
        fbp: 'fb.1.1234567890.xyz',
      },
      custom_data: {},
      event_source_url: 'https://gapradar.com/',
    };

    const request = new Request('http://localhost:3001/api/meta-capi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.0.1',
        'user-agent': 'Test Browser',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.events_received).toBe(1);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const sentPayload = JSON.parse(fetchCall[1].body);
    const event = sentPayload.data[0];

    // Should not include email/phone if not provided
    expect(event.user_data.em).toBeUndefined();
    expect(event.user_data.ph).toBeUndefined();
    expect(event.user_data.fbp).toBe('fb.1.1234567890.xyz');
    expect(event.user_data.client_ip_address).toBe('10.0.0.1');
  });

  it('should return error response when Meta API fails', async () => {
    const mockErrorResponse = {
      error: {
        message: 'Invalid access token',
        type: 'OAuthException',
        code: 190,
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => mockErrorResponse,
    });

    const requestBody = {
      event_name: 'Lead',
      user_data: {
        email: 'test@example.com',
      },
      custom_data: {},
      event_source_url: 'https://gapradar.com/signup',
    };

    const request = new Request('http://localhost:3001/api/meta-capi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.error).toBeDefined();
    expect(data.error.message).toBe('Invalid access token');
  });

  it('should include event_id for deduplication when provided', async () => {
    const mockResponse = {
      events_received: 1,
      messages: [],
      fbtrace_id: 'test_trace_id_3',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const eventId = 'Purchase_1234567890_abc123';

    const requestBody = {
      event_name: 'Purchase',
      event_id: eventId,
      user_data: {
        email: 'buyer@example.com',
      },
      custom_data: {
        value: 199,
        currency: 'USD',
      },
      event_source_url: 'https://gapradar.com/checkout/complete',
    };

    const request = new Request('http://localhost:3001/api/meta-capi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    await POST(request);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const sentPayload = JSON.parse(fetchCall[1].body);
    const event = sentPayload.data[0];

    expect(event.event_id).toBe(eventId);
  });
});
