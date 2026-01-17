/**
 * API Key Management
 *
 * Utilities for generating, validating, and managing API keys
 */

import { SupabaseClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { canUseAPI } from "./subscription/permissions";

const API_KEY_PREFIX = "dr_"; // DemandRadar prefix
const KEY_LENGTH = 32; // Length of the random portion

/**
 * Generate a random API key
 * Format: dr_live_[32 random characters]
 */
export function generateAPIKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let randomPart = "";

  for (let i = 0; i < KEY_LENGTH; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `${API_KEY_PREFIX}live_${randomPart}`;
}

/**
 * Hash an API key for storage
 */
export async function hashAPIKey(key: string): Promise<string> {
  return bcrypt.hash(key, 10);
}

/**
 * Verify an API key against a hash
 */
export async function verifyAPIKey(
  key: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(key, hash);
}

/**
 * Get key prefix for display (first 12 characters)
 */
export function getKeyPrefix(key: string): string {
  return key.substring(0, 12) + "...";
}

/**
 * Create a new API key for a user
 */
export async function createAPIKey(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  expiresInDays?: number
): Promise<{ success: boolean; key?: string; error?: string }> {
  try {
    // Check if user can use API
    const apiCheck = await canUseAPI(supabase, userId);
    if (!apiCheck.allowed) {
      return {
        success: false,
        error: apiCheck.message || "API access not available on your plan",
      };
    }

    // Generate new key
    const apiKey = generateAPIKey();
    const keyHash = await hashAPIKey(apiKey);
    const keyPrefix = getKeyPrefix(apiKey);

    // Calculate expiration date if provided
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Insert into database
    const { error } = await supabase.from("api_keys").insert({
      user_id: userId,
      name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      expires_at: expiresAt,
      rate_limit: apiCheck.rateLimit || 100,
    });

    if (error) {
      console.error("Error creating API key:", error);
      return {
        success: false,
        error: "Failed to create API key",
      };
    }

    return {
      success: true,
      key: apiKey, // Return unhashed key only once
    };
  } catch (error) {
    console.error("Error in createAPIKey:", error);
    return {
      success: false,
      error: "An error occurred while creating the API key",
    };
  }
}

/**
 * Validate an API key and return user info
 */
export async function validateAPIKey(
  supabase: SupabaseClient,
  apiKey: string
): Promise<{
  valid: boolean;
  userId?: string;
  rateLimit?: number;
  error?: string;
}> {
  try {
    // Get all active API keys (we need to check hashes)
    const { data: keys, error } = await supabase
      .from("api_keys")
      .select("id, user_id, key_hash, rate_limit, expires_at, is_active")
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching API keys:", error);
      return { valid: false, error: "Failed to validate API key" };
    }

    if (!keys || keys.length === 0) {
      return { valid: false, error: "Invalid API key" };
    }

    // Check each key hash
    for (const key of keys) {
      const isValid = await verifyAPIKey(apiKey, key.key_hash);

      if (isValid) {
        // Check if expired
        if (key.expires_at && new Date(key.expires_at) < new Date()) {
          return { valid: false, error: "API key has expired" };
        }

        // Update last_used_at
        await supabase
          .from("api_keys")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", key.id);

        return {
          valid: true,
          userId: key.user_id,
          rateLimit: key.rate_limit,
        };
      }
    }

    return { valid: false, error: "Invalid API key" };
  } catch (error) {
    console.error("Error in validateAPIKey:", error);
    return { valid: false, error: "An error occurred during validation" };
  }
}

/**
 * List all API keys for a user (without sensitive data)
 */
export async function listAPIKeys(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  success: boolean;
  keys?: Array<{
    id: string;
    name: string;
    keyPrefix: string;
    lastUsedAt: string | null;
    createdAt: string;
    expiresAt: string | null;
    isActive: boolean;
  }>;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("api_keys")
      .select("id, name, key_prefix, last_used_at, created_at, expires_at, is_active")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error listing API keys:", error);
      return { success: false, error: "Failed to list API keys" };
    }

    const keys = (data || []).map((key) => ({
      id: key.id,
      name: key.name,
      keyPrefix: key.key_prefix,
      lastUsedAt: key.last_used_at,
      createdAt: key.created_at,
      expiresAt: key.expires_at,
      isActive: key.is_active,
    }));

    return { success: true, keys };
  } catch (error) {
    console.error("Error in listAPIKeys:", error);
    return { success: false, error: "An error occurred" };
  }
}

/**
 * Revoke (deactivate) an API key
 */
export async function revokeAPIKey(
  supabase: SupabaseClient,
  userId: string,
  keyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("api_keys")
      .update({ is_active: false })
      .eq("id", keyId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error revoking API key:", error);
      return { success: false, error: "Failed to revoke API key" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in revokeAPIKey:", error);
    return { success: false, error: "An error occurred" };
  }
}

/**
 * Delete an API key permanently
 */
export async function deleteAPIKey(
  supabase: SupabaseClient,
  userId: string,
  keyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("api_keys")
      .delete()
      .eq("id", keyId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting API key:", error);
      return { success: false, error: "Failed to delete API key" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteAPIKey:", error);
    return { success: false, error: "An error occurred" };
  }
}

/**
 * Check rate limit for an API key
 * Returns whether the request should be allowed
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  apiKeyId: string,
  rateLimit: number
): Promise<{ allowed: boolean; remaining?: number; resetAt?: Date }> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Count requests in the last hour
    const { count, error } = await supabase
      .from("api_usage")
      .select("*", { count: "exact", head: true })
      .eq("api_key_id", apiKeyId)
      .gte("created_at", oneHourAgo.toISOString());

    if (error) {
      console.error("Error checking rate limit:", error);
      // Allow request on error (fail open)
      return { allowed: true };
    }

    const requestCount = count || 0;
    const remaining = Math.max(0, rateLimit - requestCount);
    const resetAt = new Date(Date.now() + 60 * 60 * 1000);

    return {
      allowed: requestCount < rateLimit,
      remaining,
      resetAt,
    };
  } catch (error) {
    console.error("Error in checkRateLimit:", error);
    // Allow request on error (fail open)
    return { allowed: true };
  }
}

/**
 * Log API usage
 */
export async function logAPIUsage(
  supabase: SupabaseClient,
  apiKeyId: string,
  userId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
  }
): Promise<void> {
  try {
    await supabase.from("api_usage").insert({
      api_key_id: apiKeyId,
      user_id: userId,
      endpoint,
      method,
      status_code: statusCode,
      response_time_ms: responseTimeMs,
      ip_address: metadata?.ipAddress,
      user_agent: metadata?.userAgent,
      request_id: metadata?.requestId,
    });
  } catch (error) {
    console.error("Error logging API usage:", error);
    // Don't throw - logging failures shouldn't break the API
  }
}
