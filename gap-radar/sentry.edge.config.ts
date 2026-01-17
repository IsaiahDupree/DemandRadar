/**
 * Sentry Edge Configuration
 *
 * This file configures Sentry for Edge runtime.
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  // Define how likely traces are sampled
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Environment configuration
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',

  beforeSend(event) {
    // Don't send events if no DSN is configured
    if (!SENTRY_DSN) {
      return null;
    }

    return event;
  },
});
