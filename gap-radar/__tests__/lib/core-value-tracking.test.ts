/**
 * Test: Core Value Event Tracking (TRACK-004)
 * Test-Driven Development: RED → GREEN → REFACTOR
 *
 * Tests for product-specific value events:
 * - run_created: User creates a new analysis run
 * - run_completed: Analysis run finishes
 * - report_viewed: User views a report
 * - report_downloaded: User downloads a report (PDF/CSV)
 * - trend_clicked: User clicks on a trending topic
 */

import { tracker } from '@/lib/tracking/userEventTracker';
import {
  trackRunCreated,
  trackRunCompleted,
  trackReportViewed,
  trackReportDownloaded,
  trackTrendClicked,
} from '@/lib/tracking/core-value';

describe('Core Value Event Tracking (TRACK-004)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = '';
    tracker.init({ projectId: 'gapradar', debug: false });
  });

  describe('run_created event', () => {
    it('should track run_created event', () => {
      expect(() => {
        trackRunCreated();
      }).not.toThrow();
    });

    it('should track run_created with minimal properties', () => {
      expect(() => {
        trackRunCreated({
          run_id: 'run_123',
        });
      }).not.toThrow();
    });

    it('should track run_created with full properties', () => {
      expect(() => {
        trackRunCreated({
          run_id: 'run_123',
          query: 'meal planning apps',
          category: 'productivity',
          estimated_duration: 300,
          plan: 'pro',
        });
      }).not.toThrow();
    });
  });

  describe('run_completed event', () => {
    it('should track run_completed event', () => {
      expect(() => {
        trackRunCompleted();
      }).not.toThrow();
    });

    it('should track run_completed with minimal properties', () => {
      expect(() => {
        trackRunCompleted({
          run_id: 'run_123',
        });
      }).not.toThrow();
    });

    it('should track run_completed with full properties', () => {
      expect(() => {
        trackRunCompleted({
          run_id: 'run_123',
          duration: 285,
          status: 'success',
          results_count: 15,
          opportunity_score: 82,
          data_sources: ['reddit', 'meta_ads', 'app_store'],
        });
      }).not.toThrow();
    });

    it('should track run_completed with error status', () => {
      expect(() => {
        trackRunCompleted({
          run_id: 'run_456',
          duration: 120,
          status: 'error',
          error_message: 'API rate limit exceeded',
        });
      }).not.toThrow();
    });
  });

  describe('report_viewed event', () => {
    it('should track report_viewed event', () => {
      expect(() => {
        trackReportViewed();
      }).not.toThrow();
    });

    it('should track report_viewed with minimal properties', () => {
      expect(() => {
        trackReportViewed({
          run_id: 'run_123',
          report_id: 'rep_456',
        });
      }).not.toThrow();
    });

    it('should track report_viewed with full properties', () => {
      expect(() => {
        trackReportViewed({
          run_id: 'run_123',
          report_id: 'rep_456',
          section: 'gap_analysis',
          view_type: 'full',
          time_on_page: 45,
        });
      }).not.toThrow();
    });
  });

  describe('report_downloaded event', () => {
    it('should track report_downloaded event', () => {
      expect(() => {
        trackReportDownloaded();
      }).not.toThrow();
    });

    it('should track report_downloaded with format', () => {
      expect(() => {
        trackReportDownloaded({
          format: 'pdf',
        });
      }).not.toThrow();
    });

    it('should track report_downloaded with full properties', () => {
      expect(() => {
        trackReportDownloaded({
          run_id: 'run_123',
          report_id: 'rep_456',
          format: 'pdf',
          sections_included: ['gap_analysis', 'competitors', 'recommendations'],
          file_size: 2048,
        });
      }).not.toThrow();
    });

    it('should track CSV export', () => {
      expect(() => {
        trackReportDownloaded({
          run_id: 'run_789',
          format: 'csv',
          data_type: 'opportunities',
        });
      }).not.toThrow();
    });

    it('should track JSON export', () => {
      expect(() => {
        trackReportDownloaded({
          run_id: 'run_789',
          format: 'json',
          data_type: 'raw_data',
        });
      }).not.toThrow();
    });
  });

  describe('trend_clicked event', () => {
    it('should track trend_clicked event', () => {
      expect(() => {
        trackTrendClicked();
      }).not.toThrow();
    });

    it('should track trend_clicked with minimal properties', () => {
      expect(() => {
        trackTrendClicked({
          trend_id: 'trend_123',
          topic: 'AI productivity tools',
        });
      }).not.toThrow();
    });

    it('should track trend_clicked with full properties', () => {
      expect(() => {
        trackTrendClicked({
          trend_id: 'trend_123',
          topic: 'AI productivity tools',
          category: 'productivity',
          opportunity_score: 82,
          position: 3,
          source: 'landing_page',
        });
      }).not.toThrow();
    });
  });

  describe('User journey tracking', () => {
    it('should track complete value delivery flow', () => {
      tracker.identify('usr_123', { plan: 'pro' });

      // User clicks trending topic
      trackTrendClicked({
        trend_id: 'trend_123',
        topic: 'AI productivity tools',
        source: 'landing_page',
      });

      // User creates run
      trackRunCreated({
        run_id: 'run_456',
        query: 'AI productivity tools',
        category: 'productivity',
        plan: 'pro',
      });

      // Run completes
      trackRunCompleted({
        run_id: 'run_456',
        duration: 285,
        status: 'success',
        results_count: 15,
        opportunity_score: 82,
      });

      // User views report
      trackReportViewed({
        run_id: 'run_456',
        report_id: 'rep_789',
        section: 'gap_analysis',
      });

      // User downloads report
      trackReportDownloaded({
        run_id: 'run_456',
        report_id: 'rep_789',
        format: 'pdf',
      });

      expect(tracker.getUserId()).toBe('usr_123');
    });
  });

  describe('Error tracking', () => {
    it('should track failed runs', () => {
      expect(() => {
        trackRunCompleted({
          run_id: 'run_fail',
          duration: 60,
          status: 'error',
          error_message: 'Invalid query',
          error_code: 'INVALID_QUERY',
        });
      }).not.toThrow();
    });
  });
});
