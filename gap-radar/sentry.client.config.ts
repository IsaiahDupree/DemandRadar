/**
 * Sentry Client Configuration
 *
 * This file configures Sentry for client-side error tracking.
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  // Define how likely traces are sampled. Adjust this value in production.
  // Learn more: https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Replay configuration for session replay
  replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors
  replaysSessionSampleRate: 0.1, // Capture 10% of all sessions for replay

  integrations: [
    Sentry.replayIntegration({
      // Additional SDK configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Environment configuration
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',

  // Filter out certain errors
  beforeSend(event, hint) {
    // Don't send events if no DSN is configured
    if (!SENTRY_DSN) {
      return null;
    }

    // Filter out known noisy errors
    const error = hint.originalException;

    if (error && typeof error === 'object' && 'message' in error) {
      const message = String(error.message);

      // Filter out network errors that are user-caused
      if (message.includes('NetworkError') || message.includes('Failed to fetch')) {
        return null;
      }

      // Filter out browser extension errors
      if (message.includes('chrome-extension://') || message.includes('moz-extension://')) {
        return null;
      }
    }

    return event;
  },

  // Ignore certain errors
  ignoreErrors: [
    // Browser extension errors
    'Non-Error promise rejection captured',
    // Network errors
    'NetworkError',
    'Failed to fetch',
    // ResizeObserver errors (usually harmless)
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
  ],
});
