/**
 * Google Ads Collection Test Endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { collectGoogleAds, searchGoogleAds } from '@/lib/collectors/google';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({
      endpoint: '/api/test/google-ads',
      description: 'Test Google Ads collection via SerpAPI',
      usage: '?q=your+search+query&country=us&limit=20',
      example: '?q=fitness+app&country=us',
      note: 'Requires SERPAPI_KEY environment variable',
    });
  }

  try {
    const country = searchParams.get('country') || 'us';
    const limit = parseInt(searchParams.get('limit') || '20');

    const ads = await searchGoogleAds(query, { country, limit });

    return NextResponse.json({
      success: true,
      query,
      country,
      count: ads.length,
      ads: ads.map(ad => ({
        advertiser: ad.advertiser_name,
        headline: ad.headline,
        description: ad.description,
        url: ad.display_url,
        type: ad.ad_type,
        position: ad.position,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Google Ads collection failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nicheQuery, seedTerms = [], country = 'us' } = body;

    if (!nicheQuery) {
      return NextResponse.json(
        { error: 'nicheQuery is required' },
        { status: 400 }
      );
    }

    const ads = await collectGoogleAds(nicheQuery, seedTerms, { country });

    // Analyze patterns
    const advertisers = [...new Set(ads.map(a => a.advertiser_name))];
    const adTypes = ads.reduce((acc, ad) => {
      acc[ad.ad_type || 'unknown'] = (acc[ad.ad_type || 'unknown'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      query: nicheQuery,
      seedTerms,
      summary: {
        totalAds: ads.length,
        uniqueAdvertisers: advertisers.length,
        adTypes,
      },
      topAdvertisers: advertisers.slice(0, 10),
      ads: ads.slice(0, 20).map(ad => ({
        advertiser: ad.advertiser_name,
        headline: ad.headline,
        description: ad.description.slice(0, 150),
        type: ad.ad_type,
        url: ad.display_url,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Collection failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
