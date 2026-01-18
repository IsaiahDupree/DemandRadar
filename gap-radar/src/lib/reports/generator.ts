/**
 * Report Generator
 *
 * Generates comprehensive market analysis reports according to PRD spec (9 pages)
 *
 * Report Structure:
 * 1. Executive Summary
 * 2. Paid Market Snapshot
 * 3. What Customers Actually Say (Reddit)
 * 4. Platform Existence Gap
 * 5. Gap Opportunities (Ranked)
 * 6. Modeled Economics
 * 7. Buildability Assessment
 * 8. UGC Winners Pack
 * 9. Action Plan
 */

import { createClient } from '@/lib/supabase/server';
import { getCachedReport, setCachedReport, invalidateReportCache } from './cache';
// import type { Database } from '@/types/supabase';

type Run = any; // Database['public']['Tables']['runs']['Row'];
type AdCreative = any; // Database['public']['Tables']['ad_creatives']['Row'];
type RedditMention = any; // Database['public']['Tables']['reddit_mentions']['Row'];
type Extraction = any; // Database['public']['Tables']['extractions']['Row'];
type Cluster = any; // Database['public']['Tables']['clusters']['Row'];
type GapOpportunity = any; // Database['public']['Tables']['gap_opportunities']['Row'];
type ConceptIdea = any; // Database['public']['Tables']['concept_ideas']['Row'];
type ConceptMetrics = any; // Database['public']['Tables']['concept_metrics']['Row'];
type AppStoreResult = any; // Database['public']['Tables']['app_store_results']['Row'];

export interface ReportData {
  run: Run;
  summary: ExecutiveSummary;
  paidMarket: PaidMarketSnapshot;
  reddit: RedditInsights;
  platformGap: PlatformExistenceGap;
  gaps: GapOpportunity[];
  economics: ModeledEconomics;
  buildability: BuildabilityAssessment;
  ugc: UGCWinnersPack;
  actionPlan: ActionPlan;
}

export interface ExecutiveSummary {
  nicheName: string;
  opportunityScore: number;
  confidence: number;
  topGaps: {
    title: string;
    type: string;
    score: number;
  }[];
  platformRecommendation: {
    platform: 'web' | 'mobile' | 'hybrid';
    reasoning: string;
  };
}

export interface PaidMarketSnapshot {
  topAdvertisers: {
    name: string;
    adCount: number;
    avgLongevity: number;
  }[];
  topAngles: {
    angle: string;
    frequency: number;
    examples: string[];
  }[];
  longestRunning: {
    advertiser: string;
    creative: string;
    daysRunning: number;
    firstSeen: string;
  }[];
  offerPatterns: {
    pricing: string[];
    trials: string[];
    guarantees: string[];
  };
}

export interface RedditInsights {
  topObjections: {
    objection: string;
    frequency: number;
    intensity: number;
    examples: string[];
  }[];
  topDesiredFeatures: {
    feature: string;
    frequency: number;
    examples: string[];
  }[];
  pricingFriction: {
    quote: string;
    source: string;
    score: number;
  }[];
  trustFriction: {
    quote: string;
    source: string;
    score: number;
  }[];
  switchingTriggers: string[];
}

export interface PlatformExistenceGap {
  ios: {
    saturationScore: number;
    topApps: {
      name: string;
      developer: string;
      rating: number;
      reviewCount: number;
    }[];
  };
  android: {
    saturationScore: number;
    topApps: {
      name: string;
      developer: string;
      rating: number;
      reviewCount: number;
    }[];
  };
  web: {
    saturationScore: number;
    topCompetitors: {
      name: string;
      angle: string;
      longevity: number;
    }[];
  };
  recommendation: {
    platform: 'web' | 'mobile' | 'hybrid';
    rationale: string;
  };
}

export interface ModeledEconomics {
  cpc: { low: number; expected: number; high: number };
  cac: { low: number; expected: number; high: number };
  tam: { low: number; expected: number; high: number; assumptions: string[] };
  budgetScenarios: {
    spend1k: { reach: number; conversions: number; cost: number };
    spend10k: { reach: number; conversions: number; cost: number };
  };
}

export interface BuildabilityAssessment {
  implementationDifficulty: number; // 0-100
  timeToMVP: 'S' | 'M' | 'L';
  humanTouchLevel: 'high' | 'medium' | 'low';
  autonomousSuitability: 'high' | 'medium' | 'low';
  riskFlags: string[];
}

export interface UGCWinnersPack {
  topCreatives: {
    platform: string;
    url: string;
    score: number;
    engagement: { views: number; likes: number; shares: number };
  }[];
  trendSignals: {
    hashtags: string[];
    sounds: string[];
  };
  creativePatterns: {
    hooks: string[];
    formats: string[];
    proofTypes: string[];
    ctaStyles: string[];
  };
  recommendations: {
    hooks: string[];
    scripts: string[];
    shotList: string[];
  };
}

export interface ActionPlan {
  sevenDayWins: string[];
  thirtyDayRoadmap: {
    week: number;
    tasks: string[];
  }[];
  adTestConcepts: {
    concept: string;
    angle: string;
    copy: string;
    cta: string;
  }[];
  landingPageStructure: {
    hero: string;
    benefits: string[];
    cta: string;
  };
  topKeywords: string[];
}

/**
 * Generate a complete market analysis report
 * Uses caching to avoid recomputation (5-minute TTL)
 */
export async function generateReport(runId: string, userId: string): Promise<ReportData> {
  // Check cache first
  const cached = getCachedReport<ReportData>(runId);
  if (cached) {
    return cached.data;
  }

  const supabase = await createClient();

  // Fetch run and verify ownership
  const { data: run, error: runError } = await supabase
    .from('runs')
    .select('*')
    .eq('id', runId)
    .single();

  if (runError || !run) {
    throw new Error('Run not found');
  }

  // Verify ownership through project
  const { data: project } = await supabase
    .from('projects')
    .select('owner_id')
    .eq('id', run.project_id)
    .single();

  if (!project || project.owner_id !== userId) {
    throw new Error('Unauthorized');
  }

  // Fetch all related data in parallel
  const [
    { data: ads },
    { data: reddit },
    { data: extractions },
    { data: clusters },
    { data: gaps },
    { data: concepts },
    { data: apps },
  ] = await Promise.all([
    supabase.from('ad_creatives').select('*').eq('run_id', runId),
    supabase.from('reddit_mentions').select('*').eq('run_id', runId),
    supabase.from('extractions').select('*').eq('run_id', runId),
    supabase.from('clusters').select('*').eq('run_id', runId),
    supabase.from('gap_opportunities').select('*').eq('run_id', runId),
    supabase.from('concept_ideas').select(`
      *,
      concept_metrics (*)
    `).eq('run_id', runId),
    supabase.from('app_store_results').select('*').eq('run_id', runId),
  ]);

  // Build report sections
  const summary = buildExecutiveSummary(run, gaps || [], concepts || []);
  const paidMarket = buildPaidMarketSnapshot(ads || [], extractions || [], clusters || []);
  const redditInsights = buildRedditInsights(reddit || [], extractions || [], clusters || []);
  const platformGap = buildPlatformExistenceGap(apps || [], ads || [], concepts || []);
  const economics = buildModeledEconomics(concepts || []);
  const buildability = buildBuildabilityAssessment(concepts || []);
  const ugc = buildUGCWinnersPack();
  const actionPlan = buildActionPlan(gaps || [], clusters || [], run);

  const reportData: ReportData = {
    run,
    summary,
    paidMarket,
    reddit: redditInsights,
    platformGap,
    gaps: gaps || [],
    economics,
    buildability,
    ugc,
    actionPlan,
  };

  // Cache the report (5-minute TTL)
  setCachedReport(runId, reportData, { ttlMs: 5 * 60 * 1000 });

  return reportData;
}

/**
 * Page 1: Executive Summary
 */
function buildExecutiveSummary(
  run: Run,
  gaps: GapOpportunity[],
  concepts: (ConceptIdea & { concept_metrics?: ConceptMetrics[] })[]
): ExecutiveSummary {
  const scores = run.scores as { opportunity_score?: number; confidence?: number } || {};
  const opportunityScore = scores.opportunity_score || 0;
  const confidence = scores.confidence || 0;

  // Top 3 gaps by opportunity score
  const topGaps = gaps
    .sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0))
    .slice(0, 3)
    .map(gap => ({
      title: gap.title,
      type: gap.gap_type,
      score: gap.opportunity_score || 0,
    }));

  // Platform recommendation from top concept
  const topConcept = concepts[0];
  const platformRecommendation = topConcept
    ? {
        platform: topConcept.platform_recommendation as 'web' | 'mobile' | 'hybrid',
        reasoning: topConcept.platform_reasoning || 'Based on market analysis',
      }
    : {
        platform: 'web' as const,
        reasoning: 'Default recommendation',
      };

  return {
    nicheName: run.niche_query,
    opportunityScore,
    confidence,
    topGaps,
    platformRecommendation,
  };
}

/**
 * Page 2: Paid Market Snapshot
 */
function buildPaidMarketSnapshot(
  ads: AdCreative[],
  extractions: Extraction[],
  clusters: Cluster[]
): PaidMarketSnapshot {
  // Top advertisers by ad count
  const advertiserCounts = new Map<string, number>();
  const advertiserLongevity = new Map<string, number[]>();

  ads.forEach(ad => {
    const name = ad.advertiser_name;
    advertiserCounts.set(name, (advertiserCounts.get(name) || 0) + 1);

    const daysRunning = calculateDaysRunning(ad.first_seen, ad.last_seen);
    const longevities = advertiserLongevity.get(name) || [];
    longevities.push(daysRunning);
    advertiserLongevity.set(name, longevities);
  });

  const topAdvertisers = Array.from(advertiserCounts.entries())
    .map(([name, adCount]) => ({
      name,
      adCount,
      avgLongevity: average(advertiserLongevity.get(name) || [0]),
    }))
    .sort((a, b) => b.adCount - a.adCount)
    .slice(0, 10);

  // Top angles from clusters
  const angleClusters = clusters.filter(c => c.cluster_type === 'angle');
  const topAngles = angleClusters
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10)
    .map(cluster => ({
      angle: cluster.label,
      frequency: cluster.frequency,
      examples: (cluster.examples as string[]).slice(0, 3),
    }));

  // Longest running ads
  const longestRunning = ads
    .map(ad => ({
      advertiser: ad.advertiser_name,
      creative: ad.headline || ad.creative_text?.substring(0, 100) || '',
      daysRunning: calculateDaysRunning(ad.first_seen, ad.last_seen),
      firstSeen: ad.first_seen || '',
    }))
    .sort((a, b) => b.daysRunning - a.daysRunning)
    .slice(0, 5);

  // Offer patterns from extractions
  const offerExtractions = extractions.filter(e => e.source_type === 'ad' && e.offers);
  const allOffers = offerExtractions.flatMap(e => (e.offers as any[]) || []);

  const offerPatterns = {
    pricing: extractPatterns(allOffers, ['free', 'trial', '$', 'price', 'discount', '%']),
    trials: extractPatterns(allOffers, ['trial', 'demo', 'test', 'try']),
    guarantees: extractPatterns(allOffers, ['guarantee', 'refund', 'money back', 'risk-free']),
  };

  return {
    topAdvertisers,
    topAngles,
    longestRunning,
    offerPatterns,
  };
}

/**
 * Page 3: What Customers Actually Say (Reddit)
 */
function buildRedditInsights(
  mentions: RedditMention[],
  extractions: Extraction[],
  clusters: Cluster[]
): RedditInsights {
  // Top objections from clusters
  const objectionClusters = clusters.filter(c => c.cluster_type === 'objection');
  const topObjections = objectionClusters
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10)
    .map(cluster => ({
      objection: cluster.label,
      frequency: cluster.frequency,
      intensity: cluster.intensity,
      examples: (cluster.examples as string[]).slice(0, 3),
    }));

  // Top desired features from clusters
  const featureClusters = clusters.filter(c => c.cluster_type === 'feature');
  const topDesiredFeatures = featureClusters
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10)
    .map(cluster => ({
      feature: cluster.label,
      frequency: cluster.frequency,
      examples: (cluster.examples as string[]).slice(0, 3),
    }));

  // Pricing and trust friction from high-scored mentions
  const topMentions = mentions
    .filter(m => m.score > 5)
    .sort((a, b) => b.score - a.score);

  const pricingFriction = topMentions
    .filter(m => {
      const text = (m.title + ' ' + m.body).toLowerCase();
      return text.includes('price') || text.includes('cost') || text.includes('expensive') || text.includes('$');
    })
    .slice(0, 5)
    .map(m => ({
      quote: m.title || m.body?.substring(0, 200) || '',
      source: `r/${m.subreddit} - ${m.permalink}`,
      score: m.score,
    }));

  const trustFriction = topMentions
    .filter(m => {
      const text = (m.title + ' ' + m.body).toLowerCase();
      return text.includes('trust') || text.includes('scam') || text.includes('privacy') || text.includes('support');
    })
    .slice(0, 5)
    .map(m => ({
      quote: m.title || m.body?.substring(0, 200) || '',
      source: `r/${m.subreddit} - ${m.permalink}`,
      score: m.score,
    }));

  // Switching triggers
  const switchingTriggers = extractSwitchingTriggers(mentions);

  return {
    topObjections,
    topDesiredFeatures,
    pricingFriction,
    trustFriction,
    switchingTriggers,
  };
}

/**
 * Page 4: Platform Existence Gap
 */
function buildPlatformExistenceGap(
  apps: AppStoreResult[],
  ads: AdCreative[],
  concepts: (ConceptIdea & { concept_metrics?: ConceptMetrics[] })[]
): PlatformExistenceGap {
  const iosApps = apps.filter(a => a.platform === 'ios');
  const androidApps = apps.filter(a => a.platform === 'android');

  // Calculate saturation scores based on app count and quality
  const iosSaturation = Math.min((iosApps.length / 50) * 100, 100);
  const androidSaturation = Math.min((androidApps.length / 50) * 100, 100);
  const webSaturation = Math.min((ads.length / 100) * 100, 100);

  const topIosApps = iosApps
    .sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
    .slice(0, 5)
    .map(app => ({
      name: app.app_name,
      developer: app.developer || 'Unknown',
      rating: app.rating || 0,
      reviewCount: app.review_count || 0,
    }));

  const topAndroidApps = androidApps
    .sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
    .slice(0, 5)
    .map(app => ({
      name: app.app_name,
      developer: app.developer || 'Unknown',
      rating: app.rating || 0,
      reviewCount: app.review_count || 0,
    }));

  const topWebCompetitors = ads
    .filter(ad => ad.landing_url)
    .map(ad => ({
      name: ad.advertiser_name,
      angle: ad.headline || ad.creative_text?.substring(0, 100) || '',
      longevity: calculateDaysRunning(ad.first_seen, ad.last_seen),
    }))
    .sort((a, b) => b.longevity - a.longevity)
    .slice(0, 5);

  // Platform recommendation from top concept
  const topConcept = concepts[0];
  const recommendation = topConcept
    ? {
        platform: topConcept.platform_recommendation as 'web' | 'mobile' | 'hybrid',
        rationale: topConcept.platform_reasoning || 'Based on saturation analysis',
      }
    : {
        platform: determinePlatform(iosSaturation, androidSaturation, webSaturation),
        rationale: `iOS: ${iosSaturation.toFixed(0)}% saturated, Android: ${androidSaturation.toFixed(0)}% saturated, Web: ${webSaturation.toFixed(0)}% saturated`,
      };

  return {
    ios: { saturationScore: iosSaturation, topApps: topIosApps },
    android: { saturationScore: androidSaturation, topApps: topAndroidApps },
    web: { saturationScore: webSaturation, topCompetitors: topWebCompetitors },
    recommendation,
  };
}

/**
 * Page 6: Modeled Economics
 */
function buildModeledEconomics(
  concepts: (ConceptIdea & { concept_metrics?: ConceptMetrics[] })[]
): ModeledEconomics {
  const topConcept = concepts[0];
  const metrics = topConcept?.concept_metrics?.[0];

  if (metrics) {
    return {
      cpc: {
        low: metrics.cpc_low || 0.5,
        expected: metrics.cpc_expected || 2.0,
        high: metrics.cpc_high || 5.0,
      },
      cac: {
        low: metrics.cac_low || 10,
        expected: metrics.cac_expected || 50,
        high: metrics.cac_high || 150,
      },
      tam: {
        low: metrics.tam_low || 100000,
        expected: metrics.tam_expected || 1000000,
        high: metrics.tam_high || 10000000,
        assumptions: ['Based on market size analysis', 'Addressable via digital channels'],
      },
      budgetScenarios: {
        spend1k: {
          reach: Math.floor(1000 / (metrics.cpc_expected || 2)),
          conversions: Math.floor(1000 / (metrics.cac_expected || 50)),
          cost: 1000,
        },
        spend10k: {
          reach: Math.floor(10000 / (metrics.cpc_expected || 2)),
          conversions: Math.floor(10000 / (metrics.cac_expected || 50)),
          cost: 10000,
        },
      },
    };
  }

  // Default estimates
  return {
    cpc: { low: 0.5, expected: 2.0, high: 5.0 },
    cac: { low: 10, expected: 50, high: 150 },
    tam: {
      low: 100000,
      expected: 1000000,
      high: 10000000,
      assumptions: ['Estimated based on market indicators'],
    },
    budgetScenarios: {
      spend1k: { reach: 500, conversions: 20, cost: 1000 },
      spend10k: { reach: 5000, conversions: 200, cost: 10000 },
    },
  };
}

/**
 * Page 7: Buildability Assessment
 */
function buildBuildabilityAssessment(
  concepts: (ConceptIdea & { concept_metrics?: ConceptMetrics[] })[]
): BuildabilityAssessment {
  const topConcept = concepts[0];
  const metrics = topConcept?.concept_metrics?.[0];

  if (metrics) {
    return {
      implementationDifficulty: metrics.implementation_difficulty || 50,
      timeToMVP: estimateTimeToMVP(metrics.implementation_difficulty || 50),
      humanTouchLevel: metrics.human_touch_level as 'high' | 'medium' | 'low' || 'medium',
      autonomousSuitability: metrics.autonomous_suitability as 'high' | 'medium' | 'low' || 'medium',
      riskFlags: identifyRiskFlags(topConcept),
    };
  }

  return {
    implementationDifficulty: 50,
    timeToMVP: 'M',
    humanTouchLevel: 'medium',
    autonomousSuitability: 'medium',
    riskFlags: [],
  };
}

/**
 * Page 8: UGC Winners Pack
 */
function buildUGCWinnersPack(): UGCWinnersPack {
  // TODO: Implement UGC collection in future phase
  return {
    topCreatives: [],
    trendSignals: {
      hashtags: [],
      sounds: [],
    },
    creativePatterns: {
      hooks: [],
      formats: [],
      proofTypes: [],
      ctaStyles: [],
    },
    recommendations: {
      hooks: [
        '"Stop paying $X for Y when you can..."',
        '"Everyone\'s switching to X because..."',
        '"The problem with Z is..."',
        '"Here\'s what nobody tells you about..."',
        '"I tried every X and here\'s what actually works..."',
      ],
      scripts: [
        'Hook → Problem → Agitate → Solution → CTA',
        'Pattern interrupt → Value prop → Social proof → Offer',
        'Question → Story → Transformation → CTA',
      ],
      shotList: [
        'Opening: Close-up of frustrated user',
        'Problem visualization with text overlay',
        'Product demo (key feature)',
        'Testimonial or result',
        'CTA with special offer',
      ],
    },
  };
}

/**
 * Page 9: Action Plan
 */
function buildActionPlan(
  gaps: GapOpportunity[],
  clusters: Cluster[],
  run: Run
): ActionPlan {
  const topGaps = gaps
    .sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0))
    .slice(0, 3);

  const sevenDayWins = [
    'Set up landing page with top 3 value props from gap analysis',
    'Create 3 ad concepts targeting highest opportunity gap',
    'Launch email capture with pain point headline',
  ];

  const thirtyDayRoadmap = [
    { week: 1, tasks: ['Validate demand with landing page', 'Run first ad tests', 'Collect 50+ email signups'] },
    { week: 2, tasks: ['Build MVP core feature', 'Interview 10 target users', 'Iterate on messaging'] },
    { week: 3, tasks: ['Launch beta to waitlist', 'Collect feedback', 'Optimize conversion funnel'] },
    { week: 4, tasks: ['Scale winning ad creative', 'Launch paid tiers', 'Set up analytics'] },
  ];

  const adTestConcepts = topGaps.map(gap => ({
    concept: gap.title,
    angle: gap.problem,
    copy: gap.recommendation || '',
    cta: 'Get Early Access',
  }));

  const topObjections = clusters
    .filter(c => c.cluster_type === 'objection')
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 3);

  const landingPageStructure = {
    hero: topGaps[0]?.title || 'Solve your biggest pain point',
    benefits: topObjections.map(o => `No more ${o.label}`),
    cta: 'Start Free Trial',
  };

  const topKeywords = extractTopKeywords(clusters);

  return {
    sevenDayWins,
    thirtyDayRoadmap,
    adTestConcepts,
    landingPageStructure,
    topKeywords,
  };
}

// Helper functions

function calculateDaysRunning(firstSeen: string | null, lastSeen: string | null): number {
  if (!firstSeen) return 0;
  const start = new Date(firstSeen);
  const end = lastSeen ? new Date(lastSeen) : new Date();
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return Math.round(numbers.reduce((sum, n) => sum + n, 0) / numbers.length);
}

function extractPatterns(offers: any[], keywords: string[]): string[] {
  const patterns = new Set<string>();
  offers.forEach(offer => {
    const text = JSON.stringify(offer).toLowerCase();
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        // Extract sentence containing keyword
        const sentences = text.split(/[.!?]/);
        const match = sentences.find(s => s.includes(keyword));
        if (match) patterns.add(match.trim().substring(0, 100));
      }
    });
  });
  return Array.from(patterns).slice(0, 5);
}

function extractSwitchingTriggers(mentions: RedditMention[]): string[] {
  const triggers = new Set<string>();
  const switchKeywords = ['switched', 'moved to', 'tried', 'left', 'migrated', 'changed to'];

  mentions.forEach(m => {
    const text = (m.title + ' ' + m.body).toLowerCase();
    switchKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        triggers.add(`Users ${keyword} due to issues`);
      }
    });
  });

  return Array.from(triggers).slice(0, 5);
}

function determinePlatform(ios: number, android: number, web: number): 'web' | 'mobile' | 'hybrid' {
  const mobile = (ios + android) / 2;
  if (mobile < 30 && web > 50) return 'mobile';
  if (web < 30 && mobile > 50) return 'web';
  return 'hybrid';
}

function estimateTimeToMVP(difficulty: number): 'S' | 'M' | 'L' {
  if (difficulty < 40) return 'S';
  if (difficulty < 70) return 'M';
  return 'L';
}

function identifyRiskFlags(concept: ConceptIdea | undefined): string[] {
  const flags: string[] = [];
  if (!concept) return flags;

  const text = (concept.name + ' ' + concept.one_liner + ' ' + concept.gap_thesis).toLowerCase();

  if (text.includes('health') || text.includes('medical')) {
    flags.push('Healthcare compliance (HIPAA/FDA) may apply');
  }
  if (text.includes('finance') || text.includes('payment')) {
    flags.push('Financial regulations (PCI DSS) required');
  }
  if (text.includes('data') || text.includes('privacy')) {
    flags.push('Data privacy regulations (GDPR/CCPA) apply');
  }
  if (text.includes('ai') || text.includes('ml')) {
    flags.push('AI governance and transparency requirements');
  }

  return flags;
}

function extractTopKeywords(clusters: Cluster[]): string[] {
  const keywords = new Set<string>();

  clusters.forEach(cluster => {
    const words = cluster.label.toLowerCase().split(/\s+/);
    words.forEach((word: string) => {
      if (word.length > 4) keywords.add(word);
    });
  });

  return Array.from(keywords).slice(0, 20);
}

/**
 * Invalidate cached report when run data changes
 * Call this after updating ads, reddit mentions, extractions, etc.
 */
export function invalidateCachedReport(runId: string): void {
  invalidateReportCache(runId);
}
