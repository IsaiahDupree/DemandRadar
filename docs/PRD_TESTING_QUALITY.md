# PRD: Testing & Quality Coverage

> **Status:** Draft  
> **Priority:** High (Infrastructure)  
> **Estimated Effort:** Ongoing (2 weeks initial setup)  
> **Created:** January 19, 2026

---

## Problem Statement

The codebase has grown significantly but **testing coverage is minimal**. Build errors have occurred during deployment due to type issues, missing await statements, and integration problems. A comprehensive testing strategy is needed to:

1. Prevent regressions as features are added
2. Catch build errors before deployment
3. Ensure API endpoints work correctly
4. Validate critical user flows

### Current State
- ❌ No E2E tests
- ❌ Limited unit tests
- ❌ No API integration tests
- ❌ No visual regression tests
- ✅ TypeScript (catches some errors)
- ✅ ESLint (basic linting)

---

## Goals

1. **Reliability:** Catch bugs before they reach production
2. **Confidence:** Deploy with confidence via automated testing
3. **Speed:** Fast feedback loop for developers
4. **Coverage:** Test critical paths thoroughly

### Success Metrics
| Metric | Target |
|--------|--------|
| Unit test coverage | >70% for core libs |
| E2E test coverage | 100% of critical paths |
| Build success rate | >95% |
| Time to catch regressions | <5 min in CI |

---

## Testing Strategy

### 1. Unit Tests (Vitest)

**Scope:** Individual functions, utilities, and pure logic

```typescript
// Priority areas for unit testing:

// 1. Scoring functions
src/lib/scoring/
├── demand-score.ts        // calculateDemandScore()
├── unified-score.ts       // calculateUnifiedDemandScore()
└── index.ts

// 2. Data collectors
src/lib/collectors/
├── reddit.ts              // filterWinningSignals(), calculateDemandScore()
├── meta.ts                // filterWinningAds()
├── google.ts
├── youtube.ts
└── appstore.ts

// 3. AI/NLP utilities
src/lib/ai/
├── analyze.ts             // analyzeGaps()
├── hooks.ts               // extractHooks()
└── prompts.ts

// 4. Subscription logic
src/lib/subscription/
├── permissions.ts         // canAccessFeature()
├── tier-limits.ts         // getTierLimits()
└── credits.ts

// 5. Alert detection
src/lib/alerts/
└── detector.ts            // detectDemandChanges()
```

**Example Unit Tests:**

```typescript
// src/lib/scoring/__tests__/demand-score.test.ts
import { describe, it, expect } from 'vitest';
import { calculateDemandScore, normalizeScore } from '../demand-score';

describe('calculateDemandScore', () => {
  it('should return 0 for empty signals', () => {
    expect(calculateDemandScore([])).toBe(0);
  });

  it('should weight upvotes at 40%', () => {
    const signals = [{ upvotes: 100, comments: 0, recency: 0 }];
    const score = calculateDemandScore(signals);
    expect(score).toBeCloseTo(40, 1);
  });

  it('should cap score at 100', () => {
    const signals = [{ upvotes: 1000, comments: 500, recency: 1 }];
    expect(calculateDemandScore(signals)).toBeLessThanOrEqual(100);
  });

  it('should handle negative values gracefully', () => {
    const signals = [{ upvotes: -10, comments: 5, recency: 0.5 }];
    expect(calculateDemandScore(signals)).toBeGreaterThanOrEqual(0);
  });
});

describe('normalizeScore', () => {
  it('should normalize to 0-100 range', () => {
    expect(normalizeScore(50, 0, 100)).toBe(50);
    expect(normalizeScore(150, 0, 100)).toBe(100);
    expect(normalizeScore(-50, 0, 100)).toBe(0);
  });
});
```

```typescript
// src/lib/subscription/__tests__/permissions.test.ts
import { describe, it, expect } from 'vitest';
import { canAccessFeature, getTierLimits } from '../permissions';

describe('canAccessFeature', () => {
  it('should allow free tier to access basic features', () => {
    expect(canAccessFeature('free', 'run_analysis')).toBe(true);
    expect(canAccessFeature('free', 'view_trends')).toBe(true);
  });

  it('should restrict pro features from free tier', () => {
    expect(canAccessFeature('free', 'export_pdf')).toBe(false);
    expect(canAccessFeature('free', 'competitor_tracking')).toBe(false);
  });

  it('should allow studio tier access to all features', () => {
    expect(canAccessFeature('studio', 'white_label')).toBe(true);
    expect(canAccessFeature('studio', 'api_access')).toBe(true);
  });
});

describe('getTierLimits', () => {
  it('should return correct limits for each tier', () => {
    expect(getTierLimits('free').maxNiches).toBe(1);
    expect(getTierLimits('pro').maxNiches).toBe(5);
    expect(getTierLimits('studio').maxNiches).toBe(-1); // unlimited
  });
});
```

### 2. API Integration Tests

**Scope:** API route handlers with mocked database

```typescript
// src/app/api/__tests__/demand.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../demand/reddit/route';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: mockData, error: null }))
          }))
        }))
      })),
      insert: vi.fn(() => Promise.resolve({ error: null }))
    }))
  }))
}));

describe('GET /api/demand/reddit', () => {
  it('should return demand signals for valid niche', async () => {
    const request = new Request('http://localhost/api/demand/reddit?niche=ai-tools');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('signals');
    expect(Array.isArray(data.signals)).toBe(true);
  });

  it('should return 400 for missing niche parameter', async () => {
    const request = new Request('http://localhost/api/demand/reddit');
    const response = await GET(request);
    
    expect(response.status).toBe(400);
  });

  it('should respect limit parameter', async () => {
    const request = new Request('http://localhost/api/demand/reddit?niche=ai&limit=5');
    const response = await GET(request);
    
    const data = await response.json();
    expect(data.signals.length).toBeLessThanOrEqual(5);
  });
});

describe('POST /api/demand/reddit', () => {
  it('should create new niche tracking', async () => {
    const request = new Request('http://localhost/api/demand/reddit', {
      method: 'POST',
      body: JSON.stringify({ niche: 'new-niche' })
    });
    
    const response = await POST(request);
    expect(response.status).toBe(201);
  });

  it('should reject invalid request body', async () => {
    const request = new Request('http://localhost/api/demand/reddit', {
      method: 'POST',
      body: JSON.stringify({})
    });
    
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

### 3. E2E Tests (Playwright)

**Scope:** Critical user flows in real browser

```typescript
// e2e/critical-flows.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should allow user to sign up', async ({ page }) => {
    await page.goto('/signup');
    
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test('should allow user to log in', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[name="email"]', 'existing@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should redirect unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Run Analysis Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('should create and execute a new run', async ({ page }) => {
    await page.goto('/dashboard/new-run');
    
    // Enter niche
    await page.fill('[name="niche"]', 'AI writing tools');
    await page.click('button:has-text("Start Analysis")');
    
    // Wait for run to start
    await expect(page.locator('text=Analysis in progress')).toBeVisible();
    
    // Wait for completion (with timeout)
    await expect(page.locator('text=Analysis complete')).toBeVisible({ timeout: 60000 });
  });

  test('should display run results correctly', async ({ page }) => {
    // Navigate to existing run
    await page.goto('/dashboard/runs');
    await page.click('[data-testid="run-item"]:first-child');
    
    // Verify key sections are visible
    await expect(page.locator('[data-testid="demand-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="gap-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="ad-gallery"]')).toBeVisible();
  });
});

test.describe('Billing Flow', () => {
  test('should display pricing page correctly', async ({ page }) => {
    await page.goto('/pricing');
    
    await expect(page.locator('text=Free')).toBeVisible();
    await expect(page.locator('text=Pro')).toBeVisible();
    await expect(page.locator('text=Studio')).toBeVisible();
  });

  test('should redirect to Stripe checkout', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.goto('/pricing');
    await page.click('button:has-text("Upgrade to Pro")');
    
    // Should redirect to Stripe
    await expect(page).toHaveURL(/checkout\.stripe\.com/);
  });
});

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
  });

  test('should navigate to all main sections', async ({ page }) => {
    const sections = [
      { link: 'Runs', url: '/dashboard/runs' },
      { link: 'Trends', url: '/dashboard/trends' },
      { link: 'Gaps', url: '/dashboard/gaps' },
      { link: 'Settings', url: '/dashboard/settings' }
    ];

    for (const section of sections) {
      await page.click(`nav >> text=${section.link}`);
      await expect(page).toHaveURL(new RegExp(section.url));
    }
  });
});
```

### 4. Visual Regression Tests

**Scope:** UI component appearance

```typescript
// e2e/visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('landing page looks correct', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('landing-page.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('dashboard looks correct', async ({ page }) => {
    // Login and navigate
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    
    await expect(page).toHaveScreenshot('dashboard.png', {
      maxDiffPixels: 100
    });
  });

  test('demand score card renders correctly', async ({ page }) => {
    await page.goto('/dashboard/runs/test-run-id');
    
    const scoreCard = page.locator('[data-testid="demand-score-card"]');
    await expect(scoreCard).toHaveScreenshot('demand-score-card.png');
  });
});
```

---

## Test Configuration

### Vitest Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*'
      ],
      thresholds: {
        global: {
          branches: 60,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### Playwright Setup

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['github', { printSteps: true }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

---

## CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci --legacy-peer-deps
        working-directory: ./gap-radar
      
      - name: Run unit tests
        run: npm run test:unit
        working-directory: ./gap-radar
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./gap-radar/coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci --legacy-peer-deps
        working-directory: ./gap-radar
      
      - name: Install Playwright
        run: npx playwright install --with-deps
        working-directory: ./gap-radar
      
      - name: Run E2E tests
        run: npm run test:e2e
        working-directory: ./gap-radar
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: gap-radar/playwright-report

  build:
    runs-on: ubuntu-latest
    needs: [unit-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci --legacy-peer-deps
        working-directory: ./gap-radar
      
      - name: Build
        run: npm run build
        working-directory: ./gap-radar
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

---

## Implementation Phases

### Phase 1: Setup & Core Unit Tests (Week 1)
- [ ] Install and configure Vitest
- [ ] Create test utilities and mocks
- [ ] Write unit tests for scoring functions
- [ ] Write unit tests for subscription logic
- [ ] Set up coverage reporting

### Phase 2: API Tests (Week 1)
- [ ] Create API test helpers
- [ ] Write tests for demand endpoints
- [ ] Write tests for billing endpoints
- [ ] Write tests for auth endpoints
- [ ] Add to CI pipeline

### Phase 3: E2E Tests (Week 2)
- [ ] Install and configure Playwright
- [ ] Create test user fixtures
- [ ] Write auth flow tests
- [ ] Write run analysis flow tests
- [ ] Write billing flow tests

### Phase 4: CI/CD Integration (Week 2)
- [ ] Create GitHub Actions workflow
- [ ] Add test gates to PRs
- [ ] Set up coverage reporting (Codecov)
- [ ] Add visual regression tests
- [ ] Document testing practices

---

## Package.json Updates

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test:unit && npm run test:e2e"
  },
  "devDependencies": {
    "vitest": "^1.2.0",
    "@vitest/coverage-v8": "^1.2.0",
    "@playwright/test": "^1.40.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.2.0",
    "msw": "^2.0.0"
  }
}
```

---

## Priority Test Cases

### Critical Path Tests (Must Have)
1. ✅ User signup/login flow
2. ✅ Run creation and execution
3. ✅ Billing/subscription upgrade
4. ✅ Dashboard data loading
5. ✅ API authentication

### Important Tests (Should Have)
1. Demand score calculation accuracy
2. Alert detection logic
3. Export functionality
4. Niche comparison
5. Settings updates

### Nice to Have
1. Visual regression for all pages
2. Performance benchmarks
3. Accessibility tests
4. Mobile-specific flows

---

*Document Owner: DemandRadar Engineering Team*
