/**
 * Google Ads API Endpoint
 *
 * GET /api/google-ads
 * Returns Google Ads data for a query with rate limiting and error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { collectGoogleAds, GoogleAdsSearchOptions } from '@/lib/collectors/google';

/**
 * GET /api/google-ads?query=...&seedTerms=...&country=...&language=...&limit=...
 *
 * Query parameters:
 * - query: Required. The search query/niche to analyze
 * - seedTerms: Optional. Comma-separated list of additional seed terms
 * - country: Optional. Country code (e.g., 'us', 'uk'). Default: 'us'
 * - language: Optional. Language code (e.g., 'en'). Default: 'en'
 * - limit: Optional. Max ads per search term. Default: 20
 *
 * Example:
 * /api/google-ads?query=AI+tools&seedTerms=chatbot,automation&country=us&limit=10
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

    // Parse optional parameters
    const seedTermsParam = searchParams.get('seedTerms');
    const seedTerms = seedTermsParam
      ? seedTermsParam.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    const options: GoogleAdsSearchOptions = {};

    const country = searchParams.get('country');
    if (country) {
      options.country = country;
    }

    const language = searchParams.get('language');
    if (language) {
      options.language = language;
    }

    const limitParam = searchParams.get('limit');
    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      if (!isNaN(limit) && limit > 0) {
        options.limit = limit;
      }
    }

    // Collect Google Ads
    const ads = await collectGoogleAds(query, seedTerms, options);

    // Return response with metadata
    return NextResponse.json({
      ads,
      query,
      count: ads.length,
      seedTerms,
      options,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Google Ads API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Google ads' },
      { status: 500 }
    );
  }
}
