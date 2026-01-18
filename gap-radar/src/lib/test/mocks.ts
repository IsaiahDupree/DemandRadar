/**
 * Mock Utilities for Testing
 * Reusable mock data generators for consistent test data across the codebase
 */

import type {
  AdCreative,
  RedditMention,
  Run,
  Project,
  Extraction,
  Cluster,
  GapOpportunity,
  AppStoreResult,
  ConceptIdea,
  ConceptMetrics,
  UGCAsset,
  UGCMetrics,
  UGCPatterns,
} from '@/types';

// Helper to generate consistent IDs
const generateId = (prefix: string = 'test'): string => {
  return `${prefix}-${Math.random().toString(36).substring(2, 11)}`;
};

// Helper to pick random item from array
const pickRandom = <T>(arr: readonly T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

/**
 * Mock Ad Creative
 */
export function mockAdCreative(overrides: Partial<AdCreative> = {}): AdCreative {
  const sources = ['meta', 'google'] as const;
  const mediaTypes = ['image', 'video', 'carousel', 'unknown'] as const;
  const advertisers = [
    'FitnessApp Co',
    'MindfulApp Inc',
    'ProductivityPro',
    'AITools Ltd',
    'WatermarkRemover',
  ];
  const creatives = [
    'Transform your fitness journey with our AI-powered app',
    'Remove watermarks in seconds with our advanced AI',
    'The productivity tool that actually works',
    'Join 100,000+ users who trust us',
    'Try it free for 14 days - no credit card required',
  ];

  return {
    id: generateId('ad'),
    runId: generateId('run'),
    source: pickRandom(sources),
    advertiserName: pickRandom(advertisers),
    creativeText: pickRandom(creatives),
    headline: 'Get Started Today',
    description: 'Limited time offer',
    cta: 'Learn More',
    landingUrl: 'https://example.com',
    firstSeen: new Date('2024-01-01'),
    lastSeen: new Date('2024-12-31'),
    isActive: true,
    mediaType: pickRandom(mediaTypes),
    daysRunning: 90,
    ...overrides,
  };
}

/**
 * Mock Reddit Mention
 */
export function mockRedditMention(overrides: Partial<RedditMention> = {}): RedditMention {
  const types = ['post', 'comment'] as const;
  const subreddits = ['SaaS', 'entrepreneur', 'startups', 'smallbusiness', 'marketing'];
  const texts = [
    'I tried 5 different tools and this one is the best',
    'Anyone have experience with this? Looking for alternatives',
    'Their customer support is terrible, save your money',
    'Game changer for my business, highly recommend',
    'Pricing is way too high for what you get',
  ];

  return {
    id: generateId('mention'),
    runId: generateId('run'),
    subreddit: pickRandom(subreddits),
    type: pickRandom(types),
    title: 'Looking for recommendations',
    text: pickRandom(texts),
    score: Math.floor(Math.random() * 500),
    numComments: Math.floor(Math.random() * 100),
    createdAt: new Date(),
    permalink: `/r/${pickRandom(subreddits)}/comments/abc123`,
    matchedEntities: ['fitness', 'app'],
    ...overrides,
  };
}

/**
 * Mock Run
 */
export function mockRun(overrides: Partial<Run> = {}): Run {
  const statuses = ['queued', 'running', 'complete', 'failed'] as const;
  const niches = [
    'AI watermark remover',
    'Personal CRM app',
    'Meditation app for developers',
    'Workout tracker with AI',
  ];

  return {
    id: generateId('run'),
    projectId: generateId('project'),
    nicheQuery: pickRandom(niches),
    seedTerms: ['keyword1', 'keyword2'],
    competitors: ['Competitor A', 'Competitor B'],
    geo: 'us',
    status: pickRandom(statuses),
    startedAt: new Date(),
    finishedAt: undefined,
    error: undefined,
    scores: {
      saturation: 65,
      longevity: 72,
      dissatisfaction: 58,
      misalignment: 45,
      opportunity: 68,
      confidence: 0.82,
    },
    ...overrides,
  };
}

/**
 * Mock Project
 */
export function mockProject(overrides: Partial<Project> = {}): Project {
  return {
    id: generateId('project'),
    ownerId: generateId('user'),
    name: 'Test Project',
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Mock Extraction
 */
export function mockExtraction(overrides: Partial<Extraction> = {}): Extraction {
  const sourceTypes = ['ad', 'reddit'] as const;

  return {
    id: generateId('extraction'),
    runId: generateId('run'),
    sourceType: pickRandom(sourceTypes),
    sourceId: generateId('source'),
    offers: ['14-day free trial', 'Money-back guarantee', 'Cancel anytime'],
    claims: ['#1 rated app', 'Trusted by 100k users', 'AI-powered technology'],
    angles: ['Time-saving', 'Easy to use', 'Professional results'],
    objections: ['Too expensive', 'Hard to learn', 'Poor support'],
    desiredFeatures: ['Mobile app', 'Offline mode', 'Better integrations'],
    sentiment: {
      positive: 0.6,
      negative: 0.3,
      intensity: 0.7,
    },
    ...overrides,
  };
}

/**
 * Mock Cluster
 */
export function mockCluster(overrides: Partial<Cluster> = {}): Cluster {
  const clusterTypes = ['angle', 'objection', 'feature', 'offer'] as const;

  return {
    id: generateId('cluster'),
    runId: generateId('run'),
    clusterType: pickRandom(clusterTypes),
    label: 'Pricing concerns',
    examples: [
      { id: generateId('ex'), snippet: 'Too expensive for what you get' },
      { id: generateId('ex'), snippet: 'Pricing is not transparent' },
    ],
    frequency: Math.floor(Math.random() * 50) + 10,
    intensity: Math.random(),
    ...overrides,
  };
}

/**
 * Mock Gap Opportunity
 */
export function mockGapOpportunity(overrides: Partial<GapOpportunity> = {}): GapOpportunity {
  const gapTypes = ['product', 'offer', 'positioning', 'trust', 'pricing'] as const;

  return {
    id: generateId('gap'),
    runId: generateId('run'),
    gapType: pickRandom(gapTypes),
    title: 'Pricing transparency gap',
    problem: 'Users complain about hidden fees but ads promise transparent pricing',
    evidenceAds: [
      { id: generateId('ad'), snippet: 'No hidden fees' },
    ],
    evidenceReddit: [
      { id: generateId('mention'), snippet: 'Found hidden charges after signup' },
    ],
    recommendation: 'Display all fees upfront on pricing page',
    opportunityScore: Math.floor(Math.random() * 40) + 60, // 60-100
    confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
    ...overrides,
  };
}

/**
 * Mock App Store Result
 */
export function mockAppStoreResult(overrides: Partial<AppStoreResult> = {}): AppStoreResult {
  const platforms = ['ios', 'android', 'web'] as const;

  return {
    id: generateId('app'),
    runId: generateId('run'),
    platform: pickRandom(platforms),
    appName: 'FitnessTracker Pro',
    appId: 'com.example.fitness',
    developer: 'Example Inc',
    rating: Math.random() * 2 + 3, // 3.0-5.0
    reviewCount: Math.floor(Math.random() * 10000),
    description: 'Track your fitness goals with AI',
    category: 'Health & Fitness',
    price: 'Free',
    ...overrides,
  };
}

/**
 * Mock Concept Idea
 */
export function mockConceptIdea(overrides: Partial<ConceptIdea> = {}): ConceptIdea {
  const platformRecs = ['web', 'mobile', 'hybrid'] as const;
  const businessModels = ['b2b', 'b2c', 'b2b2c'] as const;

  return {
    id: generateId('concept'),
    runId: generateId('run'),
    name: 'AI Workout Assistant',
    oneLiner: 'Personal trainer powered by AI for busy professionals',
    platformRecommendation: pickRandom(platformRecs),
    platformReasoning: 'Mobile-first usage patterns detected in user research',
    industry: 'Health & Fitness',
    icp: 'Busy professionals aged 25-45',
    businessModel: pickRandom(businessModels),
    gapThesis: 'Current solutions lack personalization and require too much time',
    mvpSpec: {
      mustHaves: ['AI workout generator', 'Progress tracking', 'Mobile app'],
      nonGoals: ['Social features', 'Marketplace'],
      differentiator: 'AI-powered personalization in under 5 minutes',
      pricingModel: 'Freemium with $9.99/month premium',
      successCriteria: ['10k signups in 3 months', '20% conversion to paid'],
    },
    ...overrides,
  };
}

/**
 * Mock Concept Metrics
 */
export function mockConceptMetrics(overrides: Partial<ConceptMetrics> = {}): ConceptMetrics {
  const touchLevels = ['high', 'medium', 'low'] as const;

  return {
    cpcLow: 0.5,
    cpcExpected: 1.2,
    cpcHigh: 2.5,
    cacLow: 15,
    cacExpected: 35,
    cacHigh: 80,
    tamLow: 1000000,
    tamExpected: 5000000,
    tamHigh: 20000000,
    implementationDifficulty: Math.floor(Math.random() * 5) + 3, // 3-8
    humanTouchLevel: pickRandom(touchLevels),
    autonomousSuitability: pickRandom(touchLevels),
    buildDifficulty: Math.floor(Math.random() * 5) + 3,
    distributionDifficulty: Math.floor(Math.random() * 5) + 3,
    opportunityScore: Math.floor(Math.random() * 40) + 60,
    confidence: Math.random() * 0.3 + 0.7,
    ...overrides,
  };
}

/**
 * Mock UGC Asset
 */
export function mockUGCAsset(overrides: Partial<UGCAsset> = {}): UGCAsset {
  const sources = [
    'tiktok_top_ads',
    'tiktok_commercial',
    'tiktok_trend',
    'ig_hashtag',
    'tiktok_connected',
    'ig_connected',
  ] as const;
  const platforms = ['tiktok', 'instagram'] as const;

  return {
    id: generateId('ugc'),
    runId: generateId('run'),
    source: pickRandom(sources),
    platform: pickRandom(platforms),
    url: 'https://tiktok.com/@user/video/123',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    caption: 'Check out this amazing product!',
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Mock UGC Metrics
 */
export function mockUGCMetrics(overrides: Partial<UGCMetrics> = {}): UGCMetrics {
  return {
    views: Math.floor(Math.random() * 1000000),
    likes: Math.floor(Math.random() * 50000),
    comments: Math.floor(Math.random() * 5000),
    shares: Math.floor(Math.random() * 10000),
    reachUniqueUsers: Math.floor(Math.random() * 800000),
    firstShown: new Date('2024-01-01'),
    lastShown: new Date('2024-12-31'),
    score: Math.floor(Math.random() * 40) + 60,
    ...overrides,
  };
}

/**
 * Mock UGC Patterns
 */
export function mockUGCPatterns(overrides: Partial<UGCPatterns> = {}): UGCPatterns {
  return {
    hookType: 'Problem-solution',
    format: 'Talking head',
    proofType: 'Before/after',
    objectionHandled: 'Price',
    ctaStyle: 'Direct call-to-action',
    notes: 'Strong emotional appeal',
    confidence: Math.random() * 0.3 + 0.7,
    ...overrides,
  };
}

// ====================
// API Response Mocks
// ====================

/**
 * Mock Meta Ads API Response
 */
export function mockMetaAdResponse(options: { count?: number } = {}) {
  const count = options.count || 3;
  const data = Array.from({ length: count }, (_, i) => ({
    page_name: `Advertiser ${i + 1}`,
    ad_creative_bodies: [`Creative text for ad ${i + 1}`],
    ad_creative_link_titles: [`Headline ${i + 1}`],
    ad_creative_link_captions: [`Description ${i + 1}`],
    ad_delivery_start_time: '2024-01-01T00:00:00Z',
    ad_delivery_stop_time: null,
    ad_creative_link_descriptions: [`Landing page description ${i + 1}`],
    languages: ['en'],
    publisher_platforms: ['facebook', 'instagram'],
  }));

  return { data };
}

/**
 * Mock Google Ads Transparency Center Response
 */
export function mockGoogleAdResponse(options: { count?: number } = {}) {
  const count = options.count || 3;
  return Array.from({ length: count }, (_, i) => ({
    advertiser: `Google Advertiser ${i + 1}`,
    creative: `Google ad creative text ${i + 1}`,
    firstSeen: '2024-01-01',
    lastSeen: '2024-12-31',
    regions: ['US', 'UK'],
    formats: ['Search', 'Display'],
  }));
}

/**
 * Mock Reddit Post API Response
 */
export function mockRedditPostResponse(options: { count?: number } = {}) {
  const count = options.count || 5;
  const children = Array.from({ length: count }, (_, i) => ({
    kind: 't3' as const,
    data: {
      id: `post${i + 1}`,
      title: `Reddit post title ${i + 1}`,
      selftext: `Reddit post body ${i + 1}`,
      subreddit: 'SaaS',
      score: Math.floor(Math.random() * 500),
      num_comments: Math.floor(Math.random() * 100),
      created_utc: Math.floor(Date.now() / 1000),
      permalink: `/r/SaaS/comments/abc${i + 1}`,
      author: `user${i + 1}`,
    },
  }));

  return {
    data: {
      children,
      after: 'next_page_token',
      before: null,
    },
  };
}

/**
 * Mock Reddit Comment API Response
 */
export function mockRedditCommentResponse(options: { count?: number } = {}) {
  const count = options.count || 5;
  const children = Array.from({ length: count }, (_, i) => ({
    kind: 't1' as const,
    data: {
      id: `comment${i + 1}`,
      body: `Reddit comment body ${i + 1}`,
      subreddit: 'entrepreneur',
      score: Math.floor(Math.random() * 100),
      created_utc: Math.floor(Date.now() / 1000),
      permalink: `/r/entrepreneur/comments/xyz${i + 1}/_/comment${i + 1}`,
      author: `commenter${i + 1}`,
    },
  }));

  return {
    data: {
      children,
      after: 'next_page_token',
      before: null,
    },
  };
}

/**
 * Mock iOS App Store API Response
 */
export function mockIOSAppResponse(options: { count?: number } = {}) {
  const count = options.count || 5;
  const results = Array.from({ length: count }, (_, i) => ({
    trackId: 1000000000 + i,
    trackName: `iOS App ${i + 1}`,
    artistName: `Developer ${i + 1}`,
    averageUserRating: Math.random() * 2 + 3,
    userRatingCount: Math.floor(Math.random() * 10000),
    description: `iOS app description ${i + 1}`,
    primaryGenreName: 'Productivity',
    price: 0,
    currency: 'USD',
    formattedPrice: 'Free',
    artworkUrl512: `https://example.com/icon${i + 1}.png`,
  }));

  return {
    resultCount: count,
    results,
  };
}

/**
 * Mock Android Play Store API Response
 */
export function mockAndroidAppResponse(options: { count?: number } = {}) {
  const count = options.count || 5;
  return Array.from({ length: count }, (_, i) => ({
    title: `Android App ${i + 1}`,
    appId: `com.example.app${i + 1}`,
    developer: `Developer ${i + 1}`,
    rating: Math.random() * 2 + 3,
    reviewCount: Math.floor(Math.random() * 10000),
    description: `Android app description ${i + 1}`,
    category: 'Productivity',
    price: 'Free',
    icon: `https://example.com/icon${i + 1}.png`,
  }));
}
