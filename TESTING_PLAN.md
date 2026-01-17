# DemandRadar Testing Plan

**Version:** 1.0  
**Last Updated:** January 16, 2026

---

## Overview

This document outlines the comprehensive testing strategy for DemandRadar, covering unit tests, integration tests, end-to-end tests, and manual testing procedures.

---

## Test Infrastructure Setup

### Required Dependencies

```bash
# Install testing dependencies
npm install -D jest @types/jest ts-jest
npm install -D @testing-library/react @testing-library/jest-dom
npm install -D playwright @playwright/test
npm install -D msw  # Mock Service Worker for API mocking
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  collectCoverageFrom: [
    'src/lib/**/*.ts',
    'src/app/api/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

### Test Setup File

```typescript
// __tests__/setup.ts
import '@testing-library/jest-dom';

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-key';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Global test utilities
global.mockFetch = (response: any) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(response),
    } as Response)
  );
};
```

---

## Unit Tests

### 1. Scoring Module Tests

**File:** `__tests__/lib/scoring.test.ts`

```typescript
import {
  calculateSaturationScore,
  calculateLongevityScore,
  calculateDissatisfactionScore,
  calculateMisalignmentScore,
  calculateOpportunityScore,
  calculateConfidenceScore,
  calculateScores,
} from '@/lib/scoring';
import { MetaAd } from '@/lib/collectors/meta';
import { RedditMention } from '@/lib/collectors/reddit';
import { Cluster } from '@/lib/ai/extractor';

describe('Scoring Module', () => {
  
  // Test Data Fixtures
  const mockAds: MetaAd[] = [
    {
      source: 'meta',
      advertiser_name: 'Fitness Pro',
      creative_text: 'Get fit in 30 days!',
      first_seen: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      media_type: 'video',
    },
    {
      source: 'meta',
      advertiser_name: 'Workout App',
      creative_text: 'Free workout plans',
      first_seen: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      media_type: 'image',
    },
  ];

  const mockMentions: RedditMention[] = [
    {
      subreddit: 'r/fitness',
      type: 'post',
      title: 'Best fitness app?',
      body: 'Looking for a good app that actually works',
      score: 150,
      num_comments: 45,
      permalink: '/r/fitness/abc123',
      matched_entities: ['fitness app'],
      posted_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const mockClusters: Cluster[] = [
    {
      cluster_type: 'angle',
      label: 'Free trials',
      examples: ['Try free', 'No credit card'],
      frequency: 15,
      intensity: 0.7,
    },
    {
      cluster_type: 'objection',
      label: 'Expensive pricing',
      examples: ['Too expensive', 'Not worth the price'],
      frequency: 25,
      intensity: 0.85,
    },
  ];

  describe('calculateSaturationScore', () => {
    it('returns 0 for empty ads array', () => {
      expect(calculateSaturationScore([], [])).toBe(0);
    });

    it('returns score between 0-100', () => {
      const score = calculateSaturationScore(mockAds, mockClusters);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('increases with more advertisers', () => {
      const fewAds = mockAds.slice(0, 1);
      const moreAds = [...mockAds, ...mockAds, ...mockAds];
      
      const scoreFew = calculateSaturationScore(fewAds, mockClusters);
      const scoreMore = calculateSaturationScore(moreAds, mockClusters);
      
      expect(scoreMore).toBeGreaterThan(scoreFew);
    });
  });

  describe('calculateLongevityScore', () => {
    it('returns 0 for empty ads array', () => {
      expect(calculateLongevityScore([])).toBe(0);
    });

    it('returns higher score for older ads', () => {
      const newAds: MetaAd[] = [{
        ...mockAds[0],
        first_seen: new Date().toISOString(),
      }];
      const oldAds: MetaAd[] = [{
        ...mockAds[0],
        first_seen: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      }];
      
      const newScore = calculateLongevityScore(newAds);
      const oldScore = calculateLongevityScore(oldAds);
      
      expect(oldScore).toBeGreaterThan(newScore);
    });

    it('caps at 100 for very old ads', () => {
      const veryOldAds: MetaAd[] = [{
        ...mockAds[0],
        first_seen: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      }];
      
      const score = calculateLongevityScore(veryOldAds);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateDissatisfactionScore', () => {
    it('returns 0 for empty mentions', () => {
      expect(calculateDissatisfactionScore([], [])).toBe(0);
    });

    it('increases with more objection clusters', () => {
      const fewObjections = mockClusters.filter(c => c.cluster_type !== 'objection');
      const moreObjections = [...mockClusters, {
        cluster_type: 'objection' as const,
        label: 'Bad support',
        examples: ['No response', 'Terrible service'],
        frequency: 30,
        intensity: 0.9,
      }];
      
      const scoreFew = calculateDissatisfactionScore(mockMentions, fewObjections);
      const scoreMore = calculateDissatisfactionScore(mockMentions, moreObjections);
      
      expect(scoreMore).toBeGreaterThan(scoreFew);
    });
  });

  describe('calculateMisalignmentScore', () => {
    it('returns score between 0-100', () => {
      const score = calculateMisalignmentScore(mockAds, mockClusters);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateOpportunityScore', () => {
    it('combines scores correctly', () => {
      const score = calculateOpportunityScore(70, 60, 50, 30);
      // 0.35*70 + 0.35*60 + 0.30*50 - 0.15*30 = 24.5 + 21 + 15 - 4.5 = 56
      expect(score).toBeCloseTo(56, 0);
    });

    it('clamps between 0-100', () => {
      const lowScore = calculateOpportunityScore(0, 0, 0, 100);
      const highScore = calculateOpportunityScore(100, 100, 100, 0);
      
      expect(lowScore).toBeGreaterThanOrEqual(0);
      expect(highScore).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateConfidenceScore', () => {
    it('returns value between 0-1', () => {
      const mockGaps = [{ evidence_ads: ['a'], evidence_reddit: ['r'] }];
      const score = calculateConfidenceScore(mockAds, mockMentions, mockGaps as any);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateScores (integration)', () => {
    it('returns all score types', () => {
      const mockGaps = [{ evidence_ads: ['a'], evidence_reddit: ['r'] }];
      const scores = calculateScores(mockAds, mockMentions, mockClusters, mockGaps as any);
      
      expect(scores).toHaveProperty('saturation');
      expect(scores).toHaveProperty('longevity');
      expect(scores).toHaveProperty('dissatisfaction');
      expect(scores).toHaveProperty('misalignment');
      expect(scores).toHaveProperty('opportunity');
      expect(scores).toHaveProperty('confidence');
    });
  });
});
```

### 2. Collector Tests

**File:** `__tests__/lib/collectors/reddit.test.ts`

```typescript
import { collectRedditMentions, searchSubreddit } from '@/lib/collectors/reddit';

describe('Reddit Collector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('collectRedditMentions', () => {
    it('returns array of mentions', async () => {
      // Mock fetch
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              children: [
                {
                  data: {
                    subreddit: 'fitness',
                    title: 'Best app?',
                    selftext: 'Looking for recommendations',
                    score: 100,
                    num_comments: 25,
                    permalink: '/r/fitness/123',
                    created_utc: Date.now() / 1000,
                  },
                },
              ],
            },
          }),
        } as Response)
      );

      const mentions = await collectRedditMentions('fitness app', ['workout'], []);
      
      expect(Array.isArray(mentions)).toBe(true);
      expect(mentions.length).toBeGreaterThan(0);
      expect(mentions[0]).toHaveProperty('subreddit');
      expect(mentions[0]).toHaveProperty('title');
    });

    it('deduplicates by permalink', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              children: [
                { data: { subreddit: 'test', title: 'Dup', permalink: '/same', score: 1, created_utc: Date.now() / 1000 } },
                { data: { subreddit: 'test', title: 'Dup2', permalink: '/same', score: 2, created_utc: Date.now() / 1000 } },
              ],
            },
          }),
        } as Response)
      );

      const mentions = await collectRedditMentions('test', [], []);
      const permalinks = mentions.map(m => m.permalink);
      const uniquePermalinks = [...new Set(permalinks)];
      
      expect(permalinks.length).toBe(uniquePermalinks.length);
    });

    it('handles API errors gracefully', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

      const mentions = await collectRedditMentions('test', [], []);
      
      // Should return mock data on error
      expect(Array.isArray(mentions)).toBe(true);
    });
  });

  describe('searchSubreddit', () => {
    it('searches specific subreddit', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: { children: [] },
          }),
        } as Response)
      );

      await searchSubreddit('fitness', 'workout');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('r/fitness/search'),
        expect.any(Object)
      );
    });
  });
});
```

**File:** `__tests__/lib/collectors/appstore.test.ts`

```typescript
import { searchAppStore, collectAppStoreResults } from '@/lib/collectors/appstore';

describe('App Store Collector', () => {
  describe('searchAppStore', () => {
    it('returns app results', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            results: [
              {
                trackName: 'Fitness App',
                trackId: 123456,
                artistName: 'Developer',
                averageUserRating: 4.5,
                userRatingCount: 1000,
                description: 'Best fitness app',
                primaryGenreName: 'Health & Fitness',
                formattedPrice: 'Free',
              },
            ],
          }),
        } as Response)
      );

      const results = await searchAppStore('fitness');
      
      expect(Array.isArray(results)).toBe(true);
      expect(results[0]).toHaveProperty('app_name');
      expect(results[0]).toHaveProperty('rating');
    });
  });

  describe('collectAppStoreResults', () => {
    it('combines multiple search terms', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            results: [{ trackName: 'App', trackId: 1, artistName: 'Dev', averageUserRating: 4, userRatingCount: 100 }],
          }),
        } as Response)
      );

      const results = await collectAppStoreResults('fitness', ['workout', 'gym']);
      
      expect(global.fetch).toHaveBeenCalledTimes(3); // niche + 2 seed terms
    });
  });
});
```

### 3. AI Module Tests

**File:** `__tests__/lib/ai/extractor.test.ts`

```typescript
import { extractInsights, clusterInsights } from '@/lib/ai/extractor';

// Mock OpenAI
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                offers: ['Free trial', 'Money back'],
                claims: ['Best quality', '#1 rated'],
                angles: ['Save time', 'Easy to use'],
                objections: [],
                desired_features: ['Export options'],
                sentiment: { positive: 0.6, negative: 0.2, neutral: 0.2 },
              }),
            },
          }],
        }),
      },
    },
  })),
}));

describe('AI Extractor', () => {
  describe('extractInsights', () => {
    it('extracts structured data from ads and mentions', async () => {
      const mockAds = [{ creative_text: 'Try our free app!' }];
      const mockMentions = [{ body: 'Looking for alternatives' }];

      const result = await extractInsights(mockAds as any, mockMentions as any, 'test niche');
      
      expect(result).toHaveProperty('extractions');
      expect(result).toHaveProperty('clusters');
    });

    it('returns mock data when API key missing', async () => {
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const result = await extractInsights([], [], 'test');
      
      expect(result.extractions).toBeDefined();
      
      process.env.OPENAI_API_KEY = originalKey;
    });
  });

  describe('clusterInsights', () => {
    it('groups similar insights', () => {
      const extractions = [
        { offers: ['free trial', 'free trial'], claims: ['best quality'] },
        { offers: ['money back'], claims: ['best quality', 'top rated'] },
      ];

      const clusters = clusterInsights(extractions as any);
      
      expect(clusters.some(c => c.cluster_type === 'offer')).toBe(true);
      expect(clusters.some(c => c.cluster_type === 'angle')).toBe(true);
    });
  });
});
```

**File:** `__tests__/lib/ai/gap-generator.test.ts`

```typescript
import { generateGaps } from '@/lib/ai/gap-generator';

describe('Gap Generator', () => {
  describe('generateGaps', () => {
    it('returns array of gap opportunities', async () => {
      const mockClusters = [
        { cluster_type: 'objection', label: 'Expensive', frequency: 10, intensity: 0.8 },
      ];
      const mockAds = [{ creative_text: 'Premium solution' }];
      const mockMentions = [{ body: 'Too expensive for me' }];

      const gaps = await generateGaps(mockClusters as any, mockAds as any, mockMentions as any, 'test');
      
      expect(Array.isArray(gaps)).toBe(true);
      expect(gaps.length).toBeGreaterThan(0);
      expect(gaps[0]).toHaveProperty('gap_type');
      expect(gaps[0]).toHaveProperty('title');
      expect(gaps[0]).toHaveProperty('opportunity_score');
    });

    it('includes evidence from both sources', async () => {
      const gaps = await generateGaps([], [], [], 'test');
      
      gaps.forEach(gap => {
        expect(gap).toHaveProperty('evidence_ads');
        expect(gap).toHaveProperty('evidence_reddit');
      });
    });
  });
});
```

---

## Integration Tests

### 1. API Route Tests

**File:** `__tests__/integration/api/runs.test.ts`

```typescript
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/runs/route';

describe('Runs API', () => {
  describe('POST /api/runs', () => {
    it('creates a new run', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          nicheQuery: 'fitness app',
          seedTerms: ['workout'],
          competitors: ['MyFitnessPal'],
        },
      });

      // Mock auth
      jest.spyOn(require('@/lib/supabase/server'), 'createClient').mockReturnValue({
        auth: { getUser: () => ({ data: { user: { id: 'test-user' } } }) },
        from: () => ({
          select: () => ({ single: () => ({ data: { runs_used: 0, runs_limit: 10 } }) }),
          insert: () => ({ select: () => ({ single: () => ({ data: { id: 'new-run-id' } }) }) }),
        }),
      });

      const response = await POST(req as any);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('id');
    });

    it('rejects unauthenticated requests', async () => {
      const { req } = createMocks({ method: 'POST' });

      jest.spyOn(require('@/lib/supabase/server'), 'createClient').mockReturnValue({
        auth: { getUser: () => ({ data: { user: null } }) },
      });

      const response = await POST(req as any);
      
      expect(response.status).toBe(401);
    });
  });
});
```

### 2. Pipeline Integration Test

**File:** `__tests__/integration/pipeline/full-pipeline.test.ts`

```typescript
describe('Full Analysis Pipeline', () => {
  const testNiche = 'fitness app';
  
  it('completes end-to-end analysis', async () => {
    const response = await fetch('http://localhost:3000/api/test/full-pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nicheQuery: testNiche }),
    });

    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.pipeline.collection.metaAds).toBeGreaterThan(0);
    expect(data.pipeline.collection.redditMentions).toBeGreaterThan(0);
    expect(data.pipeline.gaps.length).toBeGreaterThan(0);
  }, 60000); // 60s timeout

  it('handles missing data gracefully', async () => {
    const response = await fetch('http://localhost:3000/api/test/full-pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nicheQuery: 'xyznonexistent12345' }),
    });

    const data = await response.json();
    
    expect(data.success).toBe(true);
    // Should still return structure even with no/mock data
    expect(data.pipeline).toBeDefined();
  });
});
```

---

## End-to-End Tests

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Files

**File:** `e2e/auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('shows login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/DemandRadar/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('redirects unauthenticated users from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('allows login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard or show error
    await page.waitForURL(/dashboard|login/);
  });
});
```

**File:** `e2e/new-run.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('New Run Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first (or use auth state)
    await page.goto('/login');
    // ... login steps
  });

  test('creates new analysis run', async ({ page }) => {
    await page.goto('/dashboard/new-run');
    
    // Fill form
    await page.fill('[name="nicheQuery"]', 'fitness app');
    await page.fill('[name="seedTerms"]', 'workout, gym, exercise');
    await page.fill('[name="competitors"]', 'MyFitnessPal, Fitbit');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should redirect to runs page
    await expect(page).toHaveURL(/dashboard\/runs/);
  });

  test('validates required fields', async ({ page }) => {
    await page.goto('/dashboard/new-run');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation error
    await expect(page.locator('.error, [role="alert"]')).toBeVisible();
  });
});
```

**File:** `e2e/report.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Report Viewing', () => {
  test('displays report data', async ({ page }) => {
    // Navigate to a completed run's report
    await page.goto('/dashboard/reports/test-run-id');
    
    // Check for key sections
    await expect(page.locator('text=Executive Summary')).toBeVisible();
    await expect(page.locator('text=Gap Opportunities')).toBeVisible();
  });

  test('allows PDF export', async ({ page }) => {
    await page.goto('/dashboard/reports/test-run-id');
    
    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export PDF")');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('.pdf');
  });
});
```

---

## Manual Testing Checklist

### Pre-Release Checklist

#### Authentication
- [ ] User can sign up with email/password
- [ ] User can log in
- [ ] User can log out
- [ ] Password reset works
- [ ] Session persists across page refreshes

#### Dashboard
- [ ] Dashboard loads without errors
- [ ] Navigation sidebar works
- [ ] All pages are accessible

#### New Run
- [ ] Form validates required fields
- [ ] Run is created successfully
- [ ] User sees confirmation/redirect
- [ ] Run appears in runs list

#### Data Collection
- [ ] Meta ads are collected (or mock shown)
- [ ] Reddit mentions are collected
- [ ] App store results are collected
- [ ] No API errors in console

#### Analysis
- [ ] Extractions are generated
- [ ] Clusters are created
- [ ] Gaps are identified
- [ ] Concepts are generated
- [ ] UGC recommendations are created

#### Scoring
- [ ] All scores calculate correctly
- [ ] Scores are within valid ranges (0-100)
- [ ] Confidence score is 0-1

#### Reports
- [ ] Report page renders
- [ ] All sections display data
- [ ] Export buttons work

#### Payments (Stripe)
- [ ] Checkout flow works
- [ ] Webhook processes correctly
- [ ] User plan updates after payment

---

## Coverage Requirements

| Module | Minimum Coverage |
|--------|------------------|
| `lib/scoring.ts` | 90% |
| `lib/collectors/*` | 80% |
| `lib/ai/*` | 75% |
| `app/api/*` | 70% |
| Overall | 70% |

---

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm test -- --coverage
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  e2e:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Test Commands

```bash
# Run all unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- scoring.test.ts

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e -- --ui

# Watch mode
npm test -- --watch
```

---

*Last updated: January 16, 2026*
