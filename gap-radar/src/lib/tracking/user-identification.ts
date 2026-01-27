/**
 * User Identification (TRACK-008)
 * ================================
 *
 * Identifies users and manages user traits:
 * - identifyUser: Associates a userId with the current session
 * - updateUserTraits: Updates user traits after identification
 * - clearUserIdentity: Clears user identification (e.g., on logout)
 *
 * User traits help segment users, understand cohorts, and personalize experiences.
 */

import { tracker, type UserTraits } from './userEventTracker';

/**
 * Identify a user
 *
 * Called when a user logs in or signs up. Associates a userId with the current session
 * and optionally sets user traits (email, name, plan, etc.).
 *
 * Common traits:
 * - email: User's email address
 * - name: User's full name
 * - plan: User's subscription plan (e.g., 'free', 'pro', 'enterprise')
 * - company: User's company name
 * - role: User's role (e.g., 'founder', 'marketer', 'developer')
 * - signup_date: Date user signed up (ISO string)
 * - last_login: Date of last login (ISO string)
 *
 * @param userId - Unique identifier for the user
 * @param traits - Optional user traits
 *
 * @example
 * // Identify user on login
 * identifyUser('usr_123', {
 *   email: 'john@example.com',
 *   name: 'John Doe',
 *   plan: 'pro'
 * });
 */
export function identifyUser(userId: string, traits?: UserTraits): void {
  tracker.identify(userId, traits);
}

/**
 * Update user traits
 *
 * Called to update user traits after initial identification (e.g., plan upgrade, profile update).
 * The userId remains the same; only traits are updated.
 *
 * @param traits - User traits to update
 *
 * @example
 * // Update plan after upgrade
 * updateUserTraits({
 *   plan: 'enterprise',
 *   upgrade_date: new Date().toISOString()
 * });
 */
export function updateUserTraits(traits: UserTraits): void {
  const userId = tracker.getUserId();

  if (!userId) {
    console.warn('[GapRadar Tracking] Cannot update user traits: No user is identified');
    return;
  }

  // Re-identify with updated traits
  tracker.identify(userId, traits);
}

/**
 * Clear user identity
 *
 * Called when a user logs out. Clears the userId but preserves the anonymousId
 * for continued session tracking.
 *
 * @example
 * // Clear identity on logout
 * clearUserIdentity();
 */
export function clearUserIdentity(): void {
  tracker.reset();
}
