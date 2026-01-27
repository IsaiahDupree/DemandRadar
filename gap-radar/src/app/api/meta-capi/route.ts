/**
 * Meta Conversions API (CAPI) Server-Side Events (META-004)
 * ===========================================================
 *
 * Implements Facebook Meta Conversions API for server-side event tracking.
 * This complements the client-side Meta Pixel for improved tracking accuracy.
 *
 * Official docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 */

import { NextRequest, NextResponse } from 'next/server';
import { hashUserData, type UserData } from '@/lib/meta-pixel-hashing';

/**
 * Hashed user data for CAPI events
 */
interface CAPIUserData {
  em?: string; // Hashed email
  ph?: string; // Hashed phone
  fbc?: string; // Facebook Click ID
  fbp?: string; // Facebook Browser ID
  client_ip_address?: string;
  client_user_agent?: string;
}

/**
 * CAPI event request body
 */
interface CAPIEventRequest {
  event_name: string;
  event_id?: string; // For deduplication
  user_data: UserData; // Will be hashed before sending to Meta
  custom_data?: Record<string, any>;
  event_source_url: string;
}

/**
 * CAPI event payload sent to Facebook
 */
interface CAPIEventPayload {
  event_name: string;
  event_id?: string;
  event_time: number;
  event_source_url: string;
  action_source: 'website' | 'email' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
  user_data: CAPIUserData;
  custom_data?: Record<string, any>;
}


/**
 * POST /api/meta-capi
 *
 * Sends server-side events to Meta Conversions API.
 *
 * Request body:
 * ```json
 * {
 *   "event_name": "Purchase",
 *   "event_id": "Purchase_1234567890_abc123", // Optional, for deduplication
 *   "user_data": {
 *     "email": "user@example.com", // Will be hashed
 *     "phone": "+1234567890", // Will be hashed
 *     "fbc": "fb.1.1234567890.abcdefg",
 *     "fbp": "fb.1.1234567890.hijklmn"
 *   },
 *   "custom_data": {
 *     "value": 99,
 *     "currency": "USD",
 *     "content_ids": ["order-123"]
 *   },
 *   "event_source_url": "https://gapradar.com/checkout"
 * }
 * ```
 *
 * Response:
 * ```json
 * {
 *   "events_received": 1,
 *   "messages": [],
 *   "fbtrace_id": "..."
 * }
 * ```
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: CAPIEventRequest = await req.json();

    const { event_name, event_id, user_data, custom_data, event_source_url } = body;

    // Validate required environment variables
    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

    if (!pixelId || !accessToken) {
      return NextResponse.json(
        {
          error: {
            message: 'Meta Pixel ID or Access Token not configured',
            type: 'ConfigurationError',
          },
        },
        { status: 500 }
      );
    }

    // Hash PII data using the hashing module (META-006)
    const hashedUserData = hashUserData({
      ...user_data,
      // Add IP and user agent from request headers
      client_ip_address: req.headers.get('x-forwarded-for') || undefined,
      client_user_agent: req.headers.get('user-agent') || undefined,
    });

    // Build event payload
    const eventPayload: CAPIEventPayload = {
      event_name,
      event_time: Math.floor(Date.now() / 1000), // Unix timestamp in seconds
      event_source_url,
      action_source: 'website',
      user_data: hashedUserData,
    };

    // Add event_id if provided (for deduplication)
    if (event_id) {
      eventPayload.event_id = event_id;
    }

    // Add custom_data if provided
    if (custom_data && Object.keys(custom_data).length > 0) {
      eventPayload.custom_data = custom_data;
    }

    // Send to Meta Conversions API
    const metaApiUrl = `https://graph.facebook.com/v18.0/${pixelId}/events`;

    const payload = {
      data: [eventPayload],
      access_token: accessToken,
    };

    const response = await fetch(metaApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    // Return Meta's response
    return NextResponse.json(result, { status: response.ok ? 200 : 400 });
  } catch (error) {
    console.error('[Meta CAPI] Error sending event:', error);

    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Internal server error',
          type: 'ServerError',
        },
      },
      { status: 500 }
    );
  }
}
