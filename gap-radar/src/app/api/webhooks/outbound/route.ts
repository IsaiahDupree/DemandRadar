import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { WebhookEventType, WebhookConfig } from '@/types';
import crypto from 'crypto';

const VALID_EVENT_TYPES: WebhookEventType[] = [
  'run.started',
  'run.completed',
  'run.failed',
  'gap.discovered',
  'report.generated',
];

// GET /api/webhooks/outbound - List all webhook configs for the authenticated user
export async function GET() {
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch webhook configs
  const { data: webhooks, error } = await supabase
    .from('webhook_configs')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching webhook configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook configs' },
      { status: 500 }
    );
  }

  return NextResponse.json({ webhooks: webhooks || [] });
}

// POST /api/webhooks/outbound - Create a new webhook config
export async function POST(request: Request) {
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { url, events, name, description } = body;

    // Validate required fields
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Events array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Validate event types
    const invalidEvents = events.filter(
      (event: string) => !VALID_EVENT_TYPES.includes(event as WebhookEventType)
    );

    if (invalidEvents.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid event types: ${invalidEvents.join(', ')}`,
          validEvents: VALID_EVENT_TYPES,
        },
        { status: 400 }
      );
    }

    // Generate webhook secret for HMAC signing
    const secret = crypto.randomBytes(32).toString('hex');

    // Create webhook config
    const { data: webhook, error } = await supabase
      .from('webhook_configs')
      .insert({
        user_id: user.id,
        url,
        secret,
        events,
        name: name || null,
        description: description || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating webhook config:', error);
      return NextResponse.json(
        { error: 'Failed to create webhook config' },
        { status: 500 }
      );
    }

    return NextResponse.json({ webhook }, { status: 201 });
  } catch (error) {
    console.error('Webhook creation error:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

// PATCH /api/webhooks/outbound - Update a webhook config
export async function PATCH(request: Request) {
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, url, events, name, description, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      );
    }

    const updates: any = {};

    if (url !== undefined) {
      try {
        new URL(url);
        updates.url = url;
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }
    }

    if (events !== undefined) {
      if (!Array.isArray(events)) {
        return NextResponse.json(
          { error: 'Events must be an array' },
          { status: 400 }
        );
      }

      const invalidEvents = events.filter(
        (event: string) => !VALID_EVENT_TYPES.includes(event as WebhookEventType)
      );

      if (invalidEvents.length > 0) {
        return NextResponse.json(
          {
            error: `Invalid event types: ${invalidEvents.join(', ')}`,
            validEvents: VALID_EVENT_TYPES,
          },
          { status: 400 }
        );
      }

      updates.events = events;
    }

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (isActive !== undefined) updates.is_active = isActive;

    // Update webhook config
    const { data: webhook, error } = await supabase
      .from('webhook_configs')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating webhook config:', error);
      return NextResponse.json(
        { error: 'Failed to update webhook config' },
        { status: 500 }
      );
    }

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook config not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ webhook });
  } catch (error) {
    console.error('Webhook update error:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

// DELETE /api/webhooks/outbound - Delete a webhook config
export async function DELETE(request: Request) {
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Webhook ID is required' },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from('webhook_configs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting webhook config:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook config' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
