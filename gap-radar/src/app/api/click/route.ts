/**
 * Click Redirect Tracker (GDP-006)
 *
 * Attribution spine: email → click → session → conversion with first-party cookie
 *
 * This endpoint:
 * 1. Tracks email link clicks
 * 2. Sets a first-party attribution cookie
 * 3. Redirects to the target URL
 *
 * Query Parameters:
 * - url (required): Target URL to redirect to
 * - person_id (optional): Person ID for tracking
 * - email (optional): Email for person lookup (if person_id not provided)
 * - email_message_id (optional): Email message ID for attribution
 *
 * Example:
 * /api/click?url=https://gapradar.com/dashboard&person_id=123&email_message_id=msg_456
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(request: NextRequest) {
  try {
    // Parse search params from URL (compatible with tests)
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const targetUrl = searchParams.get('url');
    const personIdParam = searchParams.get('person_id');
    const emailParam = searchParams.get('email');
    const emailMessageId = searchParams.get('email_message_id');

    // Validate required parameters
    if (!targetUrl) {
      return NextResponse.json(
        { error: 'Missing required parameter: url' },
        { status: 400 }
      );
    }

    if (!personIdParam && !emailParam) {
      return NextResponse.json(
        { error: 'Missing person_id or email parameter' },
        { status: 400 }
      );
    }

    // Validate URL
    let validatedUrl: URL;
    try {
      validatedUrl = new URL(targetUrl);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(validatedUrl.protocol)) {
      return NextResponse.json(
        { error: 'Invalid URL protocol' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createServiceClient();

    // Get or lookup person_id
    let personId: string | null = personIdParam;

    if (!personId && emailParam) {
      // Lookup person by email
      const { data: person } = await supabase
        .from('person')
        .select('id')
        .eq('email', emailParam)
        .single();

      if (person) {
        personId = person.id;
      }
    }

    // Verify person exists if personId provided
    if (personId) {
      const { data: person } = await supabase
        .from('person')
        .select('id')
        .eq('id', personId)
        .single();

      if (!person) {
        personId = null;
      }
    }

    // Track click event in unified_event
    if (personId) {
      await supabase.from('unified_event').insert({
        person_id: personId,
        event_name: 'email.link_clicked',
        event_source: 'email',
        event_timestamp: new Date().toISOString(),
        properties: {
          target_url: targetUrl,
          email_message_id: emailMessageId,
          source: 'click_redirect',
        },
        raw_event: {
          url: targetUrl,
          person_id: personId,
          email_message_id: emailMessageId,
        },
      });
    }

    // Create attribution cookie data
    const attributionData = {
      person_id: personId,
      email_message_id: emailMessageId,
      clicked_at: new Date().toISOString(),
      target_url: targetUrl,
    };

    // Set first-party attribution cookie
    const cookieValue = Buffer.from(JSON.stringify(attributionData)).toString('base64');
    const cookieMaxAge = 60 * 60 * 24 * 30; // 30 days

    // Create redirect response with cookie
    const response = NextResponse.redirect(targetUrl, { status: 302 });
    response.headers.set(
      'Set-Cookie',
      `gr_attribution=${cookieValue}; Path=/; Max-Age=${cookieMaxAge}; HttpOnly; Secure; SameSite=Lax`
    );

    return response;
  } catch (error) {
    console.error('Click redirect error:', error);
    return NextResponse.json(
      { error: 'Click redirect failed' },
      { status: 500 }
    );
  }
}
