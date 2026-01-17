import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/demand/opportunities
 * 
 * Get top demand opportunities - "What to Build Next"
 * 
 * Query params:
 * - limit: number (default 10)
 * - min_score: number (default 50)
 * - trend: 'rising' | 'stable' | 'declining' | 'new'
 * - category: string
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const minScore = parseInt(searchParams.get('min_score') || '0');
    const trend = searchParams.get('trend');
    const category = searchParams.get('category');

    let query = supabase
      .from('niche_opportunities')
      .select('*')
      .gte('demand_score', minScore)
      .order('demand_score', { ascending: false })
      .limit(limit);

    if (trend) {
      query = query.eq('trend', trend);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with recent signal counts
    const enrichedData = await Promise.all(
      (data || []).map(async (opp) => {
        const { count: recentSignals } = await supabase
          .from('demand_signals')
          .select('*', { count: 'exact', head: true })
          .eq('niche', opp.niche)
          .gte('detected_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        return {
          ...opp,
          recent_signals: recentSignals || 0,
          score_breakdown: {
            pain: opp.pain_score,
            spend: opp.spend_score,
            search: opp.search_score,
            content: opp.content_score,
            app: opp.app_score,
          },
        };
      })
    );

    return NextResponse.json({
      opportunities: enrichedData,
      total: enrichedData.length,
      filters: { limit, minScore, trend, category },
    });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/demand/opportunities
 * 
 * Add a new niche to monitor
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { niche, category, description, is_watching = true } = body;

    if (!niche) {
      return NextResponse.json({ error: 'Niche is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('niche_opportunities')
      .upsert({
        niche: niche.toLowerCase().replace(/\s+/g, '-'),
        category,
        description,
        is_watching,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ opportunity: data });
  } catch (error) {
    console.error('Error creating opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to create opportunity' },
      { status: 500 }
    );
  }
}
