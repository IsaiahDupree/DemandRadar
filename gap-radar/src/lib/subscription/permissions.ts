/**
 * Subscription Permissions Checker
 *
 * Helper functions to check user permissions based on subscription tier
 */

import { SupabaseClient } from "@supabase/supabase-js";
import {
  getTierLimits,
  checkAnalysisRunLimit,
  checkNicheLimit,
  type SubscriptionTier,
  canUseFeature,
} from "./tier-limits";

export interface UserSubscription {
  userId: string;
  tier: SubscriptionTier;
  maxNiches: number;
  runsRemaining: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
}

/**
 * Get user's subscription details
 */
export async function getUserSubscription(
  supabase: SupabaseClient,
  userId: string
): Promise<UserSubscription | null> {
  try {
    // Get profile with subscription data
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("subscription_tier, max_niches, runs_remaining, stripe_customer_id, stripe_subscription_id")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      console.error("Error fetching user subscription:", error);
      return null;
    }

    const tier = (profile.subscription_tier as SubscriptionTier) || "free";
    const limits = getTierLimits(tier);

    return {
      userId,
      tier,
      maxNiches: profile.max_niches || limits.niches,
      runsRemaining: profile.runs_remaining ?? limits.analysisRuns,
      stripeCustomerId: profile.stripe_customer_id,
      stripeSubscriptionId: profile.stripe_subscription_id,
    };
  } catch (error) {
    console.error("Error in getUserSubscription:", error);
    return null;
  }
}

/**
 * Check if user can create a new analysis run
 */
export async function canCreateAnalysisRun(
  supabase: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean; message?: string; runsRemaining?: number }> {
  const subscription = await getUserSubscription(supabase, userId);

  if (!subscription) {
    return {
      allowed: false,
      message: "Unable to verify subscription",
    };
  }

  const limits = getTierLimits(subscription.tier);

  if (subscription.runsRemaining <= 0) {
    return {
      allowed: false,
      message: `You've used all ${limits.analysisRuns} runs this month. Upgrade or wait for your monthly reset.`,
      runsRemaining: 0,
    };
  }

  return {
    allowed: true,
    runsRemaining: subscription.runsRemaining,
  };
}

/**
 * Check if user can create a new niche
 */
export async function canCreateNiche(
  supabase: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean; message?: string; currentCount?: number; limit?: number }> {
  const subscription = await getUserSubscription(supabase, userId);

  if (!subscription) {
    return {
      allowed: false,
      message: "Unable to verify subscription",
    };
  }

  // Get current niche count
  const { count, error } = await supabase
    .from("user_niches")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) {
    console.error("Error counting niches:", error);
    return {
      allowed: false,
      message: "Unable to verify niche count",
    };
  }

  const currentCount = count || 0;
  const check = checkNicheLimit(subscription.tier, currentCount);

  return {
    allowed: check.allowed,
    message: check.message,
    currentCount,
    limit: check.limit,
  };
}

/**
 * Check if user can export to a specific format
 */
export async function canExportFormat(
  supabase: SupabaseClient,
  userId: string,
  format: "pdf" | "csv" | "json"
): Promise<{ allowed: boolean; message?: string }> {
  const subscription = await getUserSubscription(supabase, userId);

  if (!subscription) {
    return {
      allowed: false,
      message: "Unable to verify subscription",
    };
  }

  const limits = getTierLimits(subscription.tier);
  let featureKey: keyof typeof limits;

  switch (format) {
    case "pdf":
      featureKey = "pdfExport";
      break;
    case "csv":
      featureKey = "csvExport";
      break;
    case "json":
      featureKey = "jsonExport";
      break;
  }

  const allowed = limits[featureKey] as boolean;

  return {
    allowed,
    message: allowed
      ? undefined
      : `${format.toUpperCase()} export is not available on your plan. Upgrade to access this feature.`,
  };
}

/**
 * Check if user can access API
 */
export async function canUseAPI(
  supabase: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean; rateLimit?: number; message?: string }> {
  const subscription = await getUserSubscription(supabase, userId);

  if (!subscription) {
    return {
      allowed: false,
      message: "Unable to verify subscription",
    };
  }

  const limits = getTierLimits(subscription.tier);

  return {
    allowed: limits.apiAccess,
    rateLimit: limits.apiRateLimit,
    message: limits.apiAccess
      ? undefined
      : "API access is not available on your plan. Upgrade to Agency or Studio.",
  };
}

/**
 * Check if user can use a data source
 */
export async function canUseDataSource(
  supabase: SupabaseClient,
  userId: string,
  source: "metaAds" | "googleAds" | "reddit" | "appStore" | "ugc"
): Promise<{ allowed: boolean; message?: string }> {
  const subscription = await getUserSubscription(supabase, userId);

  if (!subscription) {
    return {
      allowed: false,
      message: "Unable to verify subscription",
    };
  }

  let featureKey: string;

  switch (source) {
    case "metaAds":
      featureKey = "metaAdsEnabled";
      break;
    case "googleAds":
      featureKey = "googleAdsEnabled";
      break;
    case "reddit":
      featureKey = "redditEnabled";
      break;
    case "appStore":
      featureKey = "appStoreEnabled";
      break;
    case "ugc":
      featureKey = "ugcEnabled";
      break;
    default:
      return {
        allowed: false,
        message: "Unknown data source",
      };
  }

  const allowed = canUseFeature(subscription.tier, featureKey as any);

  return {
    allowed,
    message: allowed
      ? undefined
      : `${source} is not available on your plan. Upgrade to access this data source.`,
  };
}

/**
 * Check if user can receive alerts
 */
export async function canReceiveAlerts(
  supabase: SupabaseClient,
  userId: string,
  alertType: "demand" | "competitor" | "trend"
): Promise<{ allowed: boolean; message?: string }> {
  const subscription = await getUserSubscription(supabase, userId);

  if (!subscription) {
    return {
      allowed: false,
      message: "Unable to verify subscription",
    };
  }

  const limits = getTierLimits(subscription.tier);
  let featureKey: keyof typeof limits;

  switch (alertType) {
    case "demand":
      featureKey = "demandAlerts";
      break;
    case "competitor":
      featureKey = "competitorAlerts";
      break;
    case "trend":
      featureKey = "trendAlerts";
      break;
  }

  const allowed = limits[featureKey] as boolean;

  return {
    allowed,
    message: allowed
      ? undefined
      : `${alertType.charAt(0).toUpperCase() + alertType.slice(1)} alerts are not available on your plan. Upgrade to Builder or higher.`,
  };
}

/**
 * Decrement user's remaining runs (call after successful analysis)
 */
export async function decrementRuns(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; runsRemaining?: number }> {
  try {
    // Get current runs_remaining
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("runs_remaining")
      .eq("id", userId)
      .single();

    if (fetchError || !profile) {
      console.error("Error fetching runs_remaining:", fetchError);
      return { success: false };
    }

    const newRemaining = Math.max(0, (profile.runs_remaining || 0) - 1);

    // Update runs_remaining
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ runs_remaining: newRemaining })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating runs_remaining:", updateError);
      return { success: false };
    }

    return {
      success: true,
      runsRemaining: newRemaining,
    };
  } catch (error) {
    console.error("Error in decrementRuns:", error);
    return { success: false };
  }
}

/**
 * Reset monthly runs (called by Stripe webhook or cron job)
 */
export async function resetMonthlyRuns(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean }> {
  try {
    const subscription = await getUserSubscription(supabase, userId);

    if (!subscription) {
      return { success: false };
    }

    const limits = getTierLimits(subscription.tier);

    const { error } = await supabase
      .from("profiles")
      .update({ runs_remaining: limits.analysisRuns })
      .eq("id", userId);

    if (error) {
      console.error("Error resetting monthly runs:", error);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in resetMonthlyRuns:", error);
    return { success: false };
  }
}
