/**
 * Landing Page Analytics Tracking
 *
 * Tracks user interactions on the landing page:
 * - Page views
 * - CTA clicks (Sign In, Get Started)
 * - NLP search submits
 * - Trend topic clicks
 * - Conversion events (signup started/completed)
 */

export type LandingEvent =
  | 'landing_view'
  | 'cta_sign_in_click'
  | 'cta_get_started_click'
  | 'nlp_search_focus'
  | 'nlp_search_submit'
  | 'trend_topic_click'
  | 'signup_started'
  | 'signup_completed';

export interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Track a landing page event
 */
export function trackLandingEvent(
  event: LandingEvent,
  properties?: EventProperties
): void {
  try {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${event}`, properties);
    }

    // Send to analytics backend (PostHog, Mixpanel, etc.)
    if (typeof window !== 'undefined') {
      // Check if PostHog is available
      if ('posthog' in window && typeof (window as any).posthog?.capture === 'function') {
        (window as any).posthog.capture(event, properties);
        return;
      }

      // Fallback: Send to our own analytics endpoint
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          properties: {
            ...properties,
            timestamp: new Date().toISOString(),
            page: window.location.pathname,
            referrer: document.referrer || undefined,
          },
        }),
        keepalive: true, // Ensure event is sent even if user navigates away
      }).catch((error) => {
        // Silent fail - don't disrupt user experience
        console.error('Analytics error:', error);
      });
    }
  } catch (error) {
    // Silent fail
    console.error('Analytics tracking error:', error);
  }
}

/**
 * Track landing page view
 */
export function trackLandingView(): void {
  trackLandingEvent('landing_view', {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  });
}

/**
 * Track CTA button click
 */
export function trackCTAClick(cta: 'sign_in' | 'get_started', location?: string): void {
  const event = cta === 'sign_in' ? 'cta_sign_in_click' : 'cta_get_started_click';
  trackLandingEvent(event, { location });
}

/**
 * Track NLP search interaction
 */
export function trackNLPSearch(action: 'focus' | 'submit', query?: string): void {
  const event = action === 'focus' ? 'nlp_search_focus' : 'nlp_search_submit';
  trackLandingEvent(event, {
    query: query?.substring(0, 100), // Limit query length for privacy
    queryLength: query?.length,
  });
}

/**
 * Track trending topic click
 */
export function trackTrendClick(topic: string, category?: string, opportunityScore?: number): void {
  trackLandingEvent('trend_topic_click', {
    topic: topic.substring(0, 100),
    category,
    opportunityScore,
  });
}

/**
 * Track signup conversion
 */
export function trackSignup(stage: 'started' | 'completed', method?: string): void {
  const event = stage === 'started' ? 'signup_started' : 'signup_completed';
  trackLandingEvent(event, { method });
}
