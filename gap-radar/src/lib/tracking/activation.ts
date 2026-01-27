/**
 * Activation Event Tracking (TRACK-003)
 * ======================================
 *
 * Tracks activation funnel events:
 * - signup_start: User begins signup process
 * - login_success: User successfully logs in
 * - activation_complete: User completes activation criteria
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
 * Track signup start
 *
 * Called when user begins the signup process (e.g., clicks signup button, opens signup form).
 *
 * @param method - Signup method (e.g., 'email', 'google', 'github')
 * @param location - Where the signup was initiated (e.g., 'hero', 'nav', 'pricing')
 * @param properties - Additional properties (e.g., plan, promo_code)
 */
export function trackSignupStart(
  method?: string,
  location?: string,
  properties?: Record<string, any>
): void {
  const utm = getUTMParams();

  tracker.track('signup_start', {
    method,
    location,
    ...properties,
    ...utm,
  });
}

/**
 * Track login success
 *
 * Called when user successfully logs in.
 * Automatically identifies the user in the tracker.
 *
 * @param properties - Login properties
 * @param properties.userId - User ID (will be used to identify user)
 * @param properties.method - Login method (e.g., 'email', 'google', 'github')
 * @param properties.email - User email
 * @param properties.name - User name
 * @param properties.isNewUser - Whether this is a new user (just signed up)
 */
export function trackLoginSuccess(properties?: {
  userId?: string;
  method?: string;
  email?: string;
  name?: string;
  isNewUser?: boolean;
  [key: string]: any;
}): void {
  const utm = getUTMParams();

  // If userId is provided, identify the user
  if (properties?.userId) {
    tracker.identify(properties.userId, {
      email: properties.email,
      name: properties.name,
      isNewUser: properties.isNewUser,
    });
  }

  tracker.track('login_success', {
    ...properties,
    ...utm,
  });
}

/**
 * Track activation complete
 *
 * Called when user completes the activation criteria (e.g., email verified, profile completed, first action taken).
 *
 * @param properties - Activation properties
 * @param properties.time_to_activate - Time (in seconds) from signup to activation
 * @param properties.completed_steps - Array of activation steps completed (e.g., ['email_verified', 'profile_completed'])
 * @param properties.activation_path - The path user took to activate (e.g., 'onboarding_flow', 'direct')
 * @param properties.plan - User's plan at activation (e.g., 'free', 'pro')
 */
export function trackActivationComplete(properties?: {
  time_to_activate?: number;
  completed_steps?: string[];
  activation_path?: string;
  plan?: string;
  [key: string]: any;
}): void {
  const utm = getUTMParams();

  tracker.track('activation_complete', {
    ...properties,
    ...utm,
  });
}
