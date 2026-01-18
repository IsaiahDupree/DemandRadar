import { createClient } from '@/lib/supabase/server';

/**
 * Plan credit limits based on PRD pricing model
 */
export type Plan = 'free' | 'starter' | 'builder' | 'agency' | 'studio';

const PLAN_CREDITS: Record<Plan, number> = {
  free: 2,
  starter: 2,
  builder: 10,
  agency: 35,
  studio: 90,
};

/**
 * Get credit limit for a given plan
 */
export function getCreditLimitForPlan(plan: string): number {
  return PLAN_CREDITS[plan as Plan] ?? PLAN_CREDITS.free;
}

/**
 * Credits information for a user
 */
export interface CreditsInfo {
  used: number;
  limit: number;
  remaining: number;
  plan?: string;
}

/**
 * Get current credit usage for a user
 */
export async function getCredits(userId: string): Promise<CreditsInfo> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select('id, runs_used, runs_limit, plan')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('User not found');
  }

  const used = data.runs_used ?? 0;
  const limit = data.runs_limit ?? 2;

  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    plan: data.plan,
  };
}

/**
 * Check if user has credits remaining
 */
export async function hasCredits(userId: string): Promise<boolean> {
  const credits = await getCredits(userId);
  return credits.remaining > 0;
}

/**
 * Deduct credits from user account
 * @throws Error if user has insufficient credits
 */
export async function deductCredits(
  userId: string,
  amount: number = 1
): Promise<{ used: number; remaining: number }> {
  const supabase = await createClient();

  // Get current credits
  const credits = await getCredits(userId);

  // Check if user has enough credits
  if (credits.remaining < amount) {
    throw new Error('Insufficient credits');
  }

  // Deduct credits
  const newUsed = credits.used + amount;

  const { error } = await supabase
    .from('users')
    .update({ runs_used: newUsed })
    .eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }

  return {
    used: newUsed,
    remaining: credits.limit - newUsed,
  };
}

/**
 * Add credits to user account
 */
export async function addCredits(
  userId: string,
  amount: number
): Promise<{ limit: number; remaining: number }> {
  if (amount < 0) {
    throw new Error('Credits must be non-negative');
  }

  if (amount === 0) {
    const credits = await getCredits(userId);
    return {
      limit: credits.limit,
      remaining: credits.remaining,
    };
  }

  const supabase = await createClient();

  // Get current credits
  const credits = await getCredits(userId);

  // Add to limit
  const newLimit = credits.limit + amount;

  const { error } = await supabase
    .from('users')
    .update({ runs_limit: newLimit })
    .eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }

  return {
    limit: newLimit,
    remaining: newLimit - credits.used,
  };
}

/**
 * Reset monthly credits based on user's plan
 * Should be called at the start of each billing cycle
 */
export async function resetMonthlyCredits(
  userId: string
): Promise<{ used: number; limit: number; remaining: number }> {
  const supabase = await createClient();

  // Get user's current plan
  const credits = await getCredits(userId);
  const planLimit = getCreditLimitForPlan(credits.plan ?? 'free');

  // Reset runs_used to 0 and update runs_limit based on current plan
  const { error } = await supabase
    .from('users')
    .update({
      runs_used: 0,
      runs_limit: planLimit,
    })
    .eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }

  return {
    used: 0,
    limit: planLimit,
    remaining: planLimit,
  };
}
