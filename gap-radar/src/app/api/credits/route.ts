/**
 * Credits Balance API
 * Feature: CREDIT-001 - Credits System Backend
 *
 * GET /api/credits - Get user's credit balance and summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCreditBalance, getCreditSummary, getCreditTransactions } from '@/lib/credits';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const includeTransactions = searchParams.get('includeTransactions') === 'true';
    const includeSummary = searchParams.get('includeSummary') === 'true';

    // Always get balance
    const balance = await getCreditBalance(user.id);

    const response: any = {
      balance,
    };

    // Optionally include full summary
    if (includeSummary) {
      const summary = await getCreditSummary(user.id);
      response.summary = summary;
    }

    // Optionally include transactions
    if (includeTransactions) {
      const transactions = await getCreditTransactions(user.id, 50);
      response.transactions = transactions;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Credits API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch credit balance',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
