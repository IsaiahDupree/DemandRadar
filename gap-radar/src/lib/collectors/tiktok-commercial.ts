/**
 * TikTok Commercial Content API Collector
 *
 * Collects commercial ad data from TikTok Commercial Content API:
 * - Ad metadata (advertiser, creative, targeting)
 * - Reach metrics (unique users, impressions)
 * - First/last shown dates (ad longevity)
 *
 * Note: Requires TikTok Marketing API access and app approval.
 * MVP uses mock data until API access is granted.
 */

export interface TikTokCommercialAd {
  ad_id: string;
  advertiser_name: string;
  advertiser_id?: string;
  video_id: string;
  creative_url: string;
  thumbnail_url?: string;
  caption: string;
  landing_page_url?: string;
  call_to_action?: string;
  targeting?: {
    countries?: string[];
    age_groups?: string[];
    interests?: string[];
  };
  raw_payload?: Record<string, unknown>;
}

export interface TikTokCommercialMetrics {
  ad_id: string;
  reach_unique_users: number;
  impressions: number;
  views: number;
  clicks?: number;
  engagement_rate?: number;
  first_shown?: string; // ISO date
  last_shown?: string; // ISO date
  days_running?: number;
  spend_estimate?: {
    low: number;
    high: number;
    currency: string;
  };
}

export interface TikTokCommercialResult {
  ad: TikTokCommercialAd;
  metrics: TikTokCommercialMetrics;
}

export interface TikTokCommercialSearchOptions {
  country?: string;
  industry?: string;
  limit?: number;
}

/**
 * Search TikTok Commercial Content API for ads
 * Requires TikTok Marketing API access (app approval required)
 */
export async function searchTikTokCommercialAds(
  query: string,
  options: TikTokCommercialSearchOptions = {}
): Promise<TikTokCommercialAd[]> {
  const apiKey = process.env.TIKTOK_COMMERCIAL_API_KEY;

  if (!apiKey) {
    console.warn('TIKTOK_COMMERCIAL_API_KEY not set, using mock data');
    return generateMockCommercialAds(query, options.limit || 10);
  }

  try {
    // TikTok Marketing API endpoint
    // Note: This requires app approval and access token
    const params = new URLSearchParams({
      keyword: query,
      country: options.country || 'US',
      limit: String(options.limit || 10),
    });

    if (options.industry) {
      params.set('industry', options.industry);
    }

    const response = await fetch(
      `https://business-api.tiktok.com/open_api/v1.3/ad/search/?${params}`,
      {
        headers: {
          'Access-Token': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn('TikTok Commercial API failed, using mock data');
      return generateMockCommercialAds(query, options.limit || 10);
    }

    const data = await response.json();

    if (!data.data || !Array.isArray(data.data.list)) {
      return generateMockCommercialAds(query, options.limit || 10);
    }

    return data.data.list.map((item: Record<string, unknown>) => ({
      ad_id: item.ad_id as string || '',
      advertiser_name: item.advertiser_name as string || 'Unknown',
      advertiser_id: item.advertiser_id as string,
      video_id: item.video_id as string || '',
      creative_url: item.video_url as string || '',
      thumbnail_url: item.image_url as string,
      caption: item.ad_text as string || '',
      landing_page_url: item.landing_page_url as string,
      call_to_action: item.call_to_action as string,
      targeting: {
        countries: (item.location_ids as string[]) || [],
        age_groups: (item.age_groups as string[]) || [],
        interests: (item.interest_category_ids as string[]) || [],
      },
      raw_payload: item,
    }));
  } catch (error) {
    console.error('TikTok Commercial API error:', error);
    return generateMockCommercialAds(query, options.limit || 10);
  }
}

/**
 * Get detailed metrics for a specific ad
 */
export async function getTikTokAdMetrics(
  adId: string
): Promise<TikTokCommercialMetrics> {
  const apiKey = process.env.TIKTOK_COMMERCIAL_API_KEY;

  if (!apiKey) {
    return generateMockMetrics(adId);
  }

  try {
    const response = await fetch(
      `https://business-api.tiktok.com/open_api/v1.3/ad/get/?ad_ids=${adId}`,
      {
        headers: {
          'Access-Token': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return generateMockMetrics(adId);
    }

    const data = await response.json();

    if (!data.data || !data.data.list || data.data.list.length === 0) {
      return generateMockMetrics(adId);
    }

    const adData = data.data.list[0];
    const metrics = adData.metrics || {};

    // Calculate days running
    let daysRunning;
    if (adData.create_time && adData.modify_time) {
      const firstShown = new Date(adData.create_time * 1000);
      const lastShown = new Date(adData.modify_time * 1000);
      daysRunning = Math.floor((lastShown.getTime() - firstShown.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      ad_id: adId,
      reach_unique_users: metrics.reach || 0,
      impressions: metrics.impressions || 0,
      views: metrics.video_views || 0,
      clicks: metrics.clicks || 0,
      engagement_rate: metrics.engagement_rate ? metrics.engagement_rate * 100 : undefined,
      first_shown: adData.create_time ? new Date(adData.create_time * 1000).toISOString() : undefined,
      last_shown: adData.modify_time ? new Date(adData.modify_time * 1000).toISOString() : undefined,
      days_running: daysRunning,
      spend_estimate: metrics.spend ? {
        low: metrics.spend * 0.8,
        high: metrics.spend * 1.2,
        currency: 'USD',
      } : undefined,
    };
  } catch (error) {
    console.error('TikTok metrics API error:', error);
    return generateMockMetrics(adId);
  }
}

/**
 * Collect all commercial content for a niche
 */
export async function collectTikTokCommercialContent(
  nicheQuery: string,
  seedTerms: string[] = []
): Promise<TikTokCommercialResult[]> {
  const results: TikTokCommercialResult[] = [];
  const searchTerms = [nicheQuery, ...seedTerms.slice(0, 3)]; // Limit to prevent excessive API calls

  for (const term of searchTerms) {
    try {
      // Get commercial ads
      const ads = await searchTikTokCommercialAds(term, { limit: 10 });

      // Get metrics for each ad
      for (const ad of ads) {
        try {
          const metrics = await getTikTokAdMetrics(ad.ad_id);
          results.push({ ad, metrics });
        } catch (error) {
          console.error(`Failed to get metrics for ad ${ad.ad_id}:`, error);
          // Continue with other ads
        }
      }

      // Rate limiting - 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`TikTok commercial collection error for "${term}":`, error);
      // Continue with other terms
    }
  }

  // Dedupe by ad_id
  const seen = new Set<string>();
  return results.filter(r => {
    if (seen.has(r.ad.ad_id)) return false;
    seen.add(r.ad.ad_id);
    return true;
  });
}

function generateMockCommercialAds(query: string, limit: number): TikTokCommercialAd[] {
  const mockTemplates = [
    {
      advertiser: `${query.split(' ')[0]}Official`,
      caption: `Transform your ${query} workflow with our AI-powered solution`,
      cta: 'Learn More',
    },
    {
      advertiser: `Best${query.replace(/\s/g, '')}`,
      caption: `Why thousands choose us for ${query}`,
      cta: 'Get Started',
    },
    {
      advertiser: `${query.replace(/\s/g, '')}Pro`,
      caption: `The future of ${query} is here. Join 50K+ users.`,
      cta: 'Sign Up',
    },
    {
      advertiser: `Smart${query.replace(/\s/g, '')}`,
      caption: `Save 10 hours per week with ${query} automation`,
      cta: 'Try Free',
    },
    {
      advertiser: `${query.split(' ')[0]}Master`,
      caption: `From beginner to pro in ${query} - start today`,
      cta: 'Watch Demo',
    },
  ];

  return mockTemplates.slice(0, limit).map((template, i) => ({
    ad_id: `mock_commercial_${query.replace(/\s/g, '_')}_${i}`,
    advertiser_name: template.advertiser,
    advertiser_id: `adv_${i}`,
    video_id: `video_${i}`,
    creative_url: `https://www.tiktok.com/@${template.advertiser.toLowerCase()}/video/mock${i}`,
    thumbnail_url: `https://via.placeholder.com/480x854?text=${encodeURIComponent(template.advertiser)}`,
    caption: template.caption,
    landing_page_url: `https://${template.advertiser.toLowerCase()}.com`,
    call_to_action: template.cta,
    targeting: {
      countries: ['US', 'CA', 'UK'],
      age_groups: ['18-24', '25-34', '35-44'],
      interests: [query.toLowerCase(), 'business', 'productivity'],
    },
  }));
}

function generateMockMetrics(adId: string): TikTokCommercialMetrics {
  const baseReach = Math.floor(Math.random() * 900000) + 100000; // 100K - 1M
  const impressions = Math.floor(baseReach * (1.5 + Math.random())); // 1.5-2.5x reach
  const views = Math.floor(impressions * (0.3 + Math.random() * 0.3)); // 30-60% of impressions
  const clicks = Math.floor(views * (0.02 + Math.random() * 0.08)); // 2-10% of views
  const engagementRate = ((clicks / views) * 100);

  // Random dates within last 180 days
  const daysAgo = Math.floor(Math.random() * 180);
  const daysRunning = Math.floor(Math.random() * daysAgo) + 1;
  const firstShown = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  const lastShown = new Date(firstShown.getTime() + daysRunning * 24 * 60 * 60 * 1000);

  // Estimate spend based on reach (rough CPM of $10-30)
  const estimatedSpend = (impressions / 1000) * (10 + Math.random() * 20);

  return {
    ad_id: adId,
    reach_unique_users: baseReach,
    impressions,
    views,
    clicks,
    engagement_rate: engagementRate,
    first_shown: firstShown.toISOString(),
    last_shown: lastShown.toISOString(),
    days_running: daysRunning,
    spend_estimate: {
      low: Math.floor(estimatedSpend * 0.8),
      high: Math.floor(estimatedSpend * 1.2),
      currency: 'USD',
    },
  };
}
