/**
 * Retention Event Tracking (TRACK-006)
 * =====================================
 *
 * Tracks retention and engagement events:
 * - return_session: User returns for another session
 * - returning_user: User milestone events (daily, weekly, monthly active)
 *
 * These events help measure user retention, engagement patterns, and lifecycle cohorts.
 */

import { tracker } from './userEventTracker';

/**
 * Track return session
 *
 * Called when a user returns to the app for another session.
 * Helps measure session frequency, gap between sessions, and engagement patterns.
 *
 * @param properties - Return session properties
 * @param properties.session_count - Total number of sessions for this user
 * @param properties.days_since_signup - Days since user first signed up
 * @param properties.days_since_last_session - Days since user's last session
 * @param properties.source - How user returned (e.g., 'direct', 'email', 'notification')
 * @param properties.feature_used - First feature used in this session
 */
export function trackReturnSession(properties?: {
  session_count?: number;
  days_since_signup?: number;
  days_since_last_session?: number;
  source?: string;
  feature_used?: string;
  [key: string]: any;
}): void {
  tracker.track('return_session', {
    ...properties,
  });
}

/**
 * Track returning user
 *
 * Called when a user reaches retention milestones (e.g., daily active, weekly active, monthly active).
 * Helps measure retention cohorts and user lifecycle stages.
 *
 * @param properties - Returning user properties
 * @param properties.days_since_signup - Days since user first signed up
 * @param properties.session_count - Total number of sessions for this user
 * @param properties.retention_bucket - Retention classification ('daily', 'weekly', 'monthly')
 * @param properties.last_active_date - Date of user's last activity (ISO string)
 * @param properties.plan - User's current plan (e.g., 'free', 'pro')
 */
export function trackReturningUser(properties?: {
  days_since_signup?: number;
  session_count?: number;
  retention_bucket?: 'daily' | 'weekly' | 'monthly';
  last_active_date?: string;
  plan?: string;
  [key: string]: any;
}): void {
  tracker.track('returning_user', {
    ...properties,
  });
}
