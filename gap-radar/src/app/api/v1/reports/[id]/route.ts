import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  authenticateAPIRequest,
  addRateLimitHeaders,
  logAPIRequest,
} from "@/lib/api-auth";

/**
 * GET /api/v1/reports/[id]
 * Get a specific report by run ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  // Authenticate request
  const auth = await authenticateAPIRequest(request);
  if (!auth.success) {
    return auth.response;
  }

  const { context } = auth;
  const supabase = await createClient();

  try {
    const { id: runId } = await params;

    // Get the run
    const { data: run, error } = await supabase
      .from("runs")
      .select("*")
      .eq("id", runId)
      .single();

    if (error || !run) {
      const response = NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
      await logAPIRequest(context, request, response, startTime);
      return response;
    }

    // Verify the run belongs to the user's project
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", run.project_id)
      .eq("owner_id", context.userId)
      .single();

    if (!project) {
      const response = NextResponse.json(
        { error: "Unauthorized access to this report" },
        { status: 403 }
      );
      await logAPIRequest(context, request, response, startTime);
      return response;
    }

    const response = NextResponse.json({ report: run });
    addRateLimitHeaders(response, context.rateLimit);
    await logAPIRequest(context, request, response, startTime);
    return response;
  } catch (error) {
    console.error("Error in GET /api/v1/reports/[id]:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    await logAPIRequest(context, request, response, startTime);
    return response;
  }
}
