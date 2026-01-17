/**
 * Demand Brief AI Content Generator
 *
 * Generates actionable content for weekly Demand Briefs:
 * - 3 Plays (product, offer, distribution)
 * - Ad hooks (5-10 hooks)
 * - Subject lines (5-10 subject lines)
 * - Landing page copy
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

export interface BriefContent {
  plays: PlayRecommendation[];
  adHooks: string[];
  subjectLines: string[];
  landingPageCopy: string;
  whyScoreChanged: string[];
}

/**
 * Generate all brief content using AI
 */
export async function generateBriefContent(
  offeringName: string,
  signals: WeeklySignals,
  metrics: DemandMetrics
): Promise<BriefContent> {
  console.log(`🤖 Generating AI content for ${offeringName}...`);

  // Generate plays first (most important)
  const plays = await generatePlays(offeringName, signals, metrics);

  // Generate ad hooks based on signals and plays
  const adHooks = await generateAdHooks(offeringName, signals, plays);

  // Generate subject lines
  const subjectLines = await generateSubjectLines(offeringName, signals, plays);

  // Generate landing page copy
  const landingPageCopy = await generateLandingPageCopy(
    offeringName,
    signals,
    plays
  );

  // Generate "why score changed" explanation
  const whyScoreChanged = await generateScoreChangeExplanation(
    offeringName,
    signals,
    metrics
  );

  return {
    plays,
    adHooks,
    subjectLines,
    landingPageCopy,
    whyScoreChanged,
  };
}

/**
 * Generate 3 actionable plays
 */
async function generatePlays(
  offeringName: string,
  signals: WeeklySignals,
  metrics: DemandMetrics
): Promise<PlayRecommendation[]> {
  const prompt = `You are a market strategist analyzing demand signals for "${offeringName}".

Based on this week's signals:

AD ACTIVITY:
- ${signals.ads.advertiserCount} advertisers running ads
- Average ad longevity: ${signals.ads.avgLongevityDays} days
- Top angles: ${signals.ads.topAngles.slice(0, 5).join(", ")}
- Top offers: ${signals.ads.topOffers.slice(0, 3).join(", ")}

PAIN POINTS & DESIRES:
- Top complaints: ${signals.forums.complaints.slice(0, 3).map((c) => c.text).join(", ")}
- Top desires: ${signals.forums.desires.slice(0, 3).map((d) => d.text).join(", ")}
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

    return plays;
  } catch (error) {
    console.error("Failed to generate plays:", error);
    return generateFallbackPlays(signals);
  }
}

/**
 * Generate ad hooks
 */
async function generateAdHooks(
  offeringName: string,
  signals: WeeklySignals,
  plays: PlayRecommendation[]
): Promise<string[]> {
  const prompt = `You are a direct response copywriter creating ad hooks for "${offeringName}".

Based on these insights:
- Top pain points: ${signals.forums.complaints.slice(0, 3).map((c) => c.text).join(", ")}
- Top desires: ${signals.forums.desires.slice(0, 3).map((d) => d.text).join(", ")}
- Winning angles in market: ${signals.ads.topAngles.slice(0, 3).join(", ")}
- Recommended plays: ${plays.map((p) => p.action).join("; ")}

Generate 10 attention-grabbing ad hooks that:
1. Address the pain points directly
2. Promise a clear benefit
3. Create curiosity or urgency
4. Are 10-15 words max
5. Feel native to social media feeds

Return ONLY a JSON array of strings: ["hook1", "hook2", ...]`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a direct response copywriter. Return only valid JSON arrays.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in response");
    }

    const hooks: string[] = JSON.parse(jsonMatch[0]);
    return hooks.slice(0, 10);
  } catch (error) {
    console.error("Failed to generate ad hooks:", error);
    return generateFallbackHooks(offeringName, signals);
  }
}

/**
 * Generate email subject lines
 */
async function generateSubjectLines(
  offeringName: string,
  signals: WeeklySignals,
  plays: PlayRecommendation[]
): Promise<string[]> {
  const prompt = `You are an email marketer creating subject lines for "${offeringName}".

Context:
- Top pain points: ${signals.forums.complaints.slice(0, 3).map((c) => c.text).join(", ")}
- Top desires: ${signals.forums.desires.slice(0, 3).map((d) => d.text).join(", ")}
- Buyer intent keywords: ${signals.search.buyerIntentKeywords.slice(0, 5).map((k) => k.keyword).join(", ")}

Generate 10 email subject lines that:
1. Create curiosity or urgency
2. Address pain points or desires
3. Are 6-10 words max
4. Have high open rates
5. Feel personal, not spammy

Return ONLY a JSON array of strings: ["subject1", "subject2", ...]`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an email marketing expert. Return only valid JSON arrays.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 400,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in response");
    }

    const subjects: string[] = JSON.parse(jsonMatch[0]);
    return subjects.slice(0, 10);
  } catch (error) {
    console.error("Failed to generate subject lines:", error);
    return generateFallbackSubjectLines(offeringName, signals);
  }
}

/**
 * Generate landing page copy
 */
async function generateLandingPageCopy(
  offeringName: string,
  signals: WeeklySignals,
  plays: PlayRecommendation[]
): Promise<string> {
  const prompt = `You are a conversion copywriter creating landing page copy for "${offeringName}".

Insights:
- Main pain points: ${signals.forums.complaints.slice(0, 3).map((c) => c.text).join(", ")}
- Main desires: ${signals.forums.desires.slice(0, 3).map((d) => d.text).join(", ")}
- Winning ad angles: ${signals.ads.topAngles.slice(0, 2).join(", ")}
- Purchase triggers: ${signals.forums.purchaseTriggers}

Write a compelling 3-paragraph landing page copy that:
1. Opens with the pain point
2. Presents ${offeringName} as the solution
3. Ends with a clear call-to-action

Make it conversational, benefit-focused, and action-oriented. Max 150 words total.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a conversion copywriter. Write compelling copy.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const content = completion.choices[0]?.message?.content;
    return content || generateFallbackLandingCopy(offeringName, signals);
  } catch (error) {
    console.error("Failed to generate landing page copy:", error);
    return generateFallbackLandingCopy(offeringName, signals);
  }
}

/**
 * Generate explanation for score change
 */
async function generateScoreChangeExplanation(
  offeringName: string,
  signals: WeeklySignals,
  metrics: DemandMetrics
): Promise<string[]> {
  const reasons: string[] = [];

  // Analyze what changed
  if (metrics.trendDelta > 5) {
    // Score went up
    if (signals.ads.advertiserCount > 20) {
      reasons.push(`${signals.ads.advertiserCount} advertisers active (high competition)`);
    }

    const mentionGrowth =
      ((signals.mentions.currentWeekCount -
        signals.mentions.previousWeekCount) /
        Math.max(signals.mentions.previousWeekCount, 1)) *
      100;
    if (mentionGrowth > 20) {
      reasons.push(`Mentions increased ${mentionGrowth.toFixed(0)}% this week`);
    }

    if (signals.forums.complaints.length > 0) {
      reasons.push(
        `"${signals.forums.complaints[0].text}" complaints trending`
      );
    }
  } else if (metrics.trendDelta < -5) {
    // Score went down
    reasons.push("Fewer active advertisers this week");
    reasons.push("Mention volume declined");
  } else {
    // Stable
    reasons.push("Market activity remained consistent");
  }

  return reasons.slice(0, 3);
}

// Fallback functions
function generateFallbackPlays(signals: WeeklySignals): PlayRecommendation[] {
  return [
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
}

function generateFallbackHooks(
  offeringName: string,
  signals: WeeklySignals
): string[] {
  const topPain = signals.forums.complaints[0]?.text || "common problems";
  const topDesire = signals.forums.desires[0]?.text || "what users want";

  return [
    `Stop struggling with ${topPain}`,
    `The ${offeringName} alternative everyone's talking about`,
    `${topDesire}? Here's how`,
    `Why people are switching to ${offeringName}`,
    `The secret to solving ${topPain}`,
  ];
}

function generateFallbackSubjectLines(
  offeringName: string,
  signals: WeeklySignals
): string[] {
  return [
    `Your ${offeringName} weekly update`,
    `What changed in your market this week`,
    `New opportunities in ${offeringName}`,
    `This week's winning strategies`,
    `Market intel you need to see`,
  ];
}

function generateFallbackLandingCopy(
  offeringName: string,
  signals: WeeklySignals
): string {
  const topPain = signals.forums.complaints[0]?.text || "common challenges";

  return `Tired of ${topPain}? You're not alone.

${offeringName} helps you overcome these challenges with a simple, proven approach. Join users who are already seeing results.

Start your free trial today and see the difference for yourself.`;
}
