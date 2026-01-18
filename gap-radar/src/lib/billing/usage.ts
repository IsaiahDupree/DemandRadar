/**
 * Subscription Usage Tracking
 * Feature: BILL-009 - Subscription Usage Tracking
 *
 * Tracks runs, exports, and alerts per subscription period for enforcing plan limits
 */

import { createClient } from '@/lib/supabase/server';

export type UsageType = 'run' | 'export' | 'alert';
export type PlanType = 'free' | 'starter' | 'builder' | 'agency' | 'studio';

export interface UsageRecord {
  id: string;
  user_id: string;
  run_id: string | null;
  usage_type: UsageType;
  metadata: Record<string, any>;
  created_at: string;
}

export interface UsageSummary {
  runs: number;
  exports: number;
  alerts: number;
  periodStart: string;
  periodEnd: string;
}

export interface UsageStats {
  runs: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  exports: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  alerts: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
}

/**
 * Plan limits configuration
 */
const PLAN_LIMITS: Record<PlanType, { runs: number; exports: number; alerts: number }> = {
  free: { runs: 2, exports: -1, alerts: -1 }, // -1 means unlimited
  starter: { runs: 2, exports: -1, alerts: -1 },
  builder: { runs: 10, exports: -1, alerts: -1 },
  agency: { runs: 35, exports: -1, alerts: -1 },
  studio: { runs: 90, exports: -1, alerts: -1 },
};

/**
 * Get the current billing period dates
 */
function getBillingPeriod(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Track a run usage
 */
export async function trackRunUsage(
  userId: string,
  runId: string,
  runType: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('subscription_usage').insert({
    user_id: userId,
    run_id: runId,
    usage_type: 'run',
    metadata: { run_type: runType },
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Track an export usage
 */
export async function trackExportUsage(
  userId: string,
  runId: string,
  exportType: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('subscription_usage').insert({
    user_id: userId,
    run_id: runId,
    usage_type: 'export',
    metadata: { export_type: exportType },
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Track an alert usage
 */
export async function trackAlertUsage(
  userId: string,
  alertType: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('subscription_usage').insert({
    user_id: userId,
    usage_type: 'alert',
    metadata: { alert_type: alertType },
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Get user's usage for the current billing period
 */
export async function getUserUsage(userId: string): Promise<UsageSummary> {
  const supabase = await createClient();
  const { start, end } = getBillingPeriod();

  const { data, error } = await supabase
    .from('subscription_usage')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const usage = data || [];

  return {
    runs: usage.filter((u) => u.usage_type === 'run').length,
    exports: usage.filter((u) => u.usage_type === 'export').length,
    alerts: usage.filter((u) => u.usage_type === 'alert').length,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
  };
}

/**
 * Check if user has reached their usage limit
 */
export async function checkUsageLimit(
  userId: string,
  usageType: UsageType,
  plan: PlanType
): Promise<boolean> {
  const usage = await getUserUsage(userId);
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  const limit = limits[`${usageType}s` as keyof typeof limits];

  // -1 means unlimited
  if (limit === -1) {
    return true;
  }

  const used = usage[`${usageType}s` as keyof UsageSummary] as number;
  return used < limit;
}

/**
 * Get detailed usage statistics with percentages
 */
export async function getUsageStats(
  userId: string,
  plan: PlanType
): Promise<UsageStats> {
  const usage = await getUserUsage(userId);
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  const calculateStats = (used: number, limit: number) => {
    if (limit === -1) {
      return {
        used,
        limit: -1,
        remaining: -1,
        percentage: 0,
      };
    }

    const remaining = Math.max(0, limit - used);
    const percentage = Math.min(100, Math.round((used / limit) * 100));

    return {
      used,
      limit,
      remaining,
      percentage,
    };
  };

  return {
    runs: calculateStats(usage.runs, limits.runs),
    exports: calculateStats(usage.exports, limits.exports),
    alerts: calculateStats(usage.alerts, limits.alerts),
  };
}

/**
 * Reset usage for the next billing period
 * (This is a no-op since we track by date range)
 */
export async function resetUsageForPeriod(): Promise<boolean> {
  // Usage is automatically "reset" because we query by date range
  // No need to delete or update records
  return true;
}

/**
 * Get plan limit for a specific usage type
 */
export function getPlanLimit(plan: PlanType, usageType: UsageType): number {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  return limits[`${usageType}s` as keyof typeof limits];
}

/**
 * Check if a plan has unlimited usage for a specific type
 */
export function hasUnlimitedUsage(plan: PlanType, usageType: UsageType): boolean {
  return getPlanLimit(plan, usageType) === -1;
}
