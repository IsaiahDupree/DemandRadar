# GapRadar Event Tracking SDK

User event tracking SDK for GapRadar, adapted from the Autonomous Coding Dashboard (ACD) tracking system.

## Installation

The SDK is already installed and ready to use.

## Usage

### Initialize the Tracker

```typescript
import { tracker } from '@/lib/tracking';

// Initialize on app load (e.g., in layout.tsx or _app.tsx)
tracker.init({
  projectId: 'gapradar',
  apiEndpoint: process.env.NEXT_PUBLIC_TRACKING_API,
  debug: process.env.NODE_ENV === 'development',
});
```

### Identify Users

```typescript
// After user logs in
tracker.identify('usr_123', {
  email: 'user@example.com',
  plan: 'pro',
  name: 'John Doe',
});
```

### Track Events

```typescript
// Landing page view
tracker.track('landing_view', { variant: 'hero_v2' });

// User creates an analysis run
tracker.track('run_created', {
  run_id: 'run_xyz',
  niche: 'SaaS productivity',
  keywords: ['project management', 'team collaboration'],
  data_sources: ['google', 'youtube', 'appstore'],
});

// Run completes
tracker.track('run_completed', {
  run_id: 'run_xyz',
  gaps_found: 12,
  processing_time_ms: 15000,
  demand_score_avg: 78,
});

// Track conversions
tracker.trackConversion('purchase', 99.99, {
  plan: 'pro',
  orderId: 'ORD-123',
});
```

### Auto-Tracking

The SDK automatically tracks:
- Page views (including SPA navigation)
- Clicks on buttons and links
- Form submissions
- Scroll depth (25%, 50%, 75%, 100%)
- JavaScript errors
- Core Web Vitals (LCP, FID, CLS, FCP, TTFB)
- Outbound links

To disable auto-tracking:

```typescript
tracker.init({
  projectId: 'gapradar',
  autoTrack: {
    pageViews: true,
    clicks: false, // Disable automatic click tracking
    scrollDepth: false,
    forms: true,
    errors: true,
    performance: true,
    outboundLinks: true,
  },
});
```

## Event Reference

### Acquisition Events
- `landing_view` - Landing page viewed
- `cta_click` - CTA button clicked
- `pricing_view` - Pricing page viewed
- `trend_clicked` - Trending topic clicked

### Activation Events
- `signup_start` - Signup form opened
- `signup_submit` - Signup form submitted
- `login_success` - User logged in
- `activation_complete` - User onboarding complete

### Core Value Events
- `run_created` - New analysis run started
- `run_completed` - Analysis run finished
- `report_viewed` - User viewed a report
- `report_downloaded` - PDF/CSV exported
- `gap_saved` - Gap saved to favorites

### Monetization Events
- `checkout_started` - Checkout flow initiated
- `purchase_completed` - Payment successful
- `subscription_started` - Recurring subscription started

## Configuration Options

```typescript
interface TrackerConfig {
  projectId: string;              // Required: Project identifier
  apiEndpoint?: string;           // API endpoint for event data
  debug?: boolean;                // Enable console logging
  sessionTimeout?: number;        // Session timeout in minutes (default: 30)
  batchSize?: number;             // Events per batch (default: 10)
  flushInterval?: number;         // Flush interval in ms (default: 5000)
  respectDoNotTrack?: boolean;    // Honor DNT header (default: true)
  maskSelectors?: string[];       // CSS selectors to mask in events
  excludePaths?: RegExp[];        // Paths to exclude from tracking
  autoTrack?: {
    pageViews?: boolean;
    clicks?: boolean;
    scrollDepth?: boolean;
    forms?: boolean;
    errors?: boolean;
    performance?: boolean;
    outboundLinks?: boolean;
  };
}
```

## Testing

Tests are located in `__tests__/lib/tracking.test.ts`. Run with:

```bash
npm test -- __tests__/lib/tracking.test.ts
```

## Implementation Status

✅ **TRACK-001: Tracking SDK Integration** - Complete

All 17 tests passing.
