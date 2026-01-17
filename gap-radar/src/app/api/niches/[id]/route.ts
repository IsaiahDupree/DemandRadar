import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/niches/[id]
 * Get a single niche by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch niche
    const { data: niche, error } = await supabase
      .from("user_niches")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (error || !niche) {
      return NextResponse.json({ error: "Niche not found" }, { status: 404 });
    }

    // Fetch latest snapshot
    const { data: latestSnapshot } = await supabase
      .from("demand_snapshots")
      .select("*")
      .eq("niche_id", params.id)
      .order("week_start", { ascending: false })
      .limit(1)
      .single();

    // Fetch all snapshots for progress tracking
    const { data: allSnapshots } = await supabase
      .from("demand_snapshots")
      .select("*")
      .eq("niche_id", params.id)
      .order("week_start", { ascending: false })
      .limit(12); // Last 12 weeks

    return NextResponse.json({
      niche,
      latestSnapshot: latestSnapshot || null,
      allSnapshots: allSnapshots || [],
    });
  } catch (error) {
    console.error("Error fetching niche:", error);
    return NextResponse.json(
      { error: "Failed to fetch niche" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/niches/[id]
 * Update a niche
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      offeringName,
      category,
      nicheTags,
      customerProfile,
      competitors,
      keywords,
      geo,
      isActive,
    } = body;

    // Build update object (only include fields that are provided)
    const updates: any = {};
    if (offeringName !== undefined) updates.offering_name = offeringName;
    if (category !== undefined) updates.category = category;
    if (nicheTags !== undefined) updates.niche_tags = nicheTags;
    if (customerProfile !== undefined)
      updates.customer_profile = customerProfile;
    if (competitors !== undefined) updates.competitors = competitors;
    if (keywords !== undefined) updates.keywords = keywords;
    if (geo !== undefined) updates.geo = geo;
    if (isActive !== undefined) updates.is_active = isActive;

    // Update niche
    const { data: niche, error } = await supabase
      .from("user_niches")
      .update(updates)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !niche) {
      return NextResponse.json({ error: "Niche not found" }, { status: 404 });
    }

    return NextResponse.json(niche);
  } catch (error) {
    console.error("Error updating niche:", error);
    return NextResponse.json(
      { error: "Failed to update niche" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/niches/[id]
 * Delete a niche (soft delete by setting is_active = false)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Soft delete: set is_active to false
    const { data: niche, error } = await supabase
      .from("user_niches")
      .update({ is_active: false })
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !niche) {
      return NextResponse.json({ error: "Niche not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting niche:", error);
    return NextResponse.json(
      { error: "Failed to delete niche" },
      { status: 500 }
    );
  }
}
