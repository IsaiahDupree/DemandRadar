import { NextRequest, NextResponse } from 'next/server';

/**
 * Analytics endpoint to receive client-side events
 *
 * This is a simple in-memory logger for now.
 * In production, this should forward events to:
 * - PostHog
 * - Mixpanel
 * - Custom analytics database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, properties } = body;

    if (!event) {
      return NextResponse.json(
        { error: 'Event name is required' },
        { status: 400 }
      );
    }

    // Get additional context
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Log event (in production, send to analytics service)
    const eventData = {
      event,
      properties: {
        ...properties,
        ip: ip.split(',')[0].trim(), // Get first IP if multiple
        userAgent,
        receivedAt: new Date().toISOString(),
      },
    };

    // Log to console (in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics Event]', JSON.stringify(eventData, null, 2));
    }

    // TODO: In production, forward to analytics service
    // Examples:
    // - await posthog.capture(event, properties)
    // - await mixpanel.track(event, properties)
    // - await supabase.from('analytics_events').insert(eventData)

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics event' },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'analytics',
    timestamp: new Date().toISOString(),
  });
}
