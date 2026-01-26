# PRD: Event Tracking System for GapRadar

**Status:** Active  
**Created:** 2026-01-25  
**Based On:** BlankLogo Event Tracking Pattern

## Overview

Implement sophisticated user event tracking for GapRadar to optimize the funnel from landing → signup → first run → purchase.

## Event Categories

| Category | Events |
|----------|--------|
| **Acquisition** | `landing_view`, `cta_click`, `pricing_view`, `trend_clicked` |
| **Activation** | `signup_start`, `signup_submit`, `login_success`, `activation_complete` |
| **Core Value** | `run_created`, `run_completed`, `report_viewed`, `report_downloaded`, `gap_saved` |
| **Monetization** | `checkout_started`, `purchase_completed`, `subscription_started` |
| **Retention** | `return_session`, `run_returning_user` |
| **Reliability** | `error_shown`, `api_error`, `run_failed` |

## Required Properties (All Events)

```json
{
  "distinct_id": "anon_xxx",
  "user_id": "usr_xxx",
  "session_id": "sess_xxx",
  "timestamp": "ISO 8601",
  "source": "web | server",
  "utm_source": "string",
  "utm_campaign": "string",
  "utm_content": "string",
  "fbclid": "string",
  "referrer": "string"
}
```

## Core Value Event Properties

### run_created
```json
{
  "run_id": "string",
  "niche": "string",
  "keywords": ["array"],
  "data_sources": ["google", "youtube", "appstore"]
}
```

### run_completed
```json
{
  "run_id": "string",
  "gaps_found": "number",
  "processing_time_ms": "number",
  "demand_score_avg": "number"
}
```

## 4 North Star Milestones

1. **Activated** = `activation_complete` (logged in + ready)
2. **First Value** = first `run_completed`
3. **Aha Moment** = first `report_downloaded`
4. **Monetized** = `purchase_completed`

## Implementation

### Install SDK
```typescript
// src/lib/tracking/userEventTracker.ts
// Copy from ACD: autonomous-coding-dashboard/harness/shared/userEventTracker.ts
```

### Initialize
```typescript
import { tracker } from '@/lib/tracking/userEventTracker';

tracker.init({
  projectId: 'gapradar',
  apiEndpoint: process.env.NEXT_PUBLIC_TRACKING_API,
});
```

### Track Events
```typescript
// Landing page
tracker.track('landing_view', { landing_variant: 'hero_v2' });

// Run completion
tracker.track('run_completed', {
  run_id: run.id,
  gaps_found: run.gaps.length,
  processing_time_ms: run.duration,
});

// Conversion
tracker.trackConversion('purchase', order.amount, {
  plan: order.plan,
  orderId: order.id,
});
```

## Features

| ID | Name | Priority |
|----|------|----------|
| TRACK-001 | Tracking SDK Integration | P1 |
| TRACK-002 | Acquisition Event Tracking | P1 |
| TRACK-003 | Activation Event Tracking | P1 |
| TRACK-004 | Core Value Event Tracking | P1 |
| TRACK-005 | Monetization Event Tracking | P1 |
| TRACK-006 | Retention Event Tracking | P2 |
| TRACK-007 | Error & Performance Tracking | P2 |
| TRACK-008 | User Identification | P1 |

## Success Metrics

- Track 100% of landing → signup → purchase funnel
- Measure activation rate (login/signup)
- Measure aha rate (download/activation)
- Measure purchase rate (purchase/aha)
