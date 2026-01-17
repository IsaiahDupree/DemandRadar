import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createAPIKey, listAPIKeys } from "@/lib/api-keys";

/**
 * GET /api/api-keys
 * List all API keys for the authenticated user
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await listAPIKeys(supabase, user.id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({ apiKeys: result.keys });
}

/**
 * POST /api/api-keys
 * Create a new API key for the authenticated user
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, expiresInDays } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }

  if (
    expiresInDays !== undefined &&
    (typeof expiresInDays !== "number" || expiresInDays < 1)
  ) {
    return NextResponse.json(
      { error: "expiresInDays must be a positive number" },
      { status: 400 }
    );
  }

  const result = await createAPIKey(
    supabase,
    user.id,
    name.trim(),
    expiresInDays
  );

  if (!result.success) {
    const status = result.error?.includes("not available") ? 403 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    message: "API key created successfully",
    apiKey: result.key,
    warning:
      "This is the only time the API key will be shown. Please save it securely.",
  });
}
