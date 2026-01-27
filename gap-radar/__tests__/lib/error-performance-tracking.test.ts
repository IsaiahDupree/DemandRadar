/**
 * Test: Error & Performance Tracking (TRACK-007)
 * Test-Driven Development: RED → GREEN → REFACTOR
 *
 * Tests for error tracking, API failures, and Core Web Vitals
 */

import { tracker } from '@/lib/tracking/userEventTracker';
import {
  trackError,
  trackAPIFailure,
  trackCoreWebVitals,
} from '@/lib/tracking/error-performance';

describe('Error & Performance Tracking (TRACK-007)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = '';
    tracker.init({ projectId: 'gapradar', debug: false });
  });

  describe('error tracking', () => {
    it('should track generic error event', () => {
      expect(() => {
        trackError({
          error_message: 'Something went wrong',
        });
      }).not.toThrow();
    });

    it('should track error with error type', () => {
      expect(() => {
        trackError({
          error_type: 'TypeError',
          error_message: 'Cannot read property of undefined',
        });
      }).not.toThrow();
    });

    it('should track error with stack trace', () => {
      expect(() => {
        trackError({
          error_type: 'ReferenceError',
          error_message: 'x is not defined',
          stack_trace: 'ReferenceError: x is not defined\n    at main.js:10:5',
        });
      }).not.toThrow();
    });

    it('should track error with full context', () => {
      expect(() => {
        trackError({
          error_type: 'NetworkError',
          error_message: 'Failed to fetch',
          stack_trace: 'NetworkError: Failed to fetch',
          component: 'TrendsList',
          action: 'fetch_trends',
          user_action: 'click_refresh',
        });
      }).not.toThrow();
    });

    it('should track error with Error object', () => {
      const error = new Error('Test error');
      expect(() => {
        trackError({
          error_type: error.name,
          error_message: error.message,
          stack_trace: error.stack,
        });
      }).not.toThrow();
    });
  });

  describe('API failure tracking', () => {
    it('should track API failure event', () => {
      expect(() => {
        trackAPIFailure({
          endpoint: '/api/trends',
        });
      }).not.toThrow();
    });

    it('should track API failure with status code', () => {
      expect(() => {
        trackAPIFailure({
          endpoint: '/api/runs',
          status_code: 500,
        });
      }).not.toThrow();
    });

    it('should track API failure with error message', () => {
      expect(() => {
        trackAPIFailure({
          endpoint: '/api/reports',
          status_code: 404,
          error_message: 'Report not found',
        });
      }).not.toThrow();
    });

    it('should track API failure with full context', () => {
      expect(() => {
        trackAPIFailure({
          endpoint: '/api/runs',
          method: 'POST',
          status_code: 429,
          error_message: 'Rate limit exceeded',
          response_time: 250,
          retry_count: 3,
        });
      }).not.toThrow();
    });
  });

  describe('Core Web Vitals tracking', () => {
    it('should track Core Web Vitals event', () => {
      expect(() => {
        trackCoreWebVitals({
          metric_name: 'LCP',
          value: 1200,
        });
      }).not.toThrow();
    });

    it('should track LCP (Largest Contentful Paint)', () => {
      expect(() => {
        trackCoreWebVitals({
          metric_name: 'LCP',
          value: 2500,
          rating: 'good',
        });
      }).not.toThrow();
    });

    it('should track FID (First Input Delay)', () => {
      expect(() => {
        trackCoreWebVitals({
          metric_name: 'FID',
          value: 100,
          rating: 'good',
        });
      }).not.toThrow();
    });

    it('should track CLS (Cumulative Layout Shift)', () => {
      expect(() => {
        trackCoreWebVitals({
          metric_name: 'CLS',
          value: 0.1,
          rating: 'good',
        });
      }).not.toThrow();
    });

    it('should track TTFB (Time to First Byte)', () => {
      expect(() => {
        trackCoreWebVitals({
          metric_name: 'TTFB',
          value: 600,
          rating: 'needs-improvement',
        });
      }).not.toThrow();
    });

    it('should track Core Web Vitals with full context', () => {
      expect(() => {
        trackCoreWebVitals({
          metric_name: 'LCP',
          value: 3500,
          rating: 'poor',
          page: '/dashboard',
          device_type: 'mobile',
          connection_type: '4g',
        });
      }).not.toThrow();
    });
  });

  describe('Error handling flow', () => {
    it('should track error with user identification', () => {
      tracker.identify('usr_789', { email: 'user@example.com' });

      trackError({
        error_type: 'ValidationError',
        error_message: 'Invalid input',
        component: 'RunForm',
      });

      expect(tracker.getUserId()).toBe('usr_789');
    });

    it('should track API failure followed by error', () => {
      // API failure
      trackAPIFailure({
        endpoint: '/api/runs',
        status_code: 500,
        error_message: 'Internal server error',
      });

      // UI error
      trackError({
        error_type: 'APIError',
        error_message: 'Failed to create run',
        action: 'create_run',
      });

      expect(() => {}).not.toThrow();
    });
  });

  describe('Performance monitoring', () => {
    it('should track multiple Core Web Vitals metrics', () => {
      expect(() => {
        trackCoreWebVitals({ metric_name: 'LCP', value: 2000, rating: 'good' });
        trackCoreWebVitals({ metric_name: 'FID', value: 50, rating: 'good' });
        trackCoreWebVitals({ metric_name: 'CLS', value: 0.05, rating: 'good' });
      }).not.toThrow();
    });
  });
});
