/**
 * Conversion Funnel Tracking
 *
 * Tracks the complete user journey through the conversion funnel:
 * 1. Signup Started → 2. Signup Completed → 3. First Run → 4. Paid Conversion
 *
 * This helps identify drop-off points and optimize conversion rates.
 */

export type FunnelStage =
  | 'signup_started'
  | 'signup_completed'
  | 'first_run_started'
  | 'first_run_completed'
  | 'payment_started'
  | 'payment_completed';

export interface FunnelEventProperties {
  stage: FunnelStage;
  method?: string; // e.g., 'email', 'google', 'stripe', etc.
  plan?: string; // e.g., 'starter', 'builder', 'agency'
  amount?: number; // Payment amount in cents
  runId?: string; // Run ID for first run events
  projectId?: string; // Project ID
  [key: string]: string | number | boolean | undefined;
}

/**
 * Track a conversion funnel event
 */
export function trackFunnelEvent(
  stage: FunnelStage,
  properties?: Omit<FunnelEventProperties, 'stage'>
): void {
  try {
    const eventData: FunnelEventProperties = {
      stage,
      ...properties,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Funnel] ${stage}`, eventData);
    }

    // Send to analytics backend
    if (typeof window !== 'undefined') {
      // Check if PostHog is available
      if ('posthog' in window && typeof (window as any).posthog?.capture === 'function') {
        (window as any).posthog.capture('funnel_event', eventData);
        return;
      }

      // Fallback: Send to our own analytics endpoint
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'funnel_event',
          properties: {
            ...eventData,
            timestamp: new Date().toISOString(),
            page: window.location.pathname,
          },
        }),
        keepalive: true,
      }).catch((error) => {
        console.error('Funnel tracking error:', error);
      });
    }
  } catch (error) {
    console.error('Funnel tracking error:', error);
  }
}

/**
 * Track signup started
 */
export function trackSignupStarted(method: 'email' | 'google' | 'other'): void {
  trackFunnelEvent('signup_started', { method });
}

/**
 * Track signup completed
 */
export function trackSignupCompleted(method: 'email' | 'google' | 'other', userId?: string): void {
  trackFunnelEvent('signup_completed', { method, userId });
}

/**
 * Track first run started
 */
export function trackFirstRunStarted(runId: string, niche?: string): void {
  trackFunnelEvent('first_run_started', { runId, niche });
}

/**
 * Track first run completed
 */
export function trackFirstRunCompleted(runId: string, duration?: number): void {
  trackFunnelEvent('first_run_completed', { runId, duration });
}

/**
 * Track payment started
 */
export function trackPaymentStarted(plan: string, amount: number): void {
  trackFunnelEvent('payment_started', { plan, amount });
}

/**
 * Track payment completed
 */
export function trackPaymentCompleted(
  plan: string,
  amount: number,
  transactionId?: string
): void {
  trackFunnelEvent('payment_completed', {
    plan,
    amount,
    transactionId,
  });
}

/**
 * Get funnel stage order for analytics
 */
export const FUNNEL_STAGES_ORDER: FunnelStage[] = [
  'signup_started',
  'signup_completed',
  'first_run_started',
  'first_run_completed',
  'payment_started',
  'payment_completed',
];

/**
 * Calculate funnel stage index (for ordering)
 */
export function getFunnelStageIndex(stage: FunnelStage): number {
  return FUNNEL_STAGES_ORDER.indexOf(stage);
}

/**
 * Check if user has completed a funnel stage
 * (This is a helper for client-side logic - actual storage should be server-side)
 */
export function hasCompletedStage(stage: FunnelStage): boolean {
  if (typeof window === 'undefined') return false;

  const completed = localStorage.getItem(`funnel_${stage}`);
  return completed === 'true';
}

/**
 * Mark a funnel stage as completed locally
 * (For client-side optimization - server-side is source of truth)
 */
export function markStageCompleted(stage: FunnelStage): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(`funnel_${stage}`, 'true');
  localStorage.setItem(`funnel_${stage}_timestamp`, new Date().toISOString());
}
