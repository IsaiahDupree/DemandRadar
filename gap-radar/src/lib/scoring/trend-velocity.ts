/**
 * Trend Velocity Calculator
 * Feature: UDS-007
 *
 * Calculates trend direction and velocity from time-series data.
 * Returns:
 * - Direction: rising, stable, or declining
 * - Velocity: percentage change over time
 * - Visual indicator: arrow symbol
 * - Confidence: based on data quality
 */

export type TrendDirection = 'rising' | 'stable' | 'declining';

export interface TrendDataPoint {
  timestamp: Date;
  value: number;
}

export interface TrendVelocityResult {
  direction: TrendDirection;
  velocityPercent: number; // Percentage change from start to end
  indicator: string; // Visual arrow: ↗ ↘ →
  confidence: number; // 0-1 confidence score
}

/**
 * Threshold for determining if a trend is stable vs rising/declining
 * If velocity is within ±10%, consider it stable
 */
const STABILITY_THRESHOLD = 10;

/**
 * Calculate confidence score based on number of data points
 * More data points = higher confidence
 * Min 2 points needed, 5+ points = high confidence
 */
function calculateConfidence(pointCount: number): number {
  if (pointCount <= 1) return 0.3; // Low confidence with single point
  if (pointCount === 2) return 0.5;
  if (pointCount === 3) return 0.7;
  if (pointCount === 4) return 0.85;
  return 1.0; // High confidence with 5+ points
}

/**
 * Calculate velocity percentage from start to end value
 * Handles edge cases like zero values
 */
function calculateVelocityPercent(startValue: number, endValue: number): number {
  // If both are zero, no change
  if (startValue === 0 && endValue === 0) {
    return 0;
  }

  // If starting from zero, treat as large positive change
  if (startValue === 0) {
    return endValue > 0 ? 1000 : 0; // Cap at 1000% for zero-start
  }

  // Standard percentage change formula: ((end - start) / start) * 100
  return ((endValue - startValue) / startValue) * 100;
}

/**
 * Determine trend direction based on velocity
 */
function determineTrendDirection(velocityPercent: number): TrendDirection {
  if (Math.abs(velocityPercent) < STABILITY_THRESHOLD) {
    return 'stable';
  }
  return velocityPercent > 0 ? 'rising' : 'declining';
}

/**
 * Get visual indicator based on trend direction
 */
function getVisualIndicator(direction: TrendDirection): string {
  switch (direction) {
    case 'rising':
      return '↗';
    case 'declining':
      return '↘';
    case 'stable':
      return '→';
  }
}

/**
 * Calculate trend velocity from time-series data points
 *
 * @param dataPoints - Array of data points with timestamps and values
 * @returns Trend direction, velocity percentage, visual indicator, and confidence
 */
export function calculateTrendVelocity(
  dataPoints: TrendDataPoint[]
): TrendVelocityResult {
  // Handle empty or single point
  if (dataPoints.length === 0) {
    return {
      direction: 'stable',
      velocityPercent: 0,
      indicator: '→',
      confidence: 0,
    };
  }

  if (dataPoints.length === 1) {
    return {
      direction: 'stable',
      velocityPercent: 0,
      indicator: '→',
      confidence: 0.3,
    };
  }

  // Sort data points by timestamp (oldest first)
  const sorted = [...dataPoints].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  // Get first and last values
  const startValue = sorted[0].value;
  const endValue = sorted[sorted.length - 1].value;

  // Calculate velocity percentage
  const velocityPercent = calculateVelocityPercent(startValue, endValue);

  // Determine direction
  const direction = determineTrendDirection(velocityPercent);

  // Calculate confidence
  const confidence = calculateConfidence(sorted.length);

  // Get visual indicator
  const indicator = getVisualIndicator(direction);

  return {
    direction,
    velocityPercent: Math.round(velocityPercent * 100) / 100, // Round to 2 decimals
    indicator,
    confidence,
  };
}
