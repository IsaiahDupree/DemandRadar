/**
 * Instrumentation file for Next.js
 *
 * This file is used to initialize observability tools like Sentry.
 * It runs once when the Next.js server starts.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
