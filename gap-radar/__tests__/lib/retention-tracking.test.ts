/**
 * Test: Retention Event Tracking (TRACK-006)
 * Test-Driven Development: RED → GREEN → REFACTOR
 *
 * Tests for return_session, returning_user events
 */

import { tracker } from '@/lib/tracking/userEventTracker';
import {
  trackReturnSession,
  trackReturningUser,
} from '@/lib/tracking/retention';

describe('Retention Event Tracking (TRACK-006)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = '';
    tracker.init({ projectId: 'gapradar', debug: false });
  });

  describe('return_session event', () => {
    it('should track return_session event', () => {
      expect(() => {
        trackReturnSession();
      }).not.toThrow();
    });

    it('should track return_session with session count', () => {
      expect(() => {
        trackReturnSession({
          session_count: 5,
        });
      }).not.toThrow();
    });

    it('should track return_session with days_since_signup', () => {
      expect(() => {
        trackReturnSession({
          days_since_signup: 7,
        });
      }).not.toThrow();
    });

    it('should track return_session with days_since_last_session', () => {
      expect(() => {
        trackReturnSession({
          days_since_last_session: 2,
        });
      }).not.toThrow();
    });

    it('should track return_session with full properties', () => {
      expect(() => {
        trackReturnSession({
          session_count: 10,
          days_since_signup: 30,
          days_since_last_session: 3,
          source: 'email',
          feature_used: 'run_created',
        });
      }).not.toThrow();
    });
  });

  describe('returning_user event', () => {
    it('should track returning_user event', () => {
      expect(() => {
        trackReturningUser();
      }).not.toThrow();
    });

    it('should track returning_user with days_since_signup', () => {
      expect(() => {
        trackReturningUser({
          days_since_signup: 14,
        });
      }).not.toThrow();
    });

    it('should track returning_user with session_count', () => {
      expect(() => {
        trackReturningUser({
          session_count: 8,
        });
      }).not.toThrow();
    });

    it('should track returning_user with retention_bucket', () => {
      expect(() => {
        trackReturningUser({
          retention_bucket: 'weekly',
        });
      }).not.toThrow();
    });

    it('should track returning_user with full properties', () => {
      expect(() => {
        trackReturningUser({
          days_since_signup: 21,
          session_count: 12,
          retention_bucket: 'monthly',
          last_active_date: '2026-01-15',
          plan: 'pro',
        });
      }).not.toThrow();
    });
  });

  describe('Session tracking flow', () => {
    it('should track user returning after first session', () => {
      // Simulate first login
      tracker.identify('usr_123', { email: 'user@example.com' });

      // Track return session (second visit)
      trackReturnSession({
        session_count: 2,
        days_since_signup: 1,
        days_since_last_session: 1,
      });

      expect(tracker.getUserId()).toBe('usr_123');
    });

    it('should track returning user milestone', () => {
      // Simulate identified user
      tracker.identify('usr_456', { email: 'user@example.com' });

      // Track returning user event (e.g., 7-day milestone)
      trackReturningUser({
        days_since_signup: 7,
        session_count: 5,
        retention_bucket: 'weekly',
      });

      expect(tracker.getUserId()).toBe('usr_456');
    });
  });

  describe('Retention bucket classification', () => {
    it('should track daily returning users', () => {
      expect(() => {
        trackReturningUser({
          days_since_signup: 2,
          retention_bucket: 'daily',
        });
      }).not.toThrow();
    });

    it('should track weekly returning users', () => {
      expect(() => {
        trackReturningUser({
          days_since_signup: 10,
          retention_bucket: 'weekly',
        });
      }).not.toThrow();
    });

    it('should track monthly returning users', () => {
      expect(() => {
        trackReturningUser({
          days_since_signup: 45,
          retention_bucket: 'monthly',
        });
      }).not.toThrow();
    });
  });
});
