import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/niches
 * List all niches for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's niches
    const { data: niches, error } = await supabase
      .from("user_niches")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ niches });
  } catch (error) {
    console.error("Error fetching niches:", error);
    return NextResponse.json(
      { error: "Failed to fetch niches" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/niches
 * Create a new niche for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile to check subscription tier
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, max_niches")
      .eq("id", user.id)
      .single();

    // Check niche limit
    const { count } = await supabase
      .from("user_niches")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_active", true);

    const maxNiches = profile?.max_niches || 0;

    if (count !== null && count >= maxNiches) {
      return NextResponse.json(
        {
          error: `You've reached your limit of ${maxNiches} niche${
            maxNiches !== 1 ? "s" : ""
          }. Upgrade your plan to track more.`,
        },
        { status: 403 }
      );
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
    } = body;

    // Validate required fields
    if (!offeringName || !keywords || keywords.length === 0) {
      return NextResponse.json(
        { error: "Offering name and keywords are required" },
        { status: 400 }
      );
    }

    // Insert niche
    const { data: niche, error } = await supabase
      .from("user_niches")
      .insert({
        user_id: user.id,
        offering_name: offeringName,
        category: category || null,
        niche_tags: nicheTags || [],
        customer_profile: customerProfile || {
          type: "B2C",
          segment: "creator",
          price_point: "mid",
        },
        competitors: competitors || [],
        keywords: keywords,
        geo: geo || "US",
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(niche, { status: 201 });
  } catch (error) {
    console.error("Error creating niche:", error);
    return NextResponse.json(
      { error: "Failed to create niche" },
      { status: 500 }
    );
  }
}
