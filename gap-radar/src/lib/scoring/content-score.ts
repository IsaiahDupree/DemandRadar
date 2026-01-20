/**
 * Content Score Calculator
 *
 * Calculates demand score from YouTube content data
 * Part of Unified Demand Score (UDS-002)
 *
 * Formula: View Velocity * 0.4 + Comment Questions * 0.3 + Gap Size * 0.3
 */

export interface YouTubeVideo {
  title: string;
  views: number;
  duration: number;  // in seconds
}

export interface YouTubeData {
  avgViews: number;       // Average views per video
  comments: string[];     // Video comments
  videos: YouTubeVideo[]; // List of videos in niche
}

const WEIGHTS = {
  velocity: 0.4,
  questions: 0.3,
  gaps: 0.3,
};

/**
 * Calculate content score from YouTube data
 * Returns a score between 0-100
 */
export function calculateContentScore(data: YouTubeData): number {
  if (data.avgViews === 0 && data.comments.length === 0 && data.videos.length === 0) {
    return 0;
  }

  const velocityScore = normalizeViewVelocity(data.avgViews);
  const questionScore = analyzeCommentQuestions(data.comments);
  const gapScore = identifyContentGaps(data.videos);

  const score =
    (velocityScore * WEIGHTS.velocity) +
    (questionScore * WEIGHTS.questions) +
    (gapScore * WEIGHTS.gaps);

  return Math.round(Math.min(Math.max(score, 0), 100));
}

/**
 * Normalize view velocity to 0-100 scale using logarithmic scaling
 * Higher views have diminishing returns
 */
export function normalizeViewVelocity(avgViews: number): number {
  if (avgViews <= 0) return 0;

  // Log scale: log10(views) mapped to 0-100
  // 1000 views = ~30, 10k = ~40, 100k = ~60, 1M = ~80
  const logViews = Math.log10(avgViews);

  // Map log scale: 3 (1k) -> 30, 4 (10k) -> 50, 5 (100k) -> 70, 6 (1M) -> 90
  const normalized = ((logViews - 3) / 3) * 70 + 30;

  return Math.round(Math.min(Math.max(normalized, 0), 100));
}

/**
 * Analyze comments for questions indicating unmet demand
 * Returns percentage of question comments as a score 0-100
 */
export function analyzeCommentQuestions(comments: string[]): number {
  if (comments.length === 0) return 0;

  const questionIndicators = [
    '?',
    /\bhow\b/i,
    /\bwhat\b/i,
    /\bwhere\b/i,
    /\bwhy\b/i,
    /\bwhen\b/i,
    /\bcan\s+i\b/i,
    /\bcould\s+you\b/i,
    /\bshould\s+i\b/i,
  ];

  let questionCount = 0;

  for (const comment of comments) {
    const isQuestion = questionIndicators.some(indicator => {
      if (typeof indicator === 'string') {
        return comment.includes(indicator);
      }
      return indicator.test(comment);
    });

    if (isQuestion) {
      questionCount++;
    }
  }

  // Return percentage as score
  const percentage = (questionCount / comments.length) * 100;
  return Math.round(Math.min(percentage, 100));
}

/**
 * Identify content gaps in the niche
 * Higher score = more missing content types = more opportunity
 */
export function identifyContentGaps(videos: YouTubeVideo[]): number {
  if (videos.length === 0) return 0;
  if (videos.length === 1) return 0; // Need multiple videos to detect gaps

  const gaps = {
    beginner: false,
    intermediate: false,
    advanced: false,
    shortForm: false,
    longForm: false,
  };

  // Analyze content levels
  const hasBeginner = videos.some(v =>
    /beginner|start|intro|basics|101|guide|learn/i.test(v.title)
  );
  const hasIntermediate = videos.some(v =>
    /intermediate|tips|tricks|improve/i.test(v.title)
  );
  const hasAdvanced = videos.some(v =>
    /advanced|expert|master|pro|deep\s*dive/i.test(v.title)
  );

  gaps.beginner = !hasBeginner;
  gaps.intermediate = !hasIntermediate;
  gaps.advanced = !hasAdvanced;

  // Analyze duration types
  const shortFormCount = videos.filter(v => v.duration < 300).length; // < 5 min
  const longFormCount = videos.filter(v => v.duration > 1200).length; // > 20 min

  gaps.shortForm = shortFormCount === 0;
  gaps.longForm = longFormCount === 0;

  // Calculate gap score
  const gapCount = Object.values(gaps).filter(Boolean).length;
  const totalGaps = Object.keys(gaps).length;
  const gapPercentage = (gapCount / totalGaps) * 100;

  return Math.round(gapPercentage);
}
