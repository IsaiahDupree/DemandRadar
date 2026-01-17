/**
 * Demand Brief Email Sender
 *
 * Sends weekly Demand Brief emails using Resend
 *
 * Note: Requires 'resend' package to be installed:
 *   npm install resend
 */

import type { DemandMetrics } from "../scoring/demand-score";
import type { BriefContent } from "../ai/brief-generator";

// Import Resend dynamically to avoid build errors when package is not installed
let Resend: any = null;
let DemandBriefEmail: any = null;

try {
  // Only import if resend package is installed
  Resend = require("resend").Resend;
  DemandBriefEmail = require("./templates/demand-brief").DemandBriefEmail;
} catch (error) {
  console.warn("Resend package not installed. Email functionality will be disabled.");
}

export interface DemandSnapshot {
  id: string;
  niche_id: string;
  offering_name: string;
  week_start: string;
  demand_score: number;
  demand_score_change: number;
  opportunity_score: number;
  message_market_fit_score: number;
  trend: "up" | "down" | "stable";
  ad_signals: any;
  search_signals: any;
  ugc_signals: any;
  forum_signals: any;
  competitor_signals: any;
  plays: BriefContent["plays"];
  ad_hooks: string[];
  subject_lines: string[];
  landing_copy: string;
  why_score_changed: string[];
}

export interface EmailRecipient {
  email: string;
  name?: string;
}

/**
 * Send Demand Brief email to user
 */
export async function sendDemandBrief(
  recipient: EmailRecipient,
  snapshot: DemandSnapshot
): Promise<{ success: boolean; error?: string }> {
  // Check if Resend is available
  if (!Resend || !DemandBriefEmail) {
    console.warn("⚠️ Resend package not installed - email cannot be sent");
    console.log("Install with: npm install resend react-email @react-email/components");
    return {
      success: false,
      error: "Resend package not installed",
    };
  }

  try {
    console.log(`📧 Sending Demand Brief to ${recipient.email}...`);

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Generate subject line
    const trendEmoji =
      snapshot.trend === "up" ? "▲" : snapshot.trend === "down" ? "▼" : "→";
    const trendText =
      snapshot.trend === "up"
        ? `+${snapshot.demand_score_change}`
        : snapshot.trend === "down"
          ? `${snapshot.demand_score_change}`
          : "stable";

    const subject = `📊 ${snapshot.offering_name} Demand Brief: Score ${snapshot.demand_score} (${trendEmoji} ${trendText})`;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: "DemandRadar <briefs@demandradar.io>",
      to: [recipient.email],
      subject,
      react: DemandBriefEmail({ snapshot, recipientName: recipient.name }),
    });

    if (error) {
      console.error("❌ Failed to send email:", error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Email sent successfully! ID: ${data?.id}`);
    return { success: true };
  } catch (error) {
    console.error("💥 Critical error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Send test email (for development)
 */
export async function sendTestBrief(
  recipientEmail: string
): Promise<{ success: boolean; error?: string }> {
  // Create mock snapshot
  const mockSnapshot: DemandSnapshot = {
    id: "test-123",
    niche_id: "test-niche",
    offering_name: "LogoMaker Pro",
    week_start: new Date().toISOString().split("T")[0],
    demand_score: 73,
    demand_score_change: 12,
    opportunity_score: 68,
    message_market_fit_score: 81,
    trend: "up",
    ad_signals: {
      advertiserCount: 25,
      avgLongevityDays: 45,
      topAngles: [
        "Remove watermarks instantly",
        "No quality loss",
        "Batch processing",
      ],
      topOffers: ["Free trial", "50% off", "Money-back guarantee"],
    },
    search_signals: {
      buyerIntentKeywords: [
        { keyword: "best logo maker", volume: 5000 },
        { keyword: "canva alternative", volume: 3000 },
      ],
      totalVolume: 11500,
    },
    ugc_signals: {
      sources: ["reddit", "tiktok"],
      mentionCount: 120,
    },
    forum_signals: {
      complaints: [
        { text: "too expensive", frequency: 45 },
        { text: "slow rendering", frequency: 30 },
      ],
      desires: [
        { text: "batch processing", frequency: 60 },
        { text: "custom fonts", frequency: 40 },
      ],
      purchaseTriggers: 35,
    },
    competitor_signals: {
      activeCompetitors: 18,
      pricingChanges: [],
      featureChanges: [],
    },
    plays: [
      {
        type: "product",
        action: "Add batch processing feature",
        evidence: "Mentioned 60 times this week in user forums",
        priority: "high",
      },
      {
        type: "offer",
        action: 'Test "first 10 exports free" vs current trial',
        evidence: "35 purchase intent signals detected",
        priority: "medium",
      },
      {
        type: "distribution",
        action: "Run before/after UGC angle on TikTok",
        evidence: "28% engagement rate on similar content",
        priority: "high",
      },
    ],
    ad_hooks: [
      "Remove watermarks in 1 click (no quality loss)",
      "The tool Canva users are switching to",
      "Why 10,000 creators ditched watermarks",
      "Export unlimited logos without the wait",
      "The secret to professional logos in minutes",
    ],
    subject_lines: [
      "Your videos deserve better than watermarks",
      "The export hack that saves 2 hours/week",
      "What Canva won't tell you",
      "This changed how I create logos",
      "Stop wasting time on exports",
    ],
    landing_copy:
      "Tired of watermarks ruining your designs? You're not alone. LogoMaker Pro gives you unlimited watermark-free exports with no quality loss. Join 10,000 creators who already made the switch. Start your free trial today.",
    why_score_changed: [
      "3 new advertisers entered the market",
      "'Alternative to X' searches increased 40%",
      "Pain mentions up in r/logodesign",
    ],
  };

  return sendDemandBrief({ email: recipientEmail }, mockSnapshot);
}
