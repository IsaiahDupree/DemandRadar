import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { collectMetaAds } from '@/lib/collectors/meta'
import { collectRedditMentions } from '@/lib/collectors/reddit'
import { collectAppStoreResults } from '@/lib/collectors/appstore'

// Test endpoint - bypasses auth for development
// DELETE IN PRODUCTION
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Test endpoint disabled in production' }, { status: 403 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const body = await request.json()
  const { nicheQuery, seedTerms = [], competitors = [], geo = 'US' } = body

  if (!nicheQuery) {
    return NextResponse.json({ error: 'nicheQuery is required' }, { status: 400 })
  }

  try {
    // Step 1: Collect data from all sources
    console.log(`[Test Run] Collecting data for: ${nicheQuery}`)
    
    const [metaAds, redditMentions, appStoreResults] = await Promise.all([
      collectMetaAds(nicheQuery, seedTerms, geo).catch(err => {
        console.error('Meta collection error:', err)
        return []
      }),
      collectRedditMentions(nicheQuery, seedTerms, competitors).catch(err => {
        console.error('Reddit collection error:', err)
        return []
      }),
      collectAppStoreResults(nicheQuery, seedTerms).catch(err => {
        console.error('App store collection error:', err)
        return []
      }),
    ])

    console.log(`[Test Run] Collected: ${metaAds.length} ads, ${redditMentions.length} reddit, ${appStoreResults.length} apps`)

    return NextResponse.json({
      success: true,
      nicheQuery,
      data: {
        metaAds: {
          count: metaAds.length,
          sample: metaAds.slice(0, 3),
        },
        redditMentions: {
          count: redditMentions.length,
          sample: redditMentions.slice(0, 3),
        },
        appStoreResults: {
          count: appStoreResults.length,
          sample: appStoreResults.slice(0, 3),
        },
      },
    })
  } catch (error) {
    console.error('[Test Run] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Test run failed' },
      { status: 500 }
    )
  }
}
