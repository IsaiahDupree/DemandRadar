/**
 * Report Data API
 * 
 * Get full report data for a run (used by report renderer)
 * GET /api/reports/[runId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateScores } from '@/lib/scoring';
import { getWhiteLabelConfig, applyWhiteLabelToReport, getDefaultBranding } from '@/lib/reports/white-label';

interface ReportData {
  run: {
    id: string;
    niche_query: string;
    status: string;
    created_at: string;
    finished_at: string | null;
  };
  scores: {
    saturation: number;
    longevity: number;
    dissatisfaction: number;
    misalignment: number;
    opportunity: number;
    confidence: number;
  };
  summary: {
    totalAds: number;
    totalMentions: number;
    totalGaps: number;
    totalConcepts: number;
    uniqueAdvertisers: number;
    topObjections: number;
  };
  marketSnapshot: {
    topAdvertisers: { name: string; adCount: number }[];
    topAngles: { label: string; frequency: number }[];
    longestRunningAds: { advertiser: string; headline: string; daysRunning: number }[];
  };
  painMap: {
    topObjections: { label: string; frequency: number; intensity: number }[];
    topFeatures: { label: string; frequency: number }[];
    pricingFriction: string[];
    trustIssues: string[];
  };
  gaps: {
    id: string;
    type: string;
    title: string;
    problem: string;
    recommendation: string;
    score: number;
    confidence: number;
  }[];
  concepts: {
    id: string;
    name: string;
    oneLiner: string;
    platform: string;
    industry: string;
    businessModel: string;
    difficulty: number;
    opportunityScore: number;
  }[];
  ugc: {
    hooks: { text: string; type: string }[];
    scripts: { duration: string; outline: string[] }[];
    shotList: { shot: string; description: string }[];
    angleMap: { angle: string; priority: number; examples: string[] }[];
  } | null;
  economics: {
    conceptId: string;
    name: string;
    cpc: { low: number; expected: number; high: number };
    cac: { low: number; expected: number; high: number };
    tam: { low: number; expected: number; high: number };
  }[];
  buildability: {
    conceptId: string;
    name: string;
    implementationDifficulty: number;
    buildDifficulty: number;
    distributionDifficulty: number;
    humanTouchLevel: string;
    autonomousSuitability: string;
  }[];
  actionPlan: {
    sevenDay: any[];
    thirtyDay: any[];
    quickWins: any[];
    keyRisks: any[];
    nextSteps: string;
  } | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const supabase = await createClient();

    // Verify user access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch run
    const { data: run, error: runError } = await supabase
      .from('runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (runError || !run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    // Fetch all related data in parallel
    const [adsResult, mentionsResult, clustersResult, gapsResult, conceptsResult, ugcResult, actionPlanResult] = await Promise.all([
      supabase.from('ad_creatives').select('*').eq('run_id', runId),
      supabase.from('reddit_mentions').select('*').eq('run_id', runId),
      supabase.from('clusters').select('*').eq('run_id', runId),
      supabase.from('gap_opportunities').select('*').eq('run_id', runId).order('opportunity_score', { ascending: false }),
      supabase.from('concept_ideas').select('*, concept_metrics(*)').eq('run_id', runId),
      supabase.from('ugc_recommendations').select('*').eq('run_id', runId).single(),
      supabase.from('action_plans').select('*').eq('run_id', runId).single(),
    ]);

    const ads = adsResult.data || [];
    const mentions = mentionsResult.data || [];
    const clusters = clustersResult.data || [];
    const gaps = gapsResult.data || [];
    const concepts = conceptsResult.data || [];
    const ugc = ugcResult.data;
    const actionPlan = actionPlanResult.data;

    // Calculate scores (filter only meta ads as scoring function expects MetaAd[])
    const scores = calculateScores(
      ads
        .filter(a => a.source === 'meta')
        .map(a => ({
          source: 'meta' as const,
          advertiser_name: a.advertiser_name,
          creative_text: a.creative_text,
          first_seen: a.first_seen,
          is_active: a.is_active,
          media_type: a.media_type as 'image' | 'video' | 'carousel' | 'unknown',
        })),
      mentions.map(m => ({
        subreddit: m.subreddit,
        type: m.type as 'post' | 'comment',
        title: m.title,
        body: m.text,
        score: m.score,
        num_comments: m.num_comments,
        permalink: m.permalink,
        matched_entities: m.matched_entities || [],
        posted_at: m.created_at,
      })),
      clusters.map(c => ({
        cluster_type: c.cluster_type as 'angle' | 'objection' | 'feature' | 'offer',
        label: c.label,
        examples: (c.examples || []).map((e: string, i: number) => ({ id: String(i), snippet: e })),
        frequency: c.frequency,
        intensity: c.intensity,
      })),
      gaps.map(g => ({
        id: g.id,
        run_id: g.run_id,
        gap_type: g.gap_type as 'product' | 'offer' | 'positioning' | 'trust' | 'pricing',
        title: g.title,
        problem: g.problem,
        evidence_ads: (g.evidence_ads || []).map((e: string, i: number) => ({ id: String(i), snippet: e })),
        evidence_reddit: (g.evidence_reddit || []).map((e: string, i: number) => ({ id: String(i), snippet: e })),
        recommendation: g.recommendation,
        opportunity_score: g.opportunity_score,
        confidence: g.confidence,
      }))
    );

    // Build market snapshot
    const advertiserCounts = ads.reduce((acc, ad) => {
      acc[ad.advertiser_name] = (acc[ad.advertiser_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topAdvertisers = Object.entries(advertiserCounts)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 10)
      .map(([name, adCount]) => ({ name, adCount: adCount as number }));

    const angleClusters = clusters.filter(c => c.cluster_type === 'angle');
    const objectionClusters = clusters.filter(c => c.cluster_type === 'objection');
    const featureClusters = clusters.filter(c => c.cluster_type === 'feature');

    // Calculate longest running ads
    const adsWithDays = ads
      .filter(a => a.first_seen)
      .map(a => ({
        advertiser: a.advertiser_name,
        headline: a.headline || a.creative_text?.slice(0, 50),
        daysRunning: Math.floor((Date.now() - new Date(a.first_seen).getTime()) / (1000 * 60 * 60 * 24)),
      }))
      .sort((a, b) => b.daysRunning - a.daysRunning)
      .slice(0, 5);

    // Fetch white-label configuration for Studio users
    const whiteLabelResult = await getWhiteLabelConfig(supabase, user.id);
    const whiteLabelConfig = (whiteLabelResult.success && whiteLabelResult.config) ? whiteLabelResult.config : null;

    // Get branding (either custom or default)
    const branding = whiteLabelConfig || getDefaultBranding();

    const reportData: ReportData = {
      run: {
        id: run.id,
        niche_query: run.niche_query,
        status: run.status,
        created_at: run.created_at,
        finished_at: run.finished_at,
      },
      scores,
      summary: {
        totalAds: ads.length,
        totalMentions: mentions.length,
        totalGaps: gaps.length,
        totalConcepts: concepts.length,
        uniqueAdvertisers: Object.keys(advertiserCounts).length,
        topObjections: objectionClusters.length,
      },
      marketSnapshot: {
        topAdvertisers,
        topAngles: angleClusters
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 5)
          .map(c => ({ label: c.label, frequency: c.frequency })),
        longestRunningAds: adsWithDays,
      },
      painMap: {
        topObjections: objectionClusters
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 5)
          .map(c => ({ label: c.label, frequency: c.frequency, intensity: c.intensity })),
        topFeatures: featureClusters
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 5)
          .map(c => ({ label: c.label, frequency: c.frequency })),
        pricingFriction: objectionClusters
          .filter(c => c.label.toLowerCase().includes('price') || c.label.toLowerCase().includes('cost'))
          .map(c => c.label),
        trustIssues: objectionClusters
          .filter(c => c.label.toLowerCase().includes('trust') || c.label.toLowerCase().includes('scam'))
          .map(c => c.label),
      },
      gaps: gaps.slice(0, 10).map(g => ({
        id: g.id,
        type: g.gap_type,
        title: g.title,
        problem: g.problem,
        recommendation: g.recommendation,
        score: g.opportunity_score,
        confidence: g.confidence,
      })),
      concepts: concepts.slice(0, 5).map(c => ({
        id: c.id,
        name: c.name,
        oneLiner: c.one_liner,
        platform: c.platform_recommendation,
        industry: c.industry,
        businessModel: c.business_model,
        difficulty: c.concept_metrics?.[0]?.implementation_difficulty || 5,
        opportunityScore: c.concept_metrics?.[0]?.opportunity_score || 0,
      })),
      ugc: ugc ? {
        hooks: ugc.hooks || [],
        scripts: ugc.scripts || [],
        shotList: ugc.shot_list || [],
        angleMap: ugc.angle_map || [],
      } : null,
      economics: concepts.map(c => ({
        conceptId: c.id,
        name: c.name,
        cpc: {
          low: c.concept_metrics?.[0]?.cpc_low || 0,
          expected: c.concept_metrics?.[0]?.cpc_expected || 0,
          high: c.concept_metrics?.[0]?.cpc_high || 0,
        },
        cac: {
          low: c.concept_metrics?.[0]?.cac_low || 0,
          expected: c.concept_metrics?.[0]?.cac_expected || 0,
          high: c.concept_metrics?.[0]?.cac_high || 0,
        },
        tam: {
          low: c.concept_metrics?.[0]?.tam_low || 0,
          expected: c.concept_metrics?.[0]?.tam_expected || 0,
          high: c.concept_metrics?.[0]?.tam_high || 0,
        },
      })),
      buildability: concepts.map(c => ({
        conceptId: c.id,
        name: c.name,
        implementationDifficulty: c.concept_metrics?.[0]?.implementation_difficulty || 5,
        buildDifficulty: c.concept_metrics?.[0]?.build_difficulty || 5,
        distributionDifficulty: c.concept_metrics?.[0]?.distribution_difficulty || 5,
        humanTouchLevel: c.concept_metrics?.[0]?.human_touch_level || 'medium',
        autonomousSuitability: c.concept_metrics?.[0]?.autonomous_suitability || 'medium',
      })),
      actionPlan: actionPlan ? {
        sevenDay: actionPlan.sevenDay || actionPlan.seven_day || [],
        thirtyDay: actionPlan.thirtyDay || actionPlan.thirty_day || [],
        quickWins: actionPlan.quickWins || actionPlan.quick_wins || [],
        keyRisks: actionPlan.keyRisks || actionPlan.key_risks || [],
        nextSteps: actionPlan.nextSteps || actionPlan.next_steps || '',
      } : null,
    };

    // Apply white-label branding to report
    const brandedReport = applyWhiteLabelToReport(reportData, whiteLabelConfig);

    // Add branding info to response
    return NextResponse.json({ ...brandedReport, branding });
  } catch (error) {
    console.error('Report data error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
