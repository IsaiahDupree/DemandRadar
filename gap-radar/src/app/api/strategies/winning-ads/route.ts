import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/strategies/winning-ads
 * 
 * Get winning ad examples from the library
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get('niche');
    const format = searchParams.get('format');
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '20');
    const minRunDays = parseInt(searchParams.get('min_run_days') || '7');
    const excludeLowImpressions = searchParams.get('exclude_low') !== 'false'; // Default: true
    const verifiedOnly = searchParams.get('verified_only') === 'true';

    let query = supabase
      .from('winning_ads_library')
      .select(`
        *,
        ad_strategies (
          name,
          slug,
          category,
          effectiveness_score
        )
      `)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    // CRITICAL: Filter out low impression ads by default
    if (excludeLowImpressions) {
      query = query.neq('impression_level', 'low');
    }

    // Filter by minimum run days
    if (minRunDays > 0) {
      query = query.gte('run_time_days', minRunDays);
    }

    // Only verified winners (30+ days runtime)
    if (verifiedOnly) {
      query = query.eq('is_verified_winner', true);
    }

    if (niche) {
      query = query.eq('niche', niche);
    }

    if (format) {
      query = query.eq('ad_format', format);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ads: data || [],
      total: data?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching winning ads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch winning ads' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/strategies/winning-ads
 * 
 * Add a new winning ad to the library
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('winning_ads_library')
      .insert(body)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ad: data });
  } catch (error) {
    console.error('Error adding winning ad:', error);
    return NextResponse.json(
      { error: 'Failed to add winning ad' },
      { status: 500 }
    );
  }
}
