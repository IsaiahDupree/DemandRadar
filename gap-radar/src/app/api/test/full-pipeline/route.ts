import { NextRequest, NextResponse } from 'next/server';
import { collectMetaAds } from '@/lib/collectors/meta';
import { collectRedditMentions } from '@/lib/collectors/reddit';
import { collectAppStoreResults } from '@/lib/collectors/appstore';
import { extractInsights } from '@/lib/ai/extractor';
import { generateGaps } from '@/lib/ai/gap-generator';

// Full pipeline test endpoint - bypasses auth for development
// DELETE IN PRODUCTION
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Test endpoint disabled in production' }, { status: 403 });
  }

  const body = await request.json();
  const { nicheQuery, seedTerms = [], competitors = [], geo = 'US' } = body;

  if (!nicheQuery) {
    return NextResponse.json({ error: 'nicheQuery is required' }, { status: 400 });
  }

  try {
    // Step 1: Collect data
    console.log(`[Full Pipeline] Collecting data for: ${nicheQuery}`);
    
    const [metaAds, redditMentions, appStoreResults] = await Promise.all([
      collectMetaAds(nicheQuery, seedTerms, geo),
      collectRedditMentions(nicheQuery, seedTerms, competitors),
      collectAppStoreResults(nicheQuery, seedTerms),
    ]);

    console.log(`[Full Pipeline] Collected: ${metaAds.length} ads, ${redditMentions.length} reddit, ${appStoreResults.length} apps`);

    // Step 2: Extract insights with LLM
    console.log(`[Full Pipeline] Extracting insights with OpenAI...`);
    const { extractions, clusters } = await extractInsights(metaAds, redditMentions, nicheQuery);
    console.log(`[Full Pipeline] Extracted: ${extractions.length} extractions, ${clusters.length} clusters`);

    // Step 3: Generate gap opportunities
    console.log(`[Full Pipeline] Generating gap opportunities...`);
    const gaps = await generateGaps(clusters, metaAds, redditMentions, nicheQuery);
    console.log(`[Full Pipeline] Generated: ${gaps.length} gaps`);

    return NextResponse.json({
      success: true,
      nicheQuery,
      pipeline: {
        collection: {
          metaAds: metaAds.length,
          redditMentions: redditMentions.length,
          appStoreResults: appStoreResults.length,
        },
        extraction: {
          extractions: extractions.length,
          clusters: clusters.length,
          clusterSummary: clusters.map(c => ({
            type: c.cluster_type,
            label: c.label,
            frequency: c.frequency,
          })),
        },
        gaps: gaps.map(g => ({
          type: g.gap_type,
          title: g.title,
          score: g.opportunity_score,
          confidence: g.confidence,
          recommendation: g.recommendation,
        })),
      },
    });
  } catch (error) {
    console.error('[Full Pipeline] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Pipeline failed' },
      { status: 500 }
    );
  }
}
