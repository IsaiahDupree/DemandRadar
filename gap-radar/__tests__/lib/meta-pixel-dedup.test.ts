/**
 * GDP-010: Meta Pixel + CAPI Dedup Tests
 *
 * Tests for event ID deduplication between Meta Pixel (client) and CAPI (server)
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  generateEventId,
  trackWithDeduplication,
} from '@/lib/meta-pixel';

describe('GDP-010: Meta Pixel + CAPI Dedup', () => {
  let mockFbq: any;

  beforeEach(() => {
    // Mock window.fbq
    mockFbq = jest.fn();

    // Mock window object
    (global as any).window = (global as any).window || {};
    (global as any).window.fbq = mockFbq;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if ((global as any).window) {
      delete (global as any).window.fbq;
    }
  });

  describe('generateEventId', () => {
    it('should generate unique event ID with correct format', () => {
      const eventName = 'Purchase';
      const eventId1 = generateEventId(eventName);
      const eventId2 = generateEventId(eventName);

      // Check format: EventName_timestamp_randomString
      expect(eventId1).toMatch(/^Purchase_\d+_[a-z0-9]+$/);
      expect(eventId2).toMatch(/^Purchase_\d+_[a-z0-9]+$/);

      // Each ID should be unique
      expect(eventId1).not.toBe(eventId2);
    });

    it('should include event name in the ID', () => {
      const eventName = 'Lead';
      const eventId = generateEventId(eventName);

      expect(eventId).toContain('Lead_');
    });

    it('should work with different event names', () => {
      const eventNames = ['Purchase', 'Lead', 'CompleteRegistration', 'ViewContent'];

      eventNames.forEach((name) => {
        const eventId = generateEventId(name);
        expect(eventId).toContain(`${name}_`);
      });
    });
  });

  describe('trackWithDeduplication', () => {
    it('should call fbq with eventID parameter for deduplication', () => {
      const eventName = 'Purchase';
      const parameters = { value: 99.99, currency: 'USD' };
      const eventId = 'Purchase_1234567890_abc123';

      const returnedEventId = trackWithDeduplication(eventName, parameters, eventId);

      expect(mockFbq).toHaveBeenCalledWith(
        'track',
        eventName,
        parameters,
        { eventID: eventId }
      );
      expect(returnedEventId).toBe(eventId);
    });

    it('should generate event ID if not provided', () => {
      const eventName = 'Lead';
      const parameters = { value: 25 };

      const returnedEventId = trackWithDeduplication(eventName, parameters);

      expect(returnedEventId).toMatch(/^Lead_\d+_[a-z0-9]+$/);
      expect(mockFbq).toHaveBeenCalledWith(
        'track',
        eventName,
        parameters,
        expect.objectContaining({
          eventID: expect.stringContaining('Lead_'),
        })
      );
    });

    it('should return generated event ID for CAPI use', () => {
      const eventName = 'CompleteRegistration';
      const parameters = {};

      const eventId = trackWithDeduplication(eventName, parameters);

      // The returned event ID should be usable for CAPI
      expect(eventId).toBeTruthy();
      expect(typeof eventId).toBe('string');
      expect(eventId.length).toBeGreaterThan(0);
    });

    it('should handle empty parameters', () => {
      const eventName = 'PageView';
      const eventId = 'PageView_1234567890_xyz789';

      trackWithDeduplication(eventName, {}, eventId);

      expect(mockFbq).toHaveBeenCalledWith('track', eventName, {}, { eventID: eventId });
    });

    it('should work with multiple events using different IDs', () => {
      const events = [
        { name: 'ViewContent', params: { content_id: '123' }, id: 'ViewContent_111_aaa' },
        { name: 'AddToCart', params: { value: 50 }, id: 'AddToCart_222_bbb' },
        { name: 'InitiateCheckout', params: { value: 50 }, id: 'Checkout_333_ccc' },
      ];

      events.forEach((event) => {
        trackWithDeduplication(event.name, event.params, event.id);
      });

      expect(mockFbq).toHaveBeenCalledTimes(3);
      expect(mockFbq).toHaveBeenNthCalledWith(
        1,
        'track',
        'ViewContent',
        { content_id: '123' },
        { eventID: 'ViewContent_111_aaa' }
      );
      expect(mockFbq).toHaveBeenNthCalledWith(
        2,
        'track',
        'AddToCart',
        { value: 50 },
        { eventID: 'AddToCart_222_bbb' }
      );
      expect(mockFbq).toHaveBeenNthCalledWith(
        3,
        'track',
        'InitiateCheckout',
        { value: 50 },
        { eventID: 'Checkout_333_ccc' }
      );
    });
  });

  describe('Deduplication workflow', () => {
    it('should generate event ID that can be used for both Pixel and CAPI', () => {
      // Simulate client-side tracking
      const eventName = 'Purchase';
      const parameters = {
        value: 99.99,
        currency: 'USD',
        content_ids: ['order-123'],
      };

      // Track with Pixel and get event ID
      const eventId = trackWithDeduplication(eventName, parameters);

      // Verify Pixel was called with event ID
      expect(mockFbq).toHaveBeenCalledWith(
        'track',
        eventName,
        parameters,
        expect.objectContaining({ eventID: eventId })
      );

      // The same event ID should be used for CAPI request
      // (In real implementation, this would be sent to /api/meta-capi)
      const capiPayload = {
        event_name: eventName,
        event_id: eventId, // Same ID for deduplication
        user_data: {
          email: 'user@example.com',
        },
        custom_data: parameters,
        event_source_url: 'https://gapradar.com/checkout',
      };

      expect(capiPayload.event_id).toBe(eventId);
      expect(capiPayload.event_id).toMatch(/^Purchase_\d+_[a-z0-9]+$/);
    });
  });
});
