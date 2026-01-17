/**
 * API Authentication Middleware
 *
 * Utilities for authenticating API requests using API keys
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { validateAPIKey, checkRateLimit, logAPIUsage } from "./api-keys";

export interface APIContext {
  userId: string;
  apiKeyId: string;
  rateLimit: number;
}

/**
 * Authenticate an API request using Bearer token
 * Returns user context if valid, or an error response
 */
export async function authenticateAPIRequest(
  request: NextRequest
): Promise<{ success: true; context: APIContext } | { success: false; response: NextResponse }> {
  const startTime = Date.now();

  // Get authorization header
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Missing Authorization header" },
        { status: 401 }
      ),
    };
  }

  // Check Bearer token format
  if (!authHeader.startsWith("Bearer ")) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid Authorization header format. Use: Bearer <api_key>" },
        { status: 401 }
      ),
    };
  }

  const apiKey = authHeader.substring(7); // Remove "Bearer " prefix

  if (!apiKey || apiKey.trim().length === 0) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "API key is required" },
        { status: 401 }
      ),
    };
  }

  // Create supabase client (service role for API key validation)
  const supabase = await createClient();

  // Validate API key
  const validation = await validateAPIKey(supabase, apiKey);

  if (!validation.valid) {
    return {
      success: false,
      response: NextResponse.json(
        { error: validation.error || "Invalid API key" },
        { status: 401 }
      ),
    };
  }

  const { userId, rateLimit } = validation;

  if (!userId || !rateLimit) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Failed to retrieve user information" },
        { status: 500 }
      ),
    };
  }

  // Get API key ID for rate limiting
  const { data: keyData } = await supabase
    .from("api_keys")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (!keyData) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "API key not found" },
        { status: 401 }
      ),
    };
  }

  const apiKeyId = keyData.id;

  // Check rate limit
  const rateLimitCheck = await checkRateLimit(supabase, apiKeyId, rateLimit);

  if (!rateLimitCheck.allowed) {
    const response = NextResponse.json(
      {
        error: "Rate limit exceeded",
        limit: rateLimit,
        resetAt: rateLimitCheck.resetAt?.toISOString(),
      },
      { status: 429 }
    );

    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", rateLimit.toString());
    response.headers.set("X-RateLimit-Remaining", "0");
    if (rateLimitCheck.resetAt) {
      response.headers.set(
        "X-RateLimit-Reset",
        Math.floor(rateLimitCheck.resetAt.getTime() / 1000).toString()
      );
    }

    return {
      success: false,
      response,
    };
  }

  return {
    success: true,
    context: {
      userId,
      apiKeyId,
      rateLimit,
    },
  };
}

/**
 * Wrapper to add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining?: number,
  resetAt?: Date
): NextResponse {
  response.headers.set("X-RateLimit-Limit", limit.toString());
  if (remaining !== undefined) {
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
  }
  if (resetAt) {
    response.headers.set(
      "X-RateLimit-Reset",
      Math.floor(resetAt.getTime() / 1000).toString()
    );
  }
  return response;
}

/**
 * Log API request for analytics and rate limiting
 */
export async function logAPIRequest(
  context: APIContext,
  request: NextRequest,
  response: NextResponse,
  startTime: number
): Promise<void> {
  const supabase = await createClient();

  const endpoint = new URL(request.url).pathname;
  const method = request.method;
  const statusCode = response.status;
  const responseTime = Date.now() - startTime;

  await logAPIUsage(
    supabase,
    context.apiKeyId,
    context.userId,
    endpoint,
    method,
    statusCode,
    responseTime,
    {
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      requestId: crypto.randomUUID(),
    }
  );
}
