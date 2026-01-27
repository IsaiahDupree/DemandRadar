/**
 * Acquisition Event Tracking (TRACK-002)
 * ======================================
 *
 * Tracks acquisition funnel events with UTM parameters:
 * - landing_view: User lands on the website
 * - cta_click: User clicks on any CTA button (Get Started, Sign In, etc.)
 * - pricing_view: User views the pricing page
 *
 * All events automatically capture UTM parameters from the URL.
 */

import { tracker } from './userEventTracker';

/**
 * Extract UTM parameters from current URL
 */
function getUTMParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};

  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  utmKeys.forEach(key => {
    const value = params.get(key);
    if (value) {
      utm[key] = value;
    }
  });

  return utm;
}

/**
 * Get referrer information
 */
function getReferrerInfo(): Record<string, string> {
  if (typeof document === 'undefined') return {};

  const referrer = document.referrer;
  if (!referrer) return {};

  try {
    const url = new URL(referrer);
    return {
      referrer,
      referrer_domain: url.hostname,
    };
  } catch {
    return { referrer };
  }
}

/**
 * Track landing page view
 *
 * Called when user first lands on the website.
 * Automatically captures UTM parameters and referrer.
 */
export function trackLandingView(): void {
  const utm = getUTMParams();
  const referrerInfo = getReferrerInfo();

  tracker.track('landing_view', {
    ...utm,
    ...referrerInfo,
    page: typeof window !== 'undefined' ? window.location.pathname : undefined,
  });
}

/**
 * Track CTA button click
 *
 * @param ctaType - Type of CTA (e.g., 'get_started', 'sign_in', 'view_pricing')
 * @param location - Where the CTA is located (e.g., 'hero', 'nav', 'footer')
 */
export function trackCTAClick(ctaType: string, location?: string): void {
  const utm = getUTMParams();

  tracker.track('cta_click', {
    cta_type: ctaType,
    location,
    ...utm,
  });
}

/**
 * Track pricing page view
 *
 * @param properties - Optional properties like plan, interval
 */
export function trackPricingView(properties?: {
  plan?: string;
  interval?: 'monthly' | 'yearly';
  [key: string]: any;
}): void {
  const utm = getUTMParams();

  tracker.track('pricing_view', {
    ...properties,
    ...utm,
  });
}

/**
 * Initialize acquisition tracking
 *
 * Call this once when the app starts.
 */
export function initAcquisitionTracking(): void {
  tracker.init({
    projectId: 'gapradar',
    apiEndpoint: process.env.NEXT_PUBLIC_TRACKING_API || '/api/tracking',
    debug: process.env.NODE_ENV === 'development',
    autoTrack: {
      pageViews: false, // We'll track manually for better control
      clicks: false, // We'll track CTAs manually
      scrollDepth: true,
      forms: true,
      errors: true,
      performance: true,
      outboundLinks: true,
    },
  });
}
