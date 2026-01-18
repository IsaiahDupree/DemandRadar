/**
 * Alert Trigger System (BRIEF-007)
 *
 * Triggers alerts by:
 * - Sending email notifications
 * - Saving dashboard notifications
 * - Batching multiple alerts when appropriate
 */

import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/resend';
import type { Alert } from './detector';

export interface TriggerResult {
  emailSent: boolean;
  notificationSaved: boolean;
  error?: string;
}

export interface BatchTriggerResult {
  triggered: number;
  emailsSent: number;
  notificationsSaved: number;
  errors: string[];
}

/**
 * Get urgency emoji for subject line
 */
function getUrgencyEmoji(urgency: Alert['urgency']): string {
  switch (urgency) {
    case 'high':
      return '🔴';
    case 'medium':
      return '🟡';
    case 'low':
      return '🟢';
    default:
      return '🔵';
  }
}

/**
 * Get alert type label for display
 */
function getAlertTypeLabel(alertType: Alert['alert_type']): string {
  switch (alertType) {
    case 'competitor_price':
      return 'Pricing Change';
    case 'trend_spike':
      return 'Demand Spike';
    case 'new_angle':
      return 'New Messaging';
    case 'pain_surge':
      return 'Pain Point Trend';
    case 'feature_change':
      return 'Feature Update';
    default:
      return 'Alert';
  }
}

/**
 * Format alert email HTML
 */
function formatAlertEmail(
  alert: Alert,
  nicheName: string
): { subject: string; html: string } {
  const urgencyEmoji = getUrgencyEmoji(alert.urgency);
  const typeLabel = getAlertTypeLabel(alert.alert_type);

  const subject = `${urgencyEmoji} ${nicheName} Alert: ${alert.title}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .alert-type {
      display: inline-block;
      background: #f3f4f6;
      color: #6b7280;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
    }
    .urgency-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 8px;
    }
    .urgency-high {
      background: #fee2e2;
      color: #991b1b;
    }
    .urgency-medium {
      background: #fef3c7;
      color: #92400e;
    }
    .urgency-low {
      background: #d1fae5;
      color: #065f46;
    }
    .alert-title {
      font-size: 24px;
      font-weight: 700;
      margin: 16px 0;
      color: #111827;
    }
    .alert-body {
      font-size: 16px;
      color: #4b5563;
      line-height: 1.7;
      margin: 20px 0;
    }
    .cta-button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 20px;
    }
    .footer {
      background: #f9fafb;
      padding: 20px;
      border-radius: 0 0 8px 8px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
  </style>
</head>
<body>
  <div class="header">
    <div style="font-size: 48px; margin-bottom: 10px;">${urgencyEmoji}</div>
    <h1 style="margin: 0; font-size: 20px; font-weight: 600;">DemandRadar Alert</h1>
  </div>
  <div class="content">
    <div class="alert-type">${typeLabel}</div>
    <span class="urgency-badge urgency-${alert.urgency}">${alert.urgency.toUpperCase()} URGENCY</span>
    <div class="alert-title">${alert.title}</div>
    <div class="alert-body">${alert.body}</div>
    <a href="https://demandradar.app/dashboard/niches/${alert.niche_id}" class="cta-button">
      View Details →
    </a>
  </div>
  <div class="footer">
    <p style="margin: 0 0 8px 0;">You're receiving this because you're tracking <strong>${nicheName}</strong></p>
    <p style="margin: 0; font-size: 12px;">
      <a href="https://demandradar.app/dashboard/settings" style="color: #667eea;">Manage alert preferences</a>
    </p>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

/**
 * Format batched alerts email HTML
 */
function formatBatchedAlertsEmail(
  alerts: Alert[],
  nicheName: string
): { subject: string; html: string } {
  const highestUrgency = alerts.some((a) => a.urgency === 'high')
    ? 'high'
    : alerts.some((a) => a.urgency === 'medium')
      ? 'medium'
      : 'low';

  const urgencyEmoji = getUrgencyEmoji(highestUrgency);
  const subject = `${urgencyEmoji} ${nicheName}: ${alerts.length} New Alerts`;

  const alertsHtml = alerts
    .map(
      (alert) => `
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 16px;">
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">
          ${getAlertTypeLabel(alert.alert_type)}
        </span>
        <span style="margin-left: 8px; padding: 2px 8px; border-radius: 8px; font-size: 11px; font-weight: 600; background: ${alert.urgency === 'high' ? '#fee2e2' : alert.urgency === 'medium' ? '#fef3c7' : '#d1fae5'}; color: ${alert.urgency === 'high' ? '#991b1b' : alert.urgency === 'medium' ? '#92400e' : '#065f46'};">
          ${alert.urgency.toUpperCase()}
        </span>
      </div>
      <div style="font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 8px;">
        ${alert.title}
      </div>
      <div style="font-size: 14px; color: #4b5563; line-height: 1.6;">
        ${alert.body}
      </div>
    </div>
  `
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .cta-button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 20px;
    }
    .footer {
      background: #f9fafb;
      padding: 20px;
      border-radius: 0 0 8px 8px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
  </style>
</head>
<body>
  <div class="header">
    <div style="font-size: 48px; margin-bottom: 10px;">${urgencyEmoji}</div>
    <h1 style="margin: 0; font-size: 20px; font-weight: 600;">${alerts.length} New Alerts for ${nicheName}</h1>
  </div>
  <div class="content">
    <p style="font-size: 16px; color: #4b5563; margin-bottom: 24px;">
      We've detected ${alerts.length} significant changes in your niche. Here's what happened:
    </p>
    ${alertsHtml}
    <a href="https://demandradar.app/dashboard/niches/${alerts[0].niche_id}" class="cta-button">
      View All Alerts →
    </a>
  </div>
  <div class="footer">
    <p style="margin: 0 0 8px 0;">You're receiving this because you're tracking <strong>${nicheName}</strong></p>
    <p style="margin: 0; font-size: 12px;">
      <a href="https://demandradar.app/dashboard/settings" style="color: #667eea;">Manage alert preferences</a>
    </p>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

/**
 * Trigger a single alert
 */
export async function triggerAlert(
  alert: Alert,
  userEmail: string,
  nicheName: string
): Promise<TriggerResult> {
  try {
    const supabase = await createClient();

    // Format and send email
    const { subject, html } = formatAlertEmail(alert, nicheName);
    const emailResult = await sendEmail({
      to: userEmail,
      subject,
      html,
    });

    if (!emailResult.success) {
      return {
        emailSent: false,
        notificationSaved: false,
        error: emailResult.error,
      };
    }

    // Save notification to database for dashboard display
    const { error: dbError } = await supabase.from('niche_alerts').insert({
      niche_id: alert.niche_id,
      alert_type: alert.alert_type,
      title: alert.title,
      body: alert.body,
      urgency: alert.urgency,
      is_read: false,
      created_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error('Error saving alert notification:', dbError);
      // Email was sent, but notification save failed
      return {
        emailSent: true,
        notificationSaved: false,
        error: dbError.message,
      };
    }

    return {
      emailSent: true,
      notificationSaved: true,
    };
  } catch (error) {
    console.error('Error triggering alert:', error);
    return {
      emailSent: false,
      notificationSaved: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Trigger multiple alerts for a niche
 * Batches into a single email if more than 3 alerts
 */
export async function triggerAlertsForNiche(
  nicheId: string,
  alerts: Alert[]
): Promise<BatchTriggerResult> {
  if (alerts.length === 0) {
    return {
      triggered: 0,
      emailsSent: 0,
      notificationsSaved: 0,
      errors: [],
    };
  }

  try {
    const supabase = await createClient();

    // Get niche details and user email
    const { data: niche, error: nicheError } = await supabase
      .from('user_niches')
      .select(`
        id,
        offering_name,
        user_id,
        users (
          email,
          full_name
        )
      `)
      .eq('id', nicheId)
      .single();

    if (nicheError || !niche) {
      return {
        triggered: 0,
        emailsSent: 0,
        notificationsSaved: 0,
        errors: [`Failed to fetch niche: ${nicheError?.message || 'Not found'}`],
      };
    }

    const userEmail = (niche as any).users.email;
    const nicheName = niche.offering_name;

    const result: BatchTriggerResult = {
      triggered: alerts.length,
      emailsSent: 0,
      notificationsSaved: 0,
      errors: [],
    };

    // If more than 3 alerts, batch into single email
    if (alerts.length > 3) {
      const { subject, html } = formatBatchedAlertsEmail(alerts, nicheName);
      const emailResult = await sendEmail({
        to: userEmail,
        subject,
        html,
      });

      if (emailResult.success) {
        result.emailsSent = 1;
      } else {
        result.errors.push(emailResult.error || 'Failed to send batched email');
      }

      // Save all notifications to database
      const { error: dbError } = await supabase.from('niche_alerts').insert(
        alerts.map((alert) => ({
          niche_id: alert.niche_id,
          alert_type: alert.alert_type,
          title: alert.title,
          body: alert.body,
          urgency: alert.urgency,
          is_read: false,
          created_at: new Date().toISOString(),
        }))
      );

      if (!dbError) {
        result.notificationsSaved = alerts.length;
      } else {
        result.errors.push(`Failed to save notifications: ${dbError.message}`);
      }
    } else {
      // Send individual emails for each alert
      for (const alert of alerts) {
        const triggerResult = await triggerAlert(alert, userEmail, nicheName);

        if (triggerResult.emailSent) {
          result.emailsSent += 1;
        }

        if (triggerResult.notificationSaved) {
          result.notificationsSaved += 1;
        }

        if (triggerResult.error) {
          result.errors.push(triggerResult.error);
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Error triggering alerts for niche:', error);
    return {
      triggered: alerts.length,
      emailsSent: 0,
      notificationsSaved: 0,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}
