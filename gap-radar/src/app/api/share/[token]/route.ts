import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = await createClient();

    // Get share link with service role (bypass RLS for public access)
    const { data: shareLink, error: shareLinkError } = await supabase
      .from('share_links')
      .select('*, runs(*)')
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (shareLinkError || !shareLink) {
      return NextResponse.json(
        { error: 'Share link not found or has been disabled' },
        { status: 404 }
      );
    }

    // Check if expired
    if (shareLink.expires_at) {
      const expirationDate = new Date(shareLink.expires_at);
      if (expirationDate < new Date()) {
        return NextResponse.json(
          { error: 'This share link has expired' },
          { status: 404 }
        );
      }
    }

    // Check password if required
    if (shareLink.password_hash) {
      const providedPassword = request.headers.get('X-Share-Password');

      if (!providedPassword) {
        return NextResponse.json(
          { error: 'Password required' },
          { status: 401 }
        );
      }

      const passwordMatch = await bcrypt.compare(
        providedPassword,
        shareLink.password_hash
      );

      if (!passwordMatch) {
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 401 }
        );
      }
    }

    // Increment view count
    await supabase.rpc('increment_share_view_count', { share_token: token });

    // Fetch the complete report data
    const runId = shareLink.run_id;

    // Fetch all the report components
    const [
      { data: run },
      { data: adCreatives },
      { data: redditMentions },
      { data: clusters },
      { data: gaps },
      { data: concepts },
      { data: conceptMetrics },
      { data: ugcRecommendations },
    ] = await Promise.all([
      supabase.from('runs').select('*').eq('id', runId).single(),
      supabase.from('ad_creatives').select('*').eq('run_id', runId),
      supabase.from('reddit_mentions').select('*').eq('run_id', runId),
      supabase.from('clusters').select('*').eq('run_id', runId),
      supabase.from('gap_opportunities').select('*').eq('run_id', runId),
      supabase.from('concept_ideas').select('*').eq('run_id', runId),
      supabase.from('concept_metrics').select('*').eq('run_id', runId),
      supabase.from('ugc_recommendations').select('*').eq('run_id', runId).single(),
    ]);

    if (!run) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Calculate summary stats
    const uniqueAdvertisers = new Set(
      adCreatives?.map((ad) => ad.advertiser_name).filter(Boolean) || []
    ).size;

    const objectionClusters =
      clusters?.filter((c) => c.cluster_type === 'objection') || [];
    const angleClusters =
      clusters?.filter((c) => c.cluster_type === 'angle') || [];
    const featureClusters =
      clusters?.filter((c) => c.cluster_type === 'feature') || [];

    // Build market snapshot
    const advertiserCounts = new Map<string, number>();
    adCreatives?.forEach((ad) => {
      if (ad.advertiser_name) {
        advertiserCounts.set(
          ad.advertiser_name,
          (advertiserCounts.get(ad.advertiser_name) || 0) + 1
        );
      }
    });

    const topAdvertisers = Array.from(advertiserCounts.entries())
      .map(([name, count]) => ({ name, adCount: count }))
      .sort((a, b) => b.adCount - a.adCount)
      .slice(0, 10);

    const topAngles = angleClusters
      .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
      .slice(0, 10)
      .map((cluster) => ({
        label: cluster.label || 'Unknown',
        frequency: cluster.frequency || 0,
      }));

    // Calculate longest running ads
    const longestRunningAds =
      adCreatives
        ?.filter((ad) => ad.first_seen && ad.last_seen)
        .map((ad) => {
          const firstSeen = new Date(ad.first_seen!);
          const lastSeen = new Date(ad.last_seen!);
          const daysRunning = Math.floor(
            (lastSeen.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24)
          );
          return {
            advertiser: ad.advertiser_name || 'Unknown',
            headline: ad.headline || ad.creative_text || 'No headline',
            daysRunning,
          };
        })
        .sort((a, b) => b.daysRunning - a.daysRunning)
        .slice(0, 5) || [];

    // Build pain map
    const topObjections = objectionClusters
      .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
      .slice(0, 10)
      .map((cluster) => ({
        label: cluster.label || 'Unknown',
        frequency: cluster.frequency || 0,
        intensity: cluster.intensity || 0,
      }));

    const topFeatures = featureClusters
      .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
      .slice(0, 10)
      .map((cluster) => ({
        label: cluster.label || 'Unknown',
        frequency: cluster.frequency || 0,
      }));

    // Extract pricing and trust issues from objections
    const pricingRelated = objectionClusters
      .filter(
        (c) =>
          c.label?.toLowerCase().includes('price') ||
          c.label?.toLowerCase().includes('cost') ||
          c.label?.toLowerCase().includes('expensive')
      )
      .map((c) => c.label || 'Unknown');

    const trustRelated = objectionClusters
      .filter(
        (c) =>
          c.label?.toLowerCase().includes('trust') ||
          c.label?.toLowerCase().includes('scam') ||
          c.label?.toLowerCase().includes('fake')
      )
      .map((c) => c.label || 'Unknown');

    // Format gaps
    const formattedGaps =
      gaps?.map((gap) => ({
        id: gap.id,
        type: gap.gap_type || 'unknown',
        title: gap.title || 'Untitled Gap',
        problem: gap.problem || '',
        recommendation: gap.recommendation || '',
        score: gap.opportunity_score || 0,
        confidence: gap.confidence || 0,
      })) || [];

    // Format concepts
    const formattedConcepts =
      concepts?.map((concept) => ({
        id: concept.id,
        name: concept.name || 'Untitled Concept',
        oneLiner: concept.one_liner || '',
        platform: concept.platform_recommendation || 'unknown',
        industry: concept.industry || '',
        businessModel: concept.business_model || 'unknown',
        difficulty: 0,
        opportunityScore: 0,
      })) || [];

    // Enhance concepts with metrics
    const conceptsWithMetrics = formattedConcepts.map((concept) => {
      const metrics = conceptMetrics?.find((m) => m.concept_id === concept.id);
      if (metrics) {
        return {
          ...concept,
          difficulty: metrics.build_difficulty || 0,
          opportunityScore: metrics.opportunity_score || 0,
        };
      }
      return concept;
    });

    // Format economics data
    const economics =
      concepts?.map((concept) => {
        const metrics = conceptMetrics?.find((m) => m.concept_id === concept.id);
        return {
          conceptId: concept.id,
          name: concept.name || 'Untitled',
          cpc: {
            low: metrics?.cpc_low || 0,
            expected: metrics?.cpc_expected || 0,
            high: metrics?.cpc_high || 0,
          },
          cac: {
            low: metrics?.cac_low || 0,
            expected: metrics?.cac_expected || 0,
            high: metrics?.cac_high || 0,
          },
          tam: {
            low: metrics?.tam_low || 0,
            expected: metrics?.tam_expected || 0,
            high: metrics?.tam_high || 0,
          },
        };
      }) || [];

    // Format buildability data
    const buildability =
      concepts?.map((concept) => {
        const metrics = conceptMetrics?.find((m) => m.concept_id === concept.id);
        return {
          conceptId: concept.id,
          name: concept.name || 'Untitled',
          implementationDifficulty: metrics?.implementation_difficulty || 0,
          buildDifficulty: metrics?.build_difficulty || 0,
          distributionDifficulty: metrics?.distribution_difficulty || 0,
          humanTouchLevel: metrics?.human_touch_level || 'unknown',
          autonomousSuitability: metrics?.autonomous_suitability || 'unknown',
        };
      }) || [];

    // Build the complete response
    const reportData = {
      run: {
        id: run.id,
        niche_query: run.niche_query,
        status: run.status,
        created_at: run.created_at,
        finished_at: run.finished_at,
      },
      scores: run.scores || {
        saturation: 0,
        longevity: 0,
        dissatisfaction: 0,
        misalignment: 0,
        opportunity: 0,
        confidence: 0,
      },
      summary: {
        totalAds: adCreatives?.length || 0,
        totalMentions: redditMentions?.length || 0,
        totalGaps: gaps?.length || 0,
        totalConcepts: concepts?.length || 0,
        uniqueAdvertisers,
        topObjections: objectionClusters.length,
      },
      marketSnapshot: {
        topAdvertisers,
        topAngles,
        longestRunningAds,
      },
      painMap: {
        topObjections,
        topFeatures,
        pricingFriction: pricingRelated,
        trustIssues: trustRelated,
      },
      gaps: formattedGaps,
      concepts: conceptsWithMetrics,
      ugc: ugcRecommendations,
      economics,
      buildability,
      actionPlan: null, // TODO: Implement action plan generation
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error fetching shared report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
