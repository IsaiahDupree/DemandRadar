/**
 * TikTok Trend Discovery
 *
 * UGC-002: Fetches trending hashtags and sounds from TikTok
 * with relevance scoring to the target niche.
 */

export type TrendType = 'hashtag' | 'sound' | 'video';

export interface TikTokTrend {
  id: string;
  name: string;
  type: TrendType;
  volume: number;
  url: string;
  relevanceScore: number;
  thumbnail_url?: string;
  description?: string;
  creator_count?: number;
  video_count?: number;
}

interface TikTokTrendOptions {
  limit?: number;
  country?: string;
}

/**
 * Fetch trending hashtags and sounds from TikTok
 * Returns trends sorted by relevance score (highest first)
 */
export async function fetchTikTokTrends(
  niche: string,
  type: TrendType = 'hashtag',
  options: TikTokTrendOptions = {}
): Promise<TikTokTrend[]> {
  const { limit = 20 } = options;
  const rapidApiKey = process.env.RAPIDAPI_KEY;

  if (!rapidApiKey) {
    console.warn('RAPIDAPI_KEY not set, using mock TikTok trends');
    return generateMockTrends(niche, type, limit);
  }

  try {
    // Fetch trends from TikTok API via RapidAPI
    const trends = await fetchTrendsFromAPI(niche, type, rapidApiKey, limit);

    // Score relevance for each trend
    const scoredTrends = trends.map(trend => ({
      ...trend,
      relevanceScore: scoreTrendRelevance(trend, niche),
    }));

    // Sort by relevance score (descending)
    scoredTrends.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return scoredTrends.slice(0, limit);
  } catch (error) {
    console.error('TikTok trends API error:', error);
    return generateMockTrends(niche, type, limit);
  }
}

/**
 * Score trend relevance to the niche (0-100)
 *
 * Scoring factors:
 * - Keyword match (exact, partial, semantic)
 * - Volume (higher volume = more relevant if keywords match)
 * - Type (hashtags vs sounds)
 */
export function scoreTrendRelevance(trend: TikTokTrend, niche: string): number {
  const trendName = trend.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const nicheWords = niche.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  const nicheNormalized = nicheWords.join('');

  // 1. Keyword match score (0-70)
  let keywordScore = 0;

  // Exact match
  if (trendName === nicheNormalized) {
    keywordScore = 70;
  }
  // Contains full niche phrase
  else if (trendName.includes(nicheNormalized)) {
    keywordScore = 60;
  }
  // Contains all niche words
  else if (nicheWords.every(word => trendName.includes(word))) {
    keywordScore = 50;
  }
  // Contains some niche words
  else {
    const matchedWords = nicheWords.filter(word =>
      word.length > 2 && trendName.includes(word)
    );
    // Give bonus if the primary (first) niche word matches
    const primaryWordMatches = nicheWords[0] && trendName.includes(nicheWords[0]);
    const baseScore = matchedWords.length * 20;
    const primaryBonus = primaryWordMatches ? 15 : 0;
    keywordScore = Math.min(60, baseScore + primaryBonus);
  }

  // 2. Volume score (0-20)
  // Use log scale for volume to prevent massive outliers
  const volumeScore = Math.min(20, Math.log10(trend.volume + 1) * 2.5);

  // 3. Type bonus (0-10)
  // Hashtags are slightly more relevant than sounds for niche discovery
  const typeBonus = trend.type === 'hashtag' ? 10 : trend.type === 'sound' ? 8 : 5;

  // Total score (0-100)
  const totalScore = keywordScore + volumeScore + typeBonus;

  return Math.min(100, Math.max(0, Math.round(totalScore)));
}

/**
 * Fetch trends from TikTok API via RapidAPI
 */
async function fetchTrendsFromAPI(
  niche: string,
  type: TrendType,
  apiKey: string,
  limit: number
): Promise<TikTokTrend[]> {
  let endpoint: string;

  if (type === 'hashtag') {
    // Search for hashtag trends
    endpoint = `https://tiktok-api23.p.rapidapi.com/api/search/hashtag?keyword=${encodeURIComponent(niche)}&count=${limit}`;
  } else if (type === 'sound') {
    // Search for sound/music trends
    endpoint = `https://tiktok-api23.p.rapidapi.com/api/search/music?keyword=${encodeURIComponent(niche)}&count=${limit}`;
  } else {
    // Search for video trends (general search)
    endpoint = `https://tiktok-api23.p.rapidapi.com/api/search/general?keyword=${encodeURIComponent(niche)}&count=${limit}`;
  }

  const response = await fetch(endpoint, {
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'tiktok-api23.p.rapidapi.com',
    },
  });

  if (!response.ok) {
    throw new Error(`TikTok API returned ${response.status}`);
  }

  const data = await response.json();

  // Parse response based on type
  if (type === 'hashtag') {
    return parseHashtagTrends(data);
  } else if (type === 'sound') {
    return parseSoundTrends(data);
  } else {
    return parseVideoTrends(data);
  }
}

/**
 * Parse hashtag trends from API response
 */
function parseHashtagTrends(data: Record<string, unknown>): TikTokTrend[] {
  const challenges = (data.challenges || data.challengeList || []) as Record<string, unknown>[];

  return challenges.map((challenge, index) => ({
    id: (challenge.id as string) || `hashtag_${index}`,
    name: (challenge.title || challenge.challengeName || '') as string,
    type: 'hashtag' as const,
    volume: (challenge.viewCount || (challenge.stats as any)?.videoCount || 0) as number,
    url: `https://www.tiktok.com/tag/${(challenge.title as string || '').replace(/^#/, '')}`,
    relevanceScore: 0, // Will be scored later
    description: challenge.desc as string,
    video_count: (challenge.stats as any)?.videoCount as number,
  }));
}

/**
 * Parse sound/music trends from API response
 */
function parseSoundTrends(data: Record<string, unknown>): TikTokTrend[] {
  const music = (data.music || data.musicList || []) as Record<string, unknown>[];

  return music.map((sound, index) => ({
    id: (sound.id as string) || `sound_${index}`,
    name: (sound.title || sound.musicName || '') as string,
    type: 'sound' as const,
    volume: ((sound.stats as any)?.videoCount || sound.userCount || 0) as number,
    url: `https://www.tiktok.com/music/${sound.id || index}`,
    relevanceScore: 0, // Will be scored later
    thumbnail_url: sound.coverLarge as string || sound.coverMedium as string,
    creator_count: (sound.stats as any)?.userCount as number,
    video_count: (sound.stats as any)?.videoCount as number,
  }));
}

/**
 * Parse video trends from API response
 */
function parseVideoTrends(data: Record<string, unknown>): TikTokTrend[] {
  const items = (data.itemList || data.items || []) as Record<string, unknown>[];

  // Extract hashtags from video trends
  const hashtagMap = new Map<string, TikTokTrend>();

  items.forEach((item) => {
    const challenges = (item.challenges || []) as Record<string, unknown>[];
    challenges.forEach((challenge) => {
      const hashtagName = (challenge.title || '') as string;
      if (hashtagName && !hashtagMap.has(hashtagName)) {
        hashtagMap.set(hashtagName, {
          id: (challenge.id as string) || hashtagName,
          name: hashtagName,
          type: 'hashtag' as const,
          volume: (challenge.viewCount || 0) as number,
          url: `https://www.tiktok.com/tag/${hashtagName.replace(/^#/, '')}`,
          relevanceScore: 0,
        });
      }
    });
  });

  return Array.from(hashtagMap.values());
}

/**
 * Generate mock trends for development/testing
 */
function generateMockTrends(niche: string, type: TrendType, limit: number): TikTokTrend[] {
  const nicheWords = niche.toLowerCase().split(/\s+/);
  const mainWord = nicheWords[0];

  if (type === 'hashtag') {
    const mockHashtags: TikTokTrend[] = [
      {
        id: `${mainWord}_exact`,
        name: niche.replace(/\s/g, ''),
        type: 'hashtag',
        volume: 5000000,
        url: `https://www.tiktok.com/tag/${niche.replace(/\s/g, '')}`,
        relevanceScore: 0,
      },
      {
        id: `${mainWord}_tips`,
        name: `${niche.replace(/\s/g, '')}tips`,
        type: 'hashtag',
        volume: 2000000,
        url: `https://www.tiktok.com/tag/${niche.replace(/\s/g, '')}tips`,
        relevanceScore: 0,
      },
      {
        id: `${mainWord}_hack`,
        name: `${niche.replace(/\s/g, '')}hack`,
        type: 'hashtag',
        volume: 1500000,
        url: `https://www.tiktok.com/tag/${niche.replace(/\s/g, '')}hack`,
        relevanceScore: 0,
      },
      {
        id: `best_${mainWord}`,
        name: `best${niche.replace(/\s/g, '')}`,
        type: 'hashtag',
        volume: 1200000,
        url: `https://www.tiktok.com/tag/best${niche.replace(/\s/g, '')}`,
        relevanceScore: 0,
      },
      {
        id: `${mainWord}_2025`,
        name: `${niche.replace(/\s/g, '')}2025`,
        type: 'hashtag',
        volume: 800000,
        url: `https://www.tiktok.com/tag/${niche.replace(/\s/g, '')}2025`,
        relevanceScore: 0,
      },
      {
        id: mainWord,
        name: mainWord,
        type: 'hashtag',
        volume: 10000000,
        url: `https://www.tiktok.com/tag/${mainWord}`,
        relevanceScore: 0,
      },
      {
        id: `${mainWord}_related`,
        name: `${mainWord}life`,
        type: 'hashtag',
        volume: 3000000,
        url: `https://www.tiktok.com/tag/${mainWord}life`,
        relevanceScore: 0,
      },
      {
        id: 'unrelated',
        name: 'cooking',
        type: 'hashtag',
        volume: 20000000,
        url: 'https://www.tiktok.com/tag/cooking',
        relevanceScore: 0,
      },
    ];

    const scoredHashtags = mockHashtags.map(tag => ({
      ...tag,
      relevanceScore: scoreTrendRelevance(tag, niche),
    }));

    scoredHashtags.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return scoredHashtags.slice(0, limit);
  } else if (type === 'sound') {
    const mockSounds: TikTokTrend[] = [
      {
        id: 'sound_1',
        name: `${niche} motivation audio`,
        type: 'sound',
        volume: 1500000,
        url: 'https://www.tiktok.com/music/sound_1',
        relevanceScore: 0,
      },
      {
        id: 'sound_2',
        name: `original ${mainWord} sound`,
        type: 'sound',
        volume: 900000,
        url: 'https://www.tiktok.com/music/sound_2',
        relevanceScore: 0,
      },
      {
        id: 'sound_3',
        name: `trending ${mainWord} beat`,
        type: 'sound',
        volume: 600000,
        url: 'https://www.tiktok.com/music/sound_3',
        relevanceScore: 0,
      },
      {
        id: 'sound_4',
        name: 'viral trending sound 2025',
        type: 'sound',
        volume: 5000000,
        url: 'https://www.tiktok.com/music/sound_4',
        relevanceScore: 0,
      },
    ];

    const scoredSounds = mockSounds.map(sound => ({
      ...sound,
      relevanceScore: scoreTrendRelevance(sound, niche),
    }));

    scoredSounds.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return scoredSounds.slice(0, limit);
  } else {
    // For video type, return hashtag trends
    return generateMockTrends(niche, 'hashtag', limit);
  }
}
