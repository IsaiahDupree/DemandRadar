/**
 * Core Value Event Tracking (TRACK-004)
 * ======================================
 *
 * Tracks product-specific value events that represent the core value
 * users get from the product:
 * - run_created: User creates a new analysis run
 * - run_completed: Analysis run finishes
 * - report_viewed: User views a report
 * - report_downloaded: User downloads a report (PDF/CSV/JSON)
 * - trend_clicked: User clicks on a trending topic
 *
 * These events represent the key moments where users derive value
 * from the product, and are critical for measuring product engagement
 * and success.
 */

import { tracker } from './userEventTracker';

/**
 * Track run created
 *
 * Called when user initiates a new analysis run.
 *
 * @param properties - Run creation properties
 * @param properties.run_id - Unique run identifier
 * @param properties.query - User's search query
 * @param properties.category - Category of the query (e.g., 'productivity', 'health')
 * @param properties.estimated_duration - Estimated time to complete (seconds)
 * @param properties.plan - User's plan (e.g., 'free', 'pro', 'enterprise')
 */
export function trackRunCreated(properties?: {
  run_id?: string;
  query?: string;
  category?: string;
  estimated_duration?: number;
  plan?: string;
  [key: string]: any;
}): void {
  tracker.track('run_created', properties || {});
}

/**
 * Track run completed
 *
 * Called when an analysis run finishes (successfully or with error).
 *
 * @param properties - Run completion properties
 * @param properties.run_id - Unique run identifier
 * @param properties.duration - Actual time taken (seconds)
 * @param properties.status - Run status ('success', 'error', 'timeout')
 * @param properties.results_count - Number of results/opportunities found
 * @param properties.opportunity_score - Overall opportunity score (0-100)
 * @param properties.data_sources - Array of data sources used (e.g., ['reddit', 'meta_ads'])
 * @param properties.error_message - Error message if status is 'error'
 * @param properties.error_code - Error code if status is 'error'
 */
export function trackRunCompleted(properties?: {
  run_id?: string;
  duration?: number;
  status?: 'success' | 'error' | 'timeout';
  results_count?: number;
  opportunity_score?: number;
  data_sources?: string[];
  error_message?: string;
  error_code?: string;
  [key: string]: any;
}): void {
  tracker.track('run_completed', properties || {});
}

/**
 * Track report viewed
 *
 * Called when user views a report section.
 *
 * @param properties - Report view properties
 * @param properties.run_id - Associated run identifier
 * @param properties.report_id - Report identifier
 * @param properties.section - Report section viewed (e.g., 'gap_analysis', 'competitors', 'recommendations')
 * @param properties.view_type - View type ('full', 'preview', 'section')
 * @param properties.time_on_page - Time spent viewing (seconds)
 */
export function trackReportViewed(properties?: {
  run_id?: string;
  report_id?: string;
  section?: string;
  view_type?: string;
  time_on_page?: number;
  [key: string]: any;
}): void {
  tracker.track('report_viewed', properties || {});
}

/**
 * Track report downloaded
 *
 * Called when user downloads a report in any format.
 *
 * @param properties - Report download properties
 * @param properties.run_id - Associated run identifier
 * @param properties.report_id - Report identifier
 * @param properties.format - Export format ('pdf', 'csv', 'json')
 * @param properties.sections_included - Array of sections included in export
 * @param properties.file_size - File size in bytes
 * @param properties.data_type - Type of data exported (e.g., 'opportunities', 'raw_data')
 */
export function trackReportDownloaded(properties?: {
  run_id?: string;
  report_id?: string;
  format?: 'pdf' | 'csv' | 'json';
  sections_included?: string[];
  file_size?: number;
  data_type?: string;
  [key: string]: any;
}): void {
  tracker.track('report_downloaded', properties || {});
}

/**
 * Track trend clicked
 *
 * Called when user clicks on a trending topic.
 *
 * @param properties - Trend click properties
 * @param properties.trend_id - Trend identifier
 * @param properties.topic - Trend topic/title
 * @param properties.category - Trend category
 * @param properties.opportunity_score - Trend opportunity score (0-100)
 * @param properties.position - Position in the trending list (1-based)
 * @param properties.source - Where the trend was clicked ('landing_page', 'dashboard', 'search')
 */
export function trackTrendClicked(properties?: {
  trend_id?: string;
  topic?: string;
  category?: string;
  opportunity_score?: number;
  position?: number;
  source?: string;
  [key: string]: any;
}): void {
  tracker.track('trend_clicked', properties || {});
}
