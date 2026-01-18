/**
 * Notion Export API
 *
 * Export report directly to Notion workspace
 * POST /api/reports/[runId]/export/notion
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exportToNotion } from '@/lib/reports/notion-export';

export async function POST(
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

    // Parse request body for Notion credentials
    const body = await request.json();
    const { apiKey, databaseId } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Notion API key is required' },
        { status: 400 }
      );
    }

    // Fetch report data from the main report API
    const reportUrl = new URL(`/api/reports/${runId}`, request.url);
    const reportResponse = await fetch(reportUrl.toString(), {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });

    if (!reportResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch report data' },
        { status: reportResponse.status }
      );
    }

    const reportData = await reportResponse.json();

    // Export to Notion
    const result = await exportToNotion(reportData, {
      apiKey,
      databaseId,
    });

    return NextResponse.json({
      success: true,
      pageId: result.pageId,
      pageUrl: result.pageUrl,
      message: 'Report successfully exported to Notion',
    });
  } catch (error) {
    console.error('Notion export error:', error);
    return NextResponse.json(
      {
        error: 'Failed to export to Notion',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
