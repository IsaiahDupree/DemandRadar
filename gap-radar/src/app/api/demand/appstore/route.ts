import { NextRequest, NextResponse } from 'next/server';
import { collectAppStoreResults } from '@/lib/collectors/appstore';
import {
  calculateAppScore,
  normalizeDownloads,
  analyzeNegativeReviews,
  extractFeatureRequests,
  type AppStoreData,
  type AppReview,
} from '@/lib/scoring/app-score';

/**
 * GET /api/demand/appstore
 *
 * Get app market score from App Store data (iOS/Android)
 *
 * Query params:
 * - niche: string (required) - The niche to analyze
 * - platform: string (optional) - Platform filter: 'ios', 'android', or 'all' (default: all)
 * - limit: number (optional) - Max results per platform (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get('niche');
    const platform = searchParams.get('platform') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!niche) {
      return NextResponse.json(
        { error: 'Niche is required' },
        { status: 400 }
      );
    }

    // Collect App Store data
    const appResults = await collectAppStoreResults(niche, []);

    // Filter by platform if specified
    const filteredApps = platform === 'all'
      ? appResults
      : appResults.filter(app => app.platform === platform);

    // Take top apps by review count
    const topApps = filteredApps
      .sort((a, b) => b.review_count - a.review_count)
      .slice(0, limit);

    // Aggregate data for scoring
    const totalDownloads = topApps.reduce((sum, app) => {
      // Estimate downloads from review count (rough heuristic: 1% of users leave reviews)
      const estimatedDownloads = app.review_count * 100;
      return sum + estimatedDownloads;
    }, 0);

    // Collect reviews (mock data for now - would fetch real reviews via API)
    const reviews: AppReview[] = topApps.flatMap(app => {
      // Generate mock reviews based on rating distribution
      const mockReviews: AppReview[] = [];
      const reviewCount = Math.min(app.review_count, 100); // Sample up to 100 reviews per app

      for (let i = 0; i < reviewCount; i++) {
        // Distribute reviews based on average rating
        const randomRating = generateRatingFromAverage(app.rating);
        const reviewText = generateMockReviewText(randomRating, app.app_name);

        mockReviews.push({
          rating: randomRating,
          text: reviewText,
        });
      }

      return mockReviews;
    });

    const appStoreData: AppStoreData = {
      downloads: totalDownloads,
      reviews: reviews,
    };

    // Calculate app score
    const appScore = calculateAppScore(appStoreData);

    // Calculate breakdown for transparency
    const downloadScore = normalizeDownloads(appStoreData.downloads);
    const reviewScore = analyzeNegativeReviews(appStoreData.reviews);
    const requestScore = extractFeatureRequests(appStoreData.reviews);

    return NextResponse.json({
      niche,
      app_score: appScore,
      data: {
        totalDownloads: totalDownloads,
        totalReviews: reviews.length,
        apps: topApps.map(app => ({
          name: app.app_name,
          platform: app.platform,
          rating: app.rating,
          reviewCount: app.review_count,
          developer: app.developer,
        })),
      },
      breakdown: {
        download_score: downloadScore,
        negative_review_score: reviewScore,
        feature_request_score: requestScore,
        weights: {
          downloads: 0.3,
          negativeReviews: 0.3,
          featureRequests: 0.4,
        },
      },
      meta: {
        platform: platform,
        appsAnalyzed: topApps.length,
        collected_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching App Store data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch App Store data' },
      { status: 500 }
    );
  }
}

/**
 * Generate a rating based on average rating distribution
 * Apps with higher averages get more high ratings
 */
function generateRatingFromAverage(avgRating: number): number {
  const rand = Math.random();

  if (avgRating >= 4.5) {
    // Excellent apps: 70% 5-star, 20% 4-star, 10% lower
    if (rand < 0.7) return 5;
    if (rand < 0.9) return 4;
    return Math.floor(Math.random() * 3) + 1;
  } else if (avgRating >= 4.0) {
    // Good apps: 50% 5-star, 30% 4-star, 20% lower
    if (rand < 0.5) return 5;
    if (rand < 0.8) return 4;
    return Math.floor(Math.random() * 3) + 1;
  } else if (avgRating >= 3.0) {
    // Average apps: 30% 5-star, 20% 4-star, 30% 3-star, 20% lower
    if (rand < 0.3) return 5;
    if (rand < 0.5) return 4;
    if (rand < 0.8) return 3;
    return Math.floor(Math.random() * 2) + 1;
  } else {
    // Poor apps: 20% 5-star, 10% 4-star, 20% 3-star, 50% lower
    if (rand < 0.2) return 5;
    if (rand < 0.3) return 4;
    if (rand < 0.5) return 3;
    return Math.floor(Math.random() * 2) + 1;
  }
}

/**
 * Generate mock review text based on rating
 * In production, this would fetch real reviews from App Store APIs
 */
function generateMockReviewText(rating: number, appName: string): string {
  const positiveReviews = [
    `Great app! ${appName} works perfectly.`,
    `Love this app! Highly recommend.`,
    `Best ${appName} app I've tried.`,
    `Amazing features and easy to use.`,
    `Perfect! Does exactly what I need.`,
  ];

  const negativeReviews = [
    `App crashes constantly. Please fix the bugs.`,
    `Terrible experience. Needs a lot of work.`,
    `Disappointed with this app. Not worth it.`,
    `Too many bugs and glitches.`,
    `Worst app ever. Don't download.`,
  ];

  const featureRequests = [
    `Would love to see dark mode added!`,
    `Please add offline support.`,
    `I wish this had export functionality.`,
    `Can you add widgets? That would be great.`,
    `Missing search feature. Please add it.`,
    `It would be nice if you could sync across devices.`,
    `Need better notification options.`,
  ];

  const neutralReviews = [
    `It's okay. Could be better.`,
    `Decent app but has room for improvement.`,
    `Not bad, but not great either.`,
  ];

  if (rating === 5) {
    return positiveReviews[Math.floor(Math.random() * positiveReviews.length)];
  } else if (rating === 4) {
    // Mix positive with feature requests
    return Math.random() > 0.5
      ? positiveReviews[Math.floor(Math.random() * positiveReviews.length)]
      : featureRequests[Math.floor(Math.random() * featureRequests.length)];
  } else if (rating === 3) {
    // Mix neutral with feature requests
    return Math.random() > 0.5
      ? neutralReviews[Math.floor(Math.random() * neutralReviews.length)]
      : featureRequests[Math.floor(Math.random() * featureRequests.length)];
  } else {
    return negativeReviews[Math.floor(Math.random() * negativeReviews.length)];
  }
}
