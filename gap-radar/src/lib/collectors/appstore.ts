/**
 * App Store Collector
 *
 * Uses iTunes Search API for iOS apps and SerpApi/scraping for Android/Play Store.
 */

import { searchPlayStore } from './android-playstore';

export interface AppStoreResult {
  platform: 'ios' | 'android' | 'web';
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

export async function collectAppStoreResults(
  nicheQuery: string,
  seedTerms: string[]
): Promise<AppStoreResult[]> {
  const results: AppStoreResult[] = [];
  const searchTerms = [nicheQuery, ...seedTerms.slice(0, 2)];

  // Collect from iOS App Store (official API)
  for (const term of searchTerms) {
    try {
      const iosResults = await searchITunesStore(term);
      results.push(...iosResults);
    } catch (error) {
      console.error(`iOS search error for "${term}":`, error);
    }
  }

  // Collect from Android Play Store (via SerpAPI)
  for (const term of searchTerms) {
    try {
      const androidResults = await searchPlayStore(term);
      // Convert PlayStoreResult to AppStoreResult
      results.push(...androidResults.map(r => ({ ...r, platform: 'android' as const })));
    } catch (error) {
      console.error(`Android search error for "${term}":`, error);
    }
  }

  // Web competitors (mock for now - would use SERP API)
  const webResults = generateMockWebResults(nicheQuery);
  results.push(...webResults);

  // Dedupe by app_id
  const seen = new Set<string>();
  return results.filter(r => {
    const key = `${r.platform}:${r.app_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function searchITunesStore(query: string): Promise<AppStoreResult[]> {
  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=software&limit=10`
    );

    if (!response.ok) {
      throw new Error(`iTunes API error: ${response.status}`);
    }

    const data = await response.json();

    return (data.results || []).map((app: Record<string, unknown>) => ({
      platform: 'ios' as const,
      app_name: app.trackName as string,
      app_id: String(app.trackId),
      developer: app.artistName as string,
      rating: (app.averageUserRating as number) || 0,
      review_count: (app.userRatingCount as number) || 0,
      description: ((app.description as string) || '').slice(0, 500),
      category: app.primaryGenreName as string,
      price: app.formattedPrice as string,
      raw_payload: app,
    }));
  } catch (error) {
    console.error('iTunes search error:', error);
    return [];
  }
}


function generateMockWebResults(query: string): AppStoreResult[] {
  return [
    {
      platform: 'web' as const,
      app_name: `${query}.io`,
      app_id: `${query.toLowerCase().replace(/\s/g, '')}.io`,
      developer: 'WebTools Ltd',
      rating: 4.5,
      review_count: 2500,
      description: `Online ${query.toLowerCase()} tool. No download required.`,
      category: 'Online Tool',
      price: '$9.99/mo',
    },
    {
      platform: 'web' as const,
      app_name: `Free${query.replace(/\s/g, '')}`,
      app_id: `free${query.toLowerCase().replace(/\s/g, '')}.com`,
      developer: 'Free Tools',
      rating: 3.9,
      review_count: 890,
      description: `Free online ${query.toLowerCase()}. Quick and simple.`,
      category: 'Online Tool',
      price: 'Free',
    },
  ];
}
