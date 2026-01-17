/**
 * Weekly Briefs Cron Job
 *
 * This endpoint is triggered weekly by Vercel Cron to:
 * 1. Collect signals for all active niches
 * 2. Calculate demand scores
 * 3. Generate brief content
 * 4. Store snapshots
 * 5. Send emails (placeholder - TASK-117)
 *
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/weekly-briefs",
 *     "schedule": "0 9 * * 1"  // Every Monday at 9am UTC
 *   }]
 * }
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  collectWeeklySignals,
  transformToWeeklySignals,
  getPreviousWeekData,
  type NicheConfig,
} from "@/lib/pipeline/weekly-signals";
import { calculateDemandScore } from "@/lib/scoring/demand-score";
import { generateBriefContent } from "@/lib/ai/brief-generator";
import { sendDemandBrief } from "@/lib/email/send-brief";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes max

/**
 * GET handler for cron job
 */
export async function GET(request: NextRequest) {
  console.log("🚀 Weekly Briefs Cron Job Started");

  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error("❌ Unauthorized cron request");
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = await createClient();
  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    // Get all active user niches
    const { data: niches, error: nicheError } = await supabase
      .from("user_niches")
      .select("*")
      .order("created_at", { ascending: true });

    if (nicheError) {
      console.error("❌ Failed to fetch niches:", nicheError);
      return Response.json(
        { error: "Failed to fetch niches", details: nicheError.message },
        { status: 500 }
      );
    }

    if (!niches || niches.length === 0) {
      console.log("ℹ️ No niches to process");
      return Response.json({ message: "No niches to process", results });
    }

    console.log(`📊 Processing ${niches.length} niches`);

    // Process each niche
    for (const niche of niches) {
      results.processed++;

      try {
        console.log(`\n--- Processing niche: ${niche.offering_name} ---`);

        // 1. Collect signals
        const rawSignals = await collectWeeklySignals({
          id: niche.id,
          offering_name: niche.offering_name,
          keywords: niche.keywords || [],
          competitors: niche.competitors || [],
          geo: niche.geo || "US",
          sources_enabled: niche.sources_enabled || [
            "meta",
            "google",
            "reddit",
            "tiktok",
            "appstore",
          ],
        });

        // 2. Get previous week data
        const previousWeekData = await getPreviousWeekData(niche.id);

        // 3. Transform to structured signals
        const weeklySignals = transformToWeeklySignals(
          rawSignals,
          previousWeekData
        );

        // 4. Calculate scores
        const metrics = calculateDemandScore(weeklySignals);

        console.log(`📈 Demand Score: ${metrics.demandScore} (${metrics.trend})`);

        // 5. Store snapshot in database
        const weekStart = getThisWeekStart();

        const { error: snapshotError } = await supabase
          .from("demand_snapshots")
          .insert({
            niche_id: niche.id,
            week_start: weekStart,
            demand_score: metrics.demandScore,
            demand_score_change: metrics.trendDelta,
            opportunity_score: metrics.opportunityScore,
            message_market_fit_score: metrics.messageMarketFit,
            ad_signals: {
              advertiserCount: weeklySignals.ads.advertiserCount,
              avgLongevityDays: weeklySignals.ads.avgLongevityDays,
              topAngles: weeklySignals.ads.topAngles,
              topOffers: weeklySignals.ads.topOffers,
            },
            search_signals: {
              buyerIntentKeywords: weeklySignals.search.buyerIntentKeywords,
              totalVolume: weeklySignals.search.totalVolume,
            },
            ugc_signals: {
              sources: weeklySignals.mentions.sources,
              mentionCount: weeklySignals.mentions.currentWeekCount,
            },
            forum_signals: {
              complaints: weeklySignals.forums.complaints,
              desires: weeklySignals.forums.desires,
              purchaseTriggers: weeklySignals.forums.purchaseTriggers,
            },
            competitor_signals: {
              activeCompetitors: weeklySignals.competitors.activeCompetitors,
              pricingChanges: weeklySignals.competitors.pricingChanges,
              featureChanges: weeklySignals.competitors.featureChanges,
            },
          });

        if (snapshotError) {
          throw new Error(
            `Failed to store snapshot: ${snapshotError.message}`
          );
        }

        console.log(`✅ Snapshot stored for ${niche.offering_name}`);

        // 6. Generate AI content (TASK-116)
        console.log("🤖 Generating AI content...");
        const briefContent = await generateBriefContent(
          niche.offering_name,
          weeklySignals,
          metrics
        );

        // 7. Update snapshot with generated content
        const { data: updatedSnapshot, error: updateError } = await supabase
          .from("demand_snapshots")
          .update({
            plays: briefContent.plays,
            ad_hooks: briefContent.adHooks,
            subject_lines: briefContent.subjectLines,
            landing_copy: briefContent.landingPageCopy,
            why_score_changed: briefContent.whyScoreChanged,
          })
          .eq("niche_id", niche.id)
          .eq("week_start", weekStart)
          .select()
          .single();

        if (updateError) {
          throw new Error(
            `Failed to update snapshot with AI content: ${updateError.message}`
          );
        }

        console.log("✅ AI content generated and stored");

        // 8. Send email (TASK-117)
        console.log("📧 Sending Demand Brief email...");

        // Get user email
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", niche.user_id)
          .single();

        if (profileError || !profile?.email) {
          console.warn(
            `⚠️ Could not find user email for niche ${niche.offering_name}`
          );
        } else {
          const emailResult = await sendDemandBrief(
            {
              email: profile.email,
              name: profile.full_name || undefined,
            },
            {
              id: updatedSnapshot.id,
              niche_id: niche.id,
              offering_name: niche.offering_name,
              week_start: weekStart,
              demand_score: metrics.demandScore,
              demand_score_change: metrics.trendDelta,
              opportunity_score: metrics.opportunityScore,
              message_market_fit_score: metrics.messageMarketFit,
              trend: metrics.trend,
              ad_signals: updatedSnapshot.ad_signals,
              search_signals: updatedSnapshot.search_signals,
              ugc_signals: updatedSnapshot.ugc_signals,
              forum_signals: updatedSnapshot.forum_signals,
              competitor_signals: updatedSnapshot.competitor_signals,
              plays: briefContent.plays,
              ad_hooks: briefContent.adHooks,
              subject_lines: briefContent.subjectLines,
              landing_copy: briefContent.landingPageCopy,
              why_score_changed: briefContent.whyScoreChanged,
            }
          );

          if (emailResult.success) {
            console.log(`✅ Email sent to ${profile.email}`);
          } else {
            console.warn(`⚠️ Failed to send email: ${emailResult.error}`);
          }
        }

        results.succeeded++;
      } catch (error) {
        console.error(
          `❌ Failed to process niche ${niche.offering_name}:`,
          error
        );
        results.failed++;
        results.errors.push(
          `${niche.offering_name}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    console.log("\n✨ Weekly Briefs Cron Job Completed");
    console.log(`📊 Results: ${JSON.stringify(results, null, 2)}`);

    return Response.json({
      success: true,
      message: "Weekly briefs processing completed",
      results,
    });
  } catch (error) {
    console.error("💥 Critical error in cron job:", error);
    return Response.json(
      {
        error: "Critical failure in weekly briefs cron",
        message: error instanceof Error ? error.message : String(error),
        results,
      },
      { status: 500 }
    );
  }
}

/**
 * Get the start date of the current week (Monday)
 */
function getThisWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split("T")[0];
}
