import { NextRequest, NextResponse } from 'next/server';
import { collectGoogleTrends } from '@/lib/collectors/google-trends';
import {
  calculateSearchScore,
  normalizeVolume,
  normalizeGrowth,
  calculateCommercialIntent,
} from '@/lib/scoring/search-score';

/**
 * GET /api/demand/google
 *
 * Get search demand score from Google Trends
 *
 * Query params:
 * - niche: string (required) - The niche to analyze
 * - country: string (optional) - Country code (default: US)
 * - timeRange: string (optional) - Time range (default: today 12-m)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get('niche');
    const country = searchParams.get('country') || 'US';
    const timeRange = searchParams.get('timeRange') || 'today 12-m';

    if (!niche) {
      return NextResponse.json(
        { error: 'Niche is required' },
        { status: 400 }
      );
    }

    // Collect Google Trends data
    const trendsData = await collectGoogleTrends(niche, {
      country,
      timeRange,
    });

    // Calculate search score
    const searchScore = calculateSearchScore(trendsData);

    // Calculate breakdown for transparency
    const volumeScore = normalizeVolume(trendsData.searchVolume);
    const growthScore = normalizeGrowth(trendsData.growthRate);
    const intentScore = calculateCommercialIntent(trendsData.relatedQueries);

    return NextResponse.json({
      niche,
      search_score: searchScore,
      data: {
        searchVolume: trendsData.searchVolume,
        growthRate: trendsData.growthRate,
        relatedQueries: trendsData.relatedQueries,
      },
      breakdown: {
        volume_score: volumeScore,
        growth_score: growthScore,
        intent_score: intentScore,
        weights: {
          volume: 0.4,
          growth: 0.4,
          intent: 0.2,
        },
      },
      meta: {
        country,
        timeRange,
        collected_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching Google Trends data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Google Trends data' },
      { status: 500 }
    );
  }
}
