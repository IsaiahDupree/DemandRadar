/**
 * Test: User Identification (TRACK-008)
 * Test-Driven Development: RED → GREEN → REFACTOR
 *
 * Tests for user identification with traits
 */

import { tracker } from '@/lib/tracking/userEventTracker';
import {
  identifyUser,
  updateUserTraits,
  clearUserIdentity,
} from '@/lib/tracking/user-identification';

describe('User Identification (TRACK-008)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = '';
    tracker.init({ projectId: 'gapradar', debug: false });
    tracker.reset(); // Ensure clean state
  });

  describe('identifyUser', () => {
    it('should identify user with userId only', () => {
      expect(() => {
        identifyUser('usr_123');
      }).not.toThrow();

      expect(tracker.getUserId()).toBe('usr_123');
    });

    it('should identify user with email trait', () => {
      identifyUser('usr_456', {
        email: 'user@example.com',
      });

      expect(tracker.getUserId()).toBe('usr_456');
    });

    it('should identify user with name trait', () => {
      identifyUser('usr_789', {
        name: 'John Doe',
      });

      expect(tracker.getUserId()).toBe('usr_789');
    });

    it('should identify user with plan trait', () => {
      identifyUser('usr_101', {
        plan: 'pro',
      });

      expect(tracker.getUserId()).toBe('usr_101');
    });

    it('should identify user with full traits', () => {
      identifyUser('usr_202', {
        email: 'john@example.com',
        name: 'John Doe',
        plan: 'pro',
        company: 'Acme Inc',
        role: 'founder',
      });

      expect(tracker.getUserId()).toBe('usr_202');
    });

    it('should identify user with signup date', () => {
      identifyUser('usr_303', {
        email: 'user@example.com',
        signup_date: '2026-01-15',
      });

      expect(tracker.getUserId()).toBe('usr_303');
    });

    it('should identify user with custom traits', () => {
      identifyUser('usr_404', {
        email: 'user@example.com',
        industry: 'SaaS',
        team_size: 5,
        monthly_revenue: 10000,
      });

      expect(tracker.getUserId()).toBe('usr_404');
    });
  });

  describe('updateUserTraits', () => {
    beforeEach(() => {
      // Identify user first
      identifyUser('usr_500', {
        email: 'user@example.com',
        plan: 'free',
      });
    });

    it('should update user traits', () => {
      expect(() => {
        updateUserTraits({
          plan: 'pro',
        });
      }).not.toThrow();
    });

    it('should update multiple traits', () => {
      expect(() => {
        updateUserTraits({
          plan: 'pro',
          company: 'New Company',
          team_size: 10,
        });
      }).not.toThrow();
    });

    it('should preserve userId after updating traits', () => {
      updateUserTraits({
        plan: 'enterprise',
      });

      expect(tracker.getUserId()).toBe('usr_500');
    });
  });

  describe('clearUserIdentity', () => {
    beforeEach(() => {
      identifyUser('usr_600', {
        email: 'user@example.com',
      });
    });

    it('should clear user identity', () => {
      expect(tracker.getUserId()).toBe('usr_600');

      clearUserIdentity();

      expect(tracker.getUserId()).toBeNull();
    });

    it('should allow re-identification after clearing', () => {
      clearUserIdentity();

      identifyUser('usr_700', {
        email: 'newuser@example.com',
      });

      expect(tracker.getUserId()).toBe('usr_700');
    });
  });

  describe('User lifecycle flow', () => {
    it('should track anonymous user → identified user → logout', () => {
      // Anonymous user
      const anonymousId = tracker.getAnonymousId();
      expect(tracker.getUserId()).toBeNull();
      expect(anonymousId).toBeTruthy();

      // User signs up and is identified
      identifyUser('usr_800', {
        email: 'newuser@example.com',
        name: 'New User',
        plan: 'free',
        signup_date: new Date().toISOString(),
      });

      expect(tracker.getUserId()).toBe('usr_800');

      // User upgrades plan
      updateUserTraits({
        plan: 'pro',
        upgrade_date: new Date().toISOString(),
      });

      expect(tracker.getUserId()).toBe('usr_800');

      // User logs out
      clearUserIdentity();

      expect(tracker.getUserId()).toBeNull();
    });

    it('should handle returning user login', () => {
      // Returning user logs in
      identifyUser('usr_900', {
        email: 'returning@example.com',
        name: 'Returning User',
        plan: 'pro',
        signup_date: '2026-01-01',
        last_login: new Date().toISOString(),
      });

      expect(tracker.getUserId()).toBe('usr_900');
    });
  });

  describe('Trait validation', () => {
    it('should handle empty traits object', () => {
      expect(() => {
        identifyUser('usr_1000', {});
      }).not.toThrow();

      expect(tracker.getUserId()).toBe('usr_1000');
    });

    it('should handle null values in traits', () => {
      expect(() => {
        identifyUser('usr_1001', {
          email: 'user@example.com',
          company: null,
          role: null,
        });
      }).not.toThrow();
    });

    it('should handle undefined values in traits', () => {
      expect(() => {
        identifyUser('usr_1002', {
          email: 'user@example.com',
          company: undefined,
          role: undefined,
        });
      }).not.toThrow();
    });
  });
});
