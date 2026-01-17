# Testing Quick Start Guide

## Running Tests

### Build Verification
```bash
# Verify the app builds successfully
npm run verify-build
```

### E2E Tests - All Tests
```bash
# Run all E2E tests in headless mode
npm run test:e2e

# Run tests with UI (recommended for debugging)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug
```

### E2E Tests - Specific Suites
```bash
# Page 404 tests (route validation)
npx playwright test e2e/pages.spec.ts

# Button interaction tests
npx playwright test e2e/buttons.spec.ts

# Data hydration tests (loading states, data display)
npx playwright test e2e/data-hydration.spec.ts

# Functionality audit (forms, filters, navigation)
npx playwright test e2e/functionality-audit.spec.ts

# Full user workflows
npx playwright test e2e/workflows/
```

### E2E Tests - By Browser
```bash
# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run on mobile
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

## Test Reports

```bash
# View last test report
npx playwright show-report

# Generate coverage report (if configured)
npm run test:coverage
```

## Pre-Deployment Checklist

Before deploying to production, run:

```bash
# 1. Verify build succeeds
npm run verify-build

# 2. Run all E2E tests
npm run test:e2e

# 3. Check test report
npx playwright show-report
```

## Test Files Overview

```
e2e/
├── pages.spec.ts                  # Route 404 validation
├── buttons.spec.ts                # Button interaction tests
├── data-hydration.spec.ts         # Data loading tests
├── functionality-audit.spec.ts    # Feature functionality tests
└── workflows/
    ├── signup-to-report.spec.ts   # Complete user journey
    └── run-analysis.spec.ts       # Analysis creation workflow
```

## Common Issues

### Tests failing due to no authentication
- Some tests require authentication
- They will skip automatically if not logged in
- This is expected behavior

### Tests skipping due to no data
- Tests intelligently skip when no data exists
- Run a full analysis to populate test data
- Or use seed data

### Build verification failing
- Check TypeScript errors: `npm run lint`
- Verify all dependencies: `npm install`
- Clear cache: `rm -rf .next && npm run build`

## CI/CD Integration

Tests are configured to run in CI environments with:
- Automatic retries (2 attempts)
- Parallel execution disabled in CI
- Screenshots on failure
- Traces on first retry

See `playwright.config.ts` for full configuration.
