/**
 * Error & Performance Tracking (TRACK-007)
 * =========================================
 *
 * Tracks errors, API failures, and Core Web Vitals:
 * - error: Application errors and exceptions
 * - api_failure: API request failures and errors
 * - core_web_vitals: Performance metrics (LCP, FID, CLS, TTFB)
 *
 * These events help monitor application health, debug issues, and optimize performance.
 */

import { tracker } from './userEventTracker';

/**
 * Track application error
 *
 * Called when an error occurs in the application (e.g., uncaught exceptions, handled errors).
 * Helps identify bugs, monitor application health, and prioritize fixes.
 *
 * @param properties - Error properties
 * @param properties.error_type - Type of error (e.g., 'TypeError', 'ReferenceError', 'NetworkError')
 * @param properties.error_message - Error message
 * @param properties.stack_trace - Error stack trace
 * @param properties.component - Component where error occurred
 * @param properties.action - Action that triggered the error
 * @param properties.user_action - What user was trying to do
 */
export function trackError(properties: {
  error_type?: string;
  error_message: string;
  stack_trace?: string;
  component?: string;
  action?: string;
  user_action?: string;
  [key: string]: any;
}): void {
  tracker.track('error', {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track API failure
 *
 * Called when an API request fails (e.g., 4xx, 5xx status codes, network errors).
 * Helps monitor API reliability, identify failing endpoints, and debug integration issues.
 *
 * @param properties - API failure properties
 * @param properties.endpoint - API endpoint that failed (e.g., '/api/runs')
 * @param properties.method - HTTP method (e.g., 'GET', 'POST', 'PUT', 'DELETE')
 * @param properties.status_code - HTTP status code (e.g., 404, 500, 503)
 * @param properties.error_message - Error message from the API
 * @param properties.response_time - Response time in milliseconds
 * @param properties.retry_count - Number of retry attempts
 */
export function trackAPIFailure(properties: {
  endpoint: string;
  method?: string;
  status_code?: number;
  error_message?: string;
  response_time?: number;
  retry_count?: number;
  [key: string]: any;
}): void {
  tracker.track('api_failure', {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track Core Web Vitals
 *
 * Called when Core Web Vitals metrics are captured (LCP, FID, CLS, TTFB).
 * Helps monitor and optimize page load performance and user experience.
 *
 * Core Web Vitals metrics:
 * - LCP (Largest Contentful Paint): Measures loading performance
 *   - Good: ≤2.5s, Needs Improvement: ≤4s, Poor: >4s
 * - FID (First Input Delay): Measures interactivity
 *   - Good: ≤100ms, Needs Improvement: ≤300ms, Poor: >300ms
 * - CLS (Cumulative Layout Shift): Measures visual stability
 *   - Good: ≤0.1, Needs Improvement: ≤0.25, Poor: >0.25
 * - TTFB (Time to First Byte): Measures server response time
 *   - Good: ≤800ms, Needs Improvement: ≤1800ms, Poor: >1800ms
 *
 * @param properties - Core Web Vitals properties
 * @param properties.metric_name - Metric name ('LCP', 'FID', 'CLS', 'TTFB')
 * @param properties.value - Metric value
 * @param properties.rating - Performance rating ('good', 'needs-improvement', 'poor')
 * @param properties.page - Page where metric was captured
 * @param properties.device_type - Device type ('desktop', 'mobile', 'tablet')
 * @param properties.connection_type - Connection type ('4g', '3g', 'wifi', etc.)
 */
export function trackCoreWebVitals(properties: {
  metric_name: 'LCP' | 'FID' | 'CLS' | 'TTFB' | string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  page?: string;
  device_type?: string;
  connection_type?: string;
  [key: string]: any;
}): void {
  tracker.track('core_web_vitals', {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}
