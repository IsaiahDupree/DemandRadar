/**
 * Resend Email Integration (BRIEF-009)
 *
 * Provides a wrapper around the Resend SDK for sending emails with:
 * - Resend SDK setup
 * - Send function
 * - Error handling
 * - Delivery tracking
 */

import { Resend } from 'resend';

// Default sender email
const DEFAULT_FROM = 'DemandRadar <briefs@demandradar.io>';

/**
 * Email send parameters
 */
export interface SendEmailParams {
  from?: string;
  to: string | string[];
  subject: string;
  html?: string;
  react?: React.ReactNode;
}

/**
 * Email send result with delivery tracking
 */
export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
  sentAt?: Date;
}

/**
 * Initialize and return Resend client
 * @throws Error if RESEND_API_KEY is not configured
 */
export function initializeResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  return new Resend(apiKey);
}

/**
 * Send email using Resend with error handling and delivery tracking
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  try {
    // Validate email addresses
    const recipients = Array.isArray(params.to) ? params.to : [params.to];
    for (const email of recipients) {
      if (!isValidEmail(email)) {
        return {
          success: false,
          error: `Invalid email address: ${email}`,
        };
      }
    }

    // Validate subject
    if (!params.subject || params.subject.trim().length === 0) {
      return {
        success: false,
        error: 'Subject is required',
      };
    }

    // Initialize Resend client
    const resend = initializeResend();

    // Prepare email data
    const emailData: any = {
      from: params.from || DEFAULT_FROM,
      to: params.to,
      subject: params.subject,
    };

    // Add content (either HTML or React)
    if (params.react) {
      emailData.react = params.react;
    } else if (params.html) {
      emailData.html = params.html;
    } else {
      return {
        success: false,
        error: 'Either html or react content is required',
      };
    }

    // Send email
    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error('❌ Failed to send email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    console.log(`✅ Email sent successfully! ID: ${data?.id}`);

    return {
      success: true,
      id: data?.id,
      sentAt: new Date(),
    };
  } catch (error) {
    console.error('💥 Critical error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Demand Brief snapshot interface
 */
export interface DemandSnapshot {
  id: string;
  niche_id: string;
  offering_name: string;
  week_start: string;
  demand_score: number;
  demand_score_change: number;
  opportunity_score: number;
  message_market_fit_score: number;
  trend: 'up' | 'down' | 'stable';
  ad_signals: any;
  search_signals: any;
  ugc_signals: any;
  forum_signals: any;
  competitor_signals: any;
  plays: any[];
  ad_hooks: string[];
  subject_lines: string[];
  landing_copy: string;
  why_score_changed: string[];
}

/**
 * Demand Brief email parameters
 */
export interface SendDemandBriefEmailParams {
  to: string;
  name?: string;
  snapshot: DemandSnapshot;
}

/**
 * Send Demand Brief email with pre-configured template
 */
export async function sendDemandBriefEmail(
  params: SendDemandBriefEmailParams
): Promise<SendEmailResult> {
  try {
    // Import the email template
    const { DemandBriefEmail } = await import('./templates/demand-brief');

    // Generate subject line with trend indicator
    const trendEmoji =
      params.snapshot.trend === 'up' ? '▲' : params.snapshot.trend === 'down' ? '▼' : '→';
    const trendText =
      params.snapshot.trend === 'up'
        ? `+${params.snapshot.demand_score_change}`
        : params.snapshot.trend === 'down'
          ? `${params.snapshot.demand_score_change}`
          : 'stable';

    const subject = `📊 ${params.snapshot.offering_name} Demand Brief: Score ${params.snapshot.demand_score} (${trendEmoji} ${trendText})`;

    // Send email using the template
    const emailElement = DemandBriefEmail({
      snapshot: params.snapshot,
      recipientName: params.name,
    });
    
    return await sendEmail({
      to: params.to,
      subject,
      react: emailElement as React.ReactNode,
    });
  } catch (error) {
    console.error('💥 Error sending demand brief:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Validate email address format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
