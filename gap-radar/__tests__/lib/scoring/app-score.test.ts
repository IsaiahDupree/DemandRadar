/**
 * App Score Calculator Tests
 *
 * Tests for UDS-003: App Store Score
 */

import {
  calculateAppScore,
  normalizeDownloads,
  analyzeNegativeReviews,
  extractFeatureRequests,
  type AppStoreData,
  type AppReview,
} from '@/lib/scoring/app-score';

describe('calculateAppScore', () => {
  it('should return 0 for empty data', () => {
    const data: AppStoreData = {
      downloads: 0,
      reviews: [],
    };

    expect(calculateAppScore(data)).toBe(0);
  });

  it('should calculate score from all three factors', () => {
    const data: AppStoreData = {
      downloads: 50000,
      reviews: [
        { rating: 2, text: 'App crashes constantly. Please fix this bug.' },
        { rating: 1, text: 'Would love a dark mode feature!' },
        { rating: 5, text: 'Great app!' },
      ],
    };

    const score = calculateAppScore(data);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should use correct weights (0.3, 0.3, 0.4)', () => {
    // High downloads, no reviews
    const highDownloads: AppStoreData = {
      downloads: 1000000,
      reviews: [],
    };

    // Low downloads, many negative reviews
    const highReviews: AppStoreData = {
      downloads: 1000,
      reviews: [
        { rating: 1, text: 'Terrible app!' },
        { rating: 2, text: 'So many bugs!' },
        { rating: 1, text: 'Need feature X please!' },
      ],
    };

    const downloadScore = calculateAppScore(highDownloads);
    const reviewScore = calculateAppScore(highReviews);

    // Downloads contribute 30%, reviews 60% combined
    expect(reviewScore).toBeGreaterThan(downloadScore);
  });
});

describe('normalizeDownloads', () => {
  it('should return 0 for zero downloads', () => {
    expect(normalizeDownloads(0)).toBe(0);
  });

  it('should return 0 for negative downloads', () => {
    expect(normalizeDownloads(-100)).toBe(0);
  });

  it('should use logarithmic scaling', () => {
    // Lower downloads should have higher relative increase
    const score1k = normalizeDownloads(1000);
    const score10k = normalizeDownloads(10000);
    const score100k = normalizeDownloads(100000);
    const score1m = normalizeDownloads(1000000);

    expect(score10k).toBeGreaterThan(score1k);
    expect(score100k).toBeGreaterThan(score10k);
    expect(score1m).toBeGreaterThan(score100k);

    // Diminishing returns - gaps should decrease
    const gap1 = score10k - score1k;
    const gap2 = score1m - score100k;
    expect(gap2).toBeLessThan(gap1);
  });

  it('should cap at 100', () => {
    expect(normalizeDownloads(100000000)).toBe(100);
  });
});

describe('analyzeNegativeReviews', () => {
  it('should return 0 for no reviews', () => {
    expect(analyzeNegativeReviews([])).toBe(0);
  });

  it('should return 0 for all positive reviews', () => {
    const reviews: AppReview[] = [
      { rating: 5, text: 'Amazing app!' },
      { rating: 4, text: 'Great!' },
    ];

    expect(analyzeNegativeReviews(reviews)).toBe(0);
  });

  it('should score based on negative review percentage', () => {
    const reviews: AppReview[] = [
      { rating: 1, text: 'Terrible!' },
      { rating: 2, text: 'Bad experience' },
      { rating: 5, text: 'Good!' },
      { rating: 5, text: 'Great!' },
    ];

    const score = analyzeNegativeReviews(reviews);
    // 50% negative (ratings <= 3)
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should weight 1-star reviews more heavily than 2-3 star', () => {
    const manyOneStar: AppReview[] = [
      { rating: 1, text: 'Bad' },
      { rating: 1, text: 'Bad' },
      { rating: 5, text: 'Good' },
    ];

    const manyTwoStar: AppReview[] = [
      { rating: 2, text: 'Okay' },
      { rating: 2, text: 'Okay' },
      { rating: 5, text: 'Good' },
    ];

    expect(analyzeNegativeReviews(manyOneStar)).toBeGreaterThan(
      analyzeNegativeReviews(manyTwoStar)
    );
  });
});

describe('extractFeatureRequests', () => {
  it('should return 0 for no reviews', () => {
    expect(extractFeatureRequests([])).toBe(0);
  });

  it('should detect feature request keywords', () => {
    const reviews: AppReview[] = [
      { rating: 4, text: 'Would love to see dark mode added!' },
      { rating: 3, text: 'Please add export feature' },
      { rating: 5, text: 'Great app!' },
    ];

    const score = extractFeatureRequests(reviews);
    expect(score).toBeGreaterThan(0);
  });

  it('should detect various request patterns', () => {
    const reviews: AppReview[] = [
      { rating: 4, text: 'I wish this had offline mode' },
      { rating: 3, text: 'It would be nice if you could sync' },
      { rating: 3, text: 'Can you add a widget?' },
      { rating: 4, text: 'Missing search functionality' },
      { rating: 3, text: 'Need better notifications' },
    ];

    const score = extractFeatureRequests(reviews);
    // All 5 reviews have requests
    expect(score).toBeGreaterThan(80);
  });

  it('should not count generic complaints as feature requests', () => {
    const reviews: AppReview[] = [
      { rating: 1, text: 'This app is terrible' },
      { rating: 2, text: 'Crashes all the time' },
      { rating: 1, text: 'Worst app ever' },
    ];

    const score = extractFeatureRequests(reviews);
    expect(score).toBeLessThan(20);
  });
});
