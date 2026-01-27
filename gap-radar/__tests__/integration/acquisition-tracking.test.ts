/**
 * Integration Test: Acquisition Event Tracking (TRACK-002)
 * ==========================================================
 *
 * Tests the full integration of acquisition tracking:
 * - landing_view: Tracked when landing page is viewed
 * - cta_click: Tracked when CTA buttons are clicked
 * - pricing_view: Tracked when pricing page is viewed
 *
 * All events should capture UTM parameters automatically.
 */

import { trackLandingView, trackCTAClick, trackPricingView } from '@/lib/tracking/acquisition';
import { tracker } from '@/lib/tracking/userEventTracker';

describe('Acquisition Event Tracking Integration (TRACK-002)', () => {
  beforeEach(() => {
    // Clear storage
    localStorage.clear();
    document.cookie = '';

    // Initialize tracker
    tracker.init({ projectId: 'gapradar', debug: false });

    // Spy on tracker.track to verify events are sent
    jest.spyOn(tracker, 'track');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('trackLandingView', () => {
    it('should track landing_view event', () => {
      trackLandingView();

      expect(tracker.track).toHaveBeenCalledWith('landing_view', expect.objectContaining({
        page: '/',
      }));
    });

    it('should track landing_view with referrer info', () => {
      // Mock document.referrer
      Object.defineProperty(document, 'referrer', {
        value: 'https://twitter.com',
        writable: true,
        configurable: true,
      });

      trackLandingView();

      expect(tracker.track).toHaveBeenCalledWith('landing_view', expect.objectContaining({
        referrer: 'https://twitter.com',
        referrer_domain: 'twitter.com',
      }));
    });

  });

  describe('trackCTAClick', () => {
    it('should track cta_click event with type and location', () => {
      trackCTAClick('get_started', 'hero');

      expect(tracker.track).toHaveBeenCalledWith('cta_click', expect.objectContaining({
        cta_type: 'get_started',
        location: 'hero',
      }));
    });

    it('should work without location', () => {
      trackCTAClick('view_pricing');

      expect(tracker.track).toHaveBeenCalledWith('cta_click', expect.objectContaining({
        cta_type: 'view_pricing',
      }));
    });
  });

  describe('trackPricingView', () => {
    it('should track pricing_view event', () => {
      trackPricingView();

      expect(tracker.track).toHaveBeenCalledWith('pricing_view', expect.any(Object));
    });

    it('should track pricing_view with plan details', () => {
      trackPricingView({
        plan: 'pro',
        interval: 'monthly',
      });

      expect(tracker.track).toHaveBeenCalledWith('pricing_view', expect.objectContaining({
        plan: 'pro',
        interval: 'monthly',
      }));
    });
  });
});
