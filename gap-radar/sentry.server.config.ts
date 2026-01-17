/**
 * Sentry Server Configuration
 *
 * This file configures Sentry for server-side error tracking.
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  // Define how likely traces are sampled. Adjust this value in production.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Environment configuration
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',

  // Integrations are automatically included in Next.js SDK
  // Custom integrations can be added here if needed

  // Filter out certain errors
  beforeSend(event, hint) {
    // Don't send events if no DSN is configured
    if (!SENTRY_DSN) {
      return null;
    }

    // Add additional context
    if (event.request) {
      // Remove sensitive query parameters
      if (event.request.query_string && typeof event.request.query_string === 'string') {
        const sensitiveParams = ['api_key', 'apiKey', 'password', 'token', 'secret'];
        let queryString = event.request.query_string;

        sensitiveParams.forEach(param => {
          const regex = new RegExp(`${param}=[^&]*`, 'gi');
          queryString = queryString.replace(regex, `${param}=REDACTED`);
        });

        event.request.query_string = queryString;
      }

      // Remove sensitive headers
      if (event.request.headers) {
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
        sensitiveHeaders.forEach(header => {
          if (event.request?.headers && header in event.request.headers) {
            event.request.headers[header] = 'REDACTED';
          }
        });
      }
    }

    return event;
  },

  // Ignore certain errors
  ignoreErrors: [
    // Expected database errors
    'PGRST',
    // Next.js expected errors
    'ECONNRESET',
    'EPIPE',
  ],
});
