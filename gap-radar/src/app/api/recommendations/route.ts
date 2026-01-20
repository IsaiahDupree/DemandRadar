import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/recommendations
 * List recommendations for authenticated user
 * Feature: BUILD-004
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Build query
    let query = supabase
      .from('build_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status) {
      const validStatuses = ['new', 'saved', 'in_progress', 'completed', 'dismissed'];
      if (validStatuses.includes(status)) {
        query = query.eq('status', status);
      }
    }

    // Apply limit
    query = query.limit(limit);

    const { data: recommendations, error, count } = await query;

    if (error) {
      console.error('Error fetching recommendations:', error);
      throw error;
    }

    // Get total count
    const { count: totalCount } = await supabase
      .from('build_recommendations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return NextResponse.json({
      recommendations: recommendations || [],
      total: totalCount || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
