/**
 * Credits System
 * Feature: CREDIT-001 - Credits System Backend
 *
 * Handles credit balance tracking, deduction, and insufficient credits checks
 */

import { createClient } from '@/lib/supabase/server';

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  transaction_type: 'purchase' | 'deduction' | 'refund' | 'bonus' | 'adjustment';
  reference_id: string | null;
  reference_type: 'run' | 'purchase' | 'refund' | 'bonus' | 'manual' | null;
  description: string | null;
  created_at: string;
}

export interface UserCreditSummary {
  user_id: string;
  current_balance: number;
  total_purchased: number;
  total_spent: number;
  total_runs: number;
}

/**
 * Get user's current credit balance
 */
export async function getCreditBalance(userId: string): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select('credits')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch credit balance: ${error.message}`);
  }

  return data?.credits ?? 0;
}

/**
 * Check if user has sufficient credits
 */
export async function hasSufficientCredits(
  userId: string,
  requiredAmount: number
): Promise<boolean> {
  const balance = await getCreditBalance(userId);
  return balance >= requiredAmount;
}

/**
 * Deduct credits from user's account
 * Returns true if successful, false if insufficient credits
 */
export async function deductCredits(
  userId: string,
  amount: number,
  referenceId: string,
  referenceType: 'run' | 'purchase' | 'refund' | 'bonus' | 'manual',
  description?: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_reference_id: referenceId,
    p_reference_type: referenceType,
    p_description: description || `Deducted ${amount} credits`,
  });

  if (error) {
    console.error('Failed to deduct credits:', error);
    throw new Error(`Failed to deduct credits: ${error.message}`);
  }

  return data === true;
}

/**
 * Add credits to user's account
 */
export async function addCredits(
  userId: string,
  amount: number,
  referenceId: string,
  referenceType: 'run' | 'purchase' | 'refund' | 'bonus' | 'manual',
  description?: string,
  transactionType: 'purchase' | 'refund' | 'bonus' | 'adjustment' = 'purchase'
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('add_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_reference_id: referenceId,
    p_reference_type: referenceType,
    p_description: description || `Added ${amount} credits`,
    p_transaction_type: transactionType,
  });

  if (error) {
    console.error('Failed to add credits:', error);
    throw new Error(`Failed to add credits: ${error.message}`);
  }

  return data === true;
}

/**
 * Get user's credit transaction history
 */
export async function getCreditTransactions(
  userId: string,
  limit: number = 50
): Promise<CreditTransaction[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch credit transactions: ${error.message}`);
  }

  return data as CreditTransaction[];
}

/**
 * Get user's credit summary (balance, total purchased, total spent, etc.)
 */
export async function getCreditSummary(
  userId: string
): Promise<UserCreditSummary> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_credit_summary')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch credit summary: ${error.message}`);
  }

  return data as UserCreditSummary;
}

/**
 * Credit costs per run type (can be configured)
 */
export const CREDIT_COSTS = {
  light_run: 1,
  deep_run: 3,
  agency_run: 5,
} as const;

/**
 * Credit packages available for purchase
 */
export const CREDIT_PACKAGES = [
  {
    id: 'starter',
    credits: 5,
    price: 49, // $0.49 in cents
    priceDisplay: '$49',
    savings: 0,
  },
  {
    id: 'popular',
    credits: 20,
    price: 149, // $1.49 in cents
    priceDisplay: '$149',
    savings: 16, // Percentage savings
    popular: true,
  },
  {
    id: 'pro',
    credits: 50,
    price: 299, // $2.99 in cents
    priceDisplay: '$299',
    savings: 39, // Percentage savings
  },
  {
    id: 'enterprise',
    credits: 150,
    price: 699, // $6.99 in cents
    priceDisplay: '$699',
    savings: 53, // Percentage savings
  },
] as const;
