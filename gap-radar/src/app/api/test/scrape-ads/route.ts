import { NextRequest, NextResponse } from 'next/server';
import { buildAdLibraryUrl, convertToMetaAds, ScrapedAd } from '@/lib/collectors/ad-library-scraper';

/**
 * Test endpoint for Ad Library scraping results
 * 
 * Accepts pre-scraped data from browser automation (Puppeteer MCP)
 * and converts it to MetaAd format for the analysis pipeline.
 * 
 * Example scraped data format:
 * {
 *   totalResults: "550",
 *   adsFound: 47,
 *   advertisers: ["DistinctMotive", "SuDs", ...],
 *   adCopies: ["Orlando! I'm playing dubstep...", ...]
 * }
 */

// Sample scraped data for testing (from actual scrape)
const SAMPLE_SCRAPED_DATA = {
  query: "dubstep",
  country: "US",
  totalResults: "550",
  advertisers: [
    "DistinctMotive",
    "SuDs", 
    "DJ Medication",
    "ARSNL",
    "sinelanguage.dub",
    "frankloindubz",
    "Dr. Psilicon",
    "EDM Links",
    "Third Room",
    "Skyway Theatre",
    "BLAQOUT",
    "REZQ",
    "NotLö",
    "Ch1m3ra",
    "TYNAN"
  ],
  adCopies: [
    "Orlando! I'm playing dubstep in a trampoline park on 1/24, see you there!",
    "OUT NOW 🚨 New tune featuring Maya Rose is officially live on all platforms. A lot of heart and hard work went into this one!",
    "ARSNL - THUMPER IS OUT NOW ON ALL MUSIC PLATFORMS ⛓️ #dubstep #music #edm",
    "I've been holding onto this one for quite a while, I'm really excited to share it with all of you… Midnight Serenata — a somber midnight serenade carved into bass and silence.",
    "IF IT DOESN'T SHAKE THE ROOM, IT'S NOT HERE. Riddim, Tearout, Trapstep & more – listen now!",
    "ANNOUNCING: The Widdler formally invites you to his new live performance, Midnight Mass! This is a gathering for the low frequency lovers, underground soldiers, mainstream misfits & creatures of the night.",
    "If you like Excision, Svdden Death, Sullivan King and other heavy dubstep artists.. prepare to Blaqout 😈",
    "where do you want to see me play this year? Let me know below 👇 tag festivals you want to see me at!",
    "the world needs more deep dubstep and i am here to deliver... #producer #dubstep #electronicmusic"
  ],
  scrapedAt: new Date().toISOString()
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || 'dubstep';
  const useSample = searchParams.get('sample') !== 'false';

  if (useSample) {
    // Use sample data for testing
    const scrapedAds: ScrapedAd[] = SAMPLE_SCRAPED_DATA.advertisers.map((advertiser, i) => ({
      libraryId: `sample-${i}`,
      advertiserName: advertiser,
      creativeText: SAMPLE_SCRAPED_DATA.adCopies[i] || '',
      startDate: 'Jan 15, 2026',
      platforms: ['facebook', 'instagram'],
    }));

    const metaAds = convertToMetaAds(scrapedAds);

    return NextResponse.json({
      success: true,
      source: 'sample_data',
      query: SAMPLE_SCRAPED_DATA.query,
      totalResults: parseInt(SAMPLE_SCRAPED_DATA.totalResults),
      adsExtracted: metaAds.length,
      ads: metaAds,
      scrapedAt: SAMPLE_SCRAPED_DATA.scrapedAt,
      note: 'Using sample scraped data. Pass ?sample=false to require real data.',
    });
  }

  // Return instructions for live scraping
  const url = buildAdLibraryUrl(query, 'US');
  
  return NextResponse.json({
    success: false,
    message: 'Live scraping requires browser automation',
    url,
    instructions: 'Use Puppeteer MCP or browser console to scrape, then POST the data here',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { advertisers, adCopies, totalResults, query, country } = body;

    if (!advertisers || !Array.isArray(advertisers)) {
      return NextResponse.json({ error: 'advertisers array is required' }, { status: 400 });
    }

    const scrapedAds: ScrapedAd[] = advertisers.map((advertiser: string, i: number) => ({
      libraryId: `scraped-${Date.now()}-${i}`,
      advertiserName: advertiser,
      creativeText: adCopies?.[i] || '',
      startDate: new Date().toISOString(),
      platforms: ['facebook'],
    }));

    const metaAds = convertToMetaAds(scrapedAds);

    return NextResponse.json({
      success: true,
      source: 'live_scrape',
      query: query || 'unknown',
      country: country || 'US',
      totalResults: parseInt(totalResults) || advertisers.length,
      adsExtracted: metaAds.length,
      ads: metaAds,
      scrapedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Scrape processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    );
  }
}
