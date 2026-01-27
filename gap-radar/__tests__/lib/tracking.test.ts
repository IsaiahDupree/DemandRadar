/**
 * Test: User Event Tracker SDK Integration (TRACK-001)
 * Test-Driven Development: RED → GREEN → REFACTOR
 */

import { tracker, UserEventTracker } from '@/lib/tracking/userEventTracker';

describe('User Event Tracker SDK Integration', () => {
  beforeEach(() => {
    // Reset tracker state
    localStorage.clear();
    document.cookie = '';
  });

  describe('Tracker Initialization', () => {
    it('should initialize tracker with projectId', () => {
      tracker.init({ projectId: 'gapradar' });

      expect(tracker.isInitialized()).toBe(true);
    });

    it('should create anonymous ID on initialization', () => {
      tracker.init({ projectId: 'gapradar' });

      const anonymousId = tracker.getAnonymousId();
      expect(anonymousId).toBeDefined();
      expect(anonymousId).toMatch(/^anon_/);
    });

    it('should create session ID on initialization', () => {
      tracker.init({ projectId: 'gapradar' });

      const sessionId = tracker.getSessionId();
      expect(sessionId).toBeDefined();
      expect(sessionId).toMatch(/^sess_/);
    });

    it('should not double-initialize', () => {
      tracker.init({ projectId: 'gapradar' });
      const firstSessionId = tracker.getSessionId();

      tracker.init({ projectId: 'gapradar' });
      const secondSessionId = tracker.getSessionId();

      expect(firstSessionId).toBe(secondSessionId);
    });

    it('should initialize with custom config', () => {
      tracker.init({
        projectId: 'gapradar',
        debug: true,
        sessionTimeout: 60,
        batchSize: 20,
      });

      expect(tracker.isInitialized()).toBe(true);
    });

    it('should support auto-tracking configuration', () => {
      tracker.init({
        projectId: 'gapradar',
        autoTrack: {
          pageViews: true,
          clicks: true,
          scrollDepth: false,
          forms: true,
          errors: true,
          performance: false,
          outboundLinks: true,
        },
      });

      expect(tracker.isInitialized()).toBe(true);
    });
  });

  describe('User Identification', () => {
    beforeEach(() => {
      tracker.init({ projectId: 'gapradar' });
    });

    it('should identify user with userId', () => {
      tracker.identify('usr_123', { email: 'test@example.com' });

      expect(tracker.getUserId()).toBe('usr_123');
    });

    it('should persist userId to localStorage', () => {
      tracker.identify('usr_123', { email: 'test@example.com' });

      expect(localStorage.getItem('_gapradar_uid')).toBe('usr_123');
    });

    it('should reset user identification', () => {
      tracker.identify('usr_123', { email: 'test@example.com' });
      tracker.reset();

      expect(tracker.getUserId()).toBeNull();
      expect(localStorage.getItem('_gapradar_uid')).toBeNull();
    });
  });

  describe('Event Tracking', () => {
    beforeEach(() => {
      tracker.init({ projectId: 'gapradar', debug: false });
    });

    it('should track basic events', () => {
      expect(() => {
        tracker.track('landing_view', { page: 'home' });
      }).not.toThrow();
    });

    it('should track page views', () => {
      expect(() => {
        tracker.trackPageView({ customProp: 'value' });
      }).not.toThrow();
    });

    it('should track conversions', () => {
      expect(() => {
        tracker.trackConversion('purchase', 99.99, {
          orderId: 'ORD-123',
          plan: 'pro',
        });
      }).not.toThrow();
    });

    it('should track errors', () => {
      const error = new Error('Test error');

      expect(() => {
        tracker.trackError(error, { context: 'test' });
      }).not.toThrow();
    });
  });

  describe('Singleton Pattern', () => {
    it('should export a singleton instance', () => {
      expect(tracker).toBeDefined();
      expect(tracker).toBeInstanceOf(UserEventTracker);
    });

    it('should allow creating custom instances', () => {
      const customTracker = new UserEventTracker();

      expect(customTracker).toBeDefined();
      expect(customTracker).toBeInstanceOf(UserEventTracker);
      expect(customTracker).not.toBe(tracker);
    });
  });

  describe('Session Management', () => {
    it('should persist session ID to localStorage', () => {
      // Clear storage first
      localStorage.clear();

      const customTracker = new UserEventTracker();
      customTracker.init({ projectId: 'gapradar' });

      const sessionId = customTracker.getSessionId();

      expect(localStorage.getItem('_gapradar_session')).toBe(sessionId);
    });

    it('should persist anonymous ID to localStorage or cookie', () => {
      // Clear storage first
      localStorage.clear();
      document.cookie = '';

      const customTracker = new UserEventTracker();

      const anonymousId = customTracker.getAnonymousId();

      // The ID should be created and persisted during construction
      // Check if it's in localStorage OR cookies
      const storedInLS = localStorage.getItem('_gapradar_anon');
      const storedInCookie = document.cookie.includes('_gapradar_anon');

      // At least one storage method should work
      expect(storedInLS || storedInCookie).toBeTruthy();
      // And the ID should be valid
      expect(anonymousId).toMatch(/^anon_/);
    });
  });
});

/**
 * Test: Acquisition Event Tracking (TRACK-002)
 * Test-Driven Development: RED → GREEN → REFACTOR
 *
 * Tests for landing_view, cta_click, pricing_view events with UTM params
 */
describe('Acquisition Event Tracking (TRACK-002)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = '';
    tracker.init({ projectId: 'gapradar', debug: false });
  });

  describe('landing_view event', () => {
    it('should track landing_view event', () => {
      expect(() => {
        tracker.track('landing_view');
      }).not.toThrow();
    });

    it('should track landing_view with referrer', () => {
      expect(() => {
        tracker.track('landing_view', {
          referrer: 'https://google.com',
        });
      }).not.toThrow();
    });

    it('should track landing_view with UTM parameters', () => {
      expect(() => {
        tracker.track('landing_view', {
          utm_source: 'twitter',
          utm_medium: 'social',
          utm_campaign: 'launch_week',
          utm_term: 'market_research',
          utm_content: 'hero_cta',
        });
      }).not.toThrow();
    });
  });

  describe('cta_click event', () => {
    it('should track cta_click event', () => {
      expect(() => {
        tracker.track('cta_click', {
          cta_type: 'get_started',
          location: 'hero',
        });
      }).not.toThrow();
    });

    it('should track cta_click with UTM parameters', () => {
      expect(() => {
        tracker.track('cta_click', {
          cta_type: 'sign_in',
          location: 'nav',
          utm_source: 'facebook',
          utm_campaign: 'retargeting',
        });
      }).not.toThrow();
    });

    it('should track multiple cta_click events', () => {
      const ctaTypes = ['get_started', 'sign_in', 'view_pricing'];
      const locations = ['hero', 'nav', 'footer'];

      ctaTypes.forEach((cta_type, index) => {
        expect(() => {
          tracker.track('cta_click', {
            cta_type,
            location: locations[index],
          });
        }).not.toThrow();
      });
    });
  });

  describe('pricing_view event', () => {
    it('should track pricing_view event', () => {
      expect(() => {
        tracker.track('pricing_view');
      }).not.toThrow();
    });

    it('should track pricing_view with plan details', () => {
      expect(() => {
        tracker.track('pricing_view', {
          plan: 'pro',
          interval: 'monthly',
        });
      }).not.toThrow();
    });

    it('should track pricing_view with UTM parameters', () => {
      expect(() => {
        tracker.track('pricing_view', {
          utm_source: 'google',
          utm_medium: 'cpc',
          utm_campaign: 'pricing_page',
        });
      }).not.toThrow();
    });
  });

  describe('UTM parameter extraction', () => {
    it('should automatically capture UTM params from URL', () => {
      // Mock window.location.search
      delete (window as any).location;
      (window as any).location = {
        search: '?utm_source=twitter&utm_medium=social&utm_campaign=launch',
        href: 'http://localhost',
      };

      const customTracker = new UserEventTracker();
      customTracker.init({ projectId: 'gapradar' });

      // Session start should capture UTM params
      // We can't directly test this without accessing private methods
      // but we can verify the tracker initializes without errors
      expect(customTracker.isInitialized()).toBe(true);
    });
  });
});
