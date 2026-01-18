import { createClient } from '@/lib/supabase/server';
import { WebhookEventType, WebhookPayload } from '@/types';
import crypto from 'crypto';

/**
 * Sign webhook payload using HMAC SHA256
 */
export function signWebhookPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = signWebhookPayload(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Deliver webhook to a specific endpoint
 */
export async function deliverWebhook(
  webhookConfigId: string,
  url: string,
  secret: string,
  eventType: WebhookEventType,
  data: Record<string, any>
): Promise<{
  success: boolean;
  statusCode?: number;
  responseBody?: string;
  errorMessage?: string;
}> {
  try {
    // Create webhook payload
    const payload: WebhookPayload = {
      id: crypto.randomUUID(),
      event: eventType,
      timestamp: new Date().toISOString(),
      data,
    };

    const payloadString = JSON.stringify(payload);
    const signature = signWebhookPayload(payloadString, secret);

    // Deliver webhook
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': eventType,
        'User-Agent': 'GapRadar-Webhooks/1.0',
      },
      body: payloadString,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    const responseBody = await response.text();

    // Log delivery
    const supabase = await createClient();
    await supabase.from('webhook_deliveries').insert({
      webhook_config_id: webhookConfigId,
      event_type: eventType,
      payload,
      status: response.ok ? 'success' : 'failed',
      status_code: response.status,
      response_body: responseBody.substring(0, 1000), // Limit to 1000 chars
      attempt_count: 1,
    });

    // Update webhook config stats
    if (response.ok) {
      await supabase.rpc('increment_webhook_success', {
        webhook_id: webhookConfigId,
      });
    } else {
      await supabase.rpc('increment_webhook_failure', {
        webhook_id: webhookConfigId,
      });
    }

    return {
      success: response.ok,
      statusCode: response.status,
      responseBody: responseBody.substring(0, 1000),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    // Log failed delivery
    const supabase = await createClient();
    await supabase.from('webhook_deliveries').insert({
      webhook_config_id: webhookConfigId,
      event_type: eventType,
      payload: { data },
      status: 'failed',
      error_message: errorMessage,
      attempt_count: 1,
    });

    await supabase.rpc('increment_webhook_failure', {
      webhook_id: webhookConfigId,
    });

    return {
      success: false,
      errorMessage,
    };
  }
}

/**
 * Trigger webhooks for a specific event
 */
export async function triggerWebhooks(
  userId: string,
  eventType: WebhookEventType,
  data: Record<string, any>
): Promise<void> {
  const supabase = await createClient();

  // Get all active webhook configs for this user that listen to this event
  const { data: webhooks, error } = await supabase
    .from('webhook_configs')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .contains('events', [eventType]);

  if (error || !webhooks || webhooks.length === 0) {
    return;
  }

  // Deliver webhooks in parallel
  const deliveryPromises = webhooks.map((webhook) =>
    deliverWebhook(webhook.id, webhook.url, webhook.secret, eventType, data)
  );

  await Promise.allSettled(deliveryPromises);
}
