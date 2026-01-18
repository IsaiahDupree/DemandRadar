/**
 * API Route: Export Report as Slides (PPTX)
 * GET /api/reports/:id/slides
 *
 * Generates and downloads a PowerPoint presentation from a report
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateReport } from '@/lib/reports/generator';
import { generateSlides, SlideGeneratorOptions } from '@/lib/reports/slide-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters for customization
    const searchParams = request.nextUrl.searchParams;
    const brandColor = searchParams.get('brandColor') || '#3b82f6';
    const includeCharts = searchParams.get('includeCharts') !== 'false';

    const options: SlideGeneratorOptions = {
      includeCharts,
      brandColor,
    };

    // Generate report data
    const reportData = await generateReport(id, user.id);

    // Generate slides
    const buffer = await generateSlides(reportData, options);

    // Set response headers for download
    const filename = `${reportData.summary.nicheName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pptx`;

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Slide generation error:', error);

    if (error instanceof Error) {
      if (error.message === 'Run not found') {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        );
      }

      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate slides' },
      { status: 500 }
    );
  }
}
