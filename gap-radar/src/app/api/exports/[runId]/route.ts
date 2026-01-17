/**
 * Data Export API
 * 
 * Export run data in CSV or JSON format
 * GET /api/exports/[runId]?format=csv|json&type=ads|mentions|gaps|all
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type ExportFormat = 'csv' | 'json';
type ExportType = 'ads' | 'mentions' | 'gaps' | 'concepts' | 'ugc' | 'all';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const format = (searchParams.get('format') || 'json') as ExportFormat;
    const type = (searchParams.get('type') || 'all') as ExportType;

    const supabase = await createClient();

    // Verify user has access to this run
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch run to verify ownership
    const { data: run, error: runError } = await supabase
      .from('runs')
      .select('*, projects(owner_id)')
      .eq('id', runId)
      .single();

    if (runError || !run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    // Build export data based on type
    const exportData: Record<string, unknown[]> = {};

    if (type === 'all' || type === 'ads') {
      const { data: ads } = await supabase
        .from('ad_creatives')
        .select('*')
        .eq('run_id', runId);
      exportData.ads = ads || [];
    }

    if (type === 'all' || type === 'mentions') {
      const { data: mentions } = await supabase
        .from('reddit_mentions')
        .select('*')
        .eq('run_id', runId);
      exportData.mentions = mentions || [];
    }

    if (type === 'all' || type === 'gaps') {
      const { data: gaps } = await supabase
        .from('gap_opportunities')
        .select('*')
        .eq('run_id', runId)
        .order('opportunity_score', { ascending: false });
      exportData.gaps = gaps || [];
    }

    if (type === 'all' || type === 'concepts') {
      const { data: concepts } = await supabase
        .from('concept_ideas')
        .select('*, concept_metrics(*)')
        .eq('run_id', runId);
      exportData.concepts = concepts || [];
    }

    if (type === 'all' || type === 'ugc') {
      const { data: ugc } = await supabase
        .from('ugc_recommendations')
        .select('*')
        .eq('run_id', runId);
      exportData.ugc = ugc || [];
    }

    // Add run metadata
    const fullExport = {
      run: {
        id: run.id,
        niche_query: run.niche_query,
        status: run.status,
        created_at: run.created_at,
        finished_at: run.finished_at,
      },
      exported_at: new Date().toISOString(),
      ...exportData,
    };

    // Return based on format
    if (format === 'csv') {
      const csv = convertToCSV(exportData, type);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="demandradar-${runId}-${type}.csv"`,
        },
      });
    }

    return NextResponse.json(fullExport, {
      headers: {
        'Content-Disposition': `attachment; filename="demandradar-${runId}-${type}.json"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Export failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function convertToCSV(data: Record<string, unknown[]>, type: ExportType): string {
  const sections: string[] = [];

  // Helper to convert array of objects to CSV
  const arrayToCSV = (arr: unknown[], sectionName: string): string => {
    if (!arr || arr.length === 0) return '';
    
    const items = arr as Record<string, unknown>[];
    const headers = Object.keys(items[0]).filter(k => k !== 'raw_payload');
    
    const headerRow = headers.join(',');
    const dataRows = items.map(item => 
      headers.map(h => {
        const val = item[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return String(val);
      }).join(',')
    );

    return `# ${sectionName}\n${headerRow}\n${dataRows.join('\n')}`;
  };

  if (data.ads && data.ads.length > 0) {
    sections.push(arrayToCSV(data.ads, 'Ads'));
  }
  if (data.mentions && data.mentions.length > 0) {
    sections.push(arrayToCSV(data.mentions, 'Reddit Mentions'));
  }
  if (data.gaps && data.gaps.length > 0) {
    sections.push(arrayToCSV(data.gaps, 'Gap Opportunities'));
  }
  if (data.concepts && data.concepts.length > 0) {
    sections.push(arrayToCSV(data.concepts, 'Concept Ideas'));
  }
  if (data.ugc && data.ugc.length > 0) {
    sections.push(arrayToCSV(data.ugc, 'UGC Recommendations'));
  }

  return sections.join('\n\n');
}
