'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Global Error Boundary Component (API-004)
 *
 * Catches errors at the root layout level that error.tsx cannot catch.
 * This includes errors in the root layout itself.
 *
 * Must include <html> and <body> tags since it replaces the root layout.
 * See: https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-errors-in-root-layouts
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the critical error to an error reporting service
    console.error('Critical application error:', error);

    // TODO: Send to Sentry or other error tracking service with high priority
    // Example: captureException(error, { level: 'fatal', extra: { digest: error.digest } });
  }, [error]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error - DemandRadar</title>
      </head>
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(to bottom right, #f9fafb, #e5e7eb)',
            padding: '1rem',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '28rem',
              width: '100%',
              background: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            {/* Error Icon */}
            <div
              style={{
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  borderRadius: '9999px',
                  backgroundColor: '#fef2f2',
                  padding: '1rem',
                  display: 'inline-flex',
                }}
              >
                <AlertTriangle
                  style={{
                    height: '3rem',
                    width: '3rem',
                    color: '#dc2626',
                  }}
                />
              </div>
            </div>

            {/* Error Title */}
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#111827',
                marginBottom: '0.5rem',
              }}
            >
              Critical Error
            </h1>

            {/* Error Description */}
            <p
              style={{
                color: '#6b7280',
                marginBottom: '1.5rem',
                lineHeight: '1.5',
              }}
            >
              We encountered a critical error that prevented the application from loading.
              Please try refreshing the page. If the problem persists, contact support.
            </p>

            {/* Error Details (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <div
                style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '0.5rem',
                  textAlign: 'left',
                }}
              >
                <p
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    color: '#374151',
                    wordBreak: 'break-all',
                  }}
                >
                  {error.message}
                </p>
                {error.digest && (
                  <p
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      color: '#6b7280',
                      marginTop: '0.5rem',
                    }}
                  >
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={() => reset()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#2563eb',
                color: 'white',
                borderRadius: '0.5rem',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#1d4ed8';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
            >
              <RefreshCw style={{ height: '1rem', width: '1rem' }} />
              Reload application
            </button>

            {/* Support Contact */}
            <div
              style={{
                marginTop: '1.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #e5e7eb',
              }}
            >
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Need help?{' '}
                <a
                  href="mailto:support@demandradar.app"
                  style={{
                    color: '#2563eb',
                    textDecoration: 'none',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.textDecoration = 'none';
                  }}
                >
                  Contact support
                </a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
