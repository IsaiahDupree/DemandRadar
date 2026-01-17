import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/strategies/playbooks
 * 
 * Get niche playbooks with complete marketing strategies
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get('niche');
    const growth = searchParams.get('growth_trend');

    let query = supabase
      .from('niche_playbooks')
      .select(`
        *,
        niche_opportunities (
          demand_score,
          trend,
          pain_score,
          spend_score,
          signal_count
        )
      `)
      .order('created_at', { ascending: false });

    if (niche) {
      query = query.eq('niche', niche);
    }

    if (growth) {
      query = query.eq('growth_trend', growth);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      playbooks: data || [],
      total: data?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching playbooks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playbooks' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/strategies/playbooks/[niche]
 * 
 * Get a specific niche playbook with all related data
 */
export async function getPlaybookByNiche(niche: string) {
  const { data: playbook, error: playbookError } = await supabase
    .from('niche_playbooks')
    .select('*')
    .eq('niche', niche)
    .single();

  if (playbookError) {
    return null;
  }

  // Get winning ads for this niche
  const { data: ads } = await supabase
    .from('winning_ads_library')
    .select('*')
    .eq('niche', niche)
    .limit(5);

  // Get opportunity data
  const { data: opportunity } = await supabase
    .from('niche_opportunities')
    .select('*')
    .eq('niche', niche)
    .single();

  // Get recent signals
  const { data: signals } = await supabase
    .from('demand_signals')
    .select('*')
    .eq('niche', niche)
    .order('detected_at', { ascending: false })
    .limit(10);

  return {
    ...playbook,
    winning_ads: ads || [],
    opportunity,
    recent_signals: signals || [],
  };
}
