/**
 * JSON Export API
 *
 * Export complete report data as JSON format
 * GET /api/reports/[runId]/export/json
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const supabase = await createClient();

    // Verify user access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch run
    const { data: run, error: runError } = await supabase
      .from('runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (runError || !run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    // Fetch all related data in parallel
    const [
      adsResult,
      mentionsResult,
      clustersResult,
      gapsResult,
      conceptsResult,
      extractionsResult,
      appsResult,
      ugcResult,
      actionPlanResult,
    ] = await Promise.all([
      supabase.from('ad_creatives').select('*').eq('run_id', runId),
      supabase.from('reddit_mentions').select('*').eq('run_id', runId),
      supabase.from('clusters').select('*').eq('run_id', runId),
      supabase.from('gap_opportunities').select('*').eq('run_id', runId).order('opportunity_score', { ascending: false }),
      supabase.from('concept_ideas').select('*, concept_metrics(*)').eq('run_id', runId),
      supabase.from('extractions').select('*').eq('run_id', runId),
      supabase.from('app_store_results').select('*').eq('run_id', runId),
      supabase.from('ugc_recommendations').select('*').eq('run_id', runId).single(),
      supabase.from('action_plans').select('*').eq('run_id', runId).single(),
    ]);

    // Build complete export data
    const exportData = {
      meta: {
        exportedAt: new Date().toISOString(),
        runId: run.id,
        nicheName: run.niche_query,
        status: run.status,
        createdAt: run.created_at,
        finishedAt: run.finished_at,
        version: '1.0.0',
      },
      run: {
        id: run.id,
        niche_query: run.niche_query,
        seed_terms: run.seed_terms || [],
        competitors: run.competitors || [],
        geo: run.geo,
        run_type: run.run_type,
        status: run.status,
        scores: run.scores || {},
        three_percent_better_plans: run.three_percent_better_plans || null,
        created_at: run.created_at,
        started_at: run.started_at,
        finished_at: run.finished_at,
      },
      data: {
        ads: adsResult.data || [],
        reddit_mentions: mentionsResult.data || [],
        clusters: clustersResult.data || [],
        extractions: extractionsResult.data || [],
        app_store_results: appsResult.data || [],
      },
      insights: {
        gap_opportunities: gapsResult.data || [],
        concept_ideas: conceptsResult.data || [],
        ugc_recommendations: ugcResult.data || null,
        action_plan: actionPlanResult.data || null,
      },
      statistics: {
        total_ads: (adsResult.data || []).length,
        total_mentions: (mentionsResult.data || []).length,
        total_gaps: (gapsResult.data || []).length,
        total_concepts: (conceptsResult.data || []).length,
        total_clusters: (clustersResult.data || []).length,
        unique_advertisers: new Set((adsResult.data || []).map(a => a.advertiser_name)).size,
        platforms_analyzed: new Set((appsResult.data || []).map(a => a.platform)).size,
      },
    };

    // Generate filename
    const filename = getJSONFilename(run.niche_query);

    // Return JSON with appropriate headers
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('JSON export error:', error);
    return NextResponse.json(
      { error: 'Failed to export JSON', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getJSONFilename(nicheQuery: string): string {
  const sanitizedNiche = nicheQuery
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const date = new Date().toISOString().split('T')[0];

  return `gapradar-${sanitizedNiche}-${date}.json`;
}
