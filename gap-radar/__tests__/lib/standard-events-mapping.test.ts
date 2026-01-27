/**
 * Test: Standard Events Mapping (META-003)
 * Test-Driven Development: RED → GREEN → REFACTOR
 *
 * Tests for mapping GapRadar events to Meta Pixel standard events
 */

import { mapToMetaEvent, trackMetaEvent } from '@/lib/meta-pixel';

// Mock window.fbq
declare global {
  interface Window {
    fbq: jest.Mock;
  }
}

describe('Standard Events Mapping (META-003)', () => {
  let mockFbq: jest.Mock;

  beforeEach(() => {
    // Create mock fbq function
    mockFbq = jest.fn();
    window.fbq = mockFbq;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('mapToMetaEvent', () => {
    it('should map landing_view to PageView event', () => {
      const result = mapToMetaEvent('landing_view', {});

      expect(result).toEqual({
        eventName: 'PageView',
        parameters: {},
      });
    });

    it('should map signup_start to Lead event', () => {
      const result = mapToMetaEvent('signup_start', {});

      expect(result).toEqual({
        eventName: 'Lead',
        parameters: {},
      });
    });

    it('should map signup_complete to CompleteRegistration event', () => {
      const result = mapToMetaEvent('signup_complete', {
        userId: 'user-123',
      });

      expect(result).toEqual({
        eventName: 'CompleteRegistration',
        parameters: {
          content_name: 'User Registration',
          status: 'completed',
        },
      });
    });

    it('should map run_created to InitiateCheckout event with content_ids', () => {
      const result = mapToMetaEvent('run_created', {
        runId: 'run-456',
        query: 'AI chatbots',
      });

      expect(result).toEqual({
        eventName: 'InitiateCheckout',
        parameters: {
          content_ids: ['run-456'],
          num_items: 1,
          content_name: 'AI chatbots',
        },
      });
    });

    it('should map run_completed to ViewContent event', () => {
      const result = mapToMetaEvent('run_completed', {
        runId: 'run-789',
        query: 'fitness apps',
      });

      expect(result).toEqual({
        eventName: 'ViewContent',
        parameters: {
          content_type: 'market_analysis',
          content_ids: ['run-789'],
          content_name: 'fitness apps',
        },
      });
    });

    it('should map checkout_started to AddToCart event with value', () => {
      const result = mapToMetaEvent('checkout_started', {
        plan: 'pro',
        value: 49,
      });

      expect(result).toEqual({
        eventName: 'AddToCart',
        parameters: {
          value: 49,
          currency: 'USD',
          content_name: 'pro',
        },
      });
    });

    it('should map purchase_completed to Purchase event', () => {
      const result = mapToMetaEvent('purchase_completed', {
        orderId: 'order-123',
        value: 99,
        currency: 'USD',
        plan: 'premium',
      });

      expect(result).toEqual({
        eventName: 'Purchase',
        parameters: {
          value: 99,
          currency: 'USD',
          content_ids: ['order-123'],
          content_name: 'premium',
        },
      });
    });

    it('should return null for unmapped events', () => {
      const result = mapToMetaEvent('unknown_event', {});

      expect(result).toBeNull();
    });

    it('should handle report_viewed event as custom event', () => {
      const result = mapToMetaEvent('report_viewed', {
        reportId: 'report-123',
      });

      // Should return null for custom events (not standard Meta events)
      expect(result).toBeNull();
    });

    it('should use default currency USD if not provided', () => {
      const result = mapToMetaEvent('checkout_started', {
        plan: 'basic',
        value: 29,
      });

      expect(result?.parameters.currency).toBe('USD');
    });

    it('should preserve custom currency if provided', () => {
      const result = mapToMetaEvent('purchase_completed', {
        value: 100,
        currency: 'EUR',
        orderId: 'order-456',
      });

      expect(result?.parameters.currency).toBe('EUR');
    });
  });

  describe('trackMetaEvent', () => {
    it('should call window.fbq with mapped event for landing_view', () => {
      trackMetaEvent('landing_view', {});

      expect(mockFbq).toHaveBeenCalledWith('track', 'PageView', {});
    });

    it('should call window.fbq with mapped event for signup_start', () => {
      trackMetaEvent('signup_start', {});

      expect(mockFbq).toHaveBeenCalledWith('track', 'Lead', {});
    });

    it('should call window.fbq with parameters for signup_complete', () => {
      trackMetaEvent('signup_complete', { userId: 'user-123' });

      expect(mockFbq).toHaveBeenCalledWith('track', 'CompleteRegistration', {
        content_name: 'User Registration',
        status: 'completed',
      });
    });

    it('should call window.fbq with parameters for run_created', () => {
      trackMetaEvent('run_created', {
        runId: 'run-456',
        query: 'AI chatbots',
      });

      expect(mockFbq).toHaveBeenCalledWith('track', 'InitiateCheckout', {
        content_ids: ['run-456'],
        num_items: 1,
        content_name: 'AI chatbots',
      });
    });

    it('should call window.fbq for purchase_completed with all parameters', () => {
      trackMetaEvent('purchase_completed', {
        orderId: 'order-789',
        value: 99,
        currency: 'USD',
        plan: 'premium',
      });

      expect(mockFbq).toHaveBeenCalledWith('track', 'Purchase', {
        value: 99,
        currency: 'USD',
        content_ids: ['order-789'],
        content_name: 'premium',
      });
    });

    it('should not call window.fbq for unmapped events', () => {
      trackMetaEvent('unknown_event', {});

      expect(mockFbq).not.toHaveBeenCalled();
    });

    it('should not call window.fbq if fbq is not initialized', () => {
      delete (window as any).fbq;

      expect(() => {
        trackMetaEvent('landing_view', {});
      }).not.toThrow();
    });

    it('should handle window.fbq being undefined gracefully', () => {
      // Delete fbq to simulate not initialized
      delete (window as any).fbq;

      // Should not throw even when fbq is undefined
      expect(() => {
        trackMetaEvent('landing_view', {});
      }).not.toThrow();

      // Verify no error was thrown and function returned early
      expect(mockFbq).not.toHaveBeenCalled();
    });
  });

  describe('Event mapping table', () => {
    const mappingTable = [
      { gapRadarEvent: 'landing_view', metaEvent: 'PageView' },
      { gapRadarEvent: 'signup_start', metaEvent: 'Lead' },
      { gapRadarEvent: 'signup_complete', metaEvent: 'CompleteRegistration' },
      { gapRadarEvent: 'run_created', metaEvent: 'InitiateCheckout' },
      { gapRadarEvent: 'run_completed', metaEvent: 'ViewContent' },
      { gapRadarEvent: 'checkout_started', metaEvent: 'AddToCart' },
      { gapRadarEvent: 'purchase_completed', metaEvent: 'Purchase' },
    ];

    it.each(mappingTable)(
      'should map $gapRadarEvent to $metaEvent',
      ({ gapRadarEvent, metaEvent }) => {
        const result = mapToMetaEvent(gapRadarEvent, {});
        expect(result?.eventName).toBe(metaEvent);
      }
    );
  });
});
