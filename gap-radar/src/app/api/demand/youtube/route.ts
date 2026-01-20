import { NextRequest, NextResponse } from 'next/server';
import { collectYouTubeDemand } from '@/lib/collectors/youtube-demand';
import {
  calculateContentScore,
  normalizeViewVelocity,
  analyzeCommentQuestions,
  identifyContentGaps,
} from '@/lib/scoring/content-score';

/**
 * GET /api/demand/youtube
 *
 * Get content gap score from YouTube data
 *
 * Query params:
 * - niche: string (required) - The niche to analyze
 * - maxVideos: number (optional) - Max videos to analyze (default: 20)
 * - seedTerms: string (optional) - Comma-separated seed terms
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get('niche');
    const maxVideos = parseInt(searchParams.get('maxVideos') || '20');
    const seedTermsParam = searchParams.get('seedTerms');
    const seedTerms = seedTermsParam ? seedTermsParam.split(',').map(s => s.trim()) : [];

    if (!niche) {
      return NextResponse.json(
        { error: 'Niche is required' },
        { status: 400 }
      );
    }

    // Collect YouTube data
    const youtubeData = await collectYouTubeDemand(niche, {
      maxVideos,
      seedTerms,
    });

    // Calculate content score
    const contentScore = calculateContentScore(youtubeData);

    // Calculate breakdown for transparency
    const velocityScore = normalizeViewVelocity(youtubeData.avgViews);
    const questionScore = analyzeCommentQuestions(youtubeData.comments);
    const gapScore = identifyContentGaps(youtubeData.videos);

    return NextResponse.json({
      niche,
      content_score: contentScore,
      data: {
        avgViews: youtubeData.avgViews,
        totalComments: youtubeData.comments.length,
        totalVideos: youtubeData.videos.length,
        questionComments: youtubeData.comments.filter(c =>
          c.includes('?') || /\b(how|what|where|why|when)\b/i.test(c)
        ).length,
      },
      breakdown: {
        velocity_score: velocityScore,
        question_score: questionScore,
        gap_score: gapScore,
        weights: {
          velocity: 0.4,
          questions: 0.3,
          gaps: 0.3,
        },
      },
      content_gaps: identifyContentGapDetails(youtubeData.videos),
      sample_questions: youtubeData.comments
        .filter(c => c.includes('?') || /\b(how|what|where|why|when)\b/i.test(c))
        .slice(0, 5),
      meta: {
        maxVideos,
        seedTerms,
        collected_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching YouTube data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch YouTube data' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to provide detailed content gap information
 */
function identifyContentGapDetails(videos: Array<{ title: string; views: number; duration: number }>) {
  const gaps = {
    beginner: true,
    intermediate: true,
    advanced: true,
    shortForm: true,
    longForm: true,
  };

  // Check for content levels
  const hasBeginner = videos.some(v =>
    /beginner|start|intro|basics|101|guide|learn/i.test(v.title)
  );
  const hasIntermediate = videos.some(v =>
    /intermediate|tips|tricks|improve/i.test(v.title)
  );
  const hasAdvanced = videos.some(v =>
    /advanced|expert|master|pro|deep\s*dive/i.test(v.title)
  );

  gaps.beginner = !hasBeginner;
  gaps.intermediate = !hasIntermediate;
  gaps.advanced = !hasAdvanced;

  // Check for duration types
  const shortFormCount = videos.filter(v => v.duration < 300).length; // < 5 min
  const longFormCount = videos.filter(v => v.duration > 1200).length; // > 20 min

  gaps.shortForm = shortFormCount === 0;
  gaps.longForm = longFormCount === 0;

  return {
    missing: Object.entries(gaps)
      .filter(([_, isMissing]) => isMissing)
      .map(([type]) => type),
    details: gaps,
  };
}
