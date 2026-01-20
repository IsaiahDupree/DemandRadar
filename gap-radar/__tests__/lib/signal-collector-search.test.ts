/**
 * Search Signal Collector Tests
 *
 * Tests for Google Trends integration in signal collector (UDS-001)
 */

// Mock Supabase before importing
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ error: null })),
      select: jest.fn(() => ({ data: [], error: null })),
    })),
    rpc: jest.fn(() => ({ data: [], error: null })),
  })),
}));

import { collectSearchSignals } from '@/lib/demand-intelligence/signal-collector';

describe('collectSearchSignals', () => {
  it('collects search signals for a niche', async () => {
    const signals = await collectSearchSignals('project management');

    expect(signals).toBeDefined();
    expect(signals.length).toBeGreaterThan(0);
  });

  it('returns signals with correct structure', async () => {
    const signals = await collectSearchSignals('crm software');
    const signal = signals[0];

    expect(signal.niche).toBe('crm software');
    expect(signal.signal_type).toBe('search');
    expect(signal.source).toBe('google');
    expect(signal.title).toBeDefined();
    expect(signal.content).toBeDefined();
    expect(signal.score).toBeGreaterThanOrEqual(0);
    expect(signal.score).toBeLessThanOrEqual(100);
  });

  it('includes search volume in raw data', async () => {
    const signals = await collectSearchSignals('email marketing');
    const signal = signals[0];

    expect(signal.raw_data).toBeDefined();
    expect(signal.raw_data?.searchVolume).toBeDefined();
    expect(signal.raw_data?.growthRate).toBeDefined();
    expect(signal.raw_data?.relatedQueries).toBeDefined();
    expect(Array.isArray(signal.raw_data?.relatedQueries)).toBe(true);
  });

  it('calculates score from Google Trends data', async () => {
    const signals = await collectSearchSignals('productivity app');

    expect(signals[0].score).toBeGreaterThan(0);
  });

  it('handles errors gracefully', async () => {
    const signals = await collectSearchSignals('');

    // Should return empty array or handle gracefully
    expect(signals).toBeDefined();
    expect(Array.isArray(signals)).toBe(true);
  });
});
