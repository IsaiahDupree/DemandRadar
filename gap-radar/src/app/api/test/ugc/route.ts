/**
 * UGC Collection Test Endpoint
 * 
 * Test the TikTok and Instagram UGC collection pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { collectAllUGC, getUGCLeaderboard } from '@/lib/collectors/ugc';
import { generateUGCRecommendations } from '@/lib/ai/ugc-generator';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || 'fitness app';
  const seedTerms = searchParams.get('seeds')?.split(',') || [];

  return NextResponse.json({
    endpoint: '/api/test/ugc',
    description: 'Test UGC collection from TikTok and Instagram',
    usage: {
      method: 'POST',
      body: {
        nicheQuery: 'string (required)',
        seedTerms: 'string[] (optional)',
        generatePlaybook: 'boolean (optional, default: false)',
      },
    },
    example: {
      nicheQuery: query,
      seedTerms: seedTerms.length > 0 ? seedTerms : ['workout', 'gym'],
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nicheQuery, seedTerms = [], generatePlaybook = false } = body;

    if (!nicheQuery) {
      return NextResponse.json(
        { error: 'nicheQuery is required' },
        { status: 400 }
      );
    }

    console.log(`[UGC Test] Collecting UGC for: ${nicheQuery}`);
    const startTime = Date.now();

    // Collect UGC from all platforms
    const ugcResults = await collectAllUGC(nicheQuery, seedTerms);

    // Get leaderboards
    const tiktokLeaderboard = getUGCLeaderboard(ugcResults, {
      platform: 'tiktok',
      sortBy: 'score',
      limit: 10,
    });

    const instagramLeaderboard = getUGCLeaderboard(ugcResults, {
      platform: 'instagram',
      sortBy: 'score',
      limit: 10,
    });

    const collectionTime = Date.now() - startTime;

    // Optionally generate playbook
    let playbook = null;
    if (generatePlaybook) {
      // Create mock clusters and gaps for playbook generation
      const mockClusters = ugcResults.patterns.topHookTypes.map(h => ({
        cluster_type: 'angle' as const,
        label: h.type,
        examples: [],
        frequency: h.count,
        intensity: 0.7,
      }));

      const mockGaps = [{
        id: 'mock-gap-1',
        run_id: 'test',
        gap_type: 'positioning' as const,
        title: `${nicheQuery} UGC opportunity`,
        problem: 'Existing content lacks authenticity',
        evidence_ads: [],
        evidence_reddit: [],
        recommendation: 'Create authentic UGC showcasing real results',
        opportunity_score: 75,
        confidence: 0.8,
      }];

      playbook = await generateUGCRecommendations(mockClusters, mockGaps, nicheQuery);
    }

    return NextResponse.json({
      success: true,
      query: nicheQuery,
      seedTerms,
      timing: {
        collectionMs: collectionTime,
        total: `${(collectionTime / 1000).toFixed(2)}s`,
      },
      summary: {
        totalAssets: ugcResults.combined.length,
        tiktokAssets: ugcResults.tiktok.length,
        instagramAssets: ugcResults.instagram.length,
        topPerformersCount: ugcResults.topPerformers.length,
      },
      patterns: ugcResults.patterns,
      leaderboards: {
        tiktok: tiktokLeaderboard.map(r => ({
          platform: r.asset.platform,
          url: r.asset.url,
          caption: r.asset.caption?.slice(0, 100),
          score: r.metrics.score,
          views: r.metrics.views,
          likes: r.metrics.likes,
          hookType: r.pattern?.hook_type,
          format: r.pattern?.format,
        })),
        instagram: instagramLeaderboard.map(r => ({
          platform: r.asset.platform,
          url: r.asset.url,
          caption: r.asset.caption?.slice(0, 100),
          score: r.metrics.score,
          likes: r.metrics.likes,
          comments: r.metrics.comments,
          hookType: r.pattern?.hook_type,
          format: r.pattern?.format,
        })),
      },
      playbook: playbook || 'Set generatePlaybook: true to generate UGC recommendations',
    });
  } catch (error) {
    console.error('[UGC Test] Error:', error);
    return NextResponse.json(
      { 
        error: 'UGC collection failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
