import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

/**
 * One-off report types based on PRD pricing
 */
export interface ReportType {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  runType: 'light' | 'deep';
}

const REPORT_TYPES: ReportType[] = [
  {
    id: 'vetted_idea_pack',
    name: 'Vetted Idea Pack',
    description: 'Light run with 1-3 gaps, quick MVP, and platform recommendation',
    price: 4900, // $49.00
    runType: 'light',
  },
  {
    id: 'full_dossier',
    name: 'Full Dossier',
    description: 'Deep run with 3 ad concepts, MVP spec, and TAM/CAC model',
    price: 14900, // $149.00
    runType: 'deep',
  },
  {
    id: 'agency_ready',
    name: 'Agency-ready',
    description: 'Deep run with landing page, 10 ad angles, objection handling, and backlog',
    price: 39900, // $399.00
    runType: 'deep',
  },
];

/**
 * Get all available one-off report types
 */
export function getOneOffReportTypes(): ReportType[] {
  return REPORT_TYPES;
}

/**
 * Get a specific report type by ID
 */
export function getReportTypeById(reportTypeId: string): ReportType | undefined {
  return REPORT_TYPES.find((type) => type.id === reportTypeId);
}

export interface CreateOneOffCheckoutParams {
  reportType: string;
  userId: string;
  userEmail: string;
  nicheQuery: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Create a Stripe checkout session for one-off report purchase
 */
export async function createOneOffCheckoutSession({
  reportType,
  userId,
  userEmail,
  nicheQuery,
  successUrl,
  cancelUrl,
}: CreateOneOffCheckoutParams): Promise<Stripe.Checkout.Session> {
  const reportTypeData = getReportTypeById(reportType);

  if (!reportTypeData) {
    throw new Error('Invalid report type');
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: reportTypeData.name,
            description: reportTypeData.description,
          },
          unit_amount: reportTypeData.price,
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: userEmail,
    client_reference_id: userId,
    metadata: {
      userId,
      reportType: reportTypeData.id,
      nicheQuery,
      runType: reportTypeData.runType,
      purchaseType: 'one_off_report',
    },
  });

  return session;
}

export interface UnlockReportParams {
  userId: string;
  runId: string;
  reportType: string;
  paymentIntentId: string;
}

/**
 * Unlock a report for a user after successful payment
 */
export async function unlockReportForUser({
  userId,
  runId,
  reportType,
  paymentIntentId,
}: UnlockReportParams): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('one_off_purchases').insert({
    user_id: userId,
    run_id: runId,
    report_type: reportType,
    payment_intent_id: paymentIntentId,
    purchased_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Check if a report is unlocked for a user
 */
export async function isReportUnlocked(
  userId: string,
  runId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('one_off_purchases')
    .select('id, user_id, run_id')
    .eq('user_id', userId)
    .eq('run_id', runId)
    .single();

  // If error is "not found" (PGRST116), return false
  if (error && error.code === 'PGRST116') {
    return false;
  }

  // If other error, throw
  if (error) {
    throw new Error(error.message);
  }

  return !!data;
}
