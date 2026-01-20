/**
 * Channel Recommendation Logic
 * Feature: BUILD-007
 *
 * Suggests the best 3 marketing channels for each product idea
 * based on niche characteristics, target audience, and CAC range.
 */

export interface ProductContext {
  product_type: 'saas' | 'tool' | 'api' | 'marketplace' | 'content' | 'service' | 'plugin' | 'mobile_app' | 'chrome_extension';
  target_audience: string;
  niche: string;
  estimated_cac_range: string;
  pain_points?: string[];
}

export interface ChannelRecommendation {
  channel: string;
  reasoning: string;
}

export type MarketingChannel =
  | 'Google Ads'
  | 'LinkedIn Ads'
  | 'Meta Ads'
  | 'TikTok Ads'
  | 'YouTube Ads'
  | 'SEO/Content'
  | 'Reddit/Community'
  | 'ProductHunt'
  | 'Email Marketing'
  | 'Partnerships'
  | 'Influencer Marketing';

interface ChannelScore {
  channel: MarketingChannel;
  score: number;
  reasoning: string;
}

/**
 * Recommend the best 3 marketing channels for a product
 */
export function recommendChannels(context: ProductContext): ChannelRecommendation[] {
  const channelScores = scoreAllChannels(context);

  // Sort by score descending and take top 3
  const topChannels = channelScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((cs) => ({
      channel: cs.channel,
      reasoning: cs.reasoning,
    }));

  return topChannels;
}

/**
 * Score all available channels for this product
 */
function scoreAllChannels(context: ProductContext): ChannelScore[] {
  const channels: ChannelScore[] = [];

  // Score each channel
  channels.push(scoreGoogleAds(context));
  channels.push(scoreLinkedInAds(context));
  channels.push(scoreMetaAds(context));
  channels.push(scoreTikTokAds(context));
  channels.push(scoreYouTubeAds(context));
  channels.push(scoreSEOContent(context));
  channels.push(scoreRedditCommunity(context));
  channels.push(scoreProductHunt(context));
  channels.push(scoreEmailMarketing(context));
  channels.push(scorePartnerships(context));
  channels.push(scoreInfluencerMarketing(context));

  return channels;
}

/**
 * Score Google Ads channel
 */
function scoreGoogleAds(context: ProductContext): ChannelScore {
  let score = 50;
  let reasoning = 'High-intent search traffic';

  // B2B SaaS gets a boost
  if (isB2BContext(context)) {
    score += 20;
    reasoning = 'Strong B2B intent on Google with high conversion potential';
  }

  // High CAC products can afford Google's cost
  if (getAverageCAC(context.estimated_cac_range) >= 50) {
    score += 15;
  }

  // SaaS and tools benefit from search
  if (context.product_type === 'saas' || context.product_type === 'tool') {
    score += 10;
  }

  return { channel: 'Google Ads', score, reasoning };
}

/**
 * Score LinkedIn Ads channel
 */
function scoreLinkedInAds(context: ProductContext): ChannelScore {
  let score = 30;
  let reasoning = 'Professional B2B targeting';

  // LinkedIn is primarily for B2B
  if (isB2BContext(context)) {
    score += 35;
    reasoning = 'Excellent for B2B targeting with decision-maker access';
  }

  // Enterprise/team products do well
  if (context.target_audience.toLowerCase().includes('enterprise') ||
      context.target_audience.toLowerCase().includes('team')) {
    score += 15;
  }

  // High CAC products can justify LinkedIn's premium cost
  if (getAverageCAC(context.estimated_cac_range) >= 100) {
    score += 10;
    reasoning = 'High CAC justifies LinkedIn\'s premium costs for quality B2B leads';
  }

  // SaaS benefits most
  if (context.product_type === 'saas') {
    score += 10;
  }

  return { channel: 'LinkedIn Ads', score, reasoning };
}

/**
 * Score Meta Ads (Facebook/Instagram) channel
 */
function scoreMetaAds(context: ProductContext): ChannelScore {
  let score = 40;
  let reasoning = 'Broad reach with detailed targeting';

  // B2C products do well on Meta
  if (isB2CContext(context)) {
    score += 25;
    reasoning = 'Excellent for B2C with broad consumer reach and visual appeal';
  }

  // Mobile apps especially benefit
  if (context.product_type === 'mobile_app') {
    score += 20;
  }

  // Visual/lifestyle products
  if (context.niche.toLowerCase().includes('fitness') ||
      context.niche.toLowerCase().includes('photo') ||
      context.niche.toLowerCase().includes('lifestyle') ||
      context.niche.toLowerCase().includes('social')) {
    score += 15;
  }

  return { channel: 'Meta Ads', score, reasoning };
}

/**
 * Score TikTok Ads channel
 */
function scoreTikTokAds(context: ProductContext): ChannelScore {
  let score = 25;
  let reasoning = 'Young audience with viral potential';

  // Youth-focused products
  if (context.target_audience.toLowerCase().includes('gen z') ||
      context.target_audience.toLowerCase().includes('millennials') ||
      context.target_audience.toLowerCase().includes('young') ||
      context.target_audience.toLowerCase().includes('consumer')) {
    score += 30;
    reasoning = 'Perfect for young consumer audience with high engagement';
  }

  // B2C consumer products
  if (isB2CContext(context) && context.product_type === 'mobile_app') {
    score += 20;
  }

  // Low to medium CAC products
  if (getAverageCAC(context.estimated_cac_range) <= 20) {
    score += 10;
  }

  return { channel: 'TikTok Ads', score, reasoning };
}

/**
 * Score YouTube Ads channel
 */
function scoreYouTubeAds(context: ProductContext): ChannelScore {
  let score = 35;
  let reasoning = 'Video demonstration and education';

  // Education/tutorial niches
  if (context.niche.toLowerCase().includes('video') ||
      context.niche.toLowerCase().includes('education') ||
      context.niche.toLowerCase().includes('tutorial') ||
      context.niche.toLowerCase().includes('course') ||
      context.niche.toLowerCase().includes('learning') ||
      context.target_audience.toLowerCase().includes('creator') ||
      context.target_audience.toLowerCase().includes('educator')) {
    score += 30;
    reasoning = 'Excellent for products that benefit from video demonstration and education';
  }

  // Tools that need demo
  if (context.product_type === 'tool' || context.product_type === 'saas') {
    score += 10;
  }

  return { channel: 'YouTube Ads', score, reasoning };
}

/**
 * Score SEO/Content Marketing channel
 */
function scoreSEOContent(context: ProductContext): ChannelScore {
  let score = 45;
  let reasoning = 'Organic long-term growth with low CAC';

  // Low CAC products benefit from organic channels
  if (getAverageCAC(context.estimated_cac_range) <= 30) {
    score += 20;
    reasoning = 'Low CAC makes organic content marketing highly profitable';
  }

  // Tools and content products
  if (context.product_type === 'tool' || context.product_type === 'content') {
    score += 15;
  }

  // Developer/technical niches have strong content ecosystems
  if (isDeveloperNiche(context.niche)) {
    score += 15;
  }

  return { channel: 'SEO/Content', score, reasoning };
}

/**
 * Score Reddit/Community Marketing channel
 */
function scoreRedditCommunity(context: ProductContext): ChannelScore {
  let score = 40;
  let reasoning = 'Engaged niche communities with authentic feedback';

  // Developer tools and indie products
  if (isDeveloperNiche(context.niche) ||
      context.target_audience.toLowerCase().includes('indie') ||
      context.target_audience.toLowerCase().includes('hacker') ||
      context.target_audience.toLowerCase().includes('bootstrapper')) {
    score += 25;
    reasoning = 'Perfect for indie/developer communities with high engagement on Reddit';
  }

  // Low CAC products
  if (getAverageCAC(context.estimated_cac_range) <= 20) {
    score += 15;
  }

  // Tools and niche products
  if (context.product_type === 'tool' || context.product_type === 'chrome_extension') {
    score += 10;
  }

  return { channel: 'Reddit/Community', score, reasoning };
}

/**
 * Score ProductHunt channel
 */
function scoreProductHunt(context: ProductContext): ChannelScore {
  let score = 35;
  let reasoning = 'Tech-savvy early adopter audience';

  // New tools and products
  if (context.product_type === 'tool' ||
      context.product_type === 'chrome_extension' ||
      context.product_type === 'api') {
    score += 25;
    reasoning = 'Excellent for launching new tools to tech-savvy early adopters';
  }

  // Developer audience
  if (isDeveloperNiche(context.niche) ||
      context.target_audience.toLowerCase().includes('developer') ||
      context.target_audience.toLowerCase().includes('tech')) {
    score += 20;
  }

  // Low to medium CAC
  if (getAverageCAC(context.estimated_cac_range) <= 50) {
    score += 10;
  }

  return { channel: 'ProductHunt', score, reasoning };
}

/**
 * Score Email Marketing channel
 */
function scoreEmailMarketing(context: ProductContext): ChannelScore {
  let score = 30;
  let reasoning = 'Direct communication with nurture potential';

  // B2B SaaS with longer sales cycles
  if (isB2BContext(context) && context.product_type === 'saas') {
    score += 20;
  }

  // Email/marketing related niches
  if (context.niche.toLowerCase().includes('email') ||
      context.niche.toLowerCase().includes('marketing') ||
      context.niche.toLowerCase().includes('newsletter')) {
    score += 25;
  }

  return { channel: 'Email Marketing', score, reasoning };
}

/**
 * Score Partnerships channel
 */
function scorePartnerships(context: ProductContext): ChannelScore {
  let score = 25;
  let reasoning = 'Strategic integrations and referrals';

  // APIs and integrations
  if (context.product_type === 'api' ||
      context.product_type === 'plugin' ||
      context.product_type === 'chrome_extension') {
    score += 30;
  }

  // B2B with high CAC
  if (isB2BContext(context) && getAverageCAC(context.estimated_cac_range) >= 100) {
    score += 15;
  }

  return { channel: 'Partnerships', score, reasoning };
}

/**
 * Score Influencer Marketing channel
 */
function scoreInfluencerMarketing(context: ProductContext): ChannelScore {
  let score = 25;
  let reasoning = 'Trust transfer from influencer audiences';

  // B2C consumer products
  if (isB2CContext(context)) {
    score += 20;
  }

  // Visual/lifestyle products
  if (context.niche.toLowerCase().includes('fitness') ||
      context.niche.toLowerCase().includes('beauty') ||
      context.niche.toLowerCase().includes('lifestyle') ||
      context.niche.toLowerCase().includes('fashion')) {
    score += 25;
  }

  // Creator-focused products
  if (context.target_audience.toLowerCase().includes('creator') ||
      context.target_audience.toLowerCase().includes('influencer')) {
    score += 20;
  }

  return { channel: 'Influencer Marketing', score, reasoning };
}

/**
 * Check if the context is B2B
 */
function isB2BContext(context: ProductContext): boolean {
  const audience = context.target_audience.toLowerCase();
  const niche = context.niche.toLowerCase();

  const b2bKeywords = [
    'business', 'enterprise', 'team', 'company', 'manager',
    'agency', 'professional', 'b2b', 'saas companies',
    'marketing teams', 'sales', 'collaboration', 'workflow',
    'automation', 'crm', 'analytics'
  ];

  return b2bKeywords.some(keyword =>
    audience.includes(keyword) || niche.includes(keyword)
  );
}

/**
 * Check if the context is B2C
 */
function isB2CContext(context: ProductContext): boolean {
  const audience = context.target_audience.toLowerCase();

  const b2cKeywords = [
    'consumer', 'families', 'gen z', 'millennials', 'young',
    'users', 'people', 'individual', 'personal'
  ];

  return b2cKeywords.some(keyword => audience.includes(keyword));
}

/**
 * Check if niche is developer-focused
 */
function isDeveloperNiche(niche: string): boolean {
  const devKeywords = [
    'developer', 'api', 'code', 'programming', 'software',
    'testing', 'deployment', 'devops', 'productivity',
    'startup', 'tech'
  ];

  return devKeywords.some(keyword => niche.toLowerCase().includes(keyword));
}

/**
 * Extract average CAC from range string
 */
function getAverageCAC(cacRange: string): number {
  // Extract numbers from string like "$50-$150" or "$5-$15"
  const numbers = cacRange.match(/\d+/g);

  if (!numbers || numbers.length === 0) {
    return 50; // Default fallback
  }

  if (numbers.length === 1) {
    return parseInt(numbers[0], 10);
  }

  // Calculate average of range
  const low = parseInt(numbers[0], 10);
  const high = parseInt(numbers[1], 10);
  return (low + high) / 2;
}
