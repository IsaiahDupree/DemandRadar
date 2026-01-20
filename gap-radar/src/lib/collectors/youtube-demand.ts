/**
 * YouTube Demand Collector
 *
 * Adapter for collecting YouTube data for demand score calculation
 * Uses the existing YouTube collector and formats data for content scoring
 */

import { collectYouTubeUGC, searchYouTubeVideos, type YouTubeUGCResult } from './youtube';
import { YouTubeData, YouTubeVideo } from '@/lib/scoring/content-score';

export interface YouTubeDemandOptions {
  maxVideos?: number;
  maxComments?: number;
  seedTerms?: string[];
}

/**
 * Collect YouTube data for demand analysis
 */
export async function collectYouTubeDemand(
  niche: string,
  options: YouTubeDemandOptions = {}
): Promise<YouTubeData> {
  const maxVideos = options.maxVideos || 20;
  const seedTerms = options.seedTerms || [];

  try {
    // Collect videos for the niche
    const ugcResults = await collectYouTubeUGC(niche, seedTerms);

    if (ugcResults.length === 0) {
      return generateMockYouTubeData(niche);
    }

    // Calculate average views
    const videosWithViews = ugcResults.filter(r => r.metrics?.views);
    const avgViews = videosWithViews.length > 0
      ? videosWithViews.reduce((sum, r) => sum + (r.metrics?.views || 0), 0) / videosWithViews.length
      : 0;

    // Extract comments from video descriptions (in real implementation, would use YouTube Comments API)
    const comments = extractQuestionsFromDescriptions(ugcResults);

    // Format videos for gap analysis
    const videos: YouTubeVideo[] = ugcResults
      .slice(0, maxVideos)
      .map(result => ({
        title: result.asset.title,
        views: result.metrics?.views || 0,
        duration: parseDuration(result.asset.duration || ''),
      }));

    return {
      avgViews: Math.round(avgViews),
      comments,
      videos,
    };
  } catch (error) {
    console.error('YouTube demand collection error:', error);
    return generateMockYouTubeData(niche);
  }
}

/**
 * Parse ISO 8601 duration to seconds
 */
function parseDuration(duration: string): number {
  if (!duration) return 0;

  // Parse ISO 8601 duration (e.g., "PT15M33S")
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Extract potential questions from video descriptions
 * In production, this would use YouTube Comments API
 */
function extractQuestionsFromDescriptions(results: YouTubeUGCResult[]): string[] {
  const questions: string[] = [];

  for (const result of results) {
    const description = result.asset.description || '';
    const title = result.asset.title || '';

    // Look for question-like patterns in titles and descriptions
    const text = `${title} ${description}`;
    const sentences = text.split(/[.!?]\s+/);

    for (const sentence of sentences) {
      if (
        sentence.includes('?') ||
        /\b(how|what|where|why|when|can|should|could)\b/i.test(sentence)
      ) {
        questions.push(sentence.trim());
      }
    }
  }

  return questions.slice(0, 50); // Limit to 50 questions
}

/**
 * Generate mock YouTube data for development/fallback
 */
function generateMockYouTubeData(niche: string): YouTubeData {
  const baseViews = 10000 + (niche.length * 2000);

  const mockComments = [
    `How do I get started with ${niche}?`,
    `What tools do I need for ${niche}?`,
    `Where can I learn more about ${niche}?`,
    'Great video! Thanks for sharing!',
    `Why is ${niche} important?`,
    `When should I use ${niche}?`,
    'This is exactly what I was looking for!',
    `Can you make a tutorial about ${niche}?`,
    'Amazing content!',
    `Could you explain ${niche} in more detail?`,
  ];

  const mockVideos: YouTubeVideo[] = [
    {
      title: `${niche} - Complete Beginner Tutorial`,
      views: baseViews * 2,
      duration: 900, // 15 min
    },
    {
      title: `Advanced ${niche} Techniques`,
      views: baseViews * 0.8,
      duration: 1800, // 30 min
    },
    {
      title: `${niche} Tips and Tricks`,
      views: baseViews * 1.2,
      duration: 600, // 10 min
    },
    {
      title: `Quick ${niche} Guide`,
      views: baseViews * 1.5,
      duration: 300, // 5 min
    },
  ];

  return {
    avgViews: baseViews,
    comments: mockComments,
    videos: mockVideos,
  };
}
