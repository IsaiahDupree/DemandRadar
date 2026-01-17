/**
 * GapRadar Scoring Module
 *
 * Exports all scoring functions from formulas.ts and provides helper functions
 * to work with collector data formats.
 */

export {
  calculateSaturationScore,
  calculateLongevityScore,
  calculateAverageLongevity,
  calculateDissatisfactionScore,
  calculateMisalignmentScore,
  calculateOpportunityScore,
  calculateConfidenceScore,
  calculateDataSufficiency,
  calculateCrossSourceAlignment,
  calculateRecency,
  calculateRunScores,
  type SaturationInputs,
  type LongevityInputs,
  type DissatisfactionInputs,
  type MisalignmentInputs,
  type OpportunityInputs,
  type ConfidenceInputs,
  type DataSufficiencyInputs,
  type CrossSourceInputs,
  type RecencyInputs,
  type RunData,
  type RunScores,
} from './formulas';

// Re-export demand score for compatibility
export {
  calculateDemandScore,
  generateMockSignals,
  type WeeklySignals,
  type DemandMetrics,
} from './demand-score';

/**
 * Helper types for working with collector data
 */

interface MetaAd {
  source: 'meta';
  advertiser_name: string;
  creative_text: string;
  headline?: string;
  description?: string;
  cta?: string;
  landing_url?: string;
  first_seen?: string;
  last_seen?: string;
  is_active?: boolean;
  media_type: 'image' | 'video' | 'carousel' | 'unknown';
  raw_payload?: Record<string, unknown>;
}

interface RedditMention {
  subreddit: string;
  type: 'post' | 'comment';
  title?: string;
  body: string;
  score: number;
  num_comments?: number;
  permalink: string;
  matched_entities: string[];
  posted_at: string;
  raw_payload?: Record<string, unknown>;
}

interface Cluster {
  cluster_type: 'angle' | 'objection' | 'feature' | 'offer';
  label: string;
  examples: string[];
  frequency: number;
  intensity: number;
}

interface GapOpportunity {
  id: string;
  run_id: string;
  gap_type: 'product' | 'offer' | 'positioning' | 'trust' | 'pricing';
  title: string;
  problem: string;
  evidence_ads: string[];
  evidence_reddit: string[];
  recommendation: string;
  opportunity_score: number;
  confidence: number;
}

/**
 * Calculate saturation score from ads and clusters
 *
 * Uses the uniqueAdvertisers, totalCreatives, and repetitionIndex to calculate saturation
 */
export function calculateSaturationScoreFromData(
  ads: MetaAd[],
  clusters: Cluster[]
): number {
  if (ads.length === 0) return 0;

  // Count unique advertisers
  const uniqueAdvertisers = new Set(ads.map(a => a.advertiser_name)).size;

  // Count total creatives
  const totalCreatives = ads.length;

  // Calculate repetition index from angle clusters
  const angleClusters = clusters.filter(c => c.cluster_type === 'angle');

  if (angleClusters.length === 0) {
    // No clusters, assume moderate repetition
    return calculateSaturationScore({
      uniqueAdvertisers,
      totalCreatives,
      repetitionIndex: 0.5,
    });
  }

  // Get top 3 angle clusters by frequency
  const top3 = angleClusters
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 3);

  // Repetition index = sum of top 3 frequencies / total frequencies
  const top3Freq = top3.reduce((sum, c) => sum + c.frequency, 0);
  const totalFreq = angleClusters.reduce((sum, c) => sum + c.frequency, 0);

  const repetitionIndex = totalFreq > 0 ? top3Freq / totalFreq : 0.5;

  const { calculateSaturationScore } = require('./formulas');
  return calculateSaturationScore({
    uniqueAdvertisers,
    totalCreatives,
    repetitionIndex,
  });
}

/**
 * Calculate longevity score from ads
 *
 * Uses the daysRunning for each ad to calculate average longevity
 */
export function calculateLongevityScoreFromData(ads: MetaAd[]): number {
  if (ads.length === 0) return 0;

  // Calculate days running for each ad
  const now = new Date();
  const daysRunning = ads
    .map(ad => {
      if (!ad.first_seen) return 0;
      const firstSeen = new Date(ad.first_seen);
      const days = (now.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24);
      return Math.max(0, days);
    })
    .filter(days => days > 0);

  if (daysRunning.length === 0) return 0;

  const { calculateAverageLongevity } = require('./formulas');
  return calculateAverageLongevity(daysRunning);
}

/**
 * Calculate dissatisfaction score from Reddit mentions and objection clusters
 *
 * Uses frequency, intensity, sentiment, and weighted score
 */
export function calculateDissatisfactionScoreFromData(
  mentions: RedditMention[],
  clusters: Cluster[]
): number {
  if (mentions.length === 0 || clusters.length === 0) return 0;

  // Get objection clusters
  const objectionClusters = clusters.filter(c => c.cluster_type === 'objection');

  if (objectionClusters.length === 0) return 0;

  // Calculate frequency (sum of all objection cluster frequencies)
  const frequency = objectionClusters.reduce((sum, c) => sum + c.frequency, 0);

  // Calculate average intensity
  const avgIntensity =
    objectionClusters.reduce((sum, c) => sum + c.intensity, 0) /
    objectionClusters.length;

  // Calculate sentiment ratio (mock for now - would need LLM sentiment analysis)
  // Assume negative sentiment for mentions related to objections
  const sentimentNegRatio = 0.6; // Default estimate

  // Calculate weighted score (sum of mention scores)
  const weightedScore = mentions.reduce((sum, m) => sum + m.score, 0);

  const { calculateDissatisfactionScore } = require('./formulas');
  return calculateDissatisfactionScore({
    frequency,
    intensity: avgIntensity,
    sentimentNegRatio,
    weightedScore,
  });
}

/**
 * Calculate misalignment score from ads and clusters
 *
 * Analyzes how well ads address user needs
 */
export function calculateMisalignmentScoreFromData(
  ads: MetaAd[],
  clusters: Cluster[]
): number {
  if (ads.length === 0 || clusters.length === 0) return 50; // Neutral

  const { calculateMisalignmentScore } = require('./formulas');

  // Extract ad angles/promises
  const adTexts = ads
    .map(a => [a.creative_text, a.headline, a.description].filter(Boolean))
    .flat()
    .map(t => t!.toLowerCase());

  // Extract user needs (feature requests)
  const featureClusters = clusters.filter(c => c.cluster_type === 'feature');
  const featureTexts = featureClusters
    .flatMap(c => c.examples)
    .map(e => e.toLowerCase());

  if (featureTexts.length === 0) {
    return calculateMisalignmentScore({
      promiseCoverage: 0.5,
      missingFeatureRate: 0.3,
      trustGap: 0.2,
    });
  }

  // Calculate promise coverage (how many features are mentioned in ads)
  let coverageCount = 0;
  for (const feature of featureTexts) {
    const words = feature.split(/\s+/);
    const covered = words.some(word =>
      adTexts.some(adText => adText.includes(word))
    );
    if (covered) coverageCount++;
  }

  const promiseCoverage = coverageCount / featureTexts.length;

  // Missing feature rate (inverse of coverage)
  const missingFeatureRate = 1 - promiseCoverage;

  // Trust gap (mock for now - would analyze trust-related objections)
  const trustGap = 0.3; // Default estimate

  return calculateMisalignmentScore({
    promiseCoverage,
    missingFeatureRate,
    trustGap,
  });
}

/**
 * Calculate confidence score from data quality
 */
export function calculateConfidenceScoreFromData(
  ads: MetaAd[],
  mentions: RedditMention[],
  gaps: GapOpportunity[]
): number {
  const { calculateConfidenceScore, calculateDataSufficiency } = require('./formulas');

  // Data sufficiency
  const dataSufficiency = calculateDataSufficiency({
    adCount: ads.length,
    redditMentionCount: mentions.length,
  });

  // Cross-source alignment (gaps with evidence from both sources)
  const gapsWithBothSources = gaps.filter(
    g => g.evidence_ads.length > 0 && g.evidence_reddit.length > 0
  ).length;

  const crossSourceAlignment =
    gaps.length > 0 ? gapsWithBothSources / gaps.length : 0.5;

  // Recency
  const now = new Date();
  const allDates = [
    ...ads.map(a => a.first_seen).filter(Boolean),
    ...mentions.map(m => m.posted_at),
  ].map(d => new Date(d!));

  if (allDates.length === 0) {
    return calculateConfidenceScore({
      dataSufficiency,
      crossSourceAlignment,
      recency: 0.5,
    });
  }

  const oldestDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const newestDate = new Date(Math.max(...allDates.map(d => d.getTime())));

  const avgDate = new Date(
    (oldestDate.getTime() + newestDate.getTime()) / 2
  );

  const avgAgeDays = (now.getTime() - avgDate.getTime()) / (1000 * 60 * 60 * 24);
  const recency = Math.max(0, Math.min(1, 1 - avgAgeDays / 90));

  return calculateConfidenceScore({
    dataSufficiency,
    crossSourceAlignment,
    recency,
  });
}

/**
 * Calculate all scores from collector data
 *
 * This is the main entry point for scoring a complete run
 */
export function calculateScores(
  ads: MetaAd[],
  mentions: RedditMention[],
  clusters: Cluster[],
  gaps: GapOpportunity[]
): {
  saturation: number;
  longevity: number;
  dissatisfaction: number;
  misalignment: number;
  opportunity: number;
  confidence: number;
} {
  const { calculateOpportunityScore } = require('./formulas');

  // Calculate component scores
  const saturation = calculateSaturationScoreFromData(ads, clusters);
  const longevity = calculateLongevityScoreFromData(ads);
  const dissatisfaction = calculateDissatisfactionScoreFromData(mentions, clusters);
  const misalignment = calculateMisalignmentScoreFromData(ads, clusters);

  // Calculate opportunity score
  const opportunity = calculateOpportunityScore({
    longevity,
    dissatisfaction,
    misalignment,
    saturation,
  });

  // Calculate confidence score
  const confidence = calculateConfidenceScoreFromData(ads, mentions, gaps);

  return {
    saturation,
    longevity,
    dissatisfaction,
    misalignment,
    opportunity,
    confidence,
  };
}

/**
 * UGC Scoring Functions (from PRD §5.H)
 */

interface UGCAsset {
  first_shown?: string;
  last_shown?: string;
  posted_at?: string;
}

interface UGCMetrics {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  reach_unique_users?: number;
}

/**
 * Ad-tested UGC score
 * Formula: 0.45*Longevity + 0.35*Reach + 0.20*EngagementProxy
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
