import { NextRequest, NextResponse } from 'next/server';
import { 
  buildAdLibraryUrl, 
  parseScrapedData, 
  convertToMetaAds,
  AdLibraryFilters,
  AD_LIBRARY_COUNTRIES,
  AD_LIBRARY_LANGUAGES
} from '@/lib/collectors/ad-library-scraper';

/**
 * Ad Library Scraper API - Full Filter Support
 * 
 * This endpoint provides the URL and extraction script for browser-based
 * scraping of Facebook Ad Library with ALL available filters.
 * 
 * Available Filters (via URL params):
 * - q: Search query (required)
 * - country: ISO country code (US, GB, CA, AU, DE, FR, etc.)
 * - status: active | inactive | all
 * - media: all | image | video | meme
 * - platforms: facebook,instagram,messenger,audience_network (comma-separated)
 * - language: ISO language code (en, es, fr, de, etc.)
 * - startDateMin: YYYY-MM-DD (ads started after this date)
 * - startDateMax: YYYY-MM-DD (ads started before this date)
 * - adType: all | political_and_issue_ads | housing | employment | credit
 * - pageId: Specific advertiser Page ID
 * 
 * Usage:
 * 1. GET /api/scrape/ad-library?q=fitness&country=US&media=video&platforms=instagram
 *    Returns: { url, extractionScript, filters }
 * 
 * 2. POST /api/scrape/ad-library
 *    Body: { rawData: { ... scraped data ... } }
 *    Returns: { ads: MetaAd[] }
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Parse all filter parameters
  const query = searchParams.get('q') || '';
  const country = searchParams.get('country') || 'US';
  const activeStatus = (searchParams.get('status') || 'active') as 'active' | 'inactive' | 'all';
  const mediaType = (searchParams.get('media') || 'all') as 'all' | 'image' | 'video' | 'meme';
  const platformsParam = searchParams.get('platforms');
  const language = searchParams.get('language');
  const startDateMin = searchParams.get('startDateMin');
  const startDateMax = searchParams.get('startDateMax');
  const adType = (searchParams.get('adType') || 'all') as 'all' | 'political_and_issue_ads' | 'housing' | 'employment' | 'credit';
  const pageId = searchParams.get('pageId');

  if (!query && !pageId) {
    return NextResponse.json({ 
      error: 'Query parameter "q" or "pageId" is required',
      availableFilters: {
        q: 'Search query (required unless pageId provided)',
        country: AD_LIBRARY_COUNTRIES.map(c => c.code),
        status: ['active', 'inactive', 'all'],
        media: ['all', 'image', 'video', 'meme'],
        platforms: ['facebook', 'instagram', 'messenger', 'audience_network'],
        language: AD_LIBRARY_LANGUAGES.map(l => l.code),
        startDateMin: 'YYYY-MM-DD',
        startDateMax: 'YYYY-MM-DD',
        adType: ['all', 'political_and_issue_ads', 'housing', 'employment', 'credit'],
        pageId: 'Specific advertiser Page ID'
      }
    }, { status: 400 });
  }

  // Parse platforms
  const platforms = platformsParam 
    ? platformsParam.split(',').filter(p => 
        ['facebook', 'instagram', 'messenger', 'audience_network'].includes(p)
      ) as ('facebook' | 'instagram' | 'messenger' | 'audience_network')[]
    : undefined;

  // Build filter object
  const filters: AdLibraryFilters = {
    query: query || '',
    country,
    activeStatus,
    mediaType,
    platforms,
    language: language || undefined,
    startDateMin: startDateMin || undefined,
    startDateMax: startDateMax || undefined,
    adType,
    pageId: pageId || undefined,
  };

  const url = buildAdLibraryUrl(filters);

  const extractionScript = `
(function() {
  const cardTexts = document.body.innerText;
  
  const libraryIds = cardTexts.match(/Library ID: \\d+/g) || [];
  const startDates = cardTexts.match(/Started running on [A-Za-z]+ \\d+, \\d+/g) || [];
  
  const lines = cardTexts.split('\\n');
  const advertisers = [];
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === 'Sponsored' && i > 0) {
      const name = lines[i-1].trim();
      if (name.length > 1 && name.length < 60 && !name.includes('See')) {
        advertisers.push(name);
      }
    }
  }
  
  const adCopyPattern = /Sponsored\\n([^]*?)(?=\\d+:\\d+|Low impression|Library ID|$)/g;
  const copies = [...cardTexts.matchAll(adCopyPattern)]
    .map(m => m[1].trim())
    .filter(t => t.length > 20 && t.length < 1000);

  return {
    query: '${query}',
    country: '${country}',
    totalResults: cardTexts.match(/~(\\d+) results/)?.[1] || '0',
    libraryIds: libraryIds.slice(0, 100),
    startDates: startDates.slice(0, 100),
    advertisers: [...new Set(advertisers)].slice(0, 100),
    sampleAdCopy: copies.slice(0, 100),
    scrapedAt: new Date().toISOString()
  };
})();
`;

  return NextResponse.json({
    url,
    filters: {
      query,
      country,
      activeStatus,
      mediaType,
      platforms: platforms || 'all',
      language: language || 'all',
      dateRange: startDateMin || startDateMax ? { min: startDateMin, max: startDateMax } : 'all',
      adType,
      pageId: pageId || null,
    },
    extractionScript,
    instructions: [
      '1. Open the URL in a browser (or use Puppeteer)',
      '2. Scroll down to load more ads (increases results)',
      '3. Open browser console (F12 > Console)',
      '4. Paste and run the extraction script',
      '5. Copy the returned JSON object',
      '6. POST { rawData: <copied JSON> } to this endpoint',
    ],
    automationTip: 'For automated scraping, use Puppeteer MCP with puppeteer_navigate and puppeteer_evaluate',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rawData } = body;

    if (!rawData) {
      return NextResponse.json({ error: 'rawData is required' }, { status: 400 });
    }

    const scrapedAds = parseScrapedData(rawData);
    const metaAds = convertToMetaAds(scrapedAds);

    return NextResponse.json({
      success: true,
      query: rawData.query,
      country: rawData.country,
      totalResults: parseInt(rawData.totalResults) || 0,
      adsExtracted: metaAds.length,
      ads: metaAds,
      scrapedAt: rawData.scrapedAt,
    });
  } catch (error) {
    console.error('Ad Library parse error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Parse failed' },
      { status: 500 }
    );
  }
}
