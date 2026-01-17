import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  authenticateAPIRequest,
  addRateLimitHeaders,
  logAPIRequest,
} from "@/lib/api-auth";
import { canCreateAnalysisRun, decrementRuns } from "@/lib/subscription/permissions";

/**
 * GET /api/v1/runs
 * List all runs for the authenticated API user
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Authenticate request
  const auth = await authenticateAPIRequest(request);
  if (!auth.success) {
    return auth.response;
  }

  const { context } = auth;
  const supabase = await createClient();

  try {
    // Get user's projects first
    const { data: projects } = await supabase
      .from("projects")
      .select("id")
      .eq("owner_id", context.userId);

    if (!projects || projects.length === 0) {
      const response = NextResponse.json({ runs: [] });
      addRateLimitHeaders(response, context.rateLimit);
      await logAPIRequest(context, request, response, startTime);
      return response;
    }

    const projectIds = projects.map((p) => p.id);

    // Get runs for user's projects
    const { data: runs, error } = await supabase
      .from("runs")
      .select("*")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false });

    if (error) {
      const response = NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
      await logAPIRequest(context, request, response, startTime);
      return response;
    }

    const response = NextResponse.json({ runs });
    addRateLimitHeaders(response, context.rateLimit);
    await logAPIRequest(context, request, response, startTime);
    return response;
  } catch (error) {
    console.error("Error in GET /api/v1/runs:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    await logAPIRequest(context, request, response, startTime);
    return response;
  }
}

/**
 * POST /api/v1/runs
 * Create a new analysis run
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Authenticate request
  const auth = await authenticateAPIRequest(request);
  if (!auth.success) {
    return auth.response;
  }

  const { context } = auth;
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { nicheQuery, seedTerms, competitors, geo, runType } = body;

    if (!nicheQuery) {
      const response = NextResponse.json(
        { error: "nicheQuery is required" },
        { status: 400 }
      );
      await logAPIRequest(context, request, response, startTime);
      return response;
    }

    // Check user's run limit using subscription permissions
    const runCheck = await canCreateAnalysisRun(supabase, context.userId);

    if (!runCheck.allowed) {
      const response = NextResponse.json(
        {
          error: runCheck.message || "Run limit reached. Please upgrade your plan.",
          runsRemaining: runCheck.runsRemaining,
        },
        { status: 403 }
      );
      await logAPIRequest(context, request, response, startTime);
      return response;
    }

    // Get user's default project (or first project)
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("owner_id", context.userId)
      .limit(1)
      .single();

    if (!project) {
      const response = NextResponse.json(
        { error: "No project found. Please create a project first." },
        { status: 400 }
      );
      await logAPIRequest(context, request, response, startTime);
      return response;
    }

    // Create the run
    const { data: run, error } = await supabase
      .from("runs")
      .insert({
        project_id: project.id,
        niche_query: nicheQuery,
        seed_terms: seedTerms || [],
        competitors: competitors || [],
        geo: geo || "us",
        run_type: runType || "deep",
        status: "queued",
      })
      .select()
      .single();

    if (error) {
      const response = NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
      await logAPIRequest(context, request, response, startTime);
      return response;
    }

    // Decrement user's remaining runs
    await decrementRuns(supabase, context.userId);

    // Trigger the analysis pipeline (async)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    fetch(`${appUrl}/api/runs/${run.id}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }).catch((err) => {
      console.error("Failed to trigger analysis pipeline:", err);
    });

    const response = NextResponse.json(
      {
        run,
        message: "Analysis run created successfully",
      },
      { status: 201 }
    );
    addRateLimitHeaders(response, context.rateLimit);
    await logAPIRequest(context, request, response, startTime);
    return response;
  } catch (error) {
    console.error("Error in POST /api/v1/runs:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    await logAPIRequest(context, request, response, startTime);
    return response;
  }
}
