/**
 * Weekly Signal Collection Pipeline
 *
 * Collects all market signals for a niche and prepares them for Demand Brief generation.
 * This pipeline runs weekly for each tracked niche.
 */

import { collectRedditMentions, type RedditMention } from "../collectors/reddit";
import { collectMetaAds, type MetaAd } from "../collectors/meta";
import { collectGoogleAds, type GoogleAd } from "../collectors/google";
import { collectTikTokUGC } from "../collectors/tiktok";
import { collectInstagramUGC } from "../collectors/instagram";
import { collectAppStoreResults } from "../collectors/appstore";
import type { WeeklySignals } from "../scoring/demand-score";

export interface NicheConfig {
  id: string;
  offering_name: string;
  keywords: string[];
  competitors: string[];
  geo: string;
  sources_enabled: string[];
}

export interface RawSignals {
  ads: {
    meta: MetaAd[];
    google: GoogleAd[];
  };
  ugc: {
    tiktok: any[];
    instagram: any[];
  };
  forums: {
    reddit: RedditMention[];
  };
  appStores: {
    ios: any[];
    android: any[];
  };
  collectedAt: Date;
}

/**
 * Collect all signals for a niche
 */
export async function collectWeeklySignals(
  niche: NicheConfig
): Promise<RawSignals> {
  console.log(`Collecting weekly signals for niche: ${niche.offering_name}`);

  const { keywords, competitors, sources_enabled } = niche;
  const primaryKeyword = keywords[0] || niche.offering_name;

  const signals: RawSignals = {
    ads: { meta: [], google: [] },
    ugc: { tiktok: [], instagram: [] },
    forums: { reddit: [] },
    appStores: { ios: [], android: [] },
    collectedAt: new Date(),
  };

  // Collect Meta Ads
  if (sources_enabled.includes("meta")) {
    try {
      console.log("Collecting Meta ads...");
      signals.ads.meta = await collectMetaAds(
        primaryKeyword,
        keywords.slice(1, 4),
        niche.geo
      );
      console.log(`✓ Collected ${signals.ads.meta.length} Meta ads`);
    } catch (error) {
      console.error("Meta ads collection failed:", error);
    }
  }

  // Collect Google Ads
  if (sources_enabled.includes("google")) {
    try {
      console.log("Collecting Google ads...");
      signals.ads.google = await collectGoogleAds(
        primaryKeyword,
        keywords.slice(1, 4),
        { country: niche.geo }
      );
      console.log(`✓ Collected ${signals.ads.google.length} Google ads`);
    } catch (error) {
      console.error("Google ads collection failed:", error);
    }
  }

  // Collect Reddit mentions
  if (sources_enabled.includes("reddit")) {
    try {
      console.log("Collecting Reddit mentions...");
      signals.forums.reddit = await collectRedditMentions(
        primaryKeyword,
        keywords.slice(1, 4),
        competitors.slice(0, 5)
      );
      console.log(`✓ Collected ${signals.forums.reddit.length} Reddit mentions`);
    } catch (error) {
      console.error("Reddit collection failed:", error);
    }
  }

  // Collect TikTok UGC
  if (sources_enabled.includes("tiktok")) {
    try {
      console.log("Collecting TikTok UGC...");
      signals.ugc.tiktok = await collectTikTokUGC(
        primaryKeyword,
        keywords.slice(1, 4)
      );
      console.log(`✓ Collected ${signals.ugc.tiktok.length} TikTok posts`);
    } catch (error) {
      console.error("TikTok collection failed:", error);
    }
  }

  // Collect Instagram UGC
  if (sources_enabled.includes("instagram")) {
    try {
      console.log("Collecting Instagram UGC...");
      signals.ugc.instagram = await collectInstagramUGC(
        primaryKeyword,
        keywords.slice(1, 4)
      );
      console.log(`✓ Collected ${signals.ugc.instagram.length} Instagram posts`);
    } catch (error) {
      console.error("Instagram collection failed:", error);
    }
  }

  // Collect App Store data
  if (sources_enabled.includes("appstore")) {
    try {
      console.log("Collecting App Store data...");

      // Collect from both iOS and Android
      const appStoreResults = await collectAppStoreResults(
        primaryKeyword,
        keywords.slice(1, 3)
      );

      // Separate by platform
      signals.appStores.ios = appStoreResults.filter((app) => app.platform === "ios");
      signals.appStores.android = appStoreResults.filter((app) => app.platform === "android");

      console.log(`✓ Collected ${signals.appStores.ios.length} iOS apps`);
      console.log(`✓ Collected ${signals.appStores.android.length} Android apps`);
    } catch (error) {
      console.error("App Store collection failed:", error);
    }
  }

  return signals;
}

/**
 * Transform raw signals into structured WeeklySignals format for scoring
 */
export function transformToWeeklySignals(
  raw: RawSignals,
  previousWeekData?: { mentionCount: number; score: number }
): WeeklySignals {
  // Extract unique advertisers from Meta and Google ads
  const metaAdvertisers = new Set(
    raw.ads.meta.map((ad) => ad.advertiser_name).filter(Boolean)
  );
  const googleAdvertisers = new Set(
    raw.ads.google.map((ad) => ad.advertiser_name).filter(Boolean)
  );
  const allAdvertisers = new Set([
    ...metaAdvertisers,
    ...googleAdvertisers,
  ]);

  // Calculate average ad longevity (days active)
  const adLongevities = raw.ads.meta
    .map((ad) => {
      if (ad.first_seen) {
        const startDate = new Date(ad.first_seen);
        const now = new Date();
        return Math.floor(
          (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
      }
      return 0;
    })
    .filter((days) => days > 0);

  const avgLongevityDays =
    adLongevities.length > 0
      ? Math.round(
          adLongevities.reduce((sum, days) => sum + days, 0) /
            adLongevities.length
        )
      : 0;

  // Extract top ad angles (most common hooks/headlines)
  const allHeadlines = [
    ...raw.ads.meta.map((ad) => ad.creative_text || ad.headline || ""),
    ...raw.ads.google.map((ad) => ad.headline || ""),
  ].filter(Boolean);

  const topAngles = allHeadlines.slice(0, 10);

  // Extract top offers
  const topOffers = raw.ads.meta
    .map((ad) => ad.creative_text || ad.description || "")
    .filter((text) =>
      /\b(free|trial|discount|off|save|deal|offer)\b/i.test(text)
    )
    .slice(0, 5);

  // Analyze buyer intent keywords from search data
  // For now, use a simplified approach based on Reddit mentions
  const buyerIntentKeywords = extractBuyerIntentKeywords(raw.forums.reddit);

  // Count current week mentions
  const currentWeekCount = raw.forums.reddit.length;
  const previousWeekCount = previousWeekData?.mentionCount || 0;

  // Analyze pain points and desires from Reddit
  const painAnalysis = analyzePainPoints(raw.forums.reddit);

  // Count active competitors (unique advertisers in the space)
  const activeCompetitors = allAdvertisers.size;

  return {
    ads: {
      advertiserCount: allAdvertisers.size,
      avgLongevityDays,
      topAngles,
      topOffers,
    },
    search: {
      buyerIntentKeywords,
      totalVolume: buyerIntentKeywords.reduce(
        (sum, kw) => sum + kw.volume,
        0
      ),
    },
    mentions: {
      currentWeekCount,
      previousWeekCount,
      sources: ["reddit", "tiktok", "instagram"],
    },
    forums: {
      complaints: painAnalysis.complaints,
      desires: painAnalysis.desires,
      purchaseTriggers: painAnalysis.purchaseTriggers,
    },
    competitors: {
      activeCompetitors,
      pricingChanges: [],
      featureChanges: [],
    },
    previousScore: previousWeekData?.score,
  };
}

/**
 * Extract buyer intent keywords from Reddit mentions
 */
function extractBuyerIntentKeywords(
  mentions: RedditMention[]
): { keyword: string; volume: number }[] {
  const buyerIntentTerms = [
    "best",
    "alternative",
    "vs",
    "review",
    "pricing",
    "cost",
    "compare",
    "worth it",
    "recommend",
  ];

  const keywordCounts = new Map<string, number>();

  mentions.forEach((mention) => {
    const text = (mention.title || "") + " " + mention.body;
    const lowerText = text.toLowerCase();

    buyerIntentTerms.forEach((term) => {
      if (lowerText.includes(term)) {
        const current = keywordCounts.get(term) || 0;
        keywordCounts.set(term, current + mention.score + 1);
      }
    });
  });

  return Array.from(keywordCounts.entries())
    .map(([keyword, volume]) => ({ keyword, volume }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 20);
}

/**
 * Analyze pain points and desires from Reddit mentions
 */
function analyzePainPoints(mentions: RedditMention[]): {
  complaints: { text: string; frequency: number }[];
  desires: { text: string; frequency: number }[];
  purchaseTriggers: number;
} {
  const complaintKeywords = [
    "expensive",
    "slow",
    "buggy",
    "broken",
    "issue",
    "problem",
    "doesn't work",
    "terrible",
    "worst",
    "hate",
  ];

  const desireKeywords = [
    "wish",
    "would be nice",
    "need",
    "want",
    "looking for",
    "feature request",
    "should have",
    "missing",
  ];

  const purchaseTriggerKeywords = [
    "buy",
    "purchase",
    "price",
    "cost",
    "worth",
    "subscribe",
    "pay",
  ];

  const complaintCounts = new Map<string, number>();
  const desireCounts = new Map<string, number>();
  let purchaseTriggers = 0;

  mentions.forEach((mention) => {
    const text = ((mention.title || "") + " " + mention.body).toLowerCase();

    // Count complaints
    complaintKeywords.forEach((keyword) => {
      if (text.includes(keyword)) {
        const current = complaintCounts.get(keyword) || 0;
        complaintCounts.set(keyword, current + 1);
      }
    });

    // Count desires
    desireKeywords.forEach((keyword) => {
      if (text.includes(keyword)) {
        const current = desireCounts.get(keyword) || 0;
        desireCounts.set(keyword, current + 1);
      }
    });

    // Count purchase triggers
    if (purchaseTriggerKeywords.some((keyword) => text.includes(keyword))) {
      purchaseTriggers++;
    }
  });

  const complaints = Array.from(complaintCounts.entries())
    .map(([text, frequency]) => ({ text, frequency }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  const desires = Array.from(desireCounts.entries())
    .map(([text, frequency]) => ({ text, frequency }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  return { complaints, desires, purchaseTriggers };
}

/**
 * Get previous week's data for comparison
 */
export async function getPreviousWeekData(
  nicheId: string
): Promise<{ mentionCount: number; score: number } | undefined> {
  // TODO: Query from demand_snapshots table
  // For now, return undefined
  return undefined;
}
