import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  collectRedditMentions, 
  isWinningSignal,
  WINNING_SIGNAL_THRESHOLDS,
  SAAS_OPPORTUNITY_SUBREDDITS,
  searchSubreddit,
  RedditMention 
} from '@/lib/collectors/reddit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/demand/reddit
 * 
 * Get winning Reddit signals - proven SaaS opportunities
 * 
 * Query params:
 * - niche: string (required) - The niche to search for
 * - min_upvotes: number (default 10)
 * - min_comments: number (default 5)
 * - verified_only: boolean (default false) - Only high-engagement posts
 * - signal_type: string - Filter by signal type
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get('niche');
    const minUpvotes = parseInt(searchParams.get('min_upvotes') || '10');
    const minComments = parseInt(searchParams.get('min_comments') || '5');
    const verifiedOnly = searchParams.get('verified_only') === 'true';
    const signalType = searchParams.get('signal_type');

    if (!niche) {
      return NextResponse.json({ error: 'Niche is required' }, { status: 400 });
    }

    // Collect Reddit mentions with filtering
    const mentions = await collectRedditMentions(niche, [], [], {
      filterLowEngagement: true,
      minUpvotes,
      minComments,
      verifiedOnly,
    });

    // Filter by signal type if specified
    let filtered = mentions;
    if (signalType) {
      filtered = mentions.filter(m => m.signal_type === signalType);
    }

    // Only include winning signals
    const winningSignals = filtered.filter(isWinningSignal);

    // Group by signal type for analysis
    const bySignalType = filtered.reduce((acc, m) => {
      const type = m.signal_type || 'general';
      if (!acc[type]) acc[type] = [];
      acc[type].push(m);
      return acc;
    }, {} as Record<string, RedditMention[]>);

    return NextResponse.json({
      niche,
      total: filtered.length,
      winning_signals: winningSignals.length,
      signals: filtered,
      by_type: {
        alternative_search: bySignalType.alternative_search?.length || 0,
        solution_request: bySignalType.solution_request?.length || 0,
        pain_point: bySignalType.pain_point?.length || 0,
        complaint: bySignalType.complaint?.length || 0,
        recommendation: bySignalType.recommendation?.length || 0,
        general: bySignalType.general?.length || 0,
      },
      thresholds: WINNING_SIGNAL_THRESHOLDS,
    });
  } catch (error) {
    console.error('Error fetching Reddit signals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Reddit signals' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/demand/reddit
 * 
 * Scan SaaS subreddits for winning opportunities
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      niches = [],
      subreddits = SAAS_OPPORTUNITY_SUBREDDITS.slice(0, 5),
      save_to_db = false,
    } = body;

    const allOpportunities: {
      niche: string;
      subreddit: string;
      signals: RedditMention[];
      winning_count: number;
      top_signal?: RedditMention;
    }[] = [];

    // Search each subreddit for each niche
    for (const subreddit of subreddits) {
      for (const niche of niches) {
        try {
          const mentions = await searchSubreddit(subreddit, niche, 'top', 'year');
          
          // Enrich and filter
          const enriched = mentions.map(m => {
            const text = `${m.title || ''} ${m.body}`.toLowerCase();
            const signalType = detectSignalTypeSimple(text);
            const demandScore = calculateSimpleDemandScore(m, signalType);
            return {
              ...m,
              signal_type: signalType,
              demand_score: demandScore,
              is_verified_demand: m.score >= 50 || (m.num_comments || 0) >= 20,
            };
          }).filter(m => m.score >= 10 && (m.num_comments || 0) >= 5);

          const winningSignals = enriched.filter(m => 
            m.demand_score >= 40 && 
            ['alternative_search', 'solution_request', 'pain_point', 'complaint'].includes(m.signal_type || '')
          );

          if (winningSignals.length > 0) {
            allOpportunities.push({
              niche,
              subreddit: `r/${subreddit}`,
              signals: winningSignals,
              winning_count: winningSignals.length,
              top_signal: winningSignals[0],
            });
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error searching r/${subreddit} for ${niche}:`, error);
        }
      }
    }

    // Sort by winning signal count
    allOpportunities.sort((a, b) => b.winning_count - a.winning_count);

    // Optionally save to database
    if (save_to_db && allOpportunities.length > 0) {
      for (const opp of allOpportunities) {
        for (const signal of opp.signals) {
          await supabase.from('demand_signals').insert({
            niche: opp.niche,
            signal_type: 'pain_point',
            source: 'reddit',
            title: signal.title,
            content: signal.body,
            url: signal.permalink,
            score: signal.demand_score,
            raw_data: {
              subreddit: opp.subreddit,
              upvotes: signal.score,
              comments: signal.num_comments,
              signal_type: signal.signal_type,
            },
          });
        }
      }
    }

    return NextResponse.json({
      total_opportunities: allOpportunities.length,
      total_winning_signals: allOpportunities.reduce((sum, o) => sum + o.winning_count, 0),
      opportunities: allOpportunities,
      subreddits_searched: subreddits.length,
      niches_searched: niches.length,
    });
  } catch (error) {
    console.error('Error scanning Reddit:', error);
    return NextResponse.json(
      { error: 'Failed to scan Reddit' },
      { status: 500 }
    );
  }
}

// Helper functions for POST endpoint
type SignalType = 'pain_point' | 'solution_request' | 'alternative_search' | 'recommendation' | 'complaint' | 'general';

function detectSignalTypeSimple(text: string): SignalType {
  if (text.includes('alternative to') || text.includes('switch from') || text.includes('replace')) {
    return 'alternative_search';
  }
  if (text.includes('looking for') || text.includes('need a tool') || text.includes('any recommendations')) {
    return 'solution_request';
  }
  if (text.includes('frustrated') || text.includes('struggling') || text.includes('wish there was')) {
    return 'pain_point';
  }
  if (text.includes('terrible') || text.includes('too expensive') || text.includes('broken')) {
    return 'complaint';
  }
  if (text.includes('recommend') || text.includes('best tool')) {
    return 'recommendation';
  }
  return 'general';
}

function calculateSimpleDemandScore(mention: RedditMention, signalType: string): number {
  let score = 0;
  score += Math.min(mention.score * 0.4, 20);
  score += Math.min((mention.num_comments || 0) * 0.8, 20);
  
  const multipliers: Record<string, number> = {
    'alternative_search': 30,
    'solution_request': 25,
    'pain_point': 20,
    'complaint': 15,
    'recommendation': 10,
    'general': 5,
  };
  score += multipliers[signalType] || 5;
  
  return Math.min(Math.round(score), 100);
}
