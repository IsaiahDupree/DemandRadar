/**
 * Cross-Platform App Deduplication (COLL-011)
 *
 * Recognizes the same app across iOS, Android, and web platforms
 * and merges them into a single unified entry.
 *
 * Matching Strategy:
 * 1. Normalize app names (remove common suffixes, lowercase, trim)
 * 2. Match by developer name (normalized)
 * 3. Use fuzzy matching for slight name variations
 */

import type { AppStoreResult } from './appstore';
import type { AppPlatform } from '@/types';

export interface UnifiedApp {
  id: string;
  name: string;
  developer: string;
  platforms: AppPlatform[];
  platformIds: {
    ios?: string;
    android?: string;
    web?: string;
  };
  rating: number;
  totalReviews: number;
  description: string;
  category: string;
  price: string;
  platformData: {
    [K in AppPlatform]?: {
      appId: string;
      rating: number;
      reviewCount: number;
      description: string;
      category: string;
      price: string;
    };
  };
}

/**
 * Normalize app name for matching
 * Removes common suffixes and noise words
 */
function normalizeAppName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.com$/gi, '') // Remove .com suffix
    .replace(/[:\-–—,]/g, ' ') // Replace separators with space
    .replace(/\s+(app|for ios|for android|mobile|web|online)\s*/gi, ' ')
    .replace(/\s+(notes?|tasks?|editor|messenger|music|podcasts?|videos?)\s*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize developer name for matching
 */
function normalizeDeveloper(dev: string): string {
  return dev
    .toLowerCase()
    .replace(/\s+(inc\.?|llc\.?|ltd\.?|pty\.?|pty|ab|technologies|labs|corp\.?|limited)\s*$/gi, '')
    .replace(/\s+(inc\.?|llc\.?|ltd\.?|pty\.?|pty|ab|technologies|labs|corp\.?|limited)$/gi, '')
    .replace(/[,\.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract core app name (first significant word)
 * Use only the first meaningful word to be more lenient
 */
function extractCoreName(name: string): string {
  const normalized = normalizeAppName(name);
  const words = normalized.split(' ').filter(w => w.length > 2);
  // Just use the first significant word for more lenient matching
  return words[0] || normalized;
}

/**
 * Calculate similarity between two strings (simple Jaccard similarity)
 */
function similarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(' '));
  const words2 = new Set(str2.toLowerCase().split(' '));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Check if two apps are likely the same product
 */
function isSameApp(app1: AppStoreResult, app2: AppStoreResult): boolean {
  // Don't match apps on the same platform
  if (app1.platform === app2.platform) {
    return false;
  }

  const name1 = normalizeAppName(app1.app_name);
  const name2 = normalizeAppName(app2.app_name);
  const dev1 = normalizeDeveloper(app1.developer);
  const dev2 = normalizeDeveloper(app2.developer);

  const coreName1 = extractCoreName(app1.app_name);
  const coreName2 = extractCoreName(app2.app_name);

  // Exact core name match + similar developer (very strong signal)
  if (coreName1 === coreName2 && similarity(dev1, dev2) > 0.3) {
    return true;
  }

  // Exact developer match + similar name
  if (dev1 === dev2 && similarity(name1, name2) > 0.5) {
    return true;
  }

  // Very similar developer + exact core name match
  if (similarity(dev1, dev2) > 0.7 && coreName1 === coreName2) {
    return true;
  }

  // Exact name match (strong signal)
  if (name1 === name2) {
    return true;
  }

  return false;
}

/**
 * Deduplicate apps across platforms
 * Merges the same app found on iOS, Android, and web into a single entry
 */
export function deduplicateApps(apps: AppStoreResult[]): UnifiedApp[] {
  const unified: UnifiedApp[] = [];
  const processed = new Set<number>();

  for (let i = 0; i < apps.length; i++) {
    if (processed.has(i)) continue;

    const app = apps[i];
    const matches = [i];

    // Find all apps that match this one
    for (let j = i + 1; j < apps.length; j++) {
      if (processed.has(j)) continue;

      if (isSameApp(app, apps[j])) {
        matches.push(j);
        processed.add(j);
      }
    }

    processed.add(i);

    // Create unified entry
    const matchedApps = matches.map(idx => apps[idx]);
    const unifiedApp = mergeApps(matchedApps);
    unified.push(unifiedApp);
  }

  return unified;
}

/**
 * Merge multiple app entries into a single unified app
 */
function mergeApps(apps: AppStoreResult[]): UnifiedApp {
  const platforms: AppPlatform[] = [];
  const platformIds: UnifiedApp['platformIds'] = {};
  const platformData: UnifiedApp['platformData'] = {};

  let totalReviews = 0;
  let maxRating = 0;
  let primaryApp = apps[0];

  // Use the app with most reviews as primary
  for (const app of apps) {
    if (app.review_count > primaryApp.review_count) {
      primaryApp = app;
    }
  }

  // Aggregate data from all platforms
  for (const app of apps) {
    platforms.push(app.platform);
    platformIds[app.platform] = app.app_id;

    platformData[app.platform] = {
      appId: app.app_id,
      rating: app.rating,
      reviewCount: app.review_count,
      description: app.description,
      category: app.category,
      price: app.price,
    };

    totalReviews += app.review_count;
    maxRating = Math.max(maxRating, app.rating);
  }

  // Sort platforms consistently (ios, android, web)
  const platformOrder: Record<AppPlatform, number> = { ios: 0, android: 1, web: 2 };
  platforms.sort((a, b) => platformOrder[a] - platformOrder[b]);

  // Clean up app name (use shortest, cleanest version)
  const cleanName = apps
    .map(a => a.app_name)
    .reduce((shortest, current) =>
      current.length < shortest.length ? current : shortest
    )
    .replace(/[:\-–—].*$/, '') // Remove everything after colon/dash
    .trim();

  return {
    id: `unified-${primaryApp.platform}-${primaryApp.app_id}`,
    name: cleanName,
    developer: primaryApp.developer,
    platforms,
    platformIds,
    rating: maxRating,
    totalReviews,
    description: primaryApp.description,
    category: primaryApp.category,
    price: primaryApp.price,
    platformData,
  };
}
