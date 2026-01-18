/**
 * Analytics Event Tracking Tests
 *
 * Tests the analytics system for tracking landing page events
 * @jest-environment jsdom
 */

import {
  trackLandingEvent,
  trackLandingView,
  trackCTAClick,
  trackNLPSearch,
  trackTrendClick,
  trackSignup,
} from '@/lib/analytics/landing';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('Analytics Event Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    // Set window properties (jsdom environment)
    delete (window as any).posthog;
    Object.defineProperty(document, 'referrer', {
      value: 'https://google.com',
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('trackLandingEvent', () => {
    it('should send event to /api/analytics endpoint', () => {
      trackLandingEvent('landing_view', { test: 'property' });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/analytics',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
        })
      );

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.event).toBe('landing_view');
      expect(body.properties.test).toBe('property');
      expect(body.properties.page).toBe('/');
      expect(body.properties.referrer).toBe('https://google.com');
      expect(body.properties.timestamp).toBeDefined();
    });

    it('should include timestamp in event properties', () => {
      trackLandingEvent('cta_sign_in_click');

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.properties.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      trackLandingEvent('landing_view');

      // Wait for async error handling
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Analytics error:',
        expect.any(Error)
      );
    });

    it('should use PostHog if available', () => {
      const mockPostHog = {
        capture: jest.fn(),
      };

      (window as any).posthog = mockPostHog;

      trackLandingEvent('landing_view', { test: 'posthog' });

      expect(mockPostHog.capture).toHaveBeenCalledWith('landing_view', {
        test: 'posthog',
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('trackLandingView', () => {
    it('should track landing page view', () => {
      trackLandingView();

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.event).toBe('landing_view');
      expect(body.properties.userAgent).toBeDefined();
    });
  });

  describe('trackCTAClick', () => {
    it('should track sign_in CTA click', () => {
      trackCTAClick('sign_in', 'nav');

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.event).toBe('cta_sign_in_click');
      expect(body.properties.location).toBe('nav');
    });

    it('should track get_started CTA click', () => {
      trackCTAClick('get_started', 'hero');

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.event).toBe('cta_get_started_click');
      expect(body.properties.location).toBe('hero');
    });
  });

  describe('trackNLPSearch', () => {
    it('should track search focus event', () => {
      trackNLPSearch('focus');

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.event).toBe('nlp_search_focus');
    });

    it('should track search submit with query', () => {
      trackNLPSearch('submit', 'AI tools for content creators');

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.event).toBe('nlp_search_submit');
      expect(body.properties.query).toBe('AI tools for content creators');
      expect(body.properties.queryLength).toBe(29);
    });

    it('should limit query length to 100 characters', () => {
      const longQuery = 'a'.repeat(150);
      trackNLPSearch('submit', longQuery);

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.properties.query).toHaveLength(100);
      expect(body.properties.queryLength).toBe(150);
    });
  });

  describe('trackTrendClick', () => {
    it('should track trend topic click', () => {
      trackTrendClick('AI Marketing Tools', 'Marketing', 85);

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.event).toBe('trend_topic_click');
      expect(body.properties.topic).toBe('AI Marketing Tools');
      expect(body.properties.category).toBe('Marketing');
      expect(body.properties.opportunityScore).toBe(85);
    });

    it('should limit topic length to 100 characters', () => {
      const longTopic = 'a'.repeat(150);
      trackTrendClick(longTopic);

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.properties.topic).toHaveLength(100);
    });
  });

  describe('trackSignup', () => {
    it('should track signup started event', () => {
      trackSignup('started', 'email');

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.event).toBe('signup_started');
      expect(body.properties.method).toBe('email');
    });

    it('should track signup completed event', () => {
      trackSignup('completed', 'google');

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.event).toBe('signup_completed');
      expect(body.properties.method).toBe('google');
    });
  });

  describe('Conversion Funnel Tracking', () => {
    it('should track complete conversion funnel', () => {
      // User lands on page
      trackLandingView();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // User focuses on search
      trackNLPSearch('focus');
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // User submits search
      trackNLPSearch('submit', 'test query');
      expect(mockFetch).toHaveBeenCalledTimes(3);

      // User clicks get started
      trackCTAClick('get_started', 'hero');
      expect(mockFetch).toHaveBeenCalledTimes(4);

      // User starts signup
      trackSignup('started', 'email');
      expect(mockFetch).toHaveBeenCalledTimes(5);

      // User completes signup
      trackSignup('completed', 'email');
      expect(mockFetch).toHaveBeenCalledTimes(6);

      // Verify all events were tracked
      const events = mockFetch.mock.calls.map(call => {
        const body = JSON.parse(call[1].body);
        return body.event;
      });

      expect(events).toEqual([
        'landing_view',
        'nlp_search_focus',
        'nlp_search_submit',
        'cta_get_started_click',
        'signup_started',
        'signup_completed',
      ]);
    });
  });
});
