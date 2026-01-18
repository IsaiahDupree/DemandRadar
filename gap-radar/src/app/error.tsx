'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

/**
 * Error Boundary Component (API-004)
 *
 * Catches errors in the app and displays a user-friendly error page
 * with options to retry or return home.
 *
 * This is a Next.js 14+ error boundary that runs on the client side.
 * See: https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);

    // TODO: Send to Sentry or other error tracking service
    // Example: captureException(error, { extra: { digest: error.digest } });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-xl p-8 text-center">
        {/* Error Icon */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
            <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Error Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Something went wrong
        </h1>

        {/* Error Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We encountered an unexpected error while processing your request.
          Our team has been notified and is working on a fix.
        </p>

        {/* Error Details (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left">
            <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-gray-500 dark:text-gray-500 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg font-medium transition-colors"
          >
            <Home className="h-4 w-4" />
            Go home
          </Link>
        </div>

        {/* Report Option */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Still having issues?{' '}
            <a
              href="mailto:support@demandradar.app"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
