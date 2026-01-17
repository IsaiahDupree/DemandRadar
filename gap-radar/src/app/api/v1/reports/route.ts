import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  authenticateAPIRequest,
  addRateLimitHeaders,
  logAPIRequest,
} from "@/lib/api-auth";

/**
 * GET /api/v1/reports
 * List all reports (completed runs with data) for the authenticated API user
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
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status"); // completed, failed, etc.

    // Get user's projects first
    const { data: projects } = await supabase
      .from("projects")
      .select("id")
      .eq("owner_id", context.userId);

    if (!projects || projects.length === 0) {
      const response = NextResponse.json({ reports: [], total: 0 });
      addRateLimitHeaders(response, context.rateLimit);
      await logAPIRequest(context, request, response, startTime);
      return response;
    }

    const projectIds = projects.map((p) => p.id);

    // Build query
    let query = supabase
      .from("runs")
      .select("*", { count: "exact" })
      .in("project_id", projectIds)
      .order("created_at", { ascending: false });

    // Filter by status if provided
    if (status) {
      query = query.eq("status", status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: runs, error, count } = await query;

    if (error) {
      const response = NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
      await logAPIRequest(context, request, response, startTime);
      return response;
    }

    const response = NextResponse.json({
      reports: runs || [],
      total: count || 0,
      limit,
      offset,
    });
    addRateLimitHeaders(response, context.rateLimit);
    await logAPIRequest(context, request, response, startTime);
    return response;
  } catch (error) {
    console.error("Error in GET /api/v1/reports:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    await logAPIRequest(context, request, response, startTime);
    return response;
  }
}
