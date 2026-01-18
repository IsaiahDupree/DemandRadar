/**
 * NLP Suggestions API
 *
 * GET /api/nlp/suggestions?q=<query>
 *
 * Server-powered NLP suggestions using OpenAI embeddings and LLM
 * Provides keyword expansion, competitor recognition, and query rewrite
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateServerSuggestions } from '@/lib/nlp/embeddings';

// Rate limiting (simple in-memory implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameter
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    // Validate query
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    if (query.length < 3) {
      return NextResponse.json(
        { error: 'Query must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Check rate limit
    const ip = getClientIP(request);
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Generate suggestions
    const result = await generateServerSuggestions(query);

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' // Cache for 5 minutes
      }
    });
  } catch (error) {
    console.error('❌ Error in NLP suggestions API:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate suggestions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
