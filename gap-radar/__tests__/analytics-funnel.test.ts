/**
 * Conversion Funnel Tracking Tests
 *
 * Tests the funnel tracking system for the complete user journey
 * @jest-environment jsdom
 */

import {
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
} from '@/lib/analytics/funnel';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Conversion Funnel Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    // Clean up PostHog
    delete (window as any).posthog;
  });

  describe('trackFunnelEvent', () => {
    it('should send funnel event to analytics endpoint', () => {
      trackFunnelEvent('signup_started', { method: 'email' });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/analytics',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
        })
      );

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.event).toBe('funnel_event');
      expect(body.properties.stage).toBe('signup_started');
      expect(body.properties.method).toBe('email');
      expect(body.properties.timestamp).toBeDefined();
    });

    it('should use PostHog if available', () => {
      const mockPostHog = {
        capture: jest.fn(),
      };

      (window as any).posthog = mockPostHog;

      trackFunnelEvent('signup_completed', { method: 'google' });

      expect(mockPostHog.capture).toHaveBeenCalledWith('funnel_event', {
        stage: 'signup_completed',
        method: 'google',
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      trackFunnelEvent('first_run_started', { runId: 'test-123' });

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Funnel tracking error:',
        expect.any(Error)
      );
    });
  });

  describe('Funnel Stage Tracking Functions', () => {
    it('should track signup started', () => {
      trackSignupStarted('email');

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.properties.stage).toBe('signup_started');
      expect(body.properties.method).toBe('email');
    });

    it('should track signup completed with user ID', () => {
      trackSignupCompleted('google', 'user-123');

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.properties.stage).toBe('signup_completed');
      expect(body.properties.method).toBe('google');
      expect(body.properties.userId).toBe('user-123');
    });

    it('should track first run started', () => {
      trackFirstRunStarted('run-456', 'AI marketing tools');

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.properties.stage).toBe('first_run_started');
      expect(body.properties.runId).toBe('run-456');
      expect(body.properties.niche).toBe('AI marketing tools');
    });

    it('should track first run completed with duration', () => {
      trackFirstRunCompleted('run-456', 125000);

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.properties.stage).toBe('first_run_completed');
      expect(body.properties.runId).toBe('run-456');
      expect(body.properties.duration).toBe(125000);
    });

    it('should track payment started', () => {
      trackPaymentStarted('builder', 9900);

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.properties.stage).toBe('payment_started');
      expect(body.properties.plan).toBe('builder');
      expect(body.properties.amount).toBe(9900);
    });

    it('should track payment completed with transaction ID', () => {
      trackPaymentCompleted('builder', 9900, 'txn_abc123');

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.properties.stage).toBe('payment_completed');
      expect(body.properties.plan).toBe('builder');
      expect(body.properties.amount).toBe(9900);
      expect(body.properties.transactionId).toBe('txn_abc123');
    });
  });

  describe('Funnel Stage Ordering', () => {
    it('should have correct funnel stages order', () => {
      expect(FUNNEL_STAGES_ORDER).toEqual([
        'signup_started',
        'signup_completed',
        'first_run_started',
        'first_run_completed',
        'payment_started',
        'payment_completed',
      ]);
    });

    it('should return correct funnel stage index', () => {
      expect(getFunnelStageIndex('signup_started')).toBe(0);
      expect(getFunnelStageIndex('signup_completed')).toBe(1);
      expect(getFunnelStageIndex('first_run_started')).toBe(2);
      expect(getFunnelStageIndex('first_run_completed')).toBe(3);
      expect(getFunnelStageIndex('payment_started')).toBe(4);
      expect(getFunnelStageIndex('payment_completed')).toBe(5);
    });
  });

  describe('Local Stage Completion Tracking', () => {
    it('should mark stage as completed', () => {
      expect(hasCompletedStage('signup_started')).toBe(false);

      markStageCompleted('signup_started');

      expect(hasCompletedStage('signup_started')).toBe(true);
      expect(localStorageMock.getItem('funnel_signup_started')).toBe('true');
      expect(localStorageMock.getItem('funnel_signup_started_timestamp')).toBeDefined();
    });

    it('should track multiple completed stages', () => {
      markStageCompleted('signup_started');
      markStageCompleted('signup_completed');
      markStageCompleted('first_run_started');

      expect(hasCompletedStage('signup_started')).toBe(true);
      expect(hasCompletedStage('signup_completed')).toBe(true);
      expect(hasCompletedStage('first_run_started')).toBe(true);
      expect(hasCompletedStage('first_run_completed')).toBe(false);
    });
  });

  describe('Complete Funnel Flow', () => {
    it('should track complete conversion funnel', () => {
      // Stage 1: Signup started
      trackSignupStarted('email');
      markStageCompleted('signup_started');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Stage 2: Signup completed
      trackSignupCompleted('email', 'user-789');
      markStageCompleted('signup_completed');
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Stage 3: First run started
      trackFirstRunStarted('run-001', 'productivity tools');
      markStageCompleted('first_run_started');
      expect(mockFetch).toHaveBeenCalledTimes(3);

      // Stage 4: First run completed
      trackFirstRunCompleted('run-001', 180000);
      markStageCompleted('first_run_completed');
      expect(mockFetch).toHaveBeenCalledTimes(4);

      // Stage 5: Payment started
      trackPaymentStarted('starter', 2900);
      markStageCompleted('payment_started');
      expect(mockFetch).toHaveBeenCalledTimes(5);

      // Stage 6: Payment completed
      trackPaymentCompleted('starter', 2900, 'txn_final');
      markStageCompleted('payment_completed');
      expect(mockFetch).toHaveBeenCalledTimes(6);

      // Verify all stages are tracked
      const events = mockFetch.mock.calls.map(call => {
        const body = JSON.parse(call[1].body);
        return body.properties.stage;
      });

      expect(events).toEqual([
        'signup_started',
        'signup_completed',
        'first_run_started',
        'first_run_completed',
        'payment_started',
        'payment_completed',
      ]);

      // Verify all stages are marked as completed
      FUNNEL_STAGES_ORDER.forEach(stage => {
        expect(hasCompletedStage(stage)).toBe(true);
      });
    });
  });

  describe('Drop-off Detection', () => {
    it('should identify drop-off at signup completed', () => {
      trackSignupStarted('email');
      markStageCompleted('signup_started');

      // User drops off here - no signup_completed event
      expect(hasCompletedStage('signup_started')).toBe(true);
      expect(hasCompletedStage('signup_completed')).toBe(false);
      expect(hasCompletedStage('first_run_started')).toBe(false);
    });

    it('should identify drop-off at first run', () => {
      trackSignupStarted('email');
      markStageCompleted('signup_started');

      trackSignupCompleted('email', 'user-123');
      markStageCompleted('signup_completed');

      // User drops off here - no first_run_started event
      expect(hasCompletedStage('signup_completed')).toBe(true);
      expect(hasCompletedStage('first_run_started')).toBe(false);
      expect(hasCompletedStage('payment_started')).toBe(false);
    });

    it('should identify drop-off at payment', () => {
      trackSignupStarted('email');
      markStageCompleted('signup_started');

      trackSignupCompleted('email', 'user-123');
      markStageCompleted('signup_completed');

      trackFirstRunStarted('run-001', 'test');
      markStageCompleted('first_run_started');

      trackFirstRunCompleted('run-001', 60000);
      markStageCompleted('first_run_completed');

      // User drops off here - no payment event
      expect(hasCompletedStage('first_run_completed')).toBe(true);
      expect(hasCompletedStage('payment_started')).toBe(false);
      expect(hasCompletedStage('payment_completed')).toBe(false);
    });
  });
});
