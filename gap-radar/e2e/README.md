# E2E Tests

End-to-end tests for DemandRadar using Playwright.

## Setup

1. Install Playwright browsers:
```bash
npx playwright install
```

2. Create test environment file:
```bash
cp .env.e2e.example .env.e2e
```

3. Update `.env.e2e` with test credentials:
```env
TEST_USER_EMAIL=your-test-user@example.com
TEST_USER_PASSWORD=your-test-password
```

## Running Tests

Run all E2E tests:
```bash
npm run test:e2e
```

Run with UI mode (interactive):
```bash
npm run test:e2e:ui
```

Run in headed mode (see browser):
```bash
npm run test:e2e:headed
```

Run in debug mode:
```bash
npm run test:e2e:debug
```

Run specific test file:
```bash
npx playwright test e2e/auth.spec.ts
```

Run specific test:
```bash
npx playwright test -g "should sign in successfully"
```

## Test Structure

- `auth.spec.ts` - Authentication flows (sign up, sign in, sign out)
- `new-run.spec.ts` - Creating new analysis runs
- `report.spec.ts` - Viewing and interacting with reports

## Test Configuration

Configuration is in `playwright.config.ts`:
- Tests run on Chromium, Firefox, and WebKit
- Mobile viewports tested (Pixel 5, iPhone 12)
- Screenshots on failure
- Traces on retry
- Automatically starts dev server

## Environment Variables

- `TEST_USER_EMAIL` - Email for test account
- `TEST_USER_PASSWORD` - Password for test account
- `TEST_REPORT_ID` - (Optional) Specific report ID to test
- `PLAYWRIGHT_TEST_BASE_URL` - Base URL (default: http://localhost:3000)
- `CI` - Set to enable CI-specific settings

## CI/CD Integration

For GitHub Actions:
```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run Playwright tests
  run: npm run test:e2e
  env:
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

## Writing Tests

Example test structure:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
  });

  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```

## Best Practices

1. Use data-testid attributes for reliable selectors
2. Wait for network idle on navigation
3. Skip tests when prerequisites aren't met
4. Use page object models for complex flows
5. Clean up test data when possible

## Troubleshooting

**Tests fail to find elements:**
- Check if selectors match your implementation
- Verify page has loaded completely
- Use `page.waitForSelector()` for dynamic content

**Authentication issues:**
- Verify test credentials in `.env.e2e`
- Check if test user exists in database
- Ensure Supabase is running

**Timeout errors:**
- Increase timeout in test or config
- Check if dev server is running
- Verify network requests complete

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
