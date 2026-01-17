/**
 * YouTube Data Collector
 *
 * Collects video and channel data from YouTube:
 * 1. Video search by keyword
 * 2. Channel data retrieval
 * 3. Video statistics and metrics
 * 4. Popular videos in a niche
 *
 * Uses YouTube Data API v3
 * Requires YOUTUBE_API_KEY environment variable
 */

export interface YouTubeAsset {
  source: 'youtube_search' | 'youtube_channel' | 'youtube_trending';
  platform: 'youtube';
  video_id: string;
  channel_id: string;
  url: string;
  thumbnail_url?: string;
  title: string;
  description?: string;
  channel_title: string;
  published_at?: string;
  tags?: string[];
  category_id?: string;
  duration?: string;
  raw_payload?: Record<string, unknown>;
}

export interface YouTubeMetrics {
  views?: number;
  likes?: number;
  comments?: number;
  subscribers?: number;
  engagement_rate?: number;
  published_at?: string;
}

export interface YouTubePattern {
  video_format?: string;
  hook_style?: string;
  content_type?: string;
  thumbnail_style?: string;
  title_pattern?: string;
  duration_category?: 'short' | 'medium' | 'long';
}

export interface YouTubeUGCResult {
  asset: YouTubeAsset;
  metrics?: YouTubeMetrics;
  pattern?: YouTubePattern;
}

/**
 * Search YouTube videos by keyword
 */
export async function searchYouTubeVideos(
  query: string,
  options?: {
    maxResults?: number;
    order?: 'relevance' | 'date' | 'viewCount' | 'rating';
    videoDuration?: 'short' | 'medium' | 'long' | 'any';
  }
): Promise<YouTubeUGCResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.warn('YOUTUBE_API_KEY not set, using mock YouTube data');
    return generateMockYouTubeVideos(query);
  }

  try {
    const maxResults = options?.maxResults || 20;
    const order = options?.order || 'relevance';
    const videoDuration = options?.videoDuration || 'any';

    // Search for videos
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.append('key', apiKey);
    searchUrl.searchParams.append('q', query);
    searchUrl.searchParams.append('part', 'snippet');
    searchUrl.searchParams.append('type', 'video');
    searchUrl.searchParams.append('maxResults', maxResults.toString());
    searchUrl.searchParams.append('order', order);
    if (videoDuration !== 'any') {
      searchUrl.searchParams.append('videoDuration', videoDuration);
    }

    const searchResponse = await fetch(searchUrl.toString());

    if (!searchResponse.ok) {
      console.warn('YouTube API search failed, using mock data');
      return generateMockYouTubeVideos(query);
    }

    const searchData = await searchResponse.json();

    if (!searchData.items || !Array.isArray(searchData.items)) {
      return generateMockYouTubeVideos(query);
    }

    // Get video IDs to fetch statistics
    const videoIds = searchData.items.map((item: Record<string, unknown>) =>
      (item.id as Record<string, unknown>)?.videoId as string
    ).filter(Boolean);

    if (videoIds.length === 0) {
      return generateMockYouTubeVideos(query);
    }

    // Fetch video statistics
    const statsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    statsUrl.searchParams.append('key', apiKey);
    statsUrl.searchParams.append('id', videoIds.join(','));
    statsUrl.searchParams.append('part', 'statistics,contentDetails,snippet');

    const statsResponse = await fetch(statsUrl.toString());

    if (!statsResponse.ok) {
      console.warn('YouTube API statistics failed, using search data only');
      return mapSearchResultsToUGC(searchData.items, query);
    }

    const statsData = await statsResponse.json();

    // Merge search results with statistics
    return mergeYouTubeData(searchData.items, statsData.items || [], query);

  } catch (error) {
    console.error('YouTube API error:', error);
    return generateMockYouTubeVideos(query);
  }
}

/**
 * Get channel information and recent videos
 */
export async function getYouTubeChannelData(
  channelId: string,
  options?: {
    includeVideos?: boolean;
    maxVideos?: number;
  }
): Promise<{
  channel: {
    id: string;
    title: string;
    description: string;
    subscriber_count?: number;
    video_count?: number;
    view_count?: number;
    thumbnail_url?: string;
  };
  videos?: YouTubeUGCResult[];
}> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.warn('YOUTUBE_API_KEY not set, using mock channel data');
    return generateMockChannelData(channelId);
  }

  try {
    // Get channel details
    const channelUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
    channelUrl.searchParams.append('key', apiKey);
    channelUrl.searchParams.append('id', channelId);
    channelUrl.searchParams.append('part', 'snippet,statistics,contentDetails');

    const channelResponse = await fetch(channelUrl.toString());

    if (!channelResponse.ok) {
      return generateMockChannelData(channelId);
    }

    const channelData = await channelResponse.json();

    if (!channelData.items || channelData.items.length === 0) {
      return generateMockChannelData(channelId);
    }

    const channel = channelData.items[0];
    const snippet = channel.snippet as Record<string, unknown>;
    const statistics = channel.statistics as Record<string, unknown>;

    const result: {
      channel: {
        id: string;
        title: string;
        description: string;
        subscriber_count?: number;
        video_count?: number;
        view_count?: number;
        thumbnail_url?: string;
      };
      videos?: YouTubeUGCResult[];
    } = {
      channel: {
        id: channelId,
        title: snippet.title as string,
        description: snippet.description as string,
        subscriber_count: parseInt(statistics.subscriberCount as string) || 0,
        video_count: parseInt(statistics.videoCount as string) || 0,
        view_count: parseInt(statistics.viewCount as string) || 0,
        thumbnail_url: ((snippet.thumbnails as Record<string, unknown>)?.high as Record<string, unknown>)?.url as string,
      },
    };

    // Optionally fetch recent videos
    if (options?.includeVideos) {
      const uploadsPlaylistId = ((channel.contentDetails as Record<string, unknown>)?.relatedPlaylists as Record<string, unknown>)?.uploads as string;

      if (uploadsPlaylistId) {
        const videosUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
        videosUrl.searchParams.append('key', apiKey);
        videosUrl.searchParams.append('playlistId', uploadsPlaylistId);
        videosUrl.searchParams.append('part', 'snippet,contentDetails');
        videosUrl.searchParams.append('maxResults', (options.maxVideos || 10).toString());

        const videosResponse = await fetch(videosUrl.toString());

        if (videosResponse.ok) {
          const videosData = await videosResponse.json();
          result.videos = mapSearchResultsToUGC(videosData.items || [], snippet.title as string);
        }
      }
    }

    return result;

  } catch (error) {
    console.error('YouTube channel API error:', error);
    return generateMockChannelData(channelId);
  }
}

/**
 * Collect all YouTube UGC for a niche
 */
export async function collectYouTubeUGC(
  nicheQuery: string,
  seedTerms: string[] = []
): Promise<YouTubeUGCResult[]> {
  const results: YouTubeUGCResult[] = [];
  const searchTerms = [nicheQuery, ...seedTerms.slice(0, 2)];

  for (const term of searchTerms) {
    try {
      // Get relevant videos
      const videos = await searchYouTubeVideos(term, {
        maxResults: 10,
        order: 'relevance'
      });
      results.push(...videos);

      // Get popular videos
      const popular = await searchYouTubeVideos(term, {
        maxResults: 5,
        order: 'viewCount'
      });
      results.push(...popular);

      // Rate limiting (YouTube API has quota limits)
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`YouTube collection error for "${term}":`, error);
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

// Helper functions

function mergeYouTubeData(
  searchItems: Record<string, unknown>[],
  statsItems: Record<string, unknown>[],
  query: string
): YouTubeUGCResult[] {
  const statsMap = new Map(
    statsItems.map(item => [(item.id as string), item])
  );

  return searchItems.map(item => {
    const videoId = (item.id as Record<string, unknown>)?.videoId as string;
    const snippet = item.snippet as Record<string, unknown>;
    const stats = statsMap.get(videoId);
    const statistics = stats?.statistics as Record<string, unknown> | undefined;
    const contentDetails = stats?.contentDetails as Record<string, unknown> | undefined;

    return {
      asset: {
        source: 'youtube_search' as const,
        platform: 'youtube' as const,
        video_id: videoId,
        channel_id: snippet.channelId as string,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail_url: ((snippet.thumbnails as Record<string, unknown>)?.high as Record<string, unknown>)?.url as string,
        title: snippet.title as string,
        description: snippet.description as string,
        channel_title: snippet.channelTitle as string,
        published_at: snippet.publishedAt as string,
        tags: (stats?.snippet as Record<string, unknown>)?.tags as string[],
        duration: contentDetails?.duration as string,
        raw_payload: item,
      },
      metrics: statistics ? {
        views: parseInt(statistics.viewCount as string) || 0,
        likes: parseInt(statistics.likeCount as string) || 0,
        comments: parseInt(statistics.commentCount as string) || 0,
        engagement_rate: calculateYouTubeEngagementRate(statistics),
        published_at: snippet.publishedAt as string,
      } : undefined,
      pattern: {
        video_format: detectVideoFormat(snippet.title as string, snippet.description as string),
        duration_category: categorizeDuration(contentDetails?.duration as string),
        title_pattern: detectTitlePattern(snippet.title as string, query),
      },
    };
  });
}

function mapSearchResultsToUGC(
  items: Record<string, unknown>[],
  query: string
): YouTubeUGCResult[] {
  return items.map(item => {
    const snippet = item.snippet as Record<string, unknown>;
    const videoId = ((item.id as Record<string, unknown>)?.videoId ||
                    (item.contentDetails as Record<string, unknown>)?.videoId) as string;

    return {
      asset: {
        source: 'youtube_search' as const,
        platform: 'youtube' as const,
        video_id: videoId,
        channel_id: snippet.channelId as string,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail_url: ((snippet.thumbnails as Record<string, unknown>)?.high as Record<string, unknown>)?.url as string,
        title: snippet.title as string,
        description: snippet.description as string,
        channel_title: snippet.channelTitle as string,
        published_at: snippet.publishedAt as string,
        raw_payload: item,
      },
      pattern: {
        title_pattern: detectTitlePattern(snippet.title as string, query),
      },
    };
  });
}

function calculateYouTubeEngagementRate(statistics: Record<string, unknown>): number {
  const views = parseInt(statistics.viewCount as string) || 0;
  if (views === 0) return 0;

  const likes = parseInt(statistics.likeCount as string) || 0;
  const comments = parseInt(statistics.commentCount as string) || 0;
  const engagement = likes + comments;

  return (engagement / views) * 100;
}

function detectVideoFormat(title: string, description: string): string {
  const content = (title + ' ' + description).toLowerCase();

  if (content.includes('tutorial') || content.includes('how to')) return 'tutorial';
  if (content.includes('review') || content.includes('unboxing')) return 'review';
  if (content.includes('vlog') || content.includes('day in')) return 'vlog';
  if (content.includes('comparison') || content.includes('vs')) return 'comparison';
  if (content.includes('tips') || content.includes('hacks')) return 'tips';

  return 'general';
}

function categorizeDuration(duration?: string): 'short' | 'medium' | 'long' {
  if (!duration) return 'medium';

  // Parse ISO 8601 duration (e.g., "PT15M33S")
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 'medium';

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  if (totalSeconds < 180) return 'short';
  if (totalSeconds < 600) return 'medium';
  return 'long';
}

function detectTitlePattern(title: string, query: string): string {
  const lowerTitle = title.toLowerCase();
  const lowerQuery = query.toLowerCase();

  if (lowerTitle.startsWith('how to') || lowerTitle.includes('tutorial')) return 'how_to';
  if (lowerTitle.includes('best') && lowerTitle.includes(lowerQuery)) return 'best_of';
  if (lowerTitle.includes('vs') || lowerTitle.includes('comparison')) return 'comparison';
  if (lowerTitle.match(/\d+\s+(tips|hacks|ways|tricks)/i)) return 'listicle';
  if (lowerTitle.includes('review') || lowerTitle.includes('unboxing')) return 'review';

  return 'general';
}

// Mock data generators

function generateMockYouTubeVideos(query: string): YouTubeUGCResult[] {
  const mockTemplates = [
    {
      title: `How to ${query} - Complete Tutorial for Beginners`,
      format: 'tutorial',
      titlePattern: 'how_to',
    },
    {
      title: `Best ${query} in 2026 - Top 10 Reviewed`,
      format: 'review',
      titlePattern: 'best_of',
    },
    {
      title: `${query} Tips and Tricks You Need to Know`,
      format: 'tips',
      titlePattern: 'listicle',
    },
    {
      title: `My Experience with ${query} - Honest Review`,
      format: 'review',
      titlePattern: 'review',
    },
    {
      title: `${query} vs Traditional Methods - Which is Better?`,
      format: 'comparison',
      titlePattern: 'comparison',
    },
  ];

  return mockTemplates.map((template, i) => ({
    asset: {
      source: 'youtube_search' as const,
      platform: 'youtube' as const,
      video_id: `mock_${query.replace(/\s/g, '_')}_${i}`,
      channel_id: `mock_channel_${i}`,
      url: `https://www.youtube.com/watch?v=mock${i}`,
      thumbnail_url: `https://i.ytimg.com/vi/mock${i}/hqdefault.jpg`,
      title: template.title,
      description: `Learn everything about ${query} in this comprehensive video.`,
      channel_title: `${query} Expert ${i + 1}`,
      published_at: new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
      tags: [query, 'tutorial', 'howto', '2026'],
    },
    metrics: {
      views: Math.floor(Math.random() * 100000) + 10000,
      likes: Math.floor(Math.random() * 5000) + 500,
      comments: Math.floor(Math.random() * 500) + 50,
      engagement_rate: Math.random() * 5 + 1,
      published_at: new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    pattern: {
      video_format: template.format,
      title_pattern: template.titlePattern,
      duration_category: i % 2 === 0 ? 'medium' : 'long',
    },
  }));
}

function generateMockChannelData(channelId: string): {
  channel: {
    id: string;
    title: string;
    description: string;
    subscriber_count?: number;
    video_count?: number;
    view_count?: number;
    thumbnail_url?: string;
  };
  videos?: YouTubeUGCResult[];
} {
  return {
    channel: {
      id: channelId,
      title: `Channel ${channelId.slice(0, 8)}`,
      description: 'A YouTube channel focused on creating helpful content.',
      subscriber_count: Math.floor(Math.random() * 100000) + 10000,
      video_count: Math.floor(Math.random() * 500) + 50,
      view_count: Math.floor(Math.random() * 10000000) + 1000000,
      thumbnail_url: `https://yt3.ggpht.com/mock-channel-${channelId.slice(0, 8)}`,
    },
    videos: [],
  };
}
