import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateBuildRecommendations } from '@/lib/demand-intelligence/signal-collector';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/demand/recommendations
 * 
 * Get build recommendations - "What to Build Next"
 * 
 * Query params:
 * - niche: string (optional - filter by niche)
 * - status: string (optional - 'new', 'investigating', 'building', 'launched', 'archived')
 * - min_confidence: number (default 50)
 * - limit: number (default 10)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get('niche');
    const status = searchParams.get('status');
    const minConfidence = parseInt(searchParams.get('min_confidence') || '0');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = supabase
      .from('build_recommendations')
      .select(`
        *,
        niche_opportunities (
          demand_score,
          trend,
          pain_score,
          spend_score,
          signal_count
        )
      `)
      .gte('confidence_score', minConfidence)
      .order('confidence_score', { ascending: false })
      .limit(limit);

    if (niche) {
      query = query.eq('niche', niche);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      recommendations: data || [],
      total: data?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/demand/recommendations
 * 
 * Generate new build recommendations for a niche
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { niche } = body;

    if (!niche) {
      return NextResponse.json({ error: 'Niche is required' }, { status: 400 });
    }

    const recommendation = await generateBuildRecommendations(niche);

    if (!recommendation) {
      return NextResponse.json(
        { error: 'Not enough signals to generate recommendation' },
        { status: 400 }
      );
    }

    return NextResponse.json({ recommendation });
  } catch (error) {
    console.error('Error generating recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendation' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/demand/recommendations
 * 
 * Update recommendation status
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, notes, is_saved } = body;

    if (!id) {
      return NextResponse.json({ error: 'Recommendation ID is required' }, { status: 400 });
    }

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (is_saved !== undefined) updateData.is_saved = is_saved;

    const { data, error } = await supabase
      .from('build_recommendations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ recommendation: data });
  } catch (error) {
    console.error('Error updating recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to update recommendation' },
      { status: 500 }
    );
  }
}
