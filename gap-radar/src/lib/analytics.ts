/**
 * Analytics Library - Central Export
 *
 * This module provides a unified interface for tracking user events,
 * conversion funnels, and business metrics across the GapRadar platform.
 *
 * Features:
 * - Landing page event tracking
 * - Conversion funnel tracking
 * - PostHog integration (when available)
 * - Fallback to custom analytics endpoint
 */

// Re-export landing page analytics
export {
  trackLandingEvent,
  trackLandingView,
  trackCTAClick,
  trackNLPSearch,
  trackTrendClick,
  trackSignup,
  type LandingEvent,
  type EventProperties,
} from './analytics/landing';

// Re-export conversion funnel analytics
export {
  trackFunnelEvent,
  trackSignupStarted,
  trackSignupCompleted,
  trackFirstRunStarted,
  trackFirstRunCompleted,
  trackPaymentStarted,
  trackPaymentCompleted,
  getFunnelStageIndex,
  hasCompletedStage,
  markStageCompleted,
  FUNNEL_STAGES_ORDER,
  type FunnelStage,
  type FunnelEventProperties,
} from './analytics/funnel';
