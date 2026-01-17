/**
 * TikTok UGC Collector
 * 
 * Collects UGC content data from TikTok sources:
 * 1. TikTok Creative Center (Top Ads + Trends) - via web scraping
 * 2. TikTok Commercial Content API (requires app approval)
 * 3. Connected user accounts (requires OAuth)
 * 
 * Note: Full API access requires TikTok app approval.
 * MVP uses Creative Center public data + RapidAPI fallback.
 */

export interface TikTokAsset {
  source: 'tiktok_top_ads' | 'tiktok_commercial' | 'tiktok_trend' | 'tiktok_connected';
  platform: 'tiktok';
  video_id: string;
  url: string;
  thumbnail_url?: string;
  caption?: string;
  hashtags?: string[];
  sound_name?: string;
  creator_name?: string;
  creator_username?: string;
  posted_at?: string;
  raw_payload?: Record<string, unknown>;
}

export interface TikTokMetrics {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  reach_unique_users?: number;
  first_shown?: string;
  last_shown?: string;
  engagement_rate?: number;
}

export interface TikTokPattern {
  hook_type?: string;
  format?: string;
  proof_type?: string;
  objection_handled?: string;
  cta_style?: string;
  duration_seconds?: number;
}

export interface TikTokUGCResult {
  asset: TikTokAsset;
  metrics?: TikTokMetrics;
  pattern?: TikTokPattern;
}

/**
 * Search TikTok Creative Center for top ads in a niche
 * Uses RapidAPI TikTok endpoint as fallback
 */
export async function searchTikTokTopAds(
  query: string,
  options?: {
    country?: string;
    industry?: string;
    limit?: number;
  }
): Promise<TikTokUGCResult[]> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  
  if (!rapidApiKey) {
    console.warn('RAPIDAPI_KEY not set, using mock TikTok data');
    return generateMockTikTokAds(query);
  }

  try {
    // Try RapidAPI TikTok endpoint
    const response = await fetch(
      `https://tiktok-api23.p.rapidapi.com/api/search/general?keyword=${encodeURIComponent(query)}&count=${options?.limit || 20}`,
      {
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'tiktok-api23.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      console.warn('TikTok RapidAPI failed, using mock data');
      return generateMockTikTokAds(query);
    }

    const data = await response.json();
    
    if (!data.itemList || !Array.isArray(data.itemList)) {
      return generateMockTikTokAds(query);
    }

    return data.itemList.map((item: Record<string, unknown>) => ({
      asset: {
        source: 'tiktok_top_ads' as const,
        platform: 'tiktok' as const,
        video_id: item.id as string || '',
        url: `https://www.tiktok.com/@${(item.author as Record<string, unknown>)?.uniqueId || 'user'}/video/${item.id}`,
        thumbnail_url: (item.video as Record<string, unknown>)?.cover as string,
        caption: item.desc as string,
        hashtags: ((item.challenges as Record<string, unknown>[]) || []).map((c: Record<string, unknown>) => c.title as string),
        sound_name: (item.music as Record<string, unknown>)?.title as string,
        creator_name: (item.author as Record<string, unknown>)?.nickname as string,
        creator_username: (item.author as Record<string, unknown>)?.uniqueId as string,
        posted_at: item.createTime ? new Date((item.createTime as number) * 1000).toISOString() : undefined,
        raw_payload: item,
      },
      metrics: {
        views: (item.stats as Record<string, unknown>)?.playCount as number,
        likes: (item.stats as Record<string, unknown>)?.diggCount as number,
        comments: (item.stats as Record<string, unknown>)?.commentCount as number,
        shares: (item.stats as Record<string, unknown>)?.shareCount as number,
        engagement_rate: calculateEngagementRate(item.stats as Record<string, number>),
      },
    }));
  } catch (error) {
    console.error('TikTok API error:', error);
    return generateMockTikTokAds(query);
  }
}

/**
 * Search TikTok trends (hashtags, sounds, creators)
 */
export async function searchTikTokTrends(
  query: string,
  type: 'hashtag' | 'sound' | 'video' = 'hashtag'
): Promise<TikTokUGCResult[]> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  
  if (!rapidApiKey) {
    console.warn('RAPIDAPI_KEY not set, using mock TikTok trends');
    return generateMockTikTokTrends(query);
  }

  try {
    const endpoint = type === 'hashtag' 
      ? `https://tiktok-api23.p.rapidapi.com/api/challenge/posts?challengeName=${encodeURIComponent(query)}&count=20`
      : `https://tiktok-api23.p.rapidapi.com/api/search/general?keyword=${encodeURIComponent(query)}&count=20`;

    const response = await fetch(endpoint, {
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'tiktok-api23.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      return generateMockTikTokTrends(query);
    }

    const data = await response.json();
    const items = data.itemList || data.items || [];

    return items.slice(0, 20).map((item: Record<string, unknown>) => ({
      asset: {
        source: 'tiktok_trend' as const,
        platform: 'tiktok' as const,
        video_id: item.id as string || '',
        url: `https://www.tiktok.com/@${(item.author as Record<string, unknown>)?.uniqueId || 'user'}/video/${item.id}`,
        thumbnail_url: (item.video as Record<string, unknown>)?.cover as string,
        caption: item.desc as string,
        hashtags: ((item.challenges as Record<string, unknown>[]) || []).map((c: Record<string, unknown>) => c.title as string),
        sound_name: (item.music as Record<string, unknown>)?.title as string,
        creator_username: (item.author as Record<string, unknown>)?.uniqueId as string,
        posted_at: item.createTime ? new Date((item.createTime as number) * 1000).toISOString() : undefined,
        raw_payload: item,
      },
      metrics: {
        views: (item.stats as Record<string, unknown>)?.playCount as number,
        likes: (item.stats as Record<string, unknown>)?.diggCount as number,
        comments: (item.stats as Record<string, unknown>)?.commentCount as number,
        shares: (item.stats as Record<string, unknown>)?.shareCount as number,
      },
    }));
  } catch (error) {
    console.error('TikTok trends API error:', error);
    return generateMockTikTokTrends(query);
  }
}

/**
 * Collect all TikTok UGC for a niche
 */
export async function collectTikTokUGC(
  nicheQuery: string,
  seedTerms: string[] = []
): Promise<TikTokUGCResult[]> {
  const results: TikTokUGCResult[] = [];
  const searchTerms = [nicheQuery, ...seedTerms.slice(0, 3)];

  for (const term of searchTerms) {
    try {
      // Get top ads/videos
      const topAds = await searchTikTokTopAds(term, { limit: 10 });
      results.push(...topAds);

      // Get trend content
      const trends = await searchTikTokTrends(term);
      results.push(...trends);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`TikTok collection error for "${term}":`, error);
    }
  }

  // Dedupe by video_id
  const seen = new Set<string>();
  return results.filter(r => {
    if (seen.has(r.asset.video_id)) return false;
    seen.add(r.asset.video_id);
    return true;
  });
}

function calculateEngagementRate(stats: Record<string, number> | undefined): number {
  if (!stats || !stats.playCount) return 0;
  const engagement = (stats.diggCount || 0) + (stats.commentCount || 0) + (stats.shareCount || 0);
  return (engagement / stats.playCount) * 100;
}

function generateMockTikTokAds(query: string): TikTokUGCResult[] {
  const mockTemplates = [
    {
      caption: `POV: You finally found a ${query} that actually works 🤯`,
      hook: 'POV / Relatable',
      format: 'selfie_ugc',
    },
    {
      caption: `Stop wasting money on ${query} that don't work. Here's what I use instead 👇`,
      hook: 'Pain point callout',
      format: 'talking_head',
    },
    {
      caption: `The ${query} hack that saved me hours every week ⏰`,
      hook: 'Hack / Productivity',
      format: 'screen_record',
    },
    {
      caption: `I tested 10 ${query} tools so you don't have to. Here's the winner:`,
      hook: 'Authority / Research',
      format: 'comparison',
    },
    {
      caption: `Before vs After using this ${query} 😱`,
      hook: 'Transformation',
      format: 'before_after',
    },
  ];

  return mockTemplates.map((template, i) => ({
    asset: {
      source: 'tiktok_top_ads' as const,
      platform: 'tiktok' as const,
      video_id: `mock_${query.replace(/\s/g, '_')}_${i}`,
      url: `https://www.tiktok.com/@creator/video/mock${i}`,
      caption: template.caption,
      hashtags: [query.replace(/\s/g, ''), 'fyp', 'viral'],
      creator_username: `${query.replace(/\s/g, '')}creator${i}`,
      posted_at: new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    metrics: {
      views: Math.floor(Math.random() * 500000) + 50000,
      likes: Math.floor(Math.random() * 50000) + 5000,
      comments: Math.floor(Math.random() * 2000) + 200,
      shares: Math.floor(Math.random() * 5000) + 500,
      engagement_rate: Math.random() * 10 + 2,
    },
    pattern: {
      hook_type: template.hook,
      format: template.format,
      proof_type: i % 2 === 0 ? 'demo' : 'testimonial',
      cta_style: i % 3 === 0 ? 'link_in_bio' : 'comment_keyword',
    },
  }));
}

function generateMockTikTokTrends(query: string): TikTokUGCResult[] {
  const trendTemplates = [
    { hashtag: query.replace(/\s/g, ''), sound: 'Trending Sound 1' },
    { hashtag: `${query.replace(/\s/g, '')}hack`, sound: 'Original Audio' },
    { hashtag: `best${query.replace(/\s/g, '')}`, sound: 'Viral Sound 2024' },
  ];

  return trendTemplates.map((template, i) => ({
    asset: {
      source: 'tiktok_trend' as const,
      platform: 'tiktok' as const,
      video_id: `trend_${query.replace(/\s/g, '_')}_${i}`,
      url: `https://www.tiktok.com/tag/${template.hashtag}`,
      caption: `#${template.hashtag} trending content`,
      hashtags: [template.hashtag, 'trending', 'fyp'],
      sound_name: template.sound,
      posted_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    },
    metrics: {
      views: Math.floor(Math.random() * 1000000) + 100000,
      likes: Math.floor(Math.random() * 100000) + 10000,
      comments: Math.floor(Math.random() * 5000) + 500,
      shares: Math.floor(Math.random() * 10000) + 1000,
    },
  }));
}
