/**
 * Google Trends Source
 *
 * Fetches trending topics from Google Trends Daily Trending Searches
 * Uses Google's public JSON endpoint for daily trending searches
 * Reference: https://trends.google.com/trends/trendingsearches/daily
 */

import type { TrendingTopic } from './fallback';

// Google Trends Daily Trending Searches endpoint
export const GOOGLE_TRENDS_API_URL = 'https://trends.google.com/trends/trendingsearches/daily/rss';

interface GoogleTrendData {
  title: {
    query: string;
  };
  formattedTraffic: string;
  articles?: Array<{
    title: string;
    snippet: string;
  }>;
}

interface GoogleTrendsResponse {
  default?: {
    trendingSearchesDays?: Array<{
      trendingSearches: GoogleTrendData[];
    }>;
  };
}

/**
 * Fetch trending topics from Google Trends
 * Returns normalized TrendingTopic array
 *
 * @param geo - Optional geographic filter (e.g., 'US', 'GB', 'IN')
 */
export async function fetchGoogleTrends(geo: string = 'US'): Promise<TrendingTopic[]> {
  try {
    // Google Trends Daily endpoint - JSON format
    const url = `https://trends.google.com/trends/api/dailytrends?hl=en-US&tz=-480&geo=${geo}&ns=15`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GapRadar/1.0',
        'Accept': 'application/json',
      },
      // @ts-ignore - Next.js fetch extension
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.warn(`Google Trends API returned ${response.status}: ${response.statusText}`);
      return [];
    }

    const text = await response.text();

    // Google's API returns JSON with a leading ")]}'" that needs to be stripped
    const jsonText = text.replace(/^\)\]\}'\n/, '');
    const data: GoogleTrendsResponse = JSON.parse(jsonText);

    if (!data.default?.trendingSearchesDays?.[0]?.trendingSearches) {
      console.warn('Google Trends data structure unexpected');
      return [];
    }

    // Get the first day's trending searches
    const trendingSearches = data.default.trendingSearchesDays[0].trendingSearches;

    // Normalize to TrendingTopic format
    const trends = trendingSearches
      .slice(0, 20) // Get top 20 to filter down to 12
      .map(trend => normalizeGoogleTrend(trend));

    // Sort by opportunity score and return top 12
    return trends
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 12);

  } catch (error) {
    console.error('Error fetching Google Trends:', error);
    return [];
  }
}

/**
 * Normalize a Google Trends result to TrendingTopic format
 */
export function normalizeGoogleTrend(trend: GoogleTrendData): TrendingTopic {
  const { title, formattedTraffic, articles = [] } = trend;
  const query = title.query;

  // Parse traffic volume
  const volume = parseTraffic(formattedTraffic);

  // Categorize the topic
  const category = categorize(query, articles);

  // Extract related terms
  const relatedTerms = extractRelatedTerms(query, articles);

  // Analyze sentiment from articles
  const sentiment = analyzeSentiment(articles);

  // Calculate growth score (Google Trends are by definition trending/growing)
  const growth = calculateGrowth(volume);

  // Calculate opportunity score
  const opportunityScore = calculateOpportunityScore(volume, growth, articles.length);

  return {
    id: `gt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    topic: query,
    category,
    volume,
    growth,
    sentiment,
    sources: ['Google Trends'],
    relatedTerms,
    opportunityScore,
  };
}

/**
 * Parse Google's formatted traffic string to a numeric volume
 * Examples: "100K+", "1M+", "50K+"
 */
function parseTraffic(formattedTraffic: string): number {
  const match = formattedTraffic.match(/^([\d.]+)([KM])\+?$/i);

  if (!match) {
    // Fallback: use a base number if format is unexpected
    return 10000;
  }

  const [, num, unit] = match;
  const baseNum = parseFloat(num);

  const multiplier = unit.toUpperCase() === 'M' ? 1000000 : 1000;

  return Math.round(baseNum * multiplier);
}

/**
 * Categorize a Google Trends topic based on query and articles
 */
function categorize(query: string, articles: Array<{ title: string; snippet: string }>): string {
  const queryLower = query.toLowerCase();

  // Combine query and article text for better categorization
  const allText = [
    queryLower,
    ...articles.map(a => a.title.toLowerCase()),
    ...articles.map(a => a.snippet.toLowerCase()),
  ].join(' ');

  const categories: Record<string, string[]> = {
    'AI & Automation': ['ai', 'artificial intelligence', 'chatbot', 'gpt', 'machine learning', 'automation', 'llm'],
    'Marketing': ['marketing', 'seo', 'ads', 'advertising', 'social media', 'email', 'growth', 'branding'],
    'Productivity': ['productivity', 'task', 'workflow', 'project management', 'time', 'organize', 'calendar'],
    'E-commerce': ['ecommerce', 'shopify', 'store', 'selling', 'dropship', 'retail', 'commerce'],
    'Finance': ['finance', 'payment', 'invoice', 'accounting', 'budget', 'banking', 'fintech'],
    'Development': ['code', 'developer', 'api', 'software', 'app', 'web', 'programming', 'no-code', 'nocode'],
    'Health & Wellness': ['health', 'fitness', 'wellness', 'mental', 'sleep', 'workout', 'medical'],
    'Education': ['learn', 'course', 'education', 'training', 'skill', 'teaching', 'student'],
    'Design': ['design', 'ui', 'ux', 'figma', 'creative', 'graphic', 'visual'],
    'Analytics': ['analytics', 'data', 'metrics', 'tracking', 'insights', 'dashboard'],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(k => allText.includes(k))) {
      return category;
    }
  }

  return 'General';
}

/**
 * Extract related terms from query and articles
 */
function extractRelatedTerms(query: string, articles: Array<{ title: string; snippet: string }>): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'for', 'with', 'from', 'to',
    'in', 'on', 'at', 'by', 'of', 'is', 'are', 'was', 'were', 'your',
    'this', 'that', 'these', 'those', 'what', 'which', 'who', 'when',
    'where', 'why', 'how', 'about', 'them', 'their', 'there'
  ]);

  // Combine query and first few article titles
  const allText = [
    query,
    ...articles.slice(0, 3).map(a => a.title),
  ].join(' ');

  const words = allText
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 4 && !stopWords.has(w));

  return Array.from(new Set(words)).slice(0, 5);
}

/**
 * Analyze sentiment from articles
 */
function analyzeSentiment(articles: Array<{ title: string; snippet: string }>): 'positive' | 'negative' | 'neutral' {
  if (articles.length === 0) return 'neutral';

  const allText = articles
    .map(a => `${a.title} ${a.snippet}`)
    .join(' ')
    .toLowerCase();

  const positiveWords = [
    'best', 'top', 'amazing', 'great', 'excellent', 'innovative',
    'revolutionary', 'breakthrough', 'success', 'growth', 'popular',
    'trending', 'winning', 'leading', 'premier', 'superior'
  ];

  const negativeWords = [
    'worst', 'bad', 'terrible', 'awful', 'crisis', 'failure',
    'decline', 'crash', 'scandal', 'controversy', 'disaster',
    'problem', 'concern', 'warning', 'risk'
  ];

  let score = 0;
  for (const word of positiveWords) {
    if (allText.includes(word)) score++;
  }
  for (const word of negativeWords) {
    if (allText.includes(word)) score--;
  }

  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

/**
 * Calculate growth score based on volume
 * Higher volume trends on Google Trends indicate more rapid growth
 */
function calculateGrowth(volume: number): number {
  // Google Trends are by definition trending, so base growth is high
  const baseGrowth = 60;

  // Higher volume = higher growth score
  const volumeBonus = Math.min(35, Math.log10(volume) * 5);

  // Add some randomness for variance
  const variance = Math.random() * 5;

  return Math.round(Math.min(100, baseGrowth + volumeBonus + variance));
}

/**
 * Calculate opportunity score
 */
function calculateOpportunityScore(volume: number, growth: number, articleCount: number): number {
  // Weighted formula:
  // - Volume (50%): Higher search volume = more opportunity
  // - Growth (30%): Trending topics have momentum
  // - Article count (20%): More coverage = validated interest

  const volumeScore = Math.min(100, Math.log10(volume) * 20);
  const growthScore = growth;
  const articleScore = Math.min(100, articleCount * 10);

  const score = (
    (volumeScore * 0.5) +
    (growthScore * 0.3) +
    (articleScore * 0.2)
  );

  return Math.round(Math.min(100, score));
}
