export type RunStatus = 'queued' | 'running' | 'complete' | 'failed';
export type AdSource = 'meta' | 'google';
export type MediaType = 'image' | 'video' | 'carousel' | 'unknown';
export type MentionType = 'post' | 'comment';
export type ClusterType = 'angle' | 'objection' | 'feature' | 'offer';
export type GapType = 'product' | 'offer' | 'positioning' | 'trust' | 'pricing';
export type PlatformRecommendation = 'web' | 'mobile' | 'hybrid';
export type BusinessModel = 'b2b' | 'b2c' | 'b2b2c';
export type TouchLevel = 'high' | 'medium' | 'low';
export type AppPlatform = 'ios' | 'android' | 'web';
export type UGCSource = 'tiktok_top_ads' | 'tiktok_commercial' | 'tiktok_trend' | 'ig_hashtag' | 'tiktok_connected' | 'ig_connected';
export type UGCPlatform = 'tiktok' | 'instagram';

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  createdAt: Date;
}

export interface Run {
  id: string;
  projectId: string;
  nicheQuery: string;
  seedTerms: string[];
  competitors: string[];
  geo?: string;
  status: RunStatus;
  startedAt?: Date;
  finishedAt?: Date;
  error?: string;
  scores?: RunScores;
}

export interface RunScores {
  saturation: number;
  longevity: number;
  dissatisfaction: number;
  misalignment: number;
  opportunity: number;
  confidence: number;
}

export interface AdCreative {
  id: string;
  runId: string;
  source: AdSource;
  advertiserName: string;
  creativeText: string;
  headline?: string;
  description?: string;
  cta?: string;
  landingUrl?: string;
  firstSeen?: Date;
  lastSeen?: Date;
  isActive?: boolean;
  mediaType: MediaType;
  daysRunning?: number;
}

export interface RedditMention {
  id: string;
  runId: string;
  subreddit: string;
  type: MentionType;
  title?: string;
  text: string;
  score: number;
  numComments?: number;
  createdAt: Date;
  permalink: string;
  matchedEntities: string[];
}

export interface Extraction {
  id: string;
  runId: string;
  sourceType: 'ad' | 'reddit';
  sourceId: string;
  offers: string[];
  claims: string[];
  angles: string[];
  objections: string[];
  desiredFeatures: string[];
  sentiment: {
    positive: number;
    negative: number;
    intensity: number;
  };
}

export interface Cluster {
  id: string;
  runId: string;
  clusterType: ClusterType;
  label: string;
  examples: { id: string; snippet: string }[];
  frequency: number;
  intensity: number;
}

export interface GapOpportunity {
  id: string;
  runId: string;
  gapType: GapType;
  title: string;
  problem: string;
  evidenceAds: { id: string; snippet: string }[];
  evidenceReddit: { id: string; snippet: string }[];
  recommendation: string;
  opportunityScore: number;
  confidence: number;
}

export interface AppStoreResult {
  id: string;
  runId: string;
  platform: AppPlatform;
  appName: string;
  appId: string;
  developer: string;
  rating: number;
  reviewCount: number;
  description: string;
  category: string;
  price: string;
}

export interface ConceptIdea {
  id: string;
  runId: string;
  name: string;
  oneLiner: string;
  platformRecommendation: PlatformRecommendation;
  platformReasoning: string;
  industry: string;
  icp: string;
  businessModel: BusinessModel;
  gapThesis: string;
  mvpSpec: {
    mustHaves: string[];
    nonGoals: string[];
    differentiator: string;
    pricingModel: string;
    successCriteria: string[];
  };
  metrics?: ConceptMetrics;
}

export interface ConceptMetrics {
  cpcLow: number;
  cpcExpected: number;
  cpcHigh: number;
  cacLow: number;
  cacExpected: number;
  cacHigh: number;
  tamLow: number;
  tamExpected: number;
  tamHigh: number;
  implementationDifficulty: number;
  humanTouchLevel: TouchLevel;
  autonomousSuitability: TouchLevel;
  buildDifficulty: number;
  distributionDifficulty: number;
  opportunityScore: number;
  confidence: number;
}

export interface UGCAsset {
  id: string;
  runId: string;
  source: UGCSource;
  platform: UGCPlatform;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  createdAt: Date;
  metrics?: UGCMetrics;
  patterns?: UGCPatterns;
}

export interface UGCMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reachUniqueUsers?: number;
  firstShown?: Date;
  lastShown?: Date;
  score: number;
}

export interface UGCPatterns {
  hookType: string;
  format: string;
  proofType: string;
  objectionHandled?: string;
  ctaStyle: string;
  notes?: string;
  confidence: number;
}

export interface UGCRecommendations {
  id: string;
  runId: string;
  hooks: { text: string; type: string }[];
  scripts: { duration: string; outline: string[] }[];
  shotList: { shot: string; notes: string }[];
  angleMap: { angle: string; priority: 'high' | 'medium' | 'low'; reasoning: string }[];
}

export interface Report {
  id: string;
  runId: string;
  reportUrl: string;
  pdfUrl?: string;
  exportUrl?: string;
  createdAt: Date;
}

export interface SavedGap {
  id: string;
  userId: string;
  gapId: string;
  savedAt: Date;
  notes?: string;
  gap?: GapOpportunity;
}

export interface PlatformPresence {
  platform: AppPlatform;
  exists: boolean;
  count: number;
  saturationScore: number;
  topApps: AppStoreResult[];
}

export type WebhookEventType =
  | 'run.started'
  | 'run.completed'
  | 'run.failed'
  | 'gap.discovered'
  | 'report.generated';

export type WebhookDeliveryStatus = 'pending' | 'success' | 'failed';

export interface WebhookConfig {
  id: string;
  userId: string;
  url: string;
  secret: string;
  isActive: boolean;
  events: WebhookEventType[];
  name?: string;
  description?: string;
  lastTriggeredAt?: Date;
  successCount: number;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookDelivery {
  id: string;
  webhookConfigId: string;
  eventType: WebhookEventType;
  payload: Record<string, any>;
  status: WebhookDeliveryStatus;
  statusCode?: number;
  responseBody?: string;
  errorMessage?: string;
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt?: Date;
  createdAt: Date;
  deliveredAt?: Date;
}

export interface WebhookPayload {
  id: string;
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, any>;
}

export type ProductType = 'saas' | 'tool' | 'api' | 'marketplace' | 'mobile_app' | 'chrome_extension';
export type BuildComplexity = 'weekend' | 'month' | 'quarter';
export type RecommendationStatus = 'new' | 'saved' | 'in_progress' | 'completed' | 'dismissed';

export interface BuildRecommendation {
  id: string;
  runId: string | null;
  nicheId: string | null;
  userId: string;
  productIdea: string;
  productType: ProductType | null;
  oneLiner: string | null;
  targetAudience: string | null;
  painPoints: Array<{ text: string; source: string }> | null;
  competitorGaps: Array<{ competitor: string; gap: string }> | null;
  searchQueries: Array<{ query: string; volume: number }> | null;
  recommendedHooks: string[] | null;
  recommendedChannels: string[] | null;
  sampleAdCopy: {
    headline: string;
    body: string;
    cta: string;
  } | null;
  landingPageAngle: string | null;
  buildComplexity: BuildComplexity | null;
  techStackSuggestion: string[] | null;
  estimatedTimeToMvp: string | null;
  estimatedCacRange: string | null;
  confidenceScore: number;
  reasoning: string | null;
  supportingSignals: number;
  status: RecommendationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecommendationInput {
  niche: string;
  painPoints?: Array<{ text: string; upvotes: number; source: string }>;
  winningAds?: Array<{ headline: string; hook: string; runDays: number }>;
  searchQueries?: Array<{ query: string; volume: number }>;
  competitorGaps?: Array<{ competitor: string; gap: string }>;
  demandScore?: number;
  runId?: string;
  nicheId?: string;
}

export interface GeneratedRecommendation {
  product_idea: string;
  product_type: ProductType;
  one_liner: string;
  target_audience: string;
  why_now: string;
  build_complexity: BuildComplexity;
  tech_stack: string[];
  recommended_hooks: string[];
  recommended_channels: string[];
  sample_ad_copy: {
    headline: string;
    body: string;
    cta: string;
  };
  confidence_score: number;
  reasoning: string;
}

export type AlertType = 'new_campaign' | 'ad_spike' | 'pricing_change' | 'new_feature' | 'campaign_ended' | 'creative_shift';

export interface CompetitorAlert {
  id: string;
  user_id: string;
  competitor_id: string;
  alert_type: AlertType;
  title: string;
  description: string | null;
  data: Record<string, any> | null;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: Date;
}
