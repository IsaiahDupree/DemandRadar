/**
 * UGC Scoring Module
 *
 * Implements UGC scoring formulas from PRD §5.H:
 * - Ad-tested lane: 0.45*Longevity + 0.35*Reach + 0.20*EngagementProxy
 * - Trend lane: 0.6*Recency + 0.4*RelevanceToNiche
 * - Connected performance: 0.4*SharesRate + 0.3*CommentRate + 0.2*LikeRate + 0.1*ViewVelocity
 */

export interface UGCAsset {
  first_shown?: string;
  last_shown?: string;
  posted_at?: string;
}

export interface UGCMetrics {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  reach_unique_users?: number;
}

export interface UGCResult {
  asset: {
    id: string;
    platform: 'tiktok' | 'instagram';
    url: string;
    caption?: string;
  } & UGCAsset;
  metrics: UGCMetrics & {
    score: number;
  };
  pattern?: {
    hookType: string;
    format: string;
    proofType: string;
    ctaStyle: string;
  };
}

/**
 * Ad-tested UGC score
 * Formula: 0.45*Longevity + 0.35*Reach + 0.20*EngagementProxy
 *
 * Used for ads from TikTok Top Ads or TikTok Commercial Content API
 */
export function calculateUGCAdTestedScore(
  asset: UGCAsset,
  metrics: UGCMetrics
): number {
  // Longevity (days shown)
  let longevity = 0;
  if (asset.first_shown && asset.last_shown) {
    const firstShown = new Date(asset.first_shown);
    const lastShown = new Date(asset.last_shown);
    const daysShown = (lastShown.getTime() - firstShown.getTime()) / (1000 * 60 * 60 * 24);
    longevity = Math.min(daysShown / 60, 1) * 100; // Normalize to 60 days
  }

  // Reach (unique users reached)
  let reach = 0;
  if (metrics.reach_unique_users) {
    reach = Math.min(metrics.reach_unique_users / 100000, 1) * 100; // Normalize to 100k
  } else if (metrics.views) {
    // Fallback to views if reach not available
    reach = Math.min(metrics.views / 200000, 1) * 100; // Normalize to 200k views
  }

  // Engagement proxy (likes + comments + shares)
  let engagement = 0;
  const totalEngagement =
    (metrics.likes || 0) + (metrics.comments || 0) * 2 + (metrics.shares || 0) * 3;

  engagement = Math.min(totalEngagement / 10000, 1) * 100; // Normalize to 10k engagement

  // Weighted score
  const score = 0.45 * longevity + 0.35 * reach + 0.20 * engagement;

  return Math.round(score * 10) / 10;
}

/**
 * Trend UGC score
 * Formula: 0.6*Recency + 0.4*RelevanceToNiche
 *
 * Used for trending content from TikTok/Instagram hashtags
 */
export function calculateUGCTrendScore(
  asset: UGCAsset,
  relevanceToNiche: number // 0-1, from semantic analysis
): number {
  // Recency
  let recency = 0;
  if (asset.posted_at) {
    const postedAt = new Date(asset.posted_at);
    const now = new Date();
    const ageInDays = (now.getTime() - postedAt.getTime()) / (1000 * 60 * 60 * 24);
    recency = Math.max(0, Math.min(1, 1 - ageInDays / 30)) * 100; // Normalize to 30 days
  }

  // Relevance (provided as input)
  const relevance = Math.min(Math.max(relevanceToNiche, 0), 1) * 100;

  // Weighted score
  const score = 0.6 * recency + 0.4 * relevance;

  return Math.round(score * 10) / 10;
}

/**
 * Connected performance UGC score
 * Formula: 0.4*SharesRate + 0.3*CommentRate + 0.2*LikeRate + 0.1*ViewVelocity
 *
 * Used for connected user accounts (TikTok/Instagram connected)
 */
export function calculateUGCConnectedScore(
  metrics: UGCMetrics,
  asset: UGCAsset
): number {
  const views = metrics.views || 1; // Avoid division by zero

  // Shares rate
  const sharesRate = Math.min((metrics.shares || 0) / views, 0.1) * 1000; // Normalize to 10% share rate

  // Comment rate
  const commentRate = Math.min((metrics.comments || 0) / views, 0.05) * 2000; // Normalize to 5% comment rate

  // Like rate
  const likeRate = Math.min((metrics.likes || 0) / views, 0.15) * 667; // Normalize to 15% like rate

  // View velocity (views per day)
  let viewVelocity = 0;
  if (asset.posted_at) {
    const postedAt = new Date(asset.posted_at);
    const now = new Date();
    const ageInDays = Math.max(
      (now.getTime() - postedAt.getTime()) / (1000 * 60 * 60 * 24),
      1
    );
    const viewsPerDay = views / ageInDays;
    viewVelocity = Math.min(viewsPerDay / 10000, 1) * 100; // Normalize to 10k views/day
  }

  // Weighted score
  const score =
    0.4 * sharesRate +
    0.3 * commentRate +
    0.2 * likeRate +
    0.1 * viewVelocity;

  return Math.round(Math.min(score, 100) * 10) / 10;
}

/**
 * Rank UGC results by score
 */
export function rankUGCByScore(
  results: UGCResult[],
  options?: {
    platform?: 'tiktok' | 'instagram' | 'all';
    limit?: number;
  }
): UGCResult[] {
  const platform = options?.platform || 'all';
  const limit = options?.limit || 20;

  let filtered = results;

  // Filter by platform if specified
  if (platform !== 'all') {
    filtered = filtered.filter(r => r.asset.platform === platform);
  }

  // Sort by score descending
  const sorted = filtered.sort((a, b) => b.metrics.score - a.metrics.score);

  // Limit results
  return sorted.slice(0, limit);
}

/**
 * Get UGC leaderboard grouped by hook type
 */
export function getUGCLeaderboardByHook(
  results: UGCResult[]
): Record<string, UGCResult[]> {
  const leaderboard: Record<string, UGCResult[]> = {};

  for (const result of results) {
    const hookType = result.pattern?.hookType || 'Unknown';

    if (!leaderboard[hookType]) {
      leaderboard[hookType] = [];
    }

    leaderboard[hookType].push(result);
  }

  // Sort each hook type group by score
  for (const hookType in leaderboard) {
    leaderboard[hookType].sort((a, b) => b.metrics.score - a.metrics.score);
  }

  return leaderboard;
}

/**
 * Get top performing UGC across all platforms
 */
export function getTopUGC(
  results: UGCResult[],
  options?: {
    minScore?: number;
    limit?: number;
  }
): UGCResult[] {
  const minScore = options?.minScore || 0;
  const limit = options?.limit || 10;

  return results
    .filter(r => r.metrics.score >= minScore)
    .sort((a, b) => b.metrics.score - a.metrics.score)
    .slice(0, limit);
}
