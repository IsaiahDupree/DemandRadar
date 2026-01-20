import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { generateRecommendations, MarketSignals } from '@/lib/recommendations/generator';

/**
 * POST /api/recommendations/generate
 * Generate product recommendations for a niche
 * Feature: BUILD-004
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { niche, run_id, count = 3 } = body;

    // Validate required fields
    if (!niche || typeof niche !== 'string') {
      return NextResponse.json(
        { error: 'Niche is required and must be a string' },
        { status: 400 }
      );
    }

    // Fetch market signals if run_id is provided
    let marketSignals: MarketSignals = {
      niche,
      pain_points: [],
      competitor_ads: [],
      search_queries: [],
      content_gaps: [],
      demand_score: 50,
    };

    if (run_id) {
      // Fetch pain points from Reddit mentions
      const { data: painPoints } = await supabase
        .from('reddit_mentions')
        .select('text, score')
        .eq('run_id', run_id)
        .order('score', { ascending: false })
        .limit(10);

      if (painPoints) {
        marketSignals.pain_points = painPoints.map((p) => ({
          text: p.text,
          frequency: p.score || 0,
        }));
      }

      // Fetch competitor ads
      const { data: ads } = await supabase
        .from('ad_creatives')
        .select('advertiser_name, headline, days_running')
        .eq('run_id', run_id)
        .order('days_running', { ascending: false })
        .limit(10);

      if (ads) {
        marketSignals.competitor_ads = ads.map((ad) => ({
          advertiser: ad.advertiser_name,
          headline: ad.headline || 'N/A',
          run_days: ad.days_running || 0,
        }));
      }

      // Fetch run scores
      const { data: run } = await supabase
        .from('runs')
        .select('opportunity_score')
        .eq('id', run_id)
        .single();

      if (run?.opportunity_score) {
        marketSignals.demand_score = run.opportunity_score;
      }
    }

    // Generate recommendations using AI
    const generatedRecs = await generateRecommendations(marketSignals);

    // Take only the requested count
    const limitedRecs = generatedRecs.slice(0, count);

    // Save recommendations to database
    const savedRecommendations = [];

    for (const rec of limitedRecs) {
      const { data, error } = await supabase
        .from('build_recommendations')
        .insert({
          user_id: user.id,
          run_id: run_id || null,
          niche_id: null, // Could be linked if niche tracking exists
          product_idea: rec.product_idea,
          product_type: rec.product_type,
          one_liner: rec.tagline,
          target_audience: rec.target_audience,
          pain_points: rec.pain_points.map((p) => ({ text: p, source: 'market_signals' })),
          competitor_gaps: [], // Not available in current generator
          search_queries: rec.search_queries.map((q) => ({ query: q, volume: 0 })),
          recommended_hooks: rec.recommended_hooks,
          recommended_channels: rec.recommended_channels,
          sample_ad_copy: null, // Not generated in current implementation
          landing_page_angle: null,
          build_complexity: 'month', // Default value
          tech_stack_suggestion: [],
          estimated_time_to_mvp: null,
          estimated_cac_range: rec.estimated_cac_range,
          confidence_score: rec.confidence_score,
          reasoning: rec.reasoning,
          supporting_signals:
            marketSignals.pain_points.length +
            marketSignals.competitor_ads.length +
            marketSignals.search_queries.length,
          status: 'new',
        })
        .select()
        .single();

      if (!error && data) {
        savedRecommendations.push(data);
      }
    }

    return NextResponse.json({
      recommendations: savedRecommendations,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
