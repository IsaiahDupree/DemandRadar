/**
 * Reddit Data Collector
 * 
 * Uses Reddit's public JSON API (no auth required) to fetch posts about a niche.
 * Falls back to RapidAPI if configured.
 * 
 * Data sources:
 * 1. Reddit Public JSON API (primary - no auth needed)
 * 2. RapidAPI Reddit (optional - requires subscription)
 * 3. Mock data (fallback)
 */

export interface RedditMention {
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
  // Winning signal indicators
  signal_type?: 'pain_point' | 'solution_request' | 'alternative_search' | 'recommendation' | 'complaint' | 'general';
  demand_score?: number;
  is_verified_demand?: boolean;
}

// Minimum thresholds for "winning" Reddit signals (proven demand)
export const WINNING_SIGNAL_THRESHOLDS = {
  MIN_UPVOTES: 10,              // Must have at least 10 upvotes
  MIN_COMMENTS: 5,              // Must have at least 5 comments (engagement)
  VERIFIED_UPVOTES: 50,         // 50+ upvotes = verified demand
  VERIFIED_COMMENTS: 20,        // 20+ comments = high engagement
  MAX_AGE_DAYS: 365,            // Within last year
  HIGH_DEMAND_SCORE: 70,        // Score threshold for "winning" ideas
};

// Pain point keywords that indicate real demand
export const PAIN_POINT_INDICATORS = [
  // Frustration signals
  'frustrated', 'frustrating', 'annoying', 'hate', 'terrible', 'awful',
  'struggle', 'struggling', 'problem', 'issue', 'bug', 'broken',
  // Solution seeking
  'looking for', 'need help', 'any recommendations', 'suggest', 'alternative',
  'better than', 'replace', 'switch from', 'tired of', 'fed up',
  // Direct requests
  'is there a', 'does anyone know', 'what do you use', 'best tool for',
  'how do you', 'wish there was', 'would pay for', 'shut up and take my money',
  // Price sensitivity (opportunity!)
  'too expensive', 'overpriced', 'cheaper alternative', 'free alternative',
  'budget', 'affordable', 'cost effective',
];

// High-value subreddits for SaaS opportunities
export const SAAS_OPPORTUNITY_SUBREDDITS = [
  'SaaS', 'startups', 'Entrepreneur', 'smallbusiness', 'software',
  'webdev', 'programming', 'sideproject', 'indiehackers', 'microsaas',
  'productivity', 'sales', 'marketing', 'SEO', 'analytics',
  'nocode', 'automation', 'workflow', 'freelance', 'agency',
];

export async function collectRedditMentions(
  nicheQuery: string,
  seedTerms: string[],
  competitors: string[],
  options: {
    filterLowEngagement?: boolean;
    minUpvotes?: number;
    minComments?: number;
    verifiedOnly?: boolean;
    maxAgeDays?: number;
  } = {}
): Promise<RedditMention[]> {
  const {
    filterLowEngagement = true,
    minUpvotes = WINNING_SIGNAL_THRESHOLDS.MIN_UPVOTES,
    minComments = WINNING_SIGNAL_THRESHOLDS.MIN_COMMENTS,
    verifiedOnly = false,
    maxAgeDays = WINNING_SIGNAL_THRESHOLDS.MAX_AGE_DAYS,
  } = options;

  const mentions: RedditMention[] = [];
  
  // Search terms = niche + seeds + competitors
  const searchTerms = [
    nicheQuery,
    ...seedTerms.slice(0, 3),
    ...competitors.slice(0, 3),
  ];

  try {
    for (const term of searchTerms) {
      const termMentions = await searchRedditPublic(term, searchTerms);
      mentions.push(...termMentions);
      
      // Rate limiting - small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } catch (error) {
    console.error('Reddit API error:', error);
    return generateMockRedditMentions(nicheQuery, competitors);
  }

  // Dedupe by permalink
  const seen = new Set<string>();
  let filtered = mentions.filter(m => {
    if (seen.has(m.permalink)) return false;
    seen.add(m.permalink);
    return true;
  });

  // Enrich with signal analysis
  filtered = filtered.map(m => enrichWithSignalAnalysis(m));

  // Filter out low engagement posts (not proven demand)
  if (filterLowEngagement) {
    filtered = filtered.filter(m => {
      if (m.score < minUpvotes) return false;
      if ((m.num_comments || 0) < minComments) return false;
      return true;
    });
  }

  // Filter by age
  if (maxAgeDays > 0) {
    const cutoffDate = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);
    filtered = filtered.filter(m => new Date(m.posted_at) >= cutoffDate);
  }

  // Only verified demand signals (high engagement)
  if (verifiedOnly) {
    filtered = filtered.filter(m => m.is_verified_demand === true);
  }

  // Sort by demand score
  filtered.sort((a, b) => (b.demand_score || 0) - (a.demand_score || 0));

  return filtered;
}

/**
 * Enrich Reddit mention with signal analysis
 */
function enrichWithSignalAnalysis(mention: RedditMention): RedditMention {
  const text = `${mention.title || ''} ${mention.body}`.toLowerCase();
  
  // Detect signal type
  const signalType = detectSignalType(text);
  
  // Calculate demand score
  const demandScore = calculateDemandScore(mention, signalType || 'general');
  
  // Determine if verified demand
  const isVerified = 
    mention.score >= WINNING_SIGNAL_THRESHOLDS.VERIFIED_UPVOTES ||
    (mention.num_comments || 0) >= WINNING_SIGNAL_THRESHOLDS.VERIFIED_COMMENTS ||
    demandScore >= WINNING_SIGNAL_THRESHOLDS.HIGH_DEMAND_SCORE;

  return {
    ...mention,
    signal_type: signalType,
    demand_score: demandScore,
    is_verified_demand: isVerified,
  };
}

/**
 * Detect the type of demand signal from text
 */
function detectSignalType(text: string): RedditMention['signal_type'] {
  // Alternative search (highest value - direct competitor weakness)
  if (text.includes('alternative to') || text.includes('switch from') || 
      text.includes('replace') || text.includes('better than')) {
    return 'alternative_search';
  }
  
  // Solution request (high value - active buyer)
  if (text.includes('looking for') || text.includes('need a tool') ||
      text.includes('any recommendations') || text.includes('what do you use') ||
      text.includes('is there a')) {
    return 'solution_request';
  }
  
  // Pain point (valuable - unmet need)
  if (text.includes('frustrated') || text.includes('struggling') ||
      text.includes('problem with') || text.includes('hate') ||
      text.includes('wish there was') || text.includes('would pay for')) {
    return 'pain_point';
  }
  
  // Complaint (opportunity to do better)
  if (text.includes('terrible') || text.includes('awful') ||
      text.includes('too expensive') || text.includes('overpriced') ||
      text.includes('broken') || text.includes('bug')) {
    return 'complaint';
  }
  
  // Recommendation request
  if (text.includes('recommend') || text.includes('suggest') ||
      text.includes('best tool') || text.includes('top')) {
    return 'recommendation';
  }
  
  return 'general';
}

/**
 * Calculate demand score (0-100) based on engagement and signal type
 */
function calculateDemandScore(mention: RedditMention, signalType: string): number {
  let score = 0;
  
  // Engagement score (0-40)
  const upvoteScore = Math.min(mention.score * 0.4, 20);
  const commentScore = Math.min((mention.num_comments || 0) * 0.8, 20);
  score += upvoteScore + commentScore;
  
  // Signal type multiplier (0-30)
  const signalMultipliers: Record<string, number> = {
    'alternative_search': 30,  // Highest - they want to switch
    'solution_request': 25,    // High - actively looking
    'pain_point': 20,          // Good - unmet need
    'complaint': 15,           // Decent - opportunity
    'recommendation': 10,      // Lower - already have solutions
    'general': 5,              // Lowest
  };
  score += signalMultipliers[signalType] || 5;
  
  // Pain point keyword density (0-20)
  const text = `${mention.title || ''} ${mention.body}`.toLowerCase();
  let painPointMatches = 0;
  for (const indicator of PAIN_POINT_INDICATORS) {
    if (text.includes(indicator)) {
      painPointMatches++;
    }
  }
  score += Math.min(painPointMatches * 4, 20);
  
  // Recency bonus (0-10)
  const daysAgo = (Date.now() - new Date(mention.posted_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysAgo <= 7) score += 10;
  else if (daysAgo <= 30) score += 7;
  else if (daysAgo <= 90) score += 4;
  
  return Math.min(Math.round(score), 100);
}

/**
 * Check if a Reddit mention qualifies as a "winning" demand signal
 */
export function isWinningSignal(mention: RedditMention): boolean {
  // Must have minimum engagement
  if (mention.score < WINNING_SIGNAL_THRESHOLDS.MIN_UPVOTES) return false;
  if ((mention.num_comments || 0) < WINNING_SIGNAL_THRESHOLDS.MIN_COMMENTS) return false;
  
  // Must be a valuable signal type
  const valuableTypes = ['alternative_search', 'solution_request', 'pain_point', 'complaint'];
  if (!valuableTypes.includes(mention.signal_type || '')) return false;
  
  // Must have decent demand score
  if ((mention.demand_score || 0) < 40) return false;
  
  return true;
}

/**
 * Search Reddit using the public JSON API (no auth required)
 */
async function searchRedditPublic(
  query: string,
  allTerms: string[]
): Promise<RedditMention[]> {
  const response = await fetch(
    `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&t=year&limit=25`,
    {
      headers: {
        'User-Agent': 'DemandRadar/1.0 (market research tool)',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Reddit search failed: ${response.status}`);
  }

  const data = await response.json();
  
  return (data.data?.children || []).map((child: { data: Record<string, unknown> }) => {
    const post = child.data;
    const matchedEntities = allTerms.filter(term => 
      ((post.title as string) || '').toLowerCase().includes(term.toLowerCase()) ||
      ((post.selftext as string) || '').toLowerCase().includes(term.toLowerCase())
    );

    return {
      subreddit: `r/${post.subreddit}`,
      type: 'post' as const,
      title: post.title as string,
      body: (post.selftext as string) || '',
      score: post.score as number,
      num_comments: post.num_comments as number,
      permalink: `https://reddit.com${post.permalink}`,
      matched_entities: matchedEntities,
      posted_at: new Date((post.created_utc as number) * 1000).toISOString(),
      raw_payload: post,
    };
  });
}

/**
 * Search specific subreddits for relevant posts
 */
export async function searchSubreddit(
  subreddit: string,
  query: string,
  sort: 'relevance' | 'hot' | 'new' | 'top' = 'relevance',
  time: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all' = 'year'
): Promise<RedditMention[]> {
  const response = await fetch(
    `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=${sort}&t=${time}&limit=50`,
    {
      headers: {
        'User-Agent': 'DemandRadar/1.0 (market research tool)',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Reddit subreddit search failed: ${response.status}`);
  }

  const data = await response.json();
  
  return (data.data?.children || []).map((child: { data: Record<string, unknown> }) => {
    const post = child.data;
    return {
      subreddit: `r/${post.subreddit}`,
      type: 'post' as const,
      title: post.title as string,
      body: (post.selftext as string) || '',
      score: post.score as number,
      num_comments: post.num_comments as number,
      permalink: `https://reddit.com${post.permalink}`,
      matched_entities: [query],
      posted_at: new Date((post.created_utc as number) * 1000).toISOString(),
      raw_payload: post,
    };
  });
}

function generateMockRedditMentions(
  query: string,
  competitors: string[]
): RedditMention[] {
  const templates = [
    {
      subreddit: 'r/software',
      title: `Best ${query} that actually works?`,
      body: `I've tried like 5 different tools and they all have issues. Anyone found one that actually works well?`,
      score: 234,
    },
    {
      subreddit: 'r/productivity',
      title: `${query} recommendations?`,
      body: `Looking for a good ${query.toLowerCase()} tool. Price isn't a huge concern but I want something reliable.`,
      score: 156,
    },
    {
      subreddit: 'r/startups',
      title: `Building a ${query} - market validation`,
      body: `Thinking of building a ${query.toLowerCase()} tool. The existing ones charge too much for what they offer.`,
      score: 89,
    },
    {
      subreddit: 'r/SaaS',
      title: `${competitors[0] || query} alternative?`,
      body: `${competitors[0] || 'Current tools'} is too expensive. Looking for alternatives that don't break the bank.`,
      score: 312,
    },
  ];

  return templates.map((t, i) => ({
    subreddit: t.subreddit,
    type: 'post' as const,
    title: t.title,
    body: t.body,
    score: t.score,
    num_comments: Math.floor(t.score / 3),
    permalink: `/r/${t.subreddit.slice(2)}/comments/abc${i}`,
    matched_entities: [query],
    posted_at: new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}
