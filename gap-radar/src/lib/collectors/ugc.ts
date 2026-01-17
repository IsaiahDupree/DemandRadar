/**
 * Unified UGC Collector
 * 
 * Combines TikTok and Instagram collectors into a single interface
 * for collecting UGC content across platforms.
 */

import { collectTikTokUGC, TikTokUGCResult } from './tiktok';
import { collectInstagramUGC, InstagramUGCResult } from './instagram';
import {
  calculateUGCAdTestedScore,
  calculateUGCTrendScore,
  calculateUGCConnectedScore,
} from '../scoring';

export interface UGCAsset {
  id: string;
  source: string;
  platform: 'tiktok' | 'instagram';
  url: string;
  thumbnail_url?: string;
  caption?: string;
  hashtags?: string[];
  creator_username?: string;
  posted_at?: string;
  media_type?: string;
}

export interface UGCMetrics {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  reach_unique_users?: number;
  first_shown?: string;
  last_shown?: string;
  score: number;
}

export interface UGCPattern {
  hook_type?: string;
  format?: string;
  proof_type?: string;
  objection_handled?: string;
  cta_style?: string;
}

export interface UGCResult {
  asset: UGCAsset;
  metrics: UGCMetrics;
  pattern?: UGCPattern;
}

export interface UGCCollectionResult {
  tiktok: UGCResult[];
  instagram: UGCResult[];
  combined: UGCResult[];
  topPerformers: UGCResult[];
  patterns: {
    topHookTypes: { type: string; count: number }[];
    topFormats: { format: string; count: number }[];
    topCTAs: { cta: string; count: number }[];
  };
}

/**
 * Collect all UGC for a niche from TikTok and Instagram
 */
export async function collectAllUGC(
  nicheQuery: string,
  seedTerms: string[] = []
): Promise<UGCCollectionResult> {
  // Collect from both platforms in parallel
  const [tiktokResults, instagramResults] = await Promise.all([
    collectTikTokUGC(nicheQuery, seedTerms),
    collectInstagramUGC(nicheQuery, seedTerms),
  ]);

  // Normalize TikTok results
  const tiktok: UGCResult[] = tiktokResults.map(r => normalizeResult(r, 'tiktok'));

  // Normalize Instagram results
  const instagram: UGCResult[] = instagramResults.map(r => normalizeResult(r, 'instagram'));

  // Combine all results
  const combined = [...tiktok, ...instagram];

  // Sort by score to get top performers
  const topPerformers = [...combined]
    .sort((a, b) => b.metrics.score - a.metrics.score)
    .slice(0, 20);

  // Analyze patterns
  const patterns = analyzePatterns(combined);

  return {
    tiktok,
    instagram,
    combined,
    topPerformers,
    patterns,
  };
}

/**
 * Normalize TikTok or Instagram result to unified format
 */
function normalizeResult(
  result: TikTokUGCResult | InstagramUGCResult,
  platform: 'tiktok' | 'instagram'
): UGCResult {
  if (platform === 'tiktok') {
    const r = result as TikTokUGCResult;
    const score = calculateScoreFromData(r.asset.source, r.metrics, r.asset.posted_at);
    
    return {
      asset: {
        id: r.asset.video_id,
        source: r.asset.source,
        platform: 'tiktok',
        url: r.asset.url,
        thumbnail_url: r.asset.thumbnail_url,
        caption: r.asset.caption,
        hashtags: r.asset.hashtags,
        creator_username: r.asset.creator_username,
        posted_at: r.asset.posted_at,
        media_type: 'video',
      },
      metrics: {
        views: r.metrics?.views,
        likes: r.metrics?.likes,
        comments: r.metrics?.comments,
        shares: r.metrics?.shares,
        reach_unique_users: r.metrics?.reach_unique_users,
        first_shown: r.metrics?.first_shown,
        last_shown: r.metrics?.last_shown,
        score,
      },
      pattern: r.pattern ? {
        hook_type: r.pattern.hook_type,
        format: r.pattern.format,
        proof_type: r.pattern.proof_type,
        objection_handled: r.pattern.objection_handled,
        cta_style: r.pattern.cta_style,
      } : undefined,
    };
  } else {
    const r = result as InstagramUGCResult;
    const score = calculateScoreFromData(r.asset.source, r.metrics, r.asset.posted_at);
    
    return {
      asset: {
        id: r.asset.post_id,
        source: r.asset.source,
        platform: 'instagram',
        url: r.asset.url,
        thumbnail_url: r.asset.thumbnail_url,
        caption: r.asset.caption,
        hashtags: r.asset.hashtags,
        creator_username: r.asset.creator_username,
        posted_at: r.asset.posted_at,
        media_type: r.asset.media_type,
      },
      metrics: {
        views: r.metrics?.views,
        likes: r.metrics?.likes,
        comments: r.metrics?.comments,
        score,
      },
      pattern: r.pattern ? {
        hook_type: r.pattern.hook_type,
        format: r.pattern.format,
        proof_type: r.pattern.proof_type,
        cta_style: r.pattern.cta_style,
      } : undefined,
    };
  }
}

/**
 * Calculate score based on source type and metrics
 */
function calculateScoreFromData(
  source: string,
  metrics: { views?: number; likes?: number; comments?: number; shares?: number; reach_unique_users?: number; first_shown?: string; last_shown?: string } | undefined,
  postedAt?: string
): number {
  if (!metrics) return 0;

  const metricsForScoring = {
    views: metrics.views,
    likes: metrics.likes,
    comments: metrics.comments,
    shares: metrics.shares,
    reach_unique_users: metrics.reach_unique_users,
  };

  const assetForScoring = {
    first_shown: metrics.first_shown,
    last_shown: metrics.last_shown,
    posted_at: postedAt,
  };

  if (source.includes('top_ads') || source.includes('commercial')) {
    return calculateUGCAdTestedScore(assetForScoring, metricsForScoring);
  } else if (source.includes('trend')) {
    return calculateUGCTrendScore(assetForScoring, 0.7);
  } else if (source.includes('connected')) {
    return calculateUGCConnectedScore(metricsForScoring, assetForScoring);
  } else {
    // Default: use trend scoring for hashtag/organic content
    return calculateUGCTrendScore(assetForScoring, 0.5);
  }
}

/**
 * Analyze patterns across all UGC results
 */
function analyzePatterns(results: UGCResult[]): UGCCollectionResult['patterns'] {
  const hookCounts = new Map<string, number>();
  const formatCounts = new Map<string, number>();
  const ctaCounts = new Map<string, number>();

  for (const r of results) {
    if (r.pattern?.hook_type) {
      hookCounts.set(r.pattern.hook_type, (hookCounts.get(r.pattern.hook_type) || 0) + 1);
    }
    if (r.pattern?.format) {
      formatCounts.set(r.pattern.format, (formatCounts.get(r.pattern.format) || 0) + 1);
    }
    if (r.pattern?.cta_style) {
      ctaCounts.set(r.pattern.cta_style, (ctaCounts.get(r.pattern.cta_style) || 0) + 1);
    }
  }

  const sortByCount = (map: Map<string, number>) =>
    Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

  return {
    topHookTypes: sortByCount(hookCounts).map(([type, count]) => ({ type, count })),
    topFormats: sortByCount(formatCounts).map(([format, count]) => ({ format, count })),
    topCTAs: sortByCount(ctaCounts).map(([cta, count]) => ({ cta, count })),
  };
}

/**
 * Get UGC leaderboard by platform
 */
export function getUGCLeaderboard(
  results: UGCCollectionResult,
  options?: {
    platform?: 'tiktok' | 'instagram' | 'all';
    sortBy?: 'score' | 'views' | 'engagement';
    limit?: number;
  }
): UGCResult[] {
  const platform = options?.platform || 'all';
  const sortBy = options?.sortBy || 'score';
  const limit = options?.limit || 20;

  let filtered = results.combined;
  
  if (platform !== 'all') {
    filtered = filtered.filter(r => r.asset.platform === platform);
  }

  return filtered
    .sort((a, b) => {
      if (sortBy === 'views') {
        return (b.metrics.views || 0) - (a.metrics.views || 0);
      } else if (sortBy === 'engagement') {
        const aEng = (a.metrics.likes || 0) + (a.metrics.comments || 0) * 2 + (a.metrics.shares || 0) * 3;
        const bEng = (b.metrics.likes || 0) + (b.metrics.comments || 0) * 2 + (b.metrics.shares || 0) * 3;
        return bEng - aEng;
      }
      return b.metrics.score - a.metrics.score;
    })
    .slice(0, limit);
}
