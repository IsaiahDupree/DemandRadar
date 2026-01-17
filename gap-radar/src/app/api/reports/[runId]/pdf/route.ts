/**
 * PDF Report Download API
 *
 * GET /api/reports/[runId]/pdf - Download report as PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateReportPDF, getReportFilename } from '@/lib/report-generator';

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

    // Generate PDF
    const pdfBlob = await generateReportPDF(reportData);
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    // Generate filename
    const filename = getReportFilename(reportData.run.niche_query);

    // Return PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
