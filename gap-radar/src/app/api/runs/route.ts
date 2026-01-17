import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { canCreateAnalysisRun, decrementRuns } from '@/lib/subscription/permissions'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's projects first
  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('owner_id', user.id)

  if (!projects || projects.length === 0) {
    return NextResponse.json({ runs: [] })
  }

  const projectIds = projects.map(p => p.id)

  // Get runs for user's projects
  const { data: runs, error } = await supabase
    .from('runs')
    .select('*')
    .in('project_id', projectIds)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ runs })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { nicheQuery, seedTerms, competitors, geo, runType } = body

  if (!nicheQuery) {
    return NextResponse.json({ error: 'Niche query is required' }, { status: 400 })
  }

  // Check user's run limit using subscription permissions
  const runCheck = await canCreateAnalysisRun(supabase, user.id)

  if (!runCheck.allowed) {
    return NextResponse.json({
      error: runCheck.message || 'Run limit reached. Please upgrade your plan.',
      runsRemaining: runCheck.runsRemaining
    }, { status: 403 })
  }

  // Get user's default project (or first project)
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('owner_id', user.id)
    .limit(1)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'No project found' }, { status: 400 })
  }

  // Create the run
  const { data: run, error } = await supabase
    .from('runs')
    .insert({
      project_id: project.id,
      niche_query: nicheQuery,
      seed_terms: seedTerms || [],
      competitors: competitors || [],
      geo: geo || 'us',
      run_type: runType || 'deep',
      status: 'queued',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Decrement user's remaining runs
  await decrementRuns(supabase, user.id)

  // Trigger the analysis pipeline (async)
  // In production, this would be a background job/queue
  fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/runs/${run.id}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }).catch(console.error)

  return NextResponse.json({ run })
}
