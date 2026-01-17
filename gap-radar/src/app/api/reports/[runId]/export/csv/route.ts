/**
 * CSV Export API
 *
 * Export report data as CSV format
 * GET /api/reports/[runId]/export/csv
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

    // Generate CSV content
    const csv = generateCSV(reportData);

    // Generate filename
    const filename = getCSVFilename(reportData.run.niche_query);

    // Return CSV with appropriate headers
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('CSV generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSV', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function generateCSV(reportData: any): string {
  const lines: string[] = [];

  // Header
  lines.push('GapRadar Market Analysis Report');
  lines.push(`Niche: ${reportData.run.niche_query}`);
  lines.push(`Generated: ${new Date(reportData.run.created_at).toLocaleDateString()}`);
  lines.push('');

  // Scores
  lines.push('SCORES');
  lines.push('Metric,Value');
  lines.push(`Opportunity Score,${reportData.scores.opportunity}`);
  lines.push(`Market Saturation,${reportData.scores.saturation}`);
  lines.push(`Ad Longevity,${reportData.scores.longevity}`);
  lines.push(`User Dissatisfaction,${reportData.scores.dissatisfaction}`);
  lines.push(`Misalignment,${reportData.scores.misalignment}`);
  lines.push(`Confidence,${Math.round(reportData.scores.confidence * 100)}%`);
  lines.push('');

  // Summary
  lines.push('DATA SUMMARY');
  lines.push('Metric,Count');
  lines.push(`Ads Analyzed,${reportData.summary.totalAds}`);
  lines.push(`Reddit Mentions,${reportData.summary.totalMentions}`);
  lines.push(`Gap Opportunities,${reportData.summary.totalGaps}`);
  lines.push(`Product Concepts,${reportData.summary.totalConcepts}`);
  lines.push(`Unique Advertisers,${reportData.summary.uniqueAdvertisers}`);
  lines.push('');

  // Top Advertisers
  lines.push('TOP ADVERTISERS');
  lines.push('Rank,Name,Ad Count,Market Share %');
  reportData.marketSnapshot.topAdvertisers.forEach((advertiser: any, index: number) => {
    const marketShare = ((advertiser.adCount / reportData.summary.totalAds) * 100).toFixed(1);
    lines.push(`${index + 1},"${escapeCSV(advertiser.name)}",${advertiser.adCount},${marketShare}`);
  });
  lines.push('');

  // Top Marketing Angles
  lines.push('TOP MARKETING ANGLES');
  lines.push('Rank,Angle,Frequency');
  reportData.marketSnapshot.topAngles.forEach((angle: any, index: number) => {
    lines.push(`${index + 1},"${escapeCSV(angle.label)}",${angle.frequency}`);
  });
  lines.push('');

  // User Objections
  lines.push('TOP USER OBJECTIONS');
  lines.push('Rank,Objection,Frequency,Intensity');
  reportData.painMap.topObjections.forEach((objection: any, index: number) => {
    lines.push(`${index + 1},"${escapeCSV(objection.label)}",${objection.frequency},${objection.intensity}`);
  });
  lines.push('');

  // Feature Requests
  lines.push('TOP FEATURE REQUESTS');
  lines.push('Rank,Feature,Frequency');
  reportData.painMap.topFeatures.forEach((feature: any, index: number) => {
    lines.push(`${index + 1},"${escapeCSV(feature.label)}",${feature.frequency}`);
  });
  lines.push('');

  // Gap Opportunities
  lines.push('GAP OPPORTUNITIES');
  lines.push('Rank,Type,Title,Problem,Recommendation,Score,Confidence %');
  reportData.gaps.forEach((gap: any, index: number) => {
    lines.push(
      `${index + 1},"${gap.type}","${escapeCSV(gap.title)}","${escapeCSV(gap.problem)}","${escapeCSV(gap.recommendation)}",${gap.score},${Math.round(gap.confidence * 100)}`
    );
  });
  lines.push('');

  // Product Concepts
  if (reportData.concepts && reportData.concepts.length > 0) {
    lines.push('PRODUCT CONCEPTS');
    lines.push('Rank,Name,One-Liner,Platform,Business Model,Difficulty,Opportunity Score');
    reportData.concepts.forEach((concept: any, index: number) => {
      lines.push(
        `${index + 1},"${escapeCSV(concept.name)}","${escapeCSV(concept.oneLiner)}","${concept.platform}","${concept.businessModel}",${concept.difficulty},${concept.opportunityScore}`
      );
    });
    lines.push('');
  }

  // Economics
  if (reportData.economics && reportData.economics.length > 0) {
    lines.push('ECONOMICS ESTIMATES');
    lines.push('Concept,CPC Low,CPC Expected,CPC High,CAC Low,CAC Expected,CAC High,TAM Low,TAM Expected,TAM High');
    reportData.economics.forEach((econ: any) => {
      lines.push(
        `"${escapeCSV(econ.name)}",${econ.cpc.low},${econ.cpc.expected},${econ.cpc.high},${econ.cac.low},${econ.cac.expected},${econ.cac.high},${econ.tam.low},${econ.tam.expected},${econ.tam.high}`
      );
    });
    lines.push('');
  }

  // UGC Hooks
  if (reportData.ugc && reportData.ugc.hooks && reportData.ugc.hooks.length > 0) {
    lines.push('UGC HOOKS');
    lines.push('Rank,Hook Text,Type');
    reportData.ugc.hooks.forEach((hook: any, index: number) => {
      lines.push(`${index + 1},"${escapeCSV(hook.text)}","${hook.type}"`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

function escapeCSV(value: string): string {
  if (!value) return '';
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  const escaped = value.toString().replace(/"/g, '""');
  if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
    return escaped;
  }
  return escaped;
}

function getCSVFilename(nicheQuery: string): string {
  const sanitizedNiche = nicheQuery
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const date = new Date().toISOString().split('T')[0];

  return `gapradar-${sanitizedNiche}-${date}.csv`;
}
