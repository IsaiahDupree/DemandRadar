/**
 * Instagram UGC Collector
 * 
 * Collects UGC content data from Instagram sources:
 * 1. Instagram Public Content Access (Hashtag Search) - requires app approval
 * 2. Connected professional accounts (requires OAuth)
 * 
 * Note: Instagram API has strict access requirements.
 * MVP uses RapidAPI fallback + mock data.
 */

export interface InstagramAsset {
  source: 'ig_hashtag' | 'ig_connected';
  platform: 'instagram';
  post_id: string;
  url: string;
  thumbnail_url?: string;
  caption?: string;
  hashtags?: string[];
  media_type: 'image' | 'video' | 'carousel';
  creator_username?: string;
  posted_at?: string;
  raw_payload?: Record<string, unknown>;
}

export interface InstagramMetrics {
  likes?: number;
  comments?: number;
  views?: number; // For videos/reels
  saves?: number;
  reach?: number;
  engagement_rate?: number;
}

export interface InstagramPattern {
  hook_type?: string;
  format?: string;
  proof_type?: string;
  cta_style?: string;
  carousel_count?: number;
}

export interface InstagramUGCResult {
  asset: InstagramAsset;
  metrics?: InstagramMetrics;
  pattern?: InstagramPattern;
}

/**
 * Search Instagram by hashtag
 * Uses RapidAPI Instagram endpoint as fallback
 */
export async function searchInstagramHashtag(
  hashtag: string,
  options?: { limit?: number }
): Promise<InstagramUGCResult[]> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  
  if (!rapidApiKey) {
    console.warn('RAPIDAPI_KEY not set, using mock Instagram data');
    return generateMockInstagramPosts(hashtag);
  }

  try {
    // Clean hashtag (remove # if present)
    const cleanHashtag = hashtag.replace(/^#/, '');
    
    const response = await fetch(
      `https://instagram-scraper-api2.p.rapidapi.com/v1/hashtag?hashtag=${encodeURIComponent(cleanHashtag)}`,
      {
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      console.warn('Instagram RapidAPI failed, using mock data');
      return generateMockInstagramPosts(hashtag);
    }

    const data = await response.json();
    
    if (!data.data?.items || !Array.isArray(data.data.items)) {
      return generateMockInstagramPosts(hashtag);
    }

    return data.data.items.slice(0, options?.limit || 20).map((item: Record<string, unknown>) => ({
      asset: {
        source: 'ig_hashtag' as const,
        platform: 'instagram' as const,
        post_id: item.id as string || item.pk as string || '',
        url: `https://www.instagram.com/p/${item.code || item.shortcode}/`,
        thumbnail_url: ((item.image_versions2 as Record<string, unknown>)?.candidates as Array<Record<string, unknown>>)?.[0]?.url as string ||
                       item.thumbnail_url as string ||
                       item.display_url as string,
        caption: (item.caption as Record<string, unknown>)?.text as string || item.caption as string,
        hashtags: extractHashtags((item.caption as Record<string, unknown>)?.text as string || ''),
        media_type: getMediaType(item),
        creator_username: (item.user as Record<string, unknown>)?.username as string,
        posted_at: item.taken_at ? new Date((item.taken_at as number) * 1000).toISOString() : undefined,
        raw_payload: item,
      },
      metrics: {
        likes: item.like_count as number || (item.edge_liked_by as Record<string, unknown>)?.count as number,
        comments: item.comment_count as number || (item.edge_media_to_comment as Record<string, unknown>)?.count as number,
        views: item.view_count as number || item.video_view_count as number,
        engagement_rate: calculateInstagramEngagement(item),
      },
    }));
  } catch (error) {
    console.error('Instagram API error:', error);
    return generateMockInstagramPosts(hashtag);
  }
}

/**
 * Search Instagram for content related to a niche
 */
export async function searchInstagramContent(
  query: string,
  options?: { limit?: number }
): Promise<InstagramUGCResult[]> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  
  if (!rapidApiKey) {
    return generateMockInstagramPosts(query);
  }

  try {
    const response = await fetch(
      `https://instagram-scraper-api2.p.rapidapi.com/v1/search?search_query=${encodeURIComponent(query)}`,
      {
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      return generateMockInstagramPosts(query);
    }

    const data = await response.json();
    const items = data.data?.items || data.users || [];

    // For search results, we might get users/hashtags, not posts directly
    // Fall back to hashtag search with the query
    if (items.length === 0) {
      return searchInstagramHashtag(query, options);
    }

    return items.slice(0, options?.limit || 20).map((item: Record<string, unknown>) => ({
      asset: {
        source: 'ig_hashtag' as const,
        platform: 'instagram' as const,
        post_id: item.id as string || item.pk as string || '',
        url: `https://www.instagram.com/p/${item.code || item.shortcode}/`,
        thumbnail_url: item.thumbnail_url as string || item.profile_pic_url as string,
        caption: (item.caption as Record<string, unknown>)?.text as string || '',
        hashtags: extractHashtags((item.caption as Record<string, unknown>)?.text as string || ''),
        media_type: getMediaType(item),
        creator_username: (item.user as Record<string, unknown>)?.username as string || item.username as string,
        posted_at: item.taken_at ? new Date((item.taken_at as number) * 1000).toISOString() : undefined,
        raw_payload: item,
      },
      metrics: {
        likes: item.like_count as number,
        comments: item.comment_count as number,
        views: item.view_count as number,
      },
    }));
  } catch (error) {
    console.error('Instagram search error:', error);
    return generateMockInstagramPosts(query);
  }
}

/**
 * Collect all Instagram UGC for a niche
 */
export async function collectInstagramUGC(
  nicheQuery: string,
  seedTerms: string[] = []
): Promise<InstagramUGCResult[]> {
  const results: InstagramUGCResult[] = [];
  
  // Convert query to hashtag-friendly format
  const hashtags = [
    nicheQuery.replace(/\s+/g, ''),
    ...seedTerms.slice(0, 4).map(t => t.replace(/\s+/g, '')),
  ];

  for (const hashtag of hashtags) {
    try {
      const posts = await searchInstagramHashtag(hashtag, { limit: 10 });
      results.push(...posts);

      // Rate limiting - Instagram is sensitive
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Instagram collection error for "#${hashtag}":`, error);
    }
  }

  // Dedupe by post_id
  const seen = new Set<string>();
  return results.filter(r => {
    if (seen.has(r.asset.post_id)) return false;
    seen.add(r.asset.post_id);
    return true;
  });
}

function extractHashtags(caption: string): string[] {
  const matches = caption.match(/#[\w\u0080-\uFFFF]+/g) || [];
  return matches.map(h => h.replace('#', ''));
}

function getMediaType(item: Record<string, unknown>): 'image' | 'video' | 'carousel' {
  if (item.media_type === 8 || item.carousel_media) return 'carousel';
  if (item.media_type === 2 || item.is_video || item.video_url) return 'video';
  return 'image';
}

function calculateInstagramEngagement(item: Record<string, unknown>): number {
  const likes = item.like_count as number || 0;
  const comments = item.comment_count as number || 0;
  const followers = (item.user as Record<string, unknown>)?.follower_count as number || 10000;
  
  if (followers === 0) return 0;
  return ((likes + comments) / followers) * 100;
}

function generateMockInstagramPosts(query: string): InstagramUGCResult[] {
  const mockTemplates = [
    {
      caption: `The ${query} that changed everything for me 🙌 Link in bio!`,
      format: 'carousel',
      hook: 'Transformation',
    },
    {
      caption: `POV: You finally found a ${query} that works ✨ #${query.replace(/\s/g, '')} #fyp`,
      format: 'reel',
      hook: 'POV / Relatable',
    },
    {
      caption: `5 reasons why this ${query} is a game changer (save this!) 📌`,
      format: 'carousel',
      hook: 'Listicle',
    },
    {
      caption: `Before vs After using ${query} 😱 The results speak for themselves`,
      format: 'image',
      hook: 'Before/After',
    },
    {
      caption: `Honest review: I tested this ${query} for 30 days. Here's what happened...`,
      format: 'reel',
      hook: 'Review',
    },
  ];

  return mockTemplates.map((template, i) => ({
    asset: {
      source: 'ig_hashtag' as const,
      platform: 'instagram' as const,
      post_id: `mock_ig_${query.replace(/\s/g, '_')}_${i}`,
      url: `https://www.instagram.com/p/mock${i}/`,
      caption: template.caption,
      hashtags: [query.replace(/\s/g, ''), 'viral', 'trending'],
      media_type: template.format === 'reel' ? 'video' : template.format === 'carousel' ? 'carousel' : 'image',
      creator_username: `${query.replace(/\s/g, '')}creator${i}`,
      posted_at: new Date(Date.now() - (i + 1) * 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    metrics: {
      likes: Math.floor(Math.random() * 20000) + 2000,
      comments: Math.floor(Math.random() * 500) + 50,
      views: template.format === 'reel' ? Math.floor(Math.random() * 100000) + 10000 : undefined,
      engagement_rate: Math.random() * 8 + 2,
    },
    pattern: {
      hook_type: template.hook,
      format: template.format,
      proof_type: i % 2 === 0 ? 'results' : 'demo',
      cta_style: i % 3 === 0 ? 'link_in_bio' : 'save_post',
    },
  }));
}
