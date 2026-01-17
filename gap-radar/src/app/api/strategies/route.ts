import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/strategies
 * 
 * Get ad strategies from the library
 * 
 * Query params:
 * - category: 'hook' | 'formula' | 'format' | 'targeting' | 'creative'
 * - difficulty: 'beginner' | 'intermediate' | 'advanced'
 * - limit: number
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('ad_strategies')
      .select('*')
      .order('effectiveness_score', { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by category for easier display
    const grouped = (data || []).reduce((acc, strategy) => {
      const cat = strategy.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(strategy);
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      strategies: data || [],
      grouped,
      total: data?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching strategies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch strategies' },
      { status: 500 }
    );
  }
}
