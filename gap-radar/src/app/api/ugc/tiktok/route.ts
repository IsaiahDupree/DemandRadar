/**
 * TikTok UGC API Endpoint
 *
 * GET /api/ugc/tiktok
 * Returns TikTok UGC data for a query with pattern extraction and rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { collectTikTokUGC } from '@/lib/collectors/tiktok';

/**
 * GET /api/ugc/tiktok?query=...&seedTerms=...
 *
 * Query parameters:
 * - query: Required. The search query/niche to analyze
 * - seedTerms: Optional. Comma-separated list of additional seed terms
 *
 * Example:
 * /api/ugc/tiktok?query=AI+tools&seedTerms=chatbot,automation
 *
 * Response includes:
 * - TikTok UGC assets (videos, ads, trends)
 * - Metrics (views, likes, comments, shares, engagement rate)
 * - Pattern extraction (hooks, formats, proof types, CTAs)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    // Validate required query parameter
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Parse optional seed terms
    const seedTermsParam = searchParams.get('seedTerms');
    const seedTerms = seedTermsParam
      ? seedTermsParam.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    // Collect TikTok UGC
    const results = await collectTikTokUGC(query, seedTerms);

    // Return response with metadata
    return NextResponse.json({
      results,
      query,
      count: results.length,
      seedTerms,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('TikTok UGC API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TikTok UGC data' },
      { status: 500 }
    );
  }
}
