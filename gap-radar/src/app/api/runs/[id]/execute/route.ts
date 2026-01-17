import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { collectMetaAds } from '@/lib/collectors/meta'
import { collectGoogleAds } from '@/lib/collectors/google'
import { collectRedditMentions } from '@/lib/collectors/reddit'
import { collectAppStoreResults } from '@/lib/collectors/appstore'
import { collectAllUGC } from '@/lib/collectors/ugc'
import { extractInsights } from '@/lib/ai/extractor'
import { generateGaps } from '@/lib/ai/gap-generator'
import { generateConcepts } from '@/lib/ai/concept-generator'
import { generateUGCRecommendations } from '@/lib/ai/ugc-generator'
import { generateActionPlan } from '@/lib/ai/action-plan'
import { calculateScores } from '@/lib/scoring'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: runId } = await params
  const supabase = await createClient()

  try {
    // Update run status to running
    await supabase
      .from('runs')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', runId)

    // Get run details
    const { data: run } = await supabase
      .from('runs')
      .select('*')
      .eq('id', runId)
      .single()

    if (!run) {
      throw new Error('Run not found')
    }

    const { niche_query, seed_terms, competitors, geo } = run

    // Step 1: Collect data from all sources in parallel
    console.log(`[Run ${runId}] Starting data collection...`)

    const [metaAds, googleAds, redditMentions, appStoreResults, ugcResults] = await Promise.all([
      collectMetaAds(niche_query, seed_terms, geo).catch(err => {
        console.error('Meta collection error:', err)
        return []
      }),
      collectGoogleAds(niche_query, seed_terms).catch(err => {
        console.error('Google Ads collection error:', err)
        return []
      }),
      collectRedditMentions(niche_query, seed_terms, competitors).catch(err => {
        console.error('Reddit collection error:', err)
        return []
      }),
      collectAppStoreResults(niche_query, seed_terms).catch(err => {
        console.error('App store collection error:', err)
        return []
      }),
      collectAllUGC(niche_query, seed_terms).catch(err => {
        console.error('UGC collection error:', err)
        return { tiktok: [], instagram: [], combined: [], topPerformers: [], patterns: { topHookTypes: [], topFormats: [], topCTAs: [] } }
      }),
    ])

    // Combine ad sources (Meta + Google)
    const allAds = [...metaAds, ...googleAds]

    // Step 2: Store collected data
    console.log(`[Run ${runId}] Storing collected data...`)

    // Store all ads (Meta + Google combined)
    if (allAds.length > 0) {
      await supabase.from('ad_creatives').insert(
        allAds.map(ad => ({ ...ad, run_id: runId }))
      )
    }

    if (redditMentions.length > 0) {
      await supabase.from('reddit_mentions').insert(
        redditMentions.map(mention => ({ ...mention, run_id: runId }))
      )
    }

    if (appStoreResults.length > 0) {
      await supabase.from('app_store_results').insert(
        appStoreResults.map(result => ({ ...result, run_id: runId }))
      )
    }

    // Store UGC data
    if (ugcResults.combined.length > 0) {
      // Store UGC assets
      await supabase.from('ugc_assets').insert(
        ugcResults.combined.map(r => ({ ...r.asset, run_id: runId }))
      )

      // Store UGC metrics for each asset
      for (const result of ugcResults.combined) {
        await supabase.from('ugc_metrics').insert({
          ...result.metrics,
          asset_id: result.asset.id,
          run_id: runId,
        })

        // Store UGC pattern if available
        if (result.pattern) {
          await supabase.from('ugc_patterns').insert({
            ...result.pattern,
            asset_id: result.asset.id,
            run_id: runId,
          })
        }
      }
    }

    // Step 3: Extract insights using LLM
    console.log(`[Run ${runId}] Extracting insights...`)

    const { extractions, clusters } = await extractInsights(
      allAds,
      redditMentions,
      niche_query
    )

    if (extractions.length > 0) {
      await supabase.from('extractions').insert(
        extractions.map(ext => ({ ...ext, run_id: runId }))
      )
    }

    if (clusters.length > 0) {
      await supabase.from('clusters').insert(
        clusters.map(cluster => ({ ...cluster, run_id: runId }))
      )
    }

    // Step 4: Generate gap opportunities
    console.log(`[Run ${runId}] Generating gap opportunities...`)

    const gaps = await generateGaps(clusters, allAds, redditMentions, niche_query)
    
    if (gaps.length > 0) {
      await supabase.from('gap_opportunities').insert(
        gaps.map(gap => ({ ...gap, run_id: runId }))
      )
    }

    // Step 5: Generate concept ideas
    console.log(`[Run ${runId}] Generating concept ideas...`)
    
    const concepts = await generateConcepts(
      gaps,
      clusters,
      appStoreResults,
      niche_query
    )

    for (const concept of concepts) {
      const { metrics, ...conceptData } = concept
      const { data: insertedConcept } = await supabase
        .from('concept_ideas')
        .insert({ ...conceptData, run_id: runId })
        .select()
        .single()

      if (insertedConcept && metrics) {
        await supabase.from('concept_metrics').insert({
          ...metrics,
          concept_id: insertedConcept.id,
        })
      }
    }

    // Step 6: Generate UGC recommendations
    console.log(`[Run ${runId}] Generating UGC recommendations...`)

    const ugcRecs = await generateUGCRecommendations(
      clusters,
      gaps,
      niche_query
    )

    await supabase.from('ugc_recommendations').insert({
      ...ugcRecs,
      run_id: runId,
    })

    // Step 7: Generate action plan
    console.log(`[Run ${runId}] Generating action plan...`)

    const actionPlan = await generateActionPlan(
      gaps,
      concepts,
      niche_query
    )

    await supabase.from('action_plans').insert({
      ...actionPlan,
      run_id: runId,
    })

    // Step 9: Calculate final scores
    console.log(`[Run ${runId}] Calculating scores...`)

    const scores = calculateScores(
      allAds,
      redditMentions,
      clusters,
      gaps
    )

    // Step 10: Update run as complete
    await supabase
      .from('runs')
      .update({
        status: 'complete',
        finished_at: new Date().toISOString(),
        scores,
      })
      .eq('id', runId)

    console.log(`[Run ${runId}] Complete!`)
    
    return NextResponse.json({ success: true, runId })

  } catch (error) {
    console.error(`[Run ${runId}] Error:`, error)
    
    await supabase
      .from('runs')
      .update({
        status: 'failed',
        finished_at: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', runId)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Pipeline failed' },
      { status: 500 }
    )
  }
}
