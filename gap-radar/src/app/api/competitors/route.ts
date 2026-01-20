/**
 * Competitor Tracking API
 *
 * Endpoints:
 * - POST /api/competitors - Add a new competitor to track
 * - GET /api/competitors - List all tracked competitors
 *
 * Feature: INTEL-003
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      watchlist_id,
      competitor_name,
      competitor_domain,
      meta_page_id,
      track_ads = true,
      track_pricing = false,
      track_features = false,
    } = body;

    // Validate required fields
    if (!competitor_name) {
      return NextResponse.json(
        { error: 'competitor_name is required' },
        { status: 400 }
      );
    }

    // Insert competitor
    const { data, error } = await supabase
      .from('tracked_competitors')
      .insert({
        user_id: user.id,
        watchlist_id: watchlist_id || null,
        competitor_name,
        competitor_domain: competitor_domain || null,
        meta_page_id: meta_page_id || null,
        track_ads,
        track_pricing,
        track_features,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding competitor:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to add competitor' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/competitors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const watchlist_id = searchParams.get('watchlist_id');

    // Build query
    let query = supabase
      .from('tracked_competitors')
      .select('*')
      .eq('user_id', user.id);

    // Filter by watchlist if provided
    if (watchlist_id) {
      query = query.eq('watchlist_id', watchlist_id);
    }

    // Execute query with ordering
    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      console.error('Error fetching competitors:', error);
      return NextResponse.json(
        { error: 'Failed to fetch competitors' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      competitors: data || [],
      total: data?.length || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/competitors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
