import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/competitors/alerts
 *
 * Fetch competitor alerts for the authenticated user
 *
 * Query params:
 * - unread: boolean - filter for unread alerts only
 * - competitor_id: string - filter by specific competitor
 * - limit: number - limit results (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const competitorId = searchParams.get('competitor_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let query = supabase
      .from('competitor_alerts')
      .select('*')
      .eq('user_id', user.id);

    // Apply filters
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (competitorId) {
      query = query.eq('competitor_id', competitorId);
    }

    // Order and limit
    query = query.order('created_at', { ascending: false });

    // Execute query
    const { data: alerts, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      alerts: alerts || [],
    });
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}
