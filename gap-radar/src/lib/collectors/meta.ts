/**
 * Meta Ads Collector
 * 
 * Two modes:
 * 1. Ad Library API (ads_archive) - Public ads, requires Facebook App Review approval
 * 2. Marketing API - User's own ads, works with ads_read permission
 * 
 * For MVP without App Review, uses mock data for competitor analysis.
 * Users can optionally connect their own ad accounts for self-analysis.
 */

export interface MetaAd {
  source: 'meta';
  advertiser_name: string;
  creative_text: string;
  headline?: string;
  description?: string;
  cta?: string;
  landing_url?: string;
  first_seen?: string;
  last_seen?: string;
  is_active?: boolean;
  media_type: 'image' | 'video' | 'carousel' | 'unknown';
  raw_payload?: Record<string, unknown>;
  // Performance indicators
  impression_count?: 'low' | 'medium' | 'high' | 'very_high';
  run_days?: number;
  is_verified_winner?: boolean;
}

// Minimum thresholds for "winning" ads
export const WINNING_AD_THRESHOLDS = {
  MIN_RUN_DAYS: 7,           // Must run at least 7 days
  MIN_IMPRESSION_LEVEL: 'medium', // Skip 'low' impression ads
  VERIFIED_RUN_DAYS: 30,     // 30+ days = verified winner
};

export interface MetaAdAccount {
  id: string;
  name: string;
  account_status: number;
  amount_spent: string;
  currency: string;
}

export async function collectMetaAds(
  nicheQuery: string,
  seedTerms: string[],
  geo: string = 'US',
  options: { 
    filterLowImpressions?: boolean;
    minRunDays?: number;
    onlyVerifiedWinners?: boolean;
  } = {}
): Promise<MetaAd[]> {
  const { 
    filterLowImpressions = true, 
    minRunDays = WINNING_AD_THRESHOLDS.MIN_RUN_DAYS,
    onlyVerifiedWinners = false 
  } = options;
  
  const ads: MetaAd[] = [];
  
  // Combine niche query with seed terms for search
  const searchTerms = [nicheQuery, ...seedTerms].slice(0, 5);
  
  for (const term of searchTerms) {
    try {
      const termAds = await searchMetaAdLibrary(term, geo);
      ads.push(...termAds);
    } catch (error) {
      console.error(`Error fetching Meta ads for "${term}":`, error);
    }
  }

  // Dedupe by advertiser + creative text
  const seen = new Set<string>();
  let filtered = ads.filter(ad => {
    const key = `${ad.advertiser_name}:${ad.creative_text?.slice(0, 100)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Filter out low impression ads (these are not proven winners)
  if (filterLowImpressions) {
    filtered = filtered.filter(ad => {
      // Skip ads with low impression count
      if (ad.impression_count === 'low') {
        return false;
      }
      return true;
    });
  }

  // Filter by minimum run days
  if (minRunDays > 0) {
    filtered = filtered.filter(ad => {
      const runDays = ad.run_days || calculateRunDays(ad.first_seen, ad.last_seen);
      return runDays >= minRunDays;
    });
  }

  // Only verified winners (30+ days)
  if (onlyVerifiedWinners) {
    filtered = filtered.filter(ad => {
      const runDays = ad.run_days || calculateRunDays(ad.first_seen, ad.last_seen);
      return runDays >= WINNING_AD_THRESHOLDS.VERIFIED_RUN_DAYS;
    });
  }

  return filtered;
}

/**
 * Calculate run days from first_seen and last_seen dates
 */
function calculateRunDays(firstSeen?: string, lastSeen?: string): number {
  if (!firstSeen) return 0;
  const start = new Date(firstSeen);
  const end = lastSeen ? new Date(lastSeen) : new Date();
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Check if an ad qualifies as a "winning" ad
 */
export function isWinningAd(ad: MetaAd): boolean {
  // Must not be low impression
  if (ad.impression_count === 'low') return false;
  
  // Calculate run days
  const runDays = ad.run_days || calculateRunDays(ad.first_seen, ad.last_seen);
  
  // Must have run for minimum days
  if (runDays < WINNING_AD_THRESHOLDS.MIN_RUN_DAYS) return false;
  
  // Must be active (or recently active)
  if (ad.is_active === false && ad.last_seen) {
    const daysSinceStopped = calculateRunDays(ad.last_seen, new Date().toISOString());
    if (daysSinceStopped > 30) return false; // Stopped more than 30 days ago
  }
  
  return true;
}

/**
 * Fetch user's own ad accounts (requires ads_read permission)
 */
export async function fetchUserAdAccounts(): Promise<MetaAdAccount[]> {
  const accessToken = process.env.META_ACCESS_TOKEN;
  
  if (!accessToken) {
    return [];
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v24.0/me/adaccounts?fields=id,name,account_status,amount_spent,currency&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Meta API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch ad accounts:', error);
    return [];
  }
}

/**
 * Fetch ads from a specific ad account (user's own ads)
 */
export async function fetchAccountAds(accountId: string): Promise<MetaAd[]> {
  const accessToken = process.env.META_ACCESS_TOKEN;
  
  if (!accessToken) {
    return [];
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v24.0/${accountId}/ads?fields=id,name,status,created_time,creative{body,title,call_to_action_type,link_url}&limit=50&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Meta API error: ${response.status}`);
    }

    const data = await response.json();
    
    return (data.data || []).map((ad: Record<string, unknown>) => {
      const creative = ad.creative as Record<string, unknown> | undefined;
      return {
        source: 'meta' as const,
        advertiser_name: 'Your Account',
        creative_text: (creative?.body as string) || (ad.name as string) || '',
        headline: creative?.title as string,
        cta: creative?.call_to_action_type as string,
        landing_url: creative?.link_url as string,
        first_seen: ad.created_time as string,
        is_active: ad.status === 'ACTIVE',
        media_type: 'unknown' as const,
        raw_payload: ad,
      };
    });
  } catch (error) {
    console.error('Failed to fetch account ads:', error);
    return [];
  }
}

/**
 * Search Meta Ad Library (public ads) - requires ads_archive permission
 * Falls back to mock data if permission not available
 */
async function searchMetaAdLibrary(
  query: string,
  country: string
): Promise<MetaAd[]> {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const hasAdLibraryAccess = process.env.META_AD_LIBRARY_ACCESS === 'true';
  
  if (!accessToken || !hasAdLibraryAccess) {
    console.warn('Ad Library access not configured, using mock data');
    return generateMockMetaAds(query);
  }

  try {
    const params = new URLSearchParams({
      access_token: accessToken,
      search_terms: query,
      ad_reached_countries: country,
      ad_active_status: 'ALL',
      fields: 'id,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_titles,ad_delivery_start_time,ad_delivery_stop_time,page_name,publisher_platforms',
      limit: '50',
    });

    const response = await fetch(
      `https://graph.facebook.com/v24.0/ads_archive?${params}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Ad Library API error:', errorData);
      return generateMockMetaAds(query);
    }

    const data = await response.json();
    
    return (data.data || []).map((ad: Record<string, unknown>) => ({
      source: 'meta' as const,
      advertiser_name: ad.page_name as string || 'Unknown',
      creative_text: ((ad.ad_creative_bodies as string[]) || [])[0] || '',
      headline: ((ad.ad_creative_link_titles as string[]) || [])[0],
      description: ((ad.ad_creative_link_captions as string[]) || [])[0],
      first_seen: ad.ad_delivery_start_time as string,
      last_seen: ad.ad_delivery_stop_time as string,
      is_active: !ad.ad_delivery_stop_time,
      media_type: 'unknown' as const,
      raw_payload: ad,
    }));
  } catch (error) {
    console.error('Meta Ad Library API error:', error);
    return generateMockMetaAds(query);
  }
}

function generateMockMetaAds(query: string): MetaAd[] {
  // Generate realistic mock data for development/demo
  const templates = [
    {
      advertiser: `${query} Pro`,
      text: `Remove ${query.toLowerCase()} in seconds! AI-powered, no signup required.`,
      headline: `${query} Made Easy`,
      cta: 'Try Free',
    },
    {
      advertiser: `Quick${query.replace(/\s/g, '')}`,
      text: `Tired of manual ${query.toLowerCase()}? Our AI does it perfectly. 100% free.`,
      headline: `Free ${query}`,
      cta: 'Start Now',
    },
    {
      advertiser: `${query} Studio`,
      text: `Professional ${query.toLowerCase()} tool. Batch processing available.`,
      headline: `Batch ${query}`,
      cta: 'Start Free Trial',
    },
  ];

  return templates.map((t, i) => ({
    source: 'meta' as const,
    advertiser_name: t.advertiser,
    creative_text: t.text,
    headline: t.headline,
    cta: t.cta,
    first_seen: new Date(Date.now() - (180 - i * 30) * 24 * 60 * 60 * 1000).toISOString(),
    last_seen: new Date().toISOString(),
    is_active: true,
    media_type: i % 2 === 0 ? 'video' : 'image' as const,
  }));
}
