/**
 * Resend Webhook Handler (GDP-004)
 *
 * Handles webhook events from Resend:
 * - Verifies Svix signature for security
 * - Stores email events in unified_event table
 * - Stores detailed email tracking in email_event table
 * - Maps person_id from tags or falls back to email lookup
 */

import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { createServiceClient } from '@/lib/supabase/service';

interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    to: string;
    from?: string;
    subject?: string;
    tags?: {
      person_id?: string;
      template_key?: string;
      [key: string]: any;
    };
    click?: {
      link: string;
    };
    bounce?: {
      message?: string;
    };
    [key: string]: any;
  };
}

/**
 * Handle email_message and email_event records for GDP-005
 */
async function handleEmailMessage(
  supabase: any,
  personId: string,
  payload: ResendWebhookPayload,
  eventType: string,
  eventTimestamp: string
) {
  const emailId = payload.data.email_id;

  // Check if email_message already exists
  const { data: existingMessage } = await supabase
    .from('email_message')
    .select('id')
    .eq('provider_message_id', emailId)
    .single();

  let emailMessageId = existingMessage?.id;

  if (!existingMessage) {
    // Create new email_message record (for first event: usually 'sent' or 'delivered')
    const { data: newMessage } = await supabase
      .from('email_message')
      .insert({
        person_id: personId,
        to_email: payload.data.to,
        from_email: payload.data.from || 'noreply@gapradar.com',
        subject: payload.data.subject || '(No subject)',
        email_type: 'lifecycle', // Default to lifecycle
        provider: 'resend',
        provider_message_id: emailId,
        template_key: payload.data.tags?.template_key,
        status: eventType, // 'sent', 'delivered', etc.
        sent_at: eventType === 'sent' ? eventTimestamp : null,
        delivered_at: eventType === 'delivered' ? eventTimestamp : null,
        opened_at: eventType === 'opened' ? eventTimestamp : null,
        first_clicked_at: eventType === 'clicked' ? eventTimestamp : null,
        bounced_at: eventType === 'bounced' ? eventTimestamp : null,
        open_count: eventType === 'opened' ? 1 : 0,
        click_count: eventType === 'clicked' ? 1 : 0,
        tags: payload.data.tags ? JSON.stringify(payload.data.tags) : '[]',
      })
      .select('id')
      .single();

    emailMessageId = newMessage?.id;
  } else {
    // Update existing email_message record
    const updateData: any = {
      status: eventType,
    };

    if (eventType === 'delivered') {
      updateData.delivered_at = eventTimestamp;
    } else if (eventType === 'opened') {
      updateData.opened_at = eventTimestamp;
      // Increment open_count
      const { data: current } = await supabase
        .from('email_message')
        .select('open_count')
        .eq('id', emailMessageId)
        .single();
      updateData.open_count = (current?.open_count || 0) + 1;
    } else if (eventType === 'clicked') {
      updateData.first_clicked_at = eventTimestamp;
      // Increment click_count
      const { data: current } = await supabase
        .from('email_message')
        .select('click_count, first_clicked_at')
        .eq('id', emailMessageId)
        .single();
      updateData.click_count = (current?.click_count || 0) + 1;
      // Only update first_clicked_at if not already set
      if (current?.first_clicked_at) {
        delete updateData.first_clicked_at;
      }
    } else if (eventType === 'bounced') {
      updateData.bounced_at = eventTimestamp;
      updateData.error_message = payload.data.bounce?.message || 'Email bounced';
    }

    await supabase
      .from('email_message')
      .update(updateData)
      .eq('id', emailMessageId);
  }

  // Create email_event record
  if (emailMessageId) {
    await supabase.from('email_event').insert({
      email_message_id: emailMessageId,
      person_id: personId,
      event_type: eventType,
      event_timestamp: eventTimestamp,
      clicked_url: payload.data.click?.link,
      provider_event_id: emailId,
      raw_event: payload,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get Svix signature headers
    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');
    const svixSignature = request.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json(
        { error: 'Missing signature headers' },
        { status: 400 }
      );
    }

    // Get webhook secret from environment
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('RESEND_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Get raw body
    const body = await request.text();

    // Verify signature using Svix
    const webhook = new Webhook(webhookSecret);
    let payload: ResendWebhookPayload;

    try {
      payload = webhook.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ResendWebhookPayload;
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Create Supabase client with service role for write access
    const supabase = createServiceClient();

    // Extract person_id from tags or lookup by email
    let personId: string | null = null;

    if (payload.data.tags?.person_id) {
      // Use person_id from tags
      personId = payload.data.tags.person_id;

      // Verify person exists
      const { data: person } = await supabase
        .from('person')
        .select('id')
        .eq('id', personId)
        .single();

      if (!person) {
        console.warn(`Person not found for person_id: ${personId}`);
        personId = null;
      }
    } else if (payload.data.to) {
      // Fallback: lookup person by email
      const { data: person } = await supabase
        .from('person')
        .select('id')
        .eq('email', payload.data.to)
        .single();

      if (person) {
        personId = person.id;
      }
    }

    // Map event type to standardized format
    const eventType = payload.type.replace('email.', '');
    const eventTimestamp = new Date(payload.created_at).toISOString();

    // Store in unified_event table
    if (personId) {
      await supabase.from('unified_event').insert({
        person_id: personId,
        event_name: payload.type,
        event_source: 'email',
        event_timestamp: eventTimestamp,
        properties: {
          email_id: payload.data.email_id,
          to: payload.data.to,
          from: payload.data.from,
          subject: payload.data.subject,
          clicked_url: payload.data.click?.link,
          event_type: eventType,
        },
        raw_event: payload,
      });

      // GDP-005: Email Event Tracking
      // Create or update email_message record
      await handleEmailMessage(supabase, personId, payload, eventType, eventTimestamp);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
