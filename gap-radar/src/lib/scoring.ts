/**
 * Scoring Module
 * 
 * Implements the scoring formulas from the PRD.
 */

import { MetaAd } from './collectors/meta';
import { GoogleAd } from './collectors/google';
import { RedditMention } from './collectors/reddit';
import { Cluster } from './ai/extractor';
import { GapOpportunity } from './ai/gap-generator';

export interface RunScores {
  saturation: number;
  longevity: number;
  dissatisfaction: number;
  misalignment: number;
  opportunity: number;
  confidence: number;
}

/**
 * Sigmoid function for score normalization
 */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Clamp value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate Ad Saturation Score (0-100)
 * 
 * Formula: saturation = 100 * sigmoid(0.6*log1p(A) + 0.3*log1p(C) + 0.8*R)
 * Where:
 *   A = unique_advertisers
 *   C = total_creatives
 *   R = repetition_index (top_3_angle_share, 0-1)
 */
export function calculateSaturationScore(ads: (MetaAd | GoogleAd)[], clusters: Cluster[]): number {
  if (ads.length === 0) return 0;

  const uniqueAdvertisers = new Set(ads.map(a => a.advertiser_name)).size;
  const totalCreatives = ads.length;
  
  // Calculate repetition index from angle clusters
  const angleClusters = clusters.filter(c => c.cluster_type === 'angle');
  const topAnglesFrequency = angleClusters
    .slice(0, 3)
    .reduce((sum, c) => sum + c.frequency, 0);
  const totalAngleFrequency = angleClusters.reduce((sum, c) => sum + c.frequency, 0);
  const repetitionIndex = totalAngleFrequency > 0 
    ? topAnglesFrequency / totalAngleFrequency 
    : 0;

  const rawScore = 0.6 * Math.log1p(uniqueAdvertisers) + 
                   0.3 * Math.log1p(totalCreatives) + 
                   0.8 * repetitionIndex;
  
  return Math.round(100 * sigmoid(rawScore - 2)); // Offset to center around 50
}

/**
 * Calculate Longevity Signal (0-100)
 * 
 * Formula: longevity = clamp(100 * log1p(days_running) / log1p(180), 0, 100)
 */
export function calculateLongevityScore(ads: (MetaAd | GoogleAd)[]): number {
  if (ads.length === 0) return 0;

  const now = new Date();
  const daysRunning = ads
    .filter(ad => ad.source === 'meta')  // Only Meta ads have first_seen tracking
    .map(ad => {
      const metaAd = ad as MetaAd;
      if (!metaAd.first_seen) return 0;
      const firstSeen = new Date(metaAd.first_seen);
      return Math.floor((now.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24));
    });

  const maxDaysRunning = Math.max(...daysRunning);

  // Use max days - if any ad has been running long, market has proven longevity
  return Math.round(clamp(100 * Math.log1p(maxDaysRunning) / Math.log1p(180), 0, 100));
}

/**
 * Calculate Reddit Dissatisfaction Score (0-100)
 * 
 * Formula: dissatisfaction = 100 * sigmoid(0.5*log1p(F) + 0.7*I + 0.6*S + 0.2*log1p(W))
 * Where:
 *   F = frequency (mentions in objection clusters)
 *   I = intensity (LLM-rated strength 0-1)
 *   S = sentiment_neg_ratio (0-1)
 *   W = weighted_score (sum of upvoted complaints)
 */
export function calculateDissatisfactionScore(
  mentions: RedditMention[], 
  clusters: Cluster[]
): number {
  if (mentions.length === 0) return 0;

  const objectionClusters = clusters.filter(c => c.cluster_type === 'objection');
  
  const frequency = objectionClusters.reduce((sum, c) => sum + c.frequency, 0);
  const intensity = objectionClusters.length > 0
    ? objectionClusters.reduce((sum, c) => sum + c.intensity, 0) / objectionClusters.length
    : 0;
  
  // Estimate negative sentiment ratio from mention scores
  const negativeCount = mentions.filter(m => 
    m.body.toLowerCase().includes('bad') ||
    m.body.toLowerCase().includes('terrible') ||
    m.body.toLowerCase().includes('expensive') ||
    m.body.toLowerCase().includes('scam') ||
    m.body.toLowerCase().includes('doesn\'t work')
  ).length;
  const sentimentNegRatio = mentions.length > 0 ? negativeCount / mentions.length : 0;
  
  const weightedScore = mentions.reduce((sum, m) => sum + Math.max(m.score, 0), 0);

  const rawScore = 0.5 * Math.log1p(frequency) + 
                   0.7 * intensity + 
                   0.6 * sentimentNegRatio + 
                   0.2 * Math.log1p(weightedScore);
  
  return Math.round(100 * sigmoid(rawScore - 1));
}

/**
 * Calculate Misalignment Score (0-100)
 * 
 * Formula: misalignment = 100 * (0.5*(1 - P) + 0.3*M + 0.2*T)
 * Where:
 *   P = promise_coverage (how often ads mention user's top pains)
 *   M = missing_feature_rate (how often reddit asks for X but ads never mention X)
 *   T = trust_gap (refund/privacy/support complaints vs ad clarity)
 */
export function calculateMisalignmentScore(
  ads: (MetaAd | GoogleAd)[],
  clusters: Cluster[]
): number {
  const angleClusters = clusters.filter(c => c.cluster_type === 'angle');
  const objectionClusters = clusters.filter(c => c.cluster_type === 'objection');
  const featureClusters = clusters.filter(c => c.cluster_type === 'feature');

  // Promise coverage: check if top objections are addressed in ads
  const adText = ads.map(a => {
    if (a.source === 'google') {
      return `${a.headline} ${a.description}`.toLowerCase();
    }
    const metaAd = a as MetaAd;
    return `${metaAd.headline || ''} ${metaAd.creative_text} ${metaAd.cta || ''}`.toLowerCase();
  }).join(' ');
  const objectionLabels = objectionClusters.map(c => c.label.toLowerCase());
  const addressedObjections = objectionLabels.filter(label => 
    label.split(' ').some(word => adText.includes(word))
  ).length;
  const promiseCoverage = objectionLabels.length > 0 
    ? addressedObjections / objectionLabels.length 
    : 0;

  // Missing feature rate
  const featureLabels = featureClusters.map(c => c.label.toLowerCase());
  const mentionedFeatures = featureLabels.filter(label =>
    label.split(' ').some(word => adText.includes(word))
  ).length;
  const missingFeatureRate = featureLabels.length > 0
    ? 1 - (mentionedFeatures / featureLabels.length)
    : 0;

  // Trust gap (simplified)
  const trustKeywords = ['refund', 'privacy', 'support', 'scam', 'trust'];
  const hasTrustObjections = objectionClusters.some(c => 
    trustKeywords.some(k => c.label.toLowerCase().includes(k))
  );
  const adMentionsTrust = trustKeywords.some(k => adText.includes(k));
  const trustGap = hasTrustObjections && !adMentionsTrust ? 0.8 : 0.2;

  return Math.round(100 * (0.5 * (1 - promiseCoverage) + 0.3 * missingFeatureRate + 0.2 * trustGap));
}

/**
 * Calculate Opportunity Score (0-100)
 * 
 * Formula: opportunity = 0.35*longevity + 0.35*dissatisfaction + 0.30*misalignment
 *          opportunity_adj = opportunity - 0.15*saturation
 */
export function calculateOpportunityScore(
  longevity: number,
  dissatisfaction: number,
  misalignment: number,
  saturation: number
): number {
  const baseOpportunity = 0.35 * longevity + 0.35 * dissatisfaction + 0.30 * misalignment;
  const adjusted = baseOpportunity - 0.15 * saturation;
  return Math.round(clamp(adjusted, 0, 100));
}

/**
 * Calculate Confidence Score (0-1)
 * 
 * Formula: confidence = clamp(0.4*data_sufficiency + 0.4*cross_source_alignment + 0.2*recency, 0, 1)
 */
export function calculateConfidenceScore(
  ads: (MetaAd | GoogleAd)[],
  mentions: RedditMention[],
  gaps: GapOpportunity[]
): number {
  // Data sufficiency
  const hasEnoughAds = ads.length >= 10;
  const hasEnoughMentions = mentions.length >= 20;
  const dataSufficiency = (hasEnoughAds ? 0.5 : ads.length / 20) + 
                          (hasEnoughMentions ? 0.5 : mentions.length / 40);

  // Cross-source alignment (gaps have evidence from both sources)
  const gapsWithBothSources = gaps.filter(g => 
    g.evidence_ads.length > 0 && g.evidence_reddit.length > 0
  ).length;
  const crossSourceAlignment = gaps.length > 0 
    ? gapsWithBothSources / gaps.length 
    : 0;

  // Recency (check if data is recent)
  const now = new Date();
  const recentMentions = mentions.filter(m => {
    const posted = new Date(m.posted_at);
    const daysDiff = (now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 30;
  }).length;
  const recency = mentions.length > 0 ? recentMentions / mentions.length : 0;

  return clamp(0.4 * dataSufficiency + 0.4 * crossSourceAlignment + 0.2 * recency, 0, 1);
}

/**
 * UGC Asset interface for scoring
 */
export interface UGCAssetForScoring {
  first_shown?: string;
  last_shown?: string;
  posted_at?: string;
}

export interface UGCMetricsForScoring {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  reach_unique_users?: number;
}

/**
 * Calculate UGC Score for Ad-Tested content (0-100)
 * 
 * Formula: Score = 0.45*Longevity + 0.35*Reach + 0.20*EngagementProxy
 */
export function calculateUGCAdTestedScore(
  asset: UGCAssetForScoring,
  metrics: UGCMetricsForScoring
): number {
  // Longevity: days the ad has been shown
  let longevity = 0;
  if (asset.first_shown && asset.last_shown) {
    const firstShown = new Date(asset.first_shown);
    const lastShown = new Date(asset.last_shown);
    const daysRunning = Math.floor((lastShown.getTime() - firstShown.getTime()) / (1000 * 60 * 60 * 24));
    longevity = clamp(100 * Math.log1p(daysRunning) / Math.log1p(90), 0, 100); // 90 days normalization
  }

  // Reach: normalized by typical reach values
  const reach = metrics.reach_unique_users || metrics.views || 0;
  const reachScore = clamp(100 * Math.log1p(reach) / Math.log1p(1000000), 0, 100); // 1M normalization

  // Engagement proxy
  const totalEngagement = (metrics.likes || 0) + (metrics.comments || 0) * 2 + (metrics.shares || 0) * 3;
  const views = metrics.views || 1;
  const engagementRate = (totalEngagement / views) * 100;
  const engagementScore = clamp(engagementRate * 10, 0, 100); // 10% = 100 score

  return Math.round(0.45 * longevity + 0.35 * reachScore + 0.20 * engagementScore);
}

/**
 * Calculate UGC Score for Trend content (0-100)
 * 
 * Formula: Score = 0.6*Recency + 0.4*RelevanceToNiche
 */
export function calculateUGCTrendScore(
  asset: UGCAssetForScoring,
  relevanceScore: number = 0.5 // 0-1 from LLM or keyword matching
): number {
  // Recency: how recently posted
  let recency = 50; // default
  if (asset.posted_at) {
    const postedAt = new Date(asset.posted_at);
    const now = new Date();
    const daysAgo = Math.floor((now.getTime() - postedAt.getTime()) / (1000 * 60 * 60 * 24));
    recency = clamp(100 * (1 - daysAgo / 30), 0, 100); // 30 days = 0 recency
  }

  // Relevance normalized to 0-100
  const relevance = clamp(relevanceScore * 100, 0, 100);

  return Math.round(0.6 * recency + 0.4 * relevance);
}

/**
 * Calculate UGC Score for Connected/Owned content (0-100)
 * 
 * Formula: Score = 0.4*SharesRate + 0.3*CommentRate + 0.2*LikeRate + 0.1*ViewVelocity
 */
export function calculateUGCConnectedScore(
  metrics: UGCMetricsForScoring,
  asset: UGCAssetForScoring
): number {
  const views = metrics.views || 1;
  
  // Shares rate (most valuable)
  const sharesRate = ((metrics.shares || 0) / views) * 100;
  const sharesScore = clamp(sharesRate * 20, 0, 100); // 5% shares = 100

  // Comment rate
  const commentRate = ((metrics.comments || 0) / views) * 100;
  const commentScore = clamp(commentRate * 10, 0, 100); // 10% comments = 100

  // Like rate
  const likeRate = ((metrics.likes || 0) / views) * 100;
  const likeScore = clamp(likeRate * 2, 0, 100); // 50% likes = 100

  // View velocity (views per day since posting)
  let velocityScore = 50;
  if (asset.posted_at) {
    const postedAt = new Date(asset.posted_at);
    const now = new Date();
    const daysSince = Math.max(1, Math.floor((now.getTime() - postedAt.getTime()) / (1000 * 60 * 60 * 24)));
    const viewsPerDay = views / daysSince;
    velocityScore = clamp(100 * Math.log1p(viewsPerDay) / Math.log1p(10000), 0, 100); // 10k/day = 100
  }

  return Math.round(0.4 * sharesScore + 0.3 * commentScore + 0.2 * likeScore + 0.1 * velocityScore);
}

/**
 * Calculate Build-to-Profit Score (0-100)
 *
 * Formula: B2P = (TAM × GM × Prob_Success) / (Dev_Cost + Marketing_Cost)
 *
 * Where:
 * - TAM = Total Addressable Market estimate (expected value)
 * - GM = Gross Margin (typically 70-90% for SaaS, default 0.8)
 * - Prob_Success = Confidence score × Market fit factor
 * - Dev_Cost = Estimated development cost based on complexity
 * - Marketing_Cost = Estimated first-year marketing budget
 *
 * The score is normalized to 0-100 range using logarithmic scaling.
 */
export function calculateBuildToProfitScore(
  tamExpected: number,
  confidence: number,
  buildDifficulty: number = 5, // 1-10 scale
  distributionDifficulty: number = 5, // 1-10 scale
  grossMargin: number = 0.8, // 0.7-0.9 for SaaS
  marketFitFactor: number = 0.7 // Derived from opportunity score
): number {
  // Probability of success (0-1)
  // Higher confidence and better market fit = higher probability
  const probSuccess = confidence * marketFitFactor;

  // Development cost estimate based on build difficulty
  // Scale: $5k (difficulty=1) to $200k (difficulty=10)
  const devCost = 5000 + (buildDifficulty * 19500);

  // Marketing cost estimate based on distribution difficulty
  // Scale: $10k (difficulty=1) to $500k (difficulty=10)
  const marketingCost = 10000 + (distributionDifficulty * 49000);

  // Total investment needed
  const totalCost = devCost + marketingCost;

  // Potential return (TAM × GM × Probability)
  const potentialReturn = tamExpected * grossMargin * probSuccess;

  // Raw B2P ratio
  const b2pRatio = potentialReturn / totalCost;

  // Normalize to 0-100 scale using logarithmic scaling
  // A ratio of 10 = ~80 score, ratio of 100 = ~100 score
  // This makes the score more meaningful for comparison
  const normalizedScore = Math.min(100, Math.max(0, 50 + 25 * Math.log10(b2pRatio + 1)));

  return Math.round(normalizedScore);
}

/**
 * Calculate all scores for a run
 */
export function calculateScores(
  ads: (MetaAd | GoogleAd)[],
  mentions: RedditMention[],
  clusters: Cluster[],
  gaps: GapOpportunity[]
): RunScores {
  const saturation = calculateSaturationScore(ads, clusters);
  const longevity = calculateLongevityScore(ads);
  const dissatisfaction = calculateDissatisfactionScore(mentions, clusters);
  const misalignment = calculateMisalignmentScore(ads, clusters);
  const opportunity = calculateOpportunityScore(longevity, dissatisfaction, misalignment, saturation);
  const confidence = calculateConfidenceScore(ads, mentions, gaps);

  return {
    saturation,
    longevity,
    dissatisfaction,
    misalignment,
    opportunity,
    confidence: Math.round(confidence * 100) / 100,
  };
}
