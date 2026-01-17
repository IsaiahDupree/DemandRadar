/**
 * Usage Tracker Library
 *
 * Tracks user usage and sends warning emails when approaching limits
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "./email";
import { UsageLimitWarningEmail } from "./email-templates";
import { PLANS, type PlanKey } from "./stripe";

/**
 * Warning thresholds (percentage of limit used)
 * We'll send warnings at 80% and 90% usage
 */
const WARNING_THRESHOLDS = [80, 90];

/**
 * Check if user can create a new analysis run
 * Works with the users table (runs_used, runs_limit)
 */
export async function canCreateRun(
  supabase: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean; message?: string; runsRemaining?: number }> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('runs_used, runs_limit, plan')
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.error('❌ Error fetching user:', error);
      return {
        allowed: false,
        message: "Unable to verify subscription",
      };
    }

    const runsRemaining = Math.max(0, user.runs_limit - user.runs_used);

    if (runsRemaining <= 0) {
      return {
        allowed: false,
        message: `You've used all ${user.runs_limit} runs this month. Upgrade or wait for your monthly reset.`,
        runsRemaining: 0,
      };
    }

    return {
      allowed: true,
      runsRemaining,
    };
  } catch (error) {
    console.error('❌ Error in canCreateRun:', error);
    return {
      allowed: false,
      message: "Error checking run limit",
    };
  }
}

/**
 * Check if user should receive a usage warning email
 * Returns true if warning should be sent (threshold just crossed)
 */
async function shouldSendWarning(
  supabase: SupabaseClient,
  userId: string,
  percentUsed: number
): Promise<boolean> {
  // Check if we've already sent a warning for this threshold
  const warningLevel = WARNING_THRESHOLDS.find(threshold => percentUsed >= threshold && percentUsed < threshold + 10);

  if (!warningLevel) {
    return false; // Not at a warning threshold
  }

  // Check if we've already sent this warning this month
  const { data: existingWarning } = await supabase
    .from('usage_warnings')
    .select('id')
    .eq('user_id', userId)
    .eq('warning_level', warningLevel)
    .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    .single();

  // Only send if we haven't sent this warning level this month
  return !existingWarning;
}

/**
 * Record that we sent a usage warning
 */
async function recordWarning(
  supabase: SupabaseClient,
  userId: string,
  warningLevel: number,
  currentUsage: number,
  limit: number
): Promise<void> {
  try {
    await supabase.from('usage_warnings').insert({
      user_id: userId,
      warning_level: warningLevel,
      runs_used: currentUsage,
      runs_limit: limit,
    });
  } catch (error) {
    console.error('⚠️ Failed to record usage warning:', error);
  }
}

/**
 * Check usage and send warning email if needed
 * Call this after incrementing runs_used
 */
export async function checkUsageAndWarn(
  supabase: SupabaseClient,
  userId: string
): Promise<{ warningSent: boolean; percentUsed?: number }> {
  try {
    // Get user's current usage
    const { data: user, error } = await supabase
      .from('users')
      .select('email, name, plan, runs_used, runs_limit')
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.error('❌ Failed to fetch user for usage check:', error);
      return { warningSent: false };
    }

    const { email, name, plan, runs_used, runs_limit } = user;

    // Calculate percentage used
    const percentUsed = Math.round((runs_used / runs_limit) * 100);

    // Check if we should send a warning
    const shouldWarn = await shouldSendWarning(supabase, userId, percentUsed);

    if (!shouldWarn) {
      return { warningSent: false, percentUsed };
    }

    // Determine which warning level we're at
    const warningLevel = WARNING_THRESHOLDS.find(
      threshold => percentUsed >= threshold && percentUsed < threshold + 10
    )!;

    // Get plan name
    const planInfo = PLANS[plan as keyof typeof PLANS];
    const planName = planInfo?.name || plan;

    // Send warning email
    try {
      await sendEmail({
        to: email!,
        subject: `⚠️ You're at ${percentUsed}% of your monthly runs`,
        react: UsageLimitWarningEmail({
          userName: name,
          currentUsage: runs_used,
          monthlyLimit: runs_limit,
          percentUsed,
          planName,
        }),
      });

      console.log(`✅ Usage warning email sent to ${email} (${percentUsed}% used)`);

      // Record that we sent this warning
      await recordWarning(supabase, userId, warningLevel, runs_used, runs_limit);

      return { warningSent: true, percentUsed };
    } catch (emailError) {
      console.error('⚠️ Failed to send usage warning email:', emailError);
      return { warningSent: false, percentUsed };
    }
  } catch (error) {
    console.error('❌ Error in checkUsageAndWarn:', error);
    return { warningSent: false };
  }
}

/**
 * Increment user's runs_used counter and check for warnings
 * This replaces the decrementRuns function from permissions.ts
 */
export async function incrementRunsUsed(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; runsRemaining?: number; warningSent?: boolean }> {
  try {
    // Get current usage
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('runs_used, runs_limit')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      console.error('❌ Error fetching user runs:', fetchError);
      return { success: false };
    }

    const newUsed = (user.runs_used || 0) + 1;
    const runsRemaining = Math.max(0, user.runs_limit - newUsed);

    // Update runs_used
    const { error: updateError } = await supabase
      .from('users')
      .update({ runs_used: newUsed })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Error updating runs_used:', updateError);
      return { success: false };
    }

    // Check if we should send a warning
    const { warningSent } = await checkUsageAndWarn(supabase, userId);

    return {
      success: true,
      runsRemaining,
      warningSent,
    };
  } catch (error) {
    console.error('❌ Error in incrementRunsUsed:', error);
    return { success: false };
  }
}
