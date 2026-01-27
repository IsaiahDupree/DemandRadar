/**
 * Test: Activation Event Tracking (TRACK-003)
 * Test-Driven Development: RED → GREEN → REFACTOR
 *
 * Tests for signup_start, login_success, activation_complete events
 */

import { tracker } from '@/lib/tracking/userEventTracker';
import {
  trackSignupStart,
  trackLoginSuccess,
  trackActivationComplete,
} from '@/lib/tracking/activation';

describe('Activation Event Tracking (TRACK-003)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = '';
    tracker.init({ projectId: 'gapradar', debug: false });
  });

  describe('signup_start event', () => {
    it('should track signup_start event', () => {
      expect(() => {
        trackSignupStart();
      }).not.toThrow();
    });

    it('should track signup_start with method', () => {
      expect(() => {
        trackSignupStart('email');
      }).not.toThrow();
    });

    it('should track signup_start with location', () => {
      expect(() => {
        trackSignupStart('email', 'hero');
      }).not.toThrow();
    });

    it('should track signup_start with all properties', () => {
      expect(() => {
        trackSignupStart('google', 'nav', {
          plan: 'pro',
          promo_code: 'LAUNCH2026',
        });
      }).not.toThrow();
    });
  });

  describe('login_success event', () => {
    it('should track login_success event', () => {
      expect(() => {
        trackLoginSuccess();
      }).not.toThrow();
    });

    it('should track login_success with user ID', () => {
      expect(() => {
        trackLoginSuccess({
          userId: 'usr_123',
        });
      }).not.toThrow();
    });

    it('should track login_success with method', () => {
      expect(() => {
        trackLoginSuccess({
          method: 'email',
        });
      }).not.toThrow();
    });

    it('should track login_success with full properties', () => {
      expect(() => {
        trackLoginSuccess({
          userId: 'usr_123',
          method: 'google',
          email: 'user@example.com',
          isNewUser: false,
        });
      }).not.toThrow();
    });

    it('should identify user after login_success', () => {
      trackLoginSuccess({
        userId: 'usr_123',
        email: 'user@example.com',
        name: 'Test User',
      });

      expect(tracker.getUserId()).toBe('usr_123');
    });
  });

  describe('activation_complete event', () => {
    it('should track activation_complete event', () => {
      expect(() => {
        trackActivationComplete();
      }).not.toThrow();
    });

    it('should track activation_complete with time_to_activate', () => {
      expect(() => {
        trackActivationComplete({
          time_to_activate: 120,
        });
      }).not.toThrow();
    });

    it('should track activation_complete with completed steps', () => {
      expect(() => {
        trackActivationComplete({
          completed_steps: ['email_verified', 'profile_completed'],
        });
      }).not.toThrow();
    });

    it('should track activation_complete with full properties', () => {
      expect(() => {
        trackActivationComplete({
          time_to_activate: 180,
          completed_steps: ['email_verified', 'profile_completed', 'first_run_created'],
          activation_path: 'onboarding_flow',
          plan: 'pro',
        });
      }).not.toThrow();
    });
  });

  describe('User identification in activation flow', () => {
    it('should track anonymous user through signup to identification', () => {
      // Reset tracker to ensure clean state
      tracker.reset();

      // Step 1: Track signup start (anonymous)
      const anonymousId = tracker.getAnonymousId();
      trackSignupStart('email', 'hero');

      expect(tracker.getUserId()).toBeNull();
      expect(tracker.getAnonymousId()).toBe(anonymousId);

      // Step 2: Track login success (identifies user)
      trackLoginSuccess({
        userId: 'usr_456',
        email: 'new@example.com',
        method: 'email',
        isNewUser: true,
      });

      expect(tracker.getUserId()).toBe('usr_456');

      // Step 3: Track activation complete
      trackActivationComplete({
        time_to_activate: 90,
        completed_steps: ['email_verified'],
      });

      expect(tracker.getUserId()).toBe('usr_456');
    });

    it('should track returning user login', () => {
      // Returning user logs in
      trackLoginSuccess({
        userId: 'usr_789',
        email: 'returning@example.com',
        method: 'google',
        isNewUser: false,
      });

      expect(tracker.getUserId()).toBe('usr_789');
    });
  });

  describe('UTM parameter capture', () => {
    it('should capture UTM params with signup_start', () => {
      // Mock window.location.search
      delete (window as any).location;
      (window as any).location = {
        search: '?utm_source=facebook&utm_campaign=signup',
        pathname: '/',
        href: 'http://localhost',
      };

      expect(() => {
        trackSignupStart('email', 'hero');
      }).not.toThrow();
    });
  });
});
