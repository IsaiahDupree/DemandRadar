/**
 * Tests for Event Deduplication (META-005)
 */

import {
  generateEventId,
  trackWithDeduplication,
  sendCAPIWithDeduplication,
} from '@/lib/meta-pixel';

// Mock window.fbq
declare global {
  interface Window {
    fbq: jest.Mock;
  }
}

describe('Event Deduplication (META-005)', () => {
  let mockFbq: jest.Mock;

  beforeEach(() => {
    // Create a properly typed mock for window.fbq
    mockFbq = jest.fn() as jest.Mock;

    // Set window.fbq directly
    (global as any).window = (global as any).window || {};
    (global as any).window.fbq = mockFbq;

    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ events_received: 1, fbtrace_id: 'test' }),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    if ((global as any).window) {
      delete (global as any).window.fbq;
    }
  });

  describe('generateEventId', () => {
    it('should generate unique event IDs', () => {
      const id1 = generateEventId('Purchase');
      const id2 = generateEventId('Purchase');

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2); // Should be unique
    });

    it('should include event name in the ID', () => {
      const id = generateEventId('Purchase');
      expect(id).toContain('Purchase');
    });

    it('should generate IDs with consistent format', () => {
      const id = generateEventId('Lead');
      // Format: EventName_timestamp_randomString
      expect(id).toMatch(/^Lead_\d+_[a-z0-9]+$/);
    });
  });

  describe('trackWithDeduplication', () => {
    it('should call fbq with eventID parameter', () => {
      const eventId = 'Purchase_1234567890_abc123';

      trackWithDeduplication('Purchase', { value: 99, currency: 'USD' }, eventId);

      expect(mockFbq).toHaveBeenCalledWith(
        'track',
        'Purchase',
        { value: 99, currency: 'USD' },
        { eventID: eventId }
      );
    });

    it('should generate event ID if not provided', () => {
      trackWithDeduplication('Lead', {});

      expect(mockFbq).toHaveBeenCalledTimes(1);
      const call = mockFbq.mock.calls[0];

      expect(call[0]).toBe('track');
      expect(call[1]).toBe('Lead');
      expect(call[3]).toBeDefined();
      expect(call[3].eventID).toBeDefined();
      expect(call[3].eventID).toContain('Lead');
    });

    it('should return the event ID used', () => {
      const providedId = 'Custom_ID_123';
      const returnedId = trackWithDeduplication('PageView', {}, providedId);

      expect(returnedId).toBe(providedId);
    });

    it('should return generated ID when not provided', () => {
      const returnedId = trackWithDeduplication('ViewContent', {});

      expect(returnedId).toBeDefined();
      expect(returnedId).toContain('ViewContent');
    });
  });

  describe('sendCAPIWithDeduplication', () => {
    it('should send event to CAPI with event_id', async () => {
      const eventId = 'Purchase_1234567890_xyz';

      await sendCAPIWithDeduplication({
        event_name: 'Purchase',
        event_id: eventId,
        user_data: {
          email: 'test@example.com',
        },
        custom_data: {
          value: 99,
          currency: 'USD',
        },
        event_source_url: 'https://gapradar.com/checkout',
      });

      expect(fetch).toHaveBeenCalledTimes(1);
      const fetchCall = (fetch as jest.Mock).mock.calls[0];

      expect(fetchCall[0]).toBe('/api/meta-capi');
      expect(fetchCall[1].method).toBe('POST');

      const body = JSON.parse(fetchCall[1].body);
      expect(body.event_id).toBe(eventId);
      expect(body.event_name).toBe('Purchase');
    });

    it('should generate event_id if not provided', async () => {
      await sendCAPIWithDeduplication({
        event_name: 'Lead',
        user_data: {
          email: 'lead@example.com',
        },
        custom_data: {},
        event_source_url: 'https://gapradar.com/signup',
      });

      expect(fetch).toHaveBeenCalledTimes(1);
      const fetchCall = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.event_id).toBeDefined();
      expect(body.event_id).toContain('Lead');
    });
  });

  describe('Full deduplication flow', () => {
    it('should use same event_id for both Pixel and CAPI', async () => {
      const eventId = generateEventId('Purchase');

      // Track in browser with Pixel
      trackWithDeduplication('Purchase', { value: 99, currency: 'USD' }, eventId);

      // Send to server via CAPI
      await sendCAPIWithDeduplication({
        event_name: 'Purchase',
        event_id: eventId,
        user_data: {
          email: 'customer@example.com',
        },
        custom_data: {
          value: 99,
          currency: 'USD',
        },
        event_source_url: 'https://gapradar.com/checkout',
      });

      // Verify Pixel call
      const pixelCall = mockFbq.mock.calls[0];
      expect(pixelCall[3].eventID).toBe(eventId);

      // Verify CAPI call
      const capiCall = (fetch as jest.Mock).mock.calls[0];
      const capiBody = JSON.parse(capiCall[1].body);
      expect(capiBody.event_id).toBe(eventId);

      // Both should use the same event_id
      expect(pixelCall[3].eventID).toBe(capiBody.event_id);
    });

    it('should handle conversion events with deduplication', async () => {
      const eventId = generateEventId('Purchase');

      // Simulate a purchase event tracked on both client and server
      trackWithDeduplication(
        'Purchase',
        {
          value: 199.99,
          currency: 'USD',
          content_ids: ['premium-plan'],
        },
        eventId
      );

      await sendCAPIWithDeduplication({
        event_name: 'Purchase',
        event_id: eventId,
        user_data: {
          email: 'buyer@example.com',
          fbp: 'fb.1.1234567890.abc',
        },
        custom_data: {
          value: 199.99,
          currency: 'USD',
          content_ids: ['premium-plan'],
        },
        event_source_url: 'https://gapradar.com/checkout/complete',
      });

      // Both tracking methods called
      expect(mockFbq).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledTimes(1);

      // Same event_id prevents duplicate counting in Meta
      const pixelEventId = mockFbq.mock.calls[0][3].eventID;
      const capiEventId = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body).event_id;

      expect(pixelEventId).toBe(capiEventId);
      expect(pixelEventId).toBe(eventId);
    });
  });
});
