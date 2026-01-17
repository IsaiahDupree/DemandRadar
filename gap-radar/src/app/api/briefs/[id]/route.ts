/**
 * API Route: Get Demand Brief Snapshot
 *
 * GET /api/briefs/[id] - Get a specific demand brief snapshot
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the snapshot
    const { data: snapshot, error: snapshotError } = await supabase
      .from("demand_snapshots")
      .select(
        `
        *,
        user_niches!niche_id (
          id,
          offering_name,
          user_id
        )
      `
      )
      .eq("id", id)
      .single();

    if (snapshotError) {
      console.error("Error fetching snapshot:", snapshotError);
      return NextResponse.json(
        { error: "Snapshot not found" },
        { status: 404 }
      );
    }

    // Verify the user owns this niche
    if (snapshot.user_niches.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Format the response to match the DemandSnapshot interface
    const formattedSnapshot = {
      id: snapshot.id,
      niche_id: snapshot.niche_id,
      offering_name: snapshot.user_niches.offering_name,
      week_start: snapshot.week_start,
      demand_score: snapshot.demand_score,
      demand_score_change: snapshot.demand_score_change,
      opportunity_score: snapshot.opportunity_score,
      message_market_fit_score: snapshot.message_market_fit_score,
      trend: snapshot.demand_score_change > 5
        ? "up"
        : snapshot.demand_score_change < -5
        ? "down"
        : "stable",
      ad_signals: snapshot.ad_signals,
      search_signals: snapshot.search_signals,
      ugc_signals: snapshot.ugc_signals,
      forum_signals: snapshot.forum_signals,
      competitor_signals: snapshot.competitor_signals,
      plays: snapshot.plays,
      ad_hooks: snapshot.ad_hooks,
      subject_lines: snapshot.subject_lines,
      landing_copy: snapshot.landing_copy,
      why_score_changed: snapshot.why_score_changed || [],
      created_at: snapshot.created_at,
    };

    return NextResponse.json(formattedSnapshot);
  } catch (error) {
    console.error("Error in briefs API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
