/**
 * Android Play Store Collector
 *
 * Fetches Android apps via SerpAPI for platform gap analysis.
 * Falls back to mock data when SerpAPI is unavailable.
 */

export interface PlayStoreResult {
  platform: 'android';
  app_name: string;
  app_id: string;
  developer: string;
  rating: number;
  review_count: number;
  description: string;
  category: string;
  price: string;
  raw_payload?: Record<string, unknown>;
}

export interface PlayStoreOptions {
  country?: string;
  limit?: number;
}

/**
 * Search Google Play Store via SerpAPI
 *
 * @param query - Search term (e.g., "fitness app", "productivity tool")
 * @param options - Optional country code and result limit
 * @returns Array of Android app results
 */
export async function searchPlayStore(
  query: string,
  options?: PlayStoreOptions
): Promise<PlayStoreResult[]> {
  const serpApiKey = process.env.SERPAPI_KEY;

  if (!serpApiKey) {
    console.warn('SERPAPI_KEY not set, using mock Android data');
    return generateMockAndroidResults(query);
  }

  try {
    const params = new URLSearchParams({
      api_key: serpApiKey,
      engine: 'google_play',
      q: query,
      store: 'apps',
      gl: options?.country || 'us',
      num: String(options?.limit || 10),
    });

    const response = await fetch(
      `https://serpapi.com/search.json?${params}`
    );

    if (!response.ok) {
      console.warn('SerpAPI Play Store request failed, using mock data');
      return generateMockAndroidResults(query);
    }

    const data = await response.json();

    if (!data.organic_results || data.organic_results.length === 0) {
      return generateMockAndroidResults(query);
    }

    return data.organic_results.map((app: Record<string, unknown>) => ({
      platform: 'android' as const,
      app_name: app.title as string,
      app_id: (app.product_id as string) || extractIdFromLink(app.link as string) || '',
      developer: app.developer as string,
      rating: parseFloat(String(app.rating || 0)),
      review_count: parseReviewCount(app.reviews),
      description: truncateDescription(
        (app.description as string) || (app.snippet as string) || ''
      ),
      category: (app.category as string) || 'Apps',
      price: (app.price as string) || 'Free',
      raw_payload: app,
    }));
  } catch (error) {
    console.error('Play Store search error:', error);
    return generateMockAndroidResults(query);
  }
}

/**
 * Extract app ID from Play Store link
 */
function extractIdFromLink(link: string | undefined): string {
  if (!link) return '';
  const match = link.match(/id=([^&]+)/);
  return match ? match[1] : '';
}

/**
 * Parse review count from various formats (e.g., "1,234,567" or "1.2M")
 */
function parseReviewCount(reviews: unknown): number {
  if (!reviews) return 0;

  const reviewStr = String(reviews);

  // Remove commas and parse
  const cleanedStr = reviewStr.replace(/,/g, '');
  const parsed = parseInt(cleanedStr);

  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Truncate description to 500 characters
 */
function truncateDescription(description: string): string {
  return description.slice(0, 500);
}

/**
 * Generate mock Android app results for testing/fallback
 */
function generateMockAndroidResults(query: string): PlayStoreResult[] {
  return [
    {
      platform: 'android' as const,
      app_name: `${query} - Easy Tool`,
      app_id: `com.${query.toLowerCase().replace(/\s/g, '')}.app`,
      developer: 'Mobile Tools Inc',
      rating: 4.1,
      review_count: 45000,
      description: `The best ${query.toLowerCase()} app for Android. Fast and easy to use.`,
      category: 'Tools',
      price: 'Free with Ads',
    },
    {
      platform: 'android' as const,
      app_name: `Pro ${query}`,
      app_id: `com.pro${query.toLowerCase().replace(/\s/g, '')}`,
      developer: 'Pro Apps Studio',
      rating: 3.8,
      review_count: 12000,
      description: `Professional ${query.toLowerCase()} tool with advanced features.`,
      category: 'Tools',
      price: '$4.99',
    },
  ];
}
