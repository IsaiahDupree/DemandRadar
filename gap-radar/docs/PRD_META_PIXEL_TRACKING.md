# PRD: Meta Pixel & CAPI Integration for GapRadar

**Status:** Active  
**Created:** 2026-01-25  
**Priority:** P1

## Overview

Implement Facebook Meta Pixel and Conversions API (CAPI) for GapRadar to enable retargeting, lookalike audiences, and conversion optimization for ad campaigns.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser       │     │   Next.js API    │     │   Meta CAPI     │
│   Meta Pixel    │────▶│   Server Events  │────▶│   Endpoint      │
│   (Client)      │     │   (Dedup)        │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Implementation

### 1. Pixel Installation

```typescript
// src/lib/meta-pixel.ts
export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

export const pageview = () => {
  window.fbq('track', 'PageView');
};

export const event = (name: string, options = {}) => {
  window.fbq('track', name, options);
};
```

### 2. Standard Events Mapping

| GapRadar Event | Meta Standard Event | Parameters |
|----------------|---------------------|------------|
| `landing_view` | `PageView` | - |
| `signup_start` | `Lead` | - |
| `signup_complete` | `CompleteRegistration` | `content_name`, `status` |
| `run_created` | `InitiateCheckout` | `content_ids`, `num_items` |
| `run_completed` | `ViewContent` | `content_type`, `content_ids` |
| `checkout_started` | `AddToCart` | `value`, `currency` |
| `purchase_completed` | `Purchase` | `value`, `currency`, `content_ids` |

### 3. CAPI Server-Side Events

```typescript
// src/app/api/meta-capi/route.ts
import crypto from 'crypto';

export async function POST(req: Request) {
  const { event_name, user_data, custom_data, event_source_url } = await req.json();
  
  const payload = {
    data: [{
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url,
      action_source: 'website',
      user_data: {
        em: user_data.email ? hashSHA256(user_data.email.toLowerCase()) : undefined,
        ph: user_data.phone ? hashSHA256(user_data.phone) : undefined,
        client_ip_address: req.headers.get('x-forwarded-for'),
        client_user_agent: req.headers.get('user-agent'),
        fbc: user_data.fbc,
        fbp: user_data.fbp,
      },
      custom_data,
    }],
    access_token: process.env.META_CAPI_ACCESS_TOKEN,
  };

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${process.env.META_PIXEL_ID}/events`,
    { method: 'POST', body: JSON.stringify(payload) }
  );
  
  return Response.json(await response.json());
}
```

### 4. Event Deduplication

Use `event_id` to prevent duplicate counting between browser Pixel and CAPI:

```typescript
const eventId = `${event_name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Browser
fbq('track', 'Purchase', { value: 99, currency: 'USD' }, { eventID: eventId });

// Server (CAPI)
await sendCAPIEvent({ event_name: 'Purchase', event_id: eventId, ... });
```

## Environment Variables

```env
NEXT_PUBLIC_FB_PIXEL_ID=your_pixel_id
META_PIXEL_ID=your_pixel_id
META_CAPI_ACCESS_TOKEN=your_access_token
```

## Features

| ID | Name | Priority |
|----|------|----------|
| META-001 | Meta Pixel Installation | P1 |
| META-002 | PageView Tracking | P1 |
| META-003 | Standard Events Mapping | P1 |
| META-004 | CAPI Server-Side Events | P1 |
| META-005 | Event Deduplication | P1 |
| META-006 | User Data Hashing (PII) | P1 |
| META-007 | Custom Audiences Setup | P2 |
| META-008 | Conversion Optimization | P2 |

## Success Metrics

- 100% of purchases tracked via both Pixel and CAPI
- Event match quality score > 6.0
- Deduplication working (no double-counted events)
