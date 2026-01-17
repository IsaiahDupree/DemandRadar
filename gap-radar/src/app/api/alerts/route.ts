/**
 * Alerts API
 *
 * GET /api/alerts - Get all alerts for current user
 * PATCH /api/alerts - Mark alerts as read
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/alerts
 * Fetch all alerts for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's niches
    const { data: niches, error: nichesError } = await supabase
      .from('user_niches')
      .select('id')
      .eq('user_id', user.id);

    if (nichesError) {
      return NextResponse.json({ error: nichesError.message }, { status: 500 });
    }

    if (!niches || niches.length === 0) {
      return NextResponse.json({ alerts: [] });
    }

    const nicheIds = niches.map((n) => n.id);

    // Get alerts for user's niches
    const { data: alerts, error: alertsError } = await supabase
      .from('niche_alerts')
      .select(`
        *,
        user_niches (
          offering_name,
          category
        )
      `)
      .in('niche_id', nicheIds)
      .order('created_at', { ascending: false })
      .limit(50);

    if (alertsError) {
      return NextResponse.json({ error: alertsError.message }, { status: 500 });
    }

    return NextResponse.json({ alerts: alerts || [] });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/alerts
 * Mark alerts as read
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { alert_ids } = body;

    if (!alert_ids || !Array.isArray(alert_ids)) {
      return NextResponse.json(
        { error: 'alert_ids array is required' },
        { status: 400 }
      );
    }

    // Mark alerts as read
    const { error: updateError } = await supabase
      .from('niche_alerts')
      .update({ is_read: true })
      .in('id', alert_ids);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
