/**
 * App Score Calculator
 *
 * Calculates demand score from App Store data (iOS/Android)
 * Part of Unified Demand Score (UDS-003)
 *
 * Formula: Downloads * 0.3 + Negative Reviews * 0.3 + Feature Requests * 0.4
 */

export interface AppReview {
  rating: number;  // 1-5 stars
  text: string;
}

export interface AppStoreData {
  downloads: number;       // Total downloads/installs
  reviews: AppReview[];    // App reviews
}

const WEIGHTS = {
  downloads: 0.3,
  negativeReviews: 0.3,
  featureRequests: 0.4,
};

/**
 * Calculate app score from App Store data
 * Returns a score between 0-100
 */
export function calculateAppScore(data: AppStoreData): number {
  if (data.downloads === 0 && data.reviews.length === 0) {
    return 0;
  }

  const downloadScore = normalizeDownloads(data.downloads);
  const reviewScore = analyzeNegativeReviews(data.reviews);
  const requestScore = extractFeatureRequests(data.reviews);

  const score =
    (downloadScore * WEIGHTS.downloads) +
    (reviewScore * WEIGHTS.negativeReviews) +
    (requestScore * WEIGHTS.featureRequests);

  return Math.round(Math.min(Math.max(score, 0), 100));
}

/**
 * Normalize download count to 0-100 scale using logarithmic scaling
 * Higher downloads have diminishing returns
 */
export function normalizeDownloads(downloads: number): number {
  if (downloads <= 0) return 0;

  // Log scale: log10(downloads) mapped to 0-100 with diminishing returns
  // 1k downloads = ~20, 10k = ~37, 100k = ~56, 1M = ~72, 10M = ~87, 100M+ = ~100
  const logDownloads = Math.log10(downloads);

  // Use a square root scaling for true diminishing returns
  // This creates a curve where later gains are smaller
  const baseScore = Math.min(logDownloads, 8); // Cap log at 100M
  const normalized = Math.sqrt((baseScore - 3) / 5) * 80 + 20;

  return Math.round(Math.min(Math.max(normalized, 0), 100));
}

/**
 * Analyze negative reviews to identify pain points
 * Higher score = more negative reviews = more opportunity
 */
export function analyzeNegativeReviews(reviews: AppReview[]): number {
  if (reviews.length === 0) return 0;

  let negativeScore = 0;

  for (const review of reviews) {
    // Weight by severity: 1-star = most negative
    if (review.rating <= 1) {
      negativeScore += 100;
    } else if (review.rating === 2) {
      negativeScore += 70;
    } else if (review.rating === 3) {
      negativeScore += 40;
    }
    // 4-5 stars don't contribute to negative score
  }

  // Average and normalize
  const avgScore = negativeScore / reviews.length;
  return Math.round(Math.min(avgScore, 100));
}

/**
 * Extract feature requests from reviews
 * Higher score = more feature requests = more opportunity
 */
export function extractFeatureRequests(reviews: AppReview[]): number {
  if (reviews.length === 0) return 0;

  const requestPatterns = [
    /\b(would|could|should|wish|hope|want)\b.*\b(add|have|include|support|feature|option)\b/i,
    /\b(please|can\s+you|would\s+be\s+nice)\b.*\b(add|include|implement)\b/i,
    /\b(missing|lack|need|require|must\s+have)\b/i,
    /\b(it\s+would\s+be|i'd\s+like|i\s+wish)\b/i,
    /\b(feature\s+request|enhancement)\b/i,
  ];

  let requestCount = 0;

  for (const review of reviews) {
    const hasRequest = requestPatterns.some(pattern => pattern.test(review.text));
    if (hasRequest) {
      requestCount++;
    }
  }

  // Return percentage as score
  const percentage = (requestCount / reviews.length) * 100;
  return Math.round(Math.min(percentage, 100));
}
