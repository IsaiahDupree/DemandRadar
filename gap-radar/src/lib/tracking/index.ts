/**
 * GapRadar Event Tracking SDK
 * ============================
 *
 * Centralized event tracking for user analytics.
 */

export { tracker, UserEventTracker } from './userEventTracker';
export type { TrackerConfig, UserTraits, EventProperties } from './userEventTracker';

// Acquisition tracking (TRACK-002)
export {
  trackLandingView,
  trackCTAClick,
  trackPricingView,
  initAcquisitionTracking,
} from './acquisition';

// Activation tracking (TRACK-003)
export {
  trackSignupStart,
  trackLoginSuccess,
  trackActivationComplete,
} from './activation';

// Core value tracking (TRACK-004)
export {
  trackRunCreated,
  trackRunCompleted,
  trackReportViewed,
  trackReportDownloaded,
  trackTrendClicked,
} from './core-value';

// Monetization tracking (TRACK-005)
export {
  trackCheckoutStarted,
  trackPurchaseCompleted,
  trackSubscriptionCreated,
  trackSubscriptionUpdated,
  trackSubscriptionCancelled,
  trackSubscriptionRenewed,
} from './monetization';

// Retention tracking (TRACK-006)
export {
  trackReturnSession,
  trackReturningUser,
} from './retention';

// Error & Performance tracking (TRACK-007)
export {
  trackError,
  trackAPIFailure,
  trackCoreWebVitals,
} from './error-performance';

// User Identification (TRACK-008)
export {
  identifyUser,
  updateUserTraits,
  clearUserIdentity,
} from './user-identification';

// Re-export the singleton as default
import { tracker } from './userEventTracker';
export default tracker;
