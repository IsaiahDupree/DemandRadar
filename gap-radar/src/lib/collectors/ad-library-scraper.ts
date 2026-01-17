/**
 * Facebook Ad Library Scraper
 * 
 * Uses browser automation to scrape public ad data from Facebook Ad Library
 * when API access is not available.
 * 
 * Data extracted:
 * - Advertiser names
 * - Ad creative text
 * - Library IDs
 * - Start dates
 * - Platforms
 * - Impression counts
 * 
 * All filters available in the UI are controllable via URL parameters.
 */

import { MetaAd } from './meta';

export interface ScrapedAd {
  libraryId: string;
  advertiserName: string;
  creativeText: string;
  startDate: string;
  platforms: string[];
  impressions?: string;
  cta?: string;
  landingUrl?: string;
}

export interface AdLibraryScraperResult {
  query: string;
  country: string;
  totalResults: number;
  ads: ScrapedAd[];
  scrapedAt: string;
}

/**
 * All available filter options for Ad Library
 */
export interface AdLibraryFilters {
  // Search
  query: string;
  searchType?: 'keyword_unordered' | 'keyword_exact_phrase' | 'page_id';
  
  // Location
  country?: string;  // ISO country code: US, GB, CA, AU, DE, FR, etc.
  isTargetedCountry?: boolean;
  
  // Ad Category
  adType?: 'all' | 'political_and_issue_ads' | 'housing' | 'employment' | 'credit';
  
  // Status
  activeStatus?: 'active' | 'inactive' | 'all';
  
  // Media
  mediaType?: 'all' | 'image' | 'video' | 'meme' | 'none';
  
  // Platforms (can specify multiple)
  platforms?: ('facebook' | 'instagram' | 'audience_network' | 'messenger')[];
  
  // Date Range (YYYY-MM-DD format)
  startDateMin?: string;  // Ads started running after this date
  startDateMax?: string;  // Ads started running before this date
  
  // Language (ISO language code)
  language?: string;  // en, es, fr, de, pt, etc.
  
  // Advertiser (search by specific Page ID)
  pageId?: string;
}

/**
 * Available countries for Ad Library
 */
export const AD_LIBRARY_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'IN', name: 'India' },
  { code: 'JP', name: 'Japan' },
  // Add more as needed
];

/**
 * Available languages for filtering
 */
export const AD_LIBRARY_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  // Add more as needed
];

/**
 * Build Ad Library search URL with full filter support
 */
export function buildAdLibraryUrl(
  queryOrFilters: string | AdLibraryFilters,
  country: string = 'US',
  options: {
    activeStatus?: 'active' | 'inactive' | 'all';
    adType?: 'all' | 'political_and_issue_ads' | 'housing' | 'employment' | 'credit';
    mediaType?: 'all' | 'image' | 'video' | 'meme';
  } = {}
): string {
  // Handle simple string query for backward compatibility
  if (typeof queryOrFilters === 'string') {
    const { activeStatus = 'active', adType = 'all', mediaType = 'all' } = options;
    
    const params = new URLSearchParams({
      active_status: activeStatus,
      ad_type: adType,
      country: country,
      is_targeted_country: 'false',
      media_type: mediaType,
      q: queryOrFilters,
      search_type: 'keyword_unordered',
    });

    return `https://www.facebook.com/ads/library/?${params}`;
  }
  
  // Handle full filter object
  const filters = queryOrFilters;
  const params = new URLSearchParams();
  
  // Required parameters
  params.set('q', filters.query);
  params.set('search_type', filters.searchType || 'keyword_unordered');
  params.set('country', filters.country || 'US');
  params.set('ad_type', filters.adType || 'all');
  params.set('active_status', filters.activeStatus || 'active');
  params.set('is_targeted_country', String(filters.isTargetedCountry ?? false));
  
  // Media type
  if (filters.mediaType && filters.mediaType !== 'all') {
    params.set('media_type', filters.mediaType);
  } else {
    params.set('media_type', 'all');
  }
  
  // Platforms (array format)
  if (filters.platforms && filters.platforms.length > 0) {
    filters.platforms.forEach((platform, index) => {
      params.set(`publisher_platforms[${index}]`, platform);
    });
  }
  
  // Date range
  if (filters.startDateMin) {
    params.set('start_date[min]', filters.startDateMin);
  }
  if (filters.startDateMax) {
    params.set('start_date[max]', filters.startDateMax);
  }
  
  // Language
  if (filters.language) {
    params.set('content_languages[0]', filters.language);
  }
  
  // Page ID (for searching specific advertiser)
  if (filters.pageId) {
    params.set('view_all_page_id', filters.pageId);
  }
  
  return `https://www.facebook.com/ads/library/?${params}`;
}

/**
 * Build URL for searching a specific advertiser's ads
 */
export function buildAdvertiserUrl(pageId: string, country: string = 'US'): string {
  return buildAdLibraryUrl({
    query: '',
    pageId: pageId,
    country: country,
    activeStatus: 'all',
  });
}

/**
 * Parse scraped text data into structured ads
 */
export function parseScrapedData(rawData: {
  totalResults: string;
  libraryIds: string[];
  startDates: string[];
  advertisers: string[];
  sampleAdCopy: string[];
}): ScrapedAd[] {
  const ads: ScrapedAd[] = [];
  
  // Clean advertiser names
  const cleanAdvertisers = rawData.advertisers
    .map(a => a.replace(/^See (ad|summary) details\n/, '').trim())
    .filter(a => a.length > 1 && a.length < 50 && !a.includes('\n'));

  // Match library IDs with advertisers
  const libraryIds = rawData.libraryIds.map(id => id.replace('Library ID: ', ''));
  
  // Extract ad copy from samples
  const adCopies = rawData.sampleAdCopy
    .filter(text => 
      !text.includes('United States') && 
      !text.includes('All ads') &&
      !text.includes('System status') &&
      !text.includes('results') &&
      text.length > 20
    );

  // Build ad objects
  for (let i = 0; i < Math.min(libraryIds.length, cleanAdvertisers.length); i++) {
    ads.push({
      libraryId: libraryIds[i],
      advertiserName: cleanAdvertisers[i] || `Advertiser ${i + 1}`,
      creativeText: adCopies[i] || '',
      startDate: rawData.startDates[i]?.replace('Started running on ', '') || '',
      platforms: ['facebook'], // Default, would need more scraping for specifics
    });
  }

  return ads;
}

/**
 * Convert scraped ads to MetaAd format for pipeline compatibility
 */
export function convertToMetaAds(scrapedAds: ScrapedAd[]): MetaAd[] {
  return scrapedAds.map(ad => ({
    source: 'meta' as const,
    advertiser_name: ad.advertiserName,
    creative_text: ad.creativeText,
    headline: undefined,
    description: undefined,
    cta: ad.cta,
    landing_url: ad.landingUrl,
    first_seen: ad.startDate,
    last_seen: undefined,
    is_active: true,
    media_type: 'unknown' as const,
    raw_payload: {
      library_id: ad.libraryId,
      platforms: ad.platforms,
      impressions: ad.impressions,
      scraped: true,
    },
  }));
}

/**
 * Browser automation script to extract ad data
 * Run this in browser console or via Puppeteer
 */
export const EXTRACTION_SCRIPT = `
(function() {
  const ads = [];
  const cardTexts = document.body.innerText;
  
  // Extract structured data
  const libraryIds = cardTexts.match(/Library ID: \\d+/g) || [];
  const startDates = cardTexts.match(/Started running on [A-Za-z]+ \\d+, \\d+/g) || [];
  
  // Extract advertiser names
  const advertiserPattern = /([A-Za-z0-9\\s]+)\\nSponsored/g;
  const advertisers = [...cardTexts.matchAll(advertiserPattern)].map(m => m[1].trim());

  // Get ad creative text
  const allDivs = Array.from(document.querySelectorAll('div'));
  const adTexts = [];
  
  allDivs.forEach(div => {
    const text = div.innerText;
    if (text && text.length > 30 && text.length < 500 && 
        !text.includes('Library ID') && !text.includes('Started running') &&
        !text.includes('Platforms') && !text.includes('Ad Library')) {
      adTexts.push(text.trim());
    }
  });

  return {
    totalResults: cardTexts.match(/~(\\d+) results/)?.[1] || '0',
    libraryIds: libraryIds.slice(0, 50),
    startDates: startDates.slice(0, 50),
    advertisers: [...new Set(advertisers)].slice(0, 50),
    sampleAdCopy: [...new Set(adTexts)].filter(t => t.length > 50).slice(0, 50),
    scrapedAt: new Date().toISOString()
  };
})();
`;
