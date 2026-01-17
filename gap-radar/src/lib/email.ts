/**
 * Email Client Library
 *
 * Centralized email sending using Resend
 *
 * Requires: npm install resend react-email @react-email/components
 */

import { Resend } from "resend";

// Lazy initialize Resend client
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  react?: any;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Default from address for all emails
 */
const DEFAULT_FROM = "GapRadar <notifications@gapradar.io>";

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    // Validate API key
    if (!process.env.RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY not configured");
      return {
        success: false,
        error: "Email service not configured",
      };
    }

    // Validate required fields
    if (!options.to) {
      return { success: false, error: "Recipient email required" };
    }

    if (!options.subject) {
      return { success: false, error: "Email subject required" };
    }

    if (!options.react && !options.html && !options.text) {
      return { success: false, error: "Email content required (react, html, or text)" };
    }

    // Send email
    const resendClient = getResendClient();
    const { data, error } = await resendClient.emails.send({
      from: options.from || DEFAULT_FROM,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      react: options.react,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
    });

    if (error) {
      console.error("❌ Failed to send email:", error);
      return {
        success: false,
        error: error.message || "Failed to send email",
      };
    }

    console.log(`✅ Email sent successfully! ID: ${data?.id}`);
    return {
      success: true,
      id: data?.id,
    };
  } catch (error) {
    console.error("💥 Critical error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Send multiple emails in batch
 * Note: Resend has rate limits, use carefully
 */
export async function sendBatchEmails(
  emails: EmailOptions[]
): Promise<EmailResult[]> {
  const results: EmailResult[] = [];

  for (const email of emails) {
    const result = await sendEmail(email);
    results.push(result);

    // Add small delay to avoid rate limits
    if (emails.length > 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Send a test email (for development)
 */
export async function sendTestEmail(
  recipientEmail: string
): Promise<EmailResult> {
  if (!isValidEmail(recipientEmail)) {
    return { success: false, error: "Invalid email address" };
  }

  return sendEmail({
    to: recipientEmail,
    subject: "Test Email from GapRadar",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1>Test Email</h1>
        <p>This is a test email from GapRadar.</p>
        <p>If you received this, your email configuration is working correctly!</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Sent at: ${new Date().toISOString()}
        </p>
      </div>
    `,
    text: `Test Email\n\nThis is a test email from GapRadar.\n\nIf you received this, your email configuration is working correctly!\n\nSent at: ${new Date().toISOString()}`,
  });
}
