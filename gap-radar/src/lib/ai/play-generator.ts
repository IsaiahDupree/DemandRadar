/**
 * AI Play Generator (BRIEF-006)
 *
 * Generates 3 actionable plays from weekly demand signals:
 * - PRODUCT: Feature/improvement based on pain points
 * - OFFER: Pricing/packaging test
 * - DISTRIBUTION: Channel/angle test
 *
 * Each play is evidence-backed and priority-ordered.
 */

import OpenAI from "openai";
import type { WeeklySignals, DemandMetrics } from "../scoring/demand-score";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface PlayRecommendation {
  type: "product" | "offer" | "distribution";
  action: string;
  evidence: string;
  priority: "high" | "medium" | "low";
}

/**
 * Generate 3 actionable plays from weekly signals
 *
 * Acceptance Criteria:
 * 1. Returns exactly 3 plays (product, offer, distribution)
 * 2. Each play is evidence-backed with specific data
 * 3. Plays are priority-ordered (high > medium > low)
 */
export async function generatePlays(
  offeringName: string,
  signals: WeeklySignals,
  metrics: DemandMetrics
): Promise<PlayRecommendation[]> {
  const prompt = `You are a market strategist analyzing demand signals for "${offeringName}".

Based on this week's signals:

AD ACTIVITY:
- ${signals.ads.advertiserCount} advertisers running ads
- Average ad longevity: ${signals.ads.avgLongevityDays} days
- Top angles: ${signals.ads.topAngles.slice(0, 5).join(", ") || "none"}
- Top offers: ${signals.ads.topOffers.slice(0, 3).join(", ") || "none"}

PAIN POINTS & DESIRES:
- Top complaints: ${signals.forums.complaints.slice(0, 3).map((c) => c.text).join(", ") || "none"}
- Top desires: ${signals.forums.desires.slice(0, 3).map((d) => d.text).join(", ") || "none"}
- Purchase triggers: ${signals.forums.purchaseTriggers}

MARKET ACTIVITY:
- Mentions this week: ${signals.mentions.currentWeekCount}
- Week-over-week change: ${((signals.mentions.currentWeekCount - signals.mentions.previousWeekCount) / Math.max(signals.mentions.previousWeekCount, 1) * 100).toFixed(1)}%
- Active competitors: ${signals.competitors.activeCompetitors}

DEMAND SCORE: ${metrics.demandScore}/100 (${metrics.trend})

Generate exactly 3 actionable plays:
1. A PRODUCT PLAY (feature/improvement based on pain points)
2. An OFFER PLAY (pricing/packaging test)
3. A DISTRIBUTION PLAY (channel/angle test)

Format as JSON array with this exact structure:
[
  {
    "type": "product",
    "action": "Short imperative sentence describing the play",
    "evidence": "Brief explanation citing specific data from above",
    "priority": "high" | "medium" | "low"
  },
  ...
]

Be specific, actionable, and data-driven. Each action should be testable within a week.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a market strategist who generates actionable, data-driven recommendations. Always return valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    const parsed = JSON.parse(content);
    const plays: PlayRecommendation[] = parsed.plays || parsed;

    // Ensure we have exactly 3 plays with correct types
    if (!Array.isArray(plays) || plays.length !== 3) {
      console.warn("AI returned incorrect number of plays, using fallback");
      return generateFallbackPlays(signals);
    }

    // Sort by priority: high > medium > low
    return sortPlaysByPriority(plays);
  } catch (error) {
    console.error("Failed to generate plays:", error);
    return generateFallbackPlays(signals);
  }
}

/**
 * Sort plays by priority (high > medium > low)
 */
function sortPlaysByPriority(
  plays: PlayRecommendation[]
): PlayRecommendation[] {
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  return plays.sort(
    (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]
  );
}

/**
 * Generate fallback plays when API fails or returns invalid data
 */
function generateFallbackPlays(signals: WeeklySignals): PlayRecommendation[] {
  const plays: PlayRecommendation[] = [
    {
      type: "product",
      action: `Address top complaint: ${signals.forums.complaints[0]?.text || "user feedback"}`,
      evidence: `Mentioned ${signals.forums.complaints[0]?.frequency || 0} times this week`,
      priority: "high",
    },
    {
      type: "offer",
      action: "Test a risk-reversal offer (free trial or money-back guarantee)",
      evidence: `${signals.forums.purchaseTriggers} purchase intent signals detected`,
      priority: "medium",
    },
    {
      type: "distribution",
      action: `Test winning angle: "${signals.ads.topAngles[0] || "top performing creative"}"`,
      evidence: `${signals.ads.advertiserCount} advertisers using similar approach`,
      priority: "high",
    },
  ];

  return sortPlaysByPriority(plays);
}
