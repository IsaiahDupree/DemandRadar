# Meta Custom Audiences Usage Guide

## Overview

META-007 provides utilities for configuring and tracking Custom Audiences in Meta/Facebook Ads based on user behavior.

## Features

- Define custom audience configurations with time windows
- Track events specifically for audience building
- Support for value-based and frequency-based audiences
- Predefined audience configurations for common use cases
- Enhanced event parameters for better audience segmentation

## Quick Start

### 1. Using Predefined Audiences

```typescript
import { PREDEFINED_AUDIENCES, trackForAudience } from '@/lib/meta-custom-audiences';

// Track an event for the "Active Users" audience
trackForAudience(PREDEFINED_AUDIENCES.ACTIVE_USERS, 'run_created', {
  runId: 'run-123',
  query: 'AI chatbots'
});
```

### 2. Defining Custom Audiences

```typescript
import { defineCustomAudience, trackForAudience } from '@/lib/meta-custom-audiences';

// Create a custom audience for engaged users
const engagedUsers = defineCustomAudience({
  name: 'Engaged Users',
  description: 'Users who viewed 3+ reports',
  events: ['report_viewed'],
  timeWindow: 30, // last 30 days
  frequencyCondition: {
    minOccurrences: 3
  }
});

// Track events for this audience
trackForAudience(engagedUsers, 'report_viewed', {
  reportId: 'report-456'
});
```

### 3. Value-Based Audiences

```typescript
// Target high-value customers
const highValueCustomers = defineCustomAudience({
  name: 'Premium Customers',
  description: 'Customers who spent over $200',
  events: ['purchase_completed'],
  timeWindow: 180,
  valueCondition: {
    field: 'value',
    operator: 'greater_than',
    value: 200
  }
});

trackForAudience(highValueCustomers, 'purchase_completed', {
  orderId: 'order-789',
  value: 250,
  currency: 'USD',
  plan: 'enterprise'
});
```

## Predefined Audiences

The following audiences are available out of the box:

| Audience | Description | Events | Time Window |
|----------|-------------|--------|-------------|
| `ACTIVE_USERS` | Users who created reports | `run_created`, `run_completed` | 30 days |
| `CONVERTERS` | Users who completed signup | `signup_complete` | 90 days |
| `HIGH_VALUE_CUSTOMERS` | Customers who spent $100+ | `purchase_completed` | 180 days |
| `POWER_USERS` | Users who created 5+ reports | `run_created` | 90 days |
| `RECENT_PURCHASERS` | Users who purchased recently | `purchase_completed` | 30 days |

## Integration with Tracking Provider

```typescript
// In your tracking provider or event handler
import { PREDEFINED_AUDIENCES, trackForAudience } from '@/lib/meta-custom-audiences';

function trackUserAction(event: string, properties: any) {
  // Track for relevant audiences
  if (event === 'run_created') {
    trackForAudience(PREDEFINED_AUDIENCES.ACTIVE_USERS, event, properties);
  }

  if (event === 'purchase_completed') {
    trackForAudience(PREDEFINED_AUDIENCES.HIGH_VALUE_CUSTOMERS, event, properties);
    trackForAudience(PREDEFINED_AUDIENCES.RECENT_PURCHASERS, event, properties);
  }
}
```

## Creating Audiences in Facebook Ads Manager

Once events are tracked with the correct parameters:

1. Go to Facebook Ads Manager > Audiences
2. Click "Create Audience" > "Custom Audience"
3. Choose "Website"
4. Select your Pixel
5. Set up rules based on:
   - Events (e.g., `InitiateCheckout` for `run_created`)
   - Time window (matches your `timeWindow` configuration)
   - Value conditions (if applicable)
   - Frequency (if applicable)

## Event Parameters for Segmentation

The library automatically adds `content_category` to events for better segmentation:

- `market_analysis` - for report-related events
- `purchase` - for checkout and purchase events
- `registration` - for signup events
- `engagement` - for other interactions

You can also provide custom categories:

```typescript
import { getAudienceEventParameters } from '@/lib/meta-custom-audiences';

const params = getAudienceEventParameters('run_completed',
  { query: 'AI chatbots' },
  { contentCategory: 'custom_category' }
);
```

## Testing

Run tests for custom audiences:

```bash
npm test -- __tests__/lib/meta-custom-audiences.test.ts
```

## Related Documentation

- [PRD: Meta Pixel Tracking](./PRD_META_PIXEL_TRACKING.md)
- [Meta Custom Audiences API](https://developers.facebook.com/docs/marketing-api/audiences/guides/custom-audiences)
