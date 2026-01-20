/**
 * Tests for Trend Velocity Calculation
 * Feature: UDS-007
 */

import {
  calculateTrendVelocity,
  type TrendDataPoint,
  type TrendVelocityResult,
  type TrendDirection,
} from '@/lib/scoring/trend-velocity';

describe('calculateTrendVelocity', () => {
  it('should calculate rising trend with positive velocity', () => {
    const dataPoints: TrendDataPoint[] = [
      { timestamp: new Date('2026-01-01'), value: 10 },
      { timestamp: new Date('2026-01-08'), value: 20 },
      { timestamp: new Date('2026-01-15'), value: 35 },
      { timestamp: new Date('2026-01-22'), value: 50 },
    ];

    const result = calculateTrendVelocity(dataPoints);

    expect(result.direction).toBe('rising');
    expect(result.velocityPercent).toBeGreaterThan(0);
    expect(result.velocityPercent).toBeCloseTo(400, 0); // 400% increase from first to last
  });

  it('should calculate declining trend with negative velocity', () => {
    const dataPoints: TrendDataPoint[] = [
      { timestamp: new Date('2026-01-01'), value: 100 },
      { timestamp: new Date('2026-01-08'), value: 80 },
      { timestamp: new Date('2026-01-15'), value: 50 },
      { timestamp: new Date('2026-01-22'), value: 25 },
    ];

    const result = calculateTrendVelocity(dataPoints);

    expect(result.direction).toBe('declining');
    expect(result.velocityPercent).toBeLessThan(0);
    expect(result.velocityPercent).toBeCloseTo(-75, 0); // -75% from first to last
  });

  it('should calculate stable trend with low velocity', () => {
    const dataPoints: TrendDataPoint[] = [
      { timestamp: new Date('2026-01-01'), value: 50 },
      { timestamp: new Date('2026-01-08'), value: 52 },
      { timestamp: new Date('2026-01-15'), value: 48 },
      { timestamp: new Date('2026-01-22'), value: 51 },
    ];

    const result = calculateTrendVelocity(dataPoints);

    expect(result.direction).toBe('stable');
    expect(Math.abs(result.velocityPercent)).toBeLessThan(10); // Less than 10% change = stable
  });

  it('should handle single data point as stable', () => {
    const dataPoints: TrendDataPoint[] = [
      { timestamp: new Date('2026-01-01'), value: 50 },
    ];

    const result = calculateTrendVelocity(dataPoints);

    expect(result.direction).toBe('stable');
    expect(result.velocityPercent).toBe(0);
  });

  it('should handle two data points', () => {
    const dataPoints: TrendDataPoint[] = [
      { timestamp: new Date('2026-01-01'), value: 50 },
      { timestamp: new Date('2026-01-15'), value: 100 },
    ];

    const result = calculateTrendVelocity(dataPoints);

    expect(result.direction).toBe('rising');
    expect(result.velocityPercent).toBeCloseTo(100, 0); // 100% increase
  });

  it('should handle zero starting value gracefully', () => {
    const dataPoints: TrendDataPoint[] = [
      { timestamp: new Date('2026-01-01'), value: 0 },
      { timestamp: new Date('2026-01-08'), value: 50 },
      { timestamp: new Date('2026-01-15'), value: 100 },
    ];

    const result = calculateTrendVelocity(dataPoints);

    expect(result.direction).toBe('rising');
    expect(result.velocityPercent).toBeGreaterThan(0);
  });

  it('should handle all zero values as stable', () => {
    const dataPoints: TrendDataPoint[] = [
      { timestamp: new Date('2026-01-01'), value: 0 },
      { timestamp: new Date('2026-01-08'), value: 0 },
      { timestamp: new Date('2026-01-15'), value: 0 },
    ];

    const result = calculateTrendVelocity(dataPoints);

    expect(result.direction).toBe('stable');
    expect(result.velocityPercent).toBe(0);
  });

  it('should calculate confidence based on data points', () => {
    const fewPoints: TrendDataPoint[] = [
      { timestamp: new Date('2026-01-01'), value: 10 },
      { timestamp: new Date('2026-01-15'), value: 20 },
    ];

    const manyPoints: TrendDataPoint[] = [
      { timestamp: new Date('2026-01-01'), value: 10 },
      { timestamp: new Date('2026-01-05'), value: 15 },
      { timestamp: new Date('2026-01-10'), value: 20 },
      { timestamp: new Date('2026-01-15'), value: 25 },
      { timestamp: new Date('2026-01-20'), value: 30 },
    ];

    const resultFew = calculateTrendVelocity(fewPoints);
    const resultMany = calculateTrendVelocity(manyPoints);

    expect(resultMany.confidence).toBeGreaterThan(resultFew.confidence);
    expect(resultMany.confidence).toBeGreaterThanOrEqual(0);
    expect(resultMany.confidence).toBeLessThanOrEqual(1);
  });

  it('should sort data points by timestamp', () => {
    const dataPoints: TrendDataPoint[] = [
      { timestamp: new Date('2026-01-15'), value: 30 },
      { timestamp: new Date('2026-01-01'), value: 10 },
      { timestamp: new Date('2026-01-22'), value: 50 },
      { timestamp: new Date('2026-01-08'), value: 20 },
    ];

    const result = calculateTrendVelocity(dataPoints);

    // Should still calculate correctly even if unsorted
    expect(result.direction).toBe('rising');
    expect(result.velocityPercent).toBeGreaterThan(0);
  });

  it('should return proper visual indicator', () => {
    const risingPoints: TrendDataPoint[] = [
      { timestamp: new Date('2026-01-01'), value: 10 },
      { timestamp: new Date('2026-01-15'), value: 50 },
    ];

    const decliningPoints: TrendDataPoint[] = [
      { timestamp: new Date('2026-01-01'), value: 50 },
      { timestamp: new Date('2026-01-15'), value: 10 },
    ];

    const stablePoints: TrendDataPoint[] = [
      { timestamp: new Date('2026-01-01'), value: 50 },
      { timestamp: new Date('2026-01-15'), value: 52 },
    ];

    const risingResult = calculateTrendVelocity(risingPoints);
    const decliningResult = calculateTrendVelocity(decliningPoints);
    const stableResult = calculateTrendVelocity(stablePoints);

    expect(risingResult.indicator).toBe('↗');
    expect(decliningResult.indicator).toBe('↘');
    expect(stableResult.indicator).toBe('→');
  });
});
