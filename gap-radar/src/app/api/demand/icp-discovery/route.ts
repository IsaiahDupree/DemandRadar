/**
 * ICP Discovery API Endpoint
 * 
 * Runs a specialized discovery to find ads targeting specific ICPs
 * and analyzes them for targeting insights and copywriting opportunities.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { collectMetaAds } from '@/lib/collectors/meta';
import { collectGoogleAds } from '@/lib/collectors/google';
import { collectRedditMentions } from '@/lib/collectors/reddit';
import { inferTargetingBatch, type TargetingInferenceBatch } from '@/lib/ai/targeting-inference';
import { 
  COPYWRITING_ICP_PRESET, 
  getCopywritingSearchTerms,
  type ICPPreset 
} from '@/lib/presets/copywriting-icp';

export interface ICPDiscoveryRequest {
  preset?: 'copywriting' | 'custom';
  customKeywords?: string[];
  geo?: string;
  maxAds?: number;
  minRelevanceScore?: number;
}

export interface ICPDiscoveryResponse {
  success: boolean;
  preset: ICPPreset;
  results: TargetingInferenceBatch;
  redditInsights?: {
    totalMentions: number;
    topSubreddits: { subreddit: string; count: number }[];
    topPainPoints: string[];
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: ICPDiscoveryRequest = await request.json();
    const {
      preset = 'copywriting',
      customKeywords = [],
      geo = 'US',
      maxAds = 30,
      minRelevanceScore = 0,
    } = body;

    // Get keywords based on preset
    let searchTerms: string[];
    let activePreset: ICPPreset;

    if (preset === 'copywriting') {
      searchTerms = getCopywritingSearchTerms({ maxTerms: 20 });
      activePreset = COPYWRITING_ICP_PRESET;
    } else {
      searchTerms = customKeywords.slice(0, 20);
      activePreset = {
        id: 'custom',
        name: 'Custom ICP Discovery',
        description: 'Custom keyword search',
        primaryKeywords: customKeywords,
        secondaryKeywords: [],
        adjacentKeywords: [],
        negativeKeywords: [],
        targetICPs: [],
        subreddits: [],
      };
    }

    if (searchTerms.length === 0) {
      return NextResponse.json(
        { error: 'No search terms provided' },
        { status: 400 }
      );
    }

    console.log(`[ICP Discovery] Starting with ${searchTerms.length} keywords for preset: ${preset}`);

    // Collect ads from multiple sources in parallel
    const [metaAdsResult, googleAdsResult] = await Promise.allSettled([
      collectMetaAds(searchTerms[0], searchTerms.slice(1, 10), geo),
      collectGoogleAds(searchTerms[0], searchTerms.slice(1, 10), { country: geo }),
    ]);

    const metaAds = metaAdsResult.status === 'fulfilled' ? metaAdsResult.value : [];
    const googleAds = googleAdsResult.status === 'fulfilled' ? googleAdsResult.value : [];
    const allAds = [...metaAds, ...googleAds];

    console.log(`[ICP Discovery] Collected ${allAds.length} ads (${metaAds.length} Meta, ${googleAds.length} Google)`);

    if (allAds.length === 0) {
      return NextResponse.json({
        success: true,
        preset: activePreset,
        results: {
          ads: [],
          summary: {
            totalAdsAnalyzed: 0,
            topICPs: [],
            topPainPoints: [],
            topAngles: [],
            avgRelevanceScore: 0,
            highRelevanceAds: 0,
          },
          icpOpportunities: [],
        },
        redditInsights: undefined,
      });
    }

    // Run targeting inference on collected ads
    console.log(`[ICP Discovery] Running AI targeting inference on ${Math.min(allAds.length, maxAds)} ads...`);
    const inferenceResults = await inferTargetingBatch(allAds, {
      maxAds,
      minRelevanceScore,
    });

    console.log(`[ICP Discovery] Analysis complete. Found ${inferenceResults.summary.highRelevanceAds} high-relevance ads.`);

    // Optionally collect Reddit insights for voice-of-customer
    let redditInsights: ICPDiscoveryResponse['redditInsights'];
    
    if (preset === 'copywriting') {
      const redditMentionsResult = await collectRedditMentions(
        searchTerms[0],
        searchTerms.slice(1, 5),
        [], // no specific competitors
        { filterLowEngagement: false, minUpvotes: 5, minComments: 2 }
      ).catch(() => []);

      if (redditMentionsResult.length > 0) {
        const subredditCounts = new Map<string, number>();
        redditMentionsResult.forEach(m => {
          subredditCounts.set(m.subreddit, (subredditCounts.get(m.subreddit) || 0) + 1);
        });

        redditInsights = {
          totalMentions: redditMentionsResult.length,
          topSubreddits: Array.from(subredditCounts.entries())
            .map(([subreddit, count]) => ({ subreddit, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5),
          topPainPoints: inferenceResults.summary.topPainPoints.slice(0, 5).map(p => p.painPoint),
        };
      }
    }

    const response: ICPDiscoveryResponse = {
      success: true,
      preset: activePreset,
      results: inferenceResults,
      redditInsights,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[ICP Discovery] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Discovery failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Return available presets
  return NextResponse.json({
    presets: [
      {
        id: 'copywriting',
        name: COPYWRITING_ICP_PRESET.name,
        description: COPYWRITING_ICP_PRESET.description,
        keywordCount: getCopywritingSearchTerms().length,
        icpCount: COPYWRITING_ICP_PRESET.targetICPs.length,
      },
    ],
  });
}
