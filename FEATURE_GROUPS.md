# DemandRadar Feature Groups

**Last Updated:** January 16, 2026

---

## Feature Group Overview

| Group | Description | Priority | Status |
|-------|-------------|----------|--------|
| FG1 | Data Collection | Critical | 70% |
| FG2 | AI Processing | Critical | 95% |
| FG3 | Scoring Engine | Critical | 85% |
| FG4 | Report Generation | Critical | 0% |
| FG5 | User Interface | High | 60% |
| FG6 | Authentication | High | 100% |
| FG7 | Payments | Medium | 50% |
| FG8 | Testing | High | 0% |
| FG9 | Infrastructure | Critical | 80% |

---

## FG1: Data Collection

### Purpose
Gather raw market data from multiple external sources to fuel analysis.

### Features

#### FG1.1 Meta Ads Collection ✅ COMPLETE

| Feature | Description | Status | API/Method |
|---------|-------------|--------|------------|
| FG1.1.1 | Marketing API integration | ✅ | Graph API v24.0 |
| FG1.1.2 | Ad Library browser scraping | ✅ | Puppeteer automation |
| FG1.1.3 | Keyword search | ✅ | URL params |
| FG1.1.4 | Country filtering | ✅ | URL params |
| FG1.1.5 | Platform filtering | ✅ | Facebook/Instagram/etc |
| FG1.1.6 | Media type filtering | ✅ | Video/Image/All |
| FG1.1.7 | Date range filtering | ✅ | start_date[min/max] |
| FG1.1.8 | Language filtering | ✅ | content_languages |
| FG1.1.9 | Advertiser-specific search | ✅ | Page ID |
| FG1.1.10 | Data normalization | ✅ | MetaAd interface |
| FG1.1.11 | Mock data fallback | ✅ | Development mode |

**Files:**
- `src/lib/collectors/meta.ts`
- `src/lib/collectors/ad-library-scraper.ts`
- `src/app/api/scrape/ad-library/route.ts`
- `src/app/api/meta/accounts/route.ts`
- `src/app/api/meta/ads/[accountId]/route.ts`

---

#### FG1.2 Reddit Collection ✅ COMPLETE

| Feature | Description | Status | API/Method |
|---------|-------------|--------|------------|
| FG1.2.1 | Global search | ✅ | Public JSON API |
| FG1.2.2 | Subreddit-specific search | ✅ | /r/{sub}/search.json |
| FG1.2.3 | Sort options | ✅ | relevance/hot/new/top |
| FG1.2.4 | Time filtering | ✅ | hour/day/week/month/year |
| FG1.2.5 | Score extraction | ✅ | Upvotes |
| FG1.2.6 | Comment count | ✅ | num_comments |
| FG1.2.7 | Entity matching | ✅ | Search term tracking |
| FG1.2.8 | Deduplication | ✅ | By permalink |
| FG1.2.9 | Rate limiting | ✅ | 500ms delay |
| FG1.2.10 | Mock data fallback | ✅ | Development mode |

**Files:**
- `src/lib/collectors/reddit.ts`

---

#### FG1.3 App Store Collection ⚠️ PARTIAL

| Feature | Description | Status | API/Method |
|---------|-------------|--------|------------|
| FG1.3.1 | iOS app search | ✅ | iTunes Search API |
| FG1.3.2 | App metadata extraction | ✅ | Name, rating, reviews |
| FG1.3.3 | Category extraction | ✅ | primaryGenreName |
| FG1.3.4 | Price extraction | ✅ | formattedPrice |
| FG1.3.5 | Android app search | ❌ | SerpAPI (not implemented) |
| FG1.3.6 | Web competitor search | ❌ | Not implemented |
| FG1.3.7 | Cross-platform dedup | ❌ | Not implemented |

**Files:**
- `src/lib/collectors/appstore.ts`

**Missing Implementation:**
```typescript
// Android collector (TO ADD to appstore.ts)
export async function searchPlayStore(
  query: string,
  options?: { country?: string; limit?: number }
): Promise<AppStoreResult[]> {
  const SERPAPI_KEY = process.env.SERPAPI_KEY;
  if (!SERPAPI_KEY) return [];
  
  const response = await fetch(
    `https://serpapi.com/search.json?engine=google_play&q=${encodeURIComponent(query)}&store=apps&api_key=${SERPAPI_KEY}`
  );
  // ... normalize to AppStoreResult
}
```

---

#### FG1.4 Google Ads Collection ❌ NOT IMPLEMENTED

| Feature | Description | Status | API/Method |
|---------|-------------|--------|------------|
| FG1.4.1 | Search ads collection | ❌ | SerpAPI |
| FG1.4.2 | Display ads collection | ❌ | SerpAPI |
| FG1.4.3 | Advertiser extraction | ❌ | - |
| FG1.4.4 | Creative text extraction | ❌ | - |
| FG1.4.5 | Keyword association | ❌ | - |
| FG1.4.6 | Mock data fallback | ❌ | - |

**Implementation Required:**
```typescript
// src/lib/collectors/google.ts (TO CREATE)

export interface GoogleAd {
  source: 'google';
  advertiser_name: string;
  headline: string;
  description: string;
  display_url: string;
  position?: number;
  keywords?: string[];
  raw_payload?: Record<string, unknown>;
}

export async function collectGoogleAds(
  query: string,
  options?: { country?: string; limit?: number }
): Promise<GoogleAd[]> {
  const SERPAPI_KEY = process.env.SERPAPI_KEY;
  
  if (!SERPAPI_KEY) {
    return generateMockGoogleAds(query);
  }

  const response = await fetch(
    `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}`
  );
  
  const data = await response.json();
  
  return (data.ads || []).map((ad: any) => ({
    source: 'google',
    advertiser_name: ad.advertiser || 'Unknown',
    headline: ad.title || '',
    description: ad.description || '',
    display_url: ad.displayed_link || '',
    position: ad.position,
    keywords: [query],
    raw_payload: ad,
  }));
}
```

---

#### FG1.5 UGC Collection ❌ NOT IMPLEMENTED (Future)

| Feature | Description | Status | API/Method |
|---------|-------------|--------|------------|
| FG1.5.1 | TikTok Creative Center | ❌ | API (requires approval) |
| FG1.5.2 | TikTok Commercial API | ❌ | API (requires approval) |
| FG1.5.3 | Instagram Hashtag Search | ❌ | Graph API |
| FG1.5.4 | Connected account insights | ❌ | OAuth |

**Complexity:** High - Requires platform app approvals

---

## FG2: AI Processing

### Purpose
Use LLMs to extract structured insights from raw data.

### Features

#### FG2.1 Insight Extraction ✅ COMPLETE

| Feature | Description | Status | Model |
|---------|-------------|--------|-------|
| FG2.1.1 | Offer extraction | ✅ | GPT-4o-mini |
| FG2.1.2 | Claim extraction | ✅ | GPT-4o-mini |
| FG2.1.3 | Angle extraction | ✅ | GPT-4o-mini |
| FG2.1.4 | Objection extraction | ✅ | GPT-4o-mini |
| FG2.1.5 | Feature request extraction | ✅ | GPT-4o-mini |
| FG2.1.6 | Sentiment analysis | ✅ | GPT-4o-mini |
| FG2.1.7 | JSON response parsing | ✅ | response_format |
| FG2.1.8 | Mock data fallback | ✅ | When no API key |

**Files:**
- `src/lib/ai/extractor.ts`

---

#### FG2.2 Clustering ✅ COMPLETE

| Feature | Description | Status |
|---------|-------------|--------|
| FG2.2.1 | Angle clustering | ✅ |
| FG2.2.2 | Objection clustering | ✅ |
| FG2.2.3 | Feature clustering | ✅ |
| FG2.2.4 | Offer clustering | ✅ |
| FG2.2.5 | Frequency calculation | ✅ |
| FG2.2.6 | Intensity scoring | ✅ |

**Files:**
- `src/lib/ai/extractor.ts` (clusterInsights function)

---

#### FG2.3 Gap Generation ✅ COMPLETE

| Feature | Description | Status | Model |
|---------|-------------|--------|-------|
| FG2.3.1 | Gap identification | ✅ | GPT-4o-mini |
| FG2.3.2 | Evidence linking (ads) | ✅ | Structured output |
| FG2.3.3 | Evidence linking (reddit) | ✅ | Structured output |
| FG2.3.4 | Recommendation generation | ✅ | GPT-4o-mini |
| FG2.3.5 | Gap type classification | ✅ | product/offer/positioning/trust/pricing |
| FG2.3.6 | Opportunity scoring | ✅ | 0-100 scale |
| FG2.3.7 | Confidence scoring | ✅ | 0-1 scale |

**Files:**
- `src/lib/ai/gap-generator.ts`

---

#### FG2.4 Concept Generation ✅ COMPLETE

| Feature | Description | Status |
|---------|-------------|--------|
| FG2.4.1 | Product idea generation | ✅ |
| FG2.4.2 | Platform recommendation | ✅ |
| FG2.4.3 | Platform reasoning | ✅ |
| FG2.4.4 | Business model classification | ✅ |
| FG2.4.5 | MVP spec generation | ✅ |
| FG2.4.6 | ICP definition | ✅ |
| FG2.4.7 | Gap thesis | ✅ |
| FG2.4.8 | Metrics estimation | ✅ |

**Files:**
- `src/lib/ai/concept-generator.ts`

---

#### FG2.5 UGC Recommendations ✅ COMPLETE

| Feature | Description | Status |
|---------|-------------|--------|
| FG2.5.1 | Hook generation (10) | ✅ |
| FG2.5.2 | Script outlines (3) | ✅ |
| FG2.5.3 | Shot list (6) | ✅ |
| FG2.5.4 | Angle mapping (5) | ✅ |
| FG2.5.5 | Priority ranking | ✅ |

**Files:**
- `src/lib/ai/ugc-generator.ts`

---

## FG3: Scoring Engine

### Purpose
Calculate quantitative scores for opportunity assessment.

### Features

| Feature | PRD Formula | Status | Notes |
|---------|-------------|--------|-------|
| FG3.1 | Saturation Score | ✅ | §5.A implemented |
| FG3.2 | Longevity Score | ✅ | §5.B implemented |
| FG3.3 | Dissatisfaction Score | ✅ | §5.C implemented |
| FG3.4 | Misalignment Score | ✅ | §5.D implemented |
| FG3.5 | Opportunity Score | ✅ | §5.E implemented |
| FG3.6 | Confidence Score | ✅ | §5.F implemented |
| FG3.7 | Build-to-Profit Score | ⚠️ | §5.G partial |
| FG3.8 | UGC Scoring | ❌ | §5.H missing |

**Files:**
- `src/lib/scoring.ts`

**Missing Implementation:**
```typescript
// Add to src/lib/scoring.ts

/**
 * UGC Score (0-100)
 * Ad-tested: 0.45*Longevity + 0.35*Reach + 0.20*Engagement
 * Trend: 0.6*Recency + 0.4*Relevance
 */
export function calculateUGCScore(
  asset: UGCAsset,
  metrics: UGCMetrics,
  type: 'ad_tested' | 'trend'
): number {
  if (type === 'ad_tested') {
    const longevity = calculateAssetLongevity(asset);
    const reach = normalizeReach(metrics.views);
    const engagement = calculateEngagement(metrics);
    return 0.45 * longevity + 0.35 * reach + 0.20 * engagement;
  } else {
    const recency = calculateRecency(asset.posted_at);
    const relevance = metrics.relevance_score || 0.5;
    return 0.6 * recency + 0.4 * relevance;
  }
}
```

---

## FG4: Report Generation

### Purpose
Generate human-readable reports and downloadable exports.

### Features

| Feature | Description | Status | Priority |
|---------|-------------|--------|----------|
| FG4.1 | Report data API | ❌ | P0 |
| FG4.2 | Executive Summary page | ❌ | P0 |
| FG4.3 | Market Snapshot page | ❌ | P0 |
| FG4.4 | Pain Map page | ❌ | P0 |
| FG4.5 | Platform Gap page | ❌ | P0 |
| FG4.6 | Gap Opportunities page | ❌ | P0 |
| FG4.7 | Economics page | ❌ | P1 |
| FG4.8 | Buildability page | ❌ | P1 |
| FG4.9 | UGC Pack page | ❌ | P1 |
| FG4.10 | Action Plan page | ❌ | P2 |
| FG4.11 | PDF export | ❌ | P0 |
| FG4.12 | CSV export | ❌ | P1 |
| FG4.13 | JSON export | ❌ | P1 |
| FG4.14 | Share links | ❌ | P2 |

**Files to Create:**
```
src/app/dashboard/reports/[id]/
├── page.tsx
├── components/
│   ├── ExecutiveSummary.tsx
│   ├── MarketSnapshot.tsx
│   ├── PainMap.tsx
│   ├── PlatformGap.tsx
│   ├── GapList.tsx
│   ├── Economics.tsx
│   ├── Buildability.tsx
│   ├── UGCPack.tsx
│   └── ActionPlan.tsx
└── loading.tsx

src/app/api/reports/[id]/
├── route.ts        # GET report data
└── pdf/route.ts    # GET PDF download

src/app/api/exports/[runId]/
└── route.ts        # GET CSV/JSON
```

---

## FG5: User Interface

### Purpose
Provide intuitive interface for users to interact with the system.

### Features

| Feature | Description | Status |
|---------|-------------|--------|
| FG5.1 | Landing page | ✅ |
| FG5.2 | Dashboard home | ✅ |
| FG5.3 | New run form | ✅ |
| FG5.4 | Runs list | ✅ |
| FG5.5 | Gaps viewer | ✅ |
| FG5.6 | Ideas viewer | ✅ |
| FG5.7 | Reports list | ✅ |
| FG5.8 | UGC viewer | ✅ |
| FG5.9 | Settings page | ✅ |
| FG5.10 | Report viewer | ❌ |
| FG5.11 | Run progress UI | ❌ |
| FG5.12 | Comparison view | ❌ |
| FG5.13 | Mobile responsive | ⚠️ |

**Files:**
```
src/app/dashboard/
├── page.tsx          ✅
├── new-run/page.tsx  ✅
├── runs/page.tsx     ✅
├── gaps/page.tsx     ✅
├── ideas/page.tsx    ✅
├── reports/page.tsx  ✅
├── ugc/page.tsx      ✅
├── trends/page.tsx   ✅
└── settings/page.tsx ✅
```

---

## FG6: Authentication

### Purpose
Secure user access and session management.

### Features ✅ ALL COMPLETE

| Feature | Description | Status |
|---------|-------------|--------|
| FG6.1 | Email/password signup | ✅ |
| FG6.2 | Email/password login | ✅ |
| FG6.3 | Session management | ✅ |
| FG6.4 | Protected routes | ✅ |
| FG6.5 | Auth middleware | ✅ |
| FG6.6 | Logout | ✅ |

**Files:**
- `src/app/login/page.tsx`
- `src/app/signup/page.tsx`
- `src/app/auth/callback/route.ts`
- `src/lib/supabase/middleware.ts`

---

## FG7: Payments

### Purpose
Handle subscriptions and one-time purchases.

### Features

| Feature | Description | Status |
|---------|-------------|--------|
| FG7.1 | Stripe integration | ✅ |
| FG7.2 | Checkout session | ✅ |
| FG7.3 | Webhook handling | ⚠️ |
| FG7.4 | Plan management | ⚠️ |
| FG7.5 | Usage tracking | ⚠️ |
| FG7.6 | Invoice history | ❌ |

**Files:**
- `src/lib/stripe.ts`
- `src/app/api/checkout/route.ts`
- `src/app/api/webhooks/stripe/route.ts`

---

## FG8: Testing

### Purpose
Ensure code quality and prevent regressions.

### Features

| Feature | Description | Status |
|---------|-------------|--------|
| FG8.1 | Jest configuration | ❌ |
| FG8.2 | Unit tests - Scoring | ❌ |
| FG8.3 | Unit tests - Collectors | ❌ |
| FG8.4 | Unit tests - AI | ❌ |
| FG8.5 | Integration tests - API | ❌ |
| FG8.6 | Integration tests - Pipeline | ❌ |
| FG8.7 | E2E tests - Auth | ❌ |
| FG8.8 | E2E tests - Runs | ❌ |
| FG8.9 | E2E tests - Reports | ❌ |

---

## FG9: Infrastructure

### Purpose
Supporting services and deployment.

### Features

| Feature | Description | Status |
|---------|-------------|--------|
| FG9.1 | Local Supabase | ✅ |
| FG9.2 | Database migrations | ✅ |
| FG9.3 | RLS policies | ✅ |
| FG9.4 | Environment config | ✅ |
| FG9.5 | Production Supabase | ❌ |
| FG9.6 | Vercel deployment | ❌ |
| FG9.7 | Domain setup | ❌ |
| FG9.8 | SSL/HTTPS | ❌ |
| FG9.9 | Error monitoring | ❌ |
| FG9.10 | Logging | ❌ |

---

## Feature Dependency Graph

```
FG1 (Data Collection)
    │
    ▼
FG2 (AI Processing) ◄─── FG3 (Scoring)
    │
    ▼
FG4 (Reports) ─────────► FG5 (UI)
    │
    ▼
FG8 (Testing)
    │
    ▼
FG9 (Infrastructure) ──► DEPLOYMENT

FG6 (Auth) ◄───────────► FG7 (Payments)
```

---

## Implementation Order

### Phase 1: Complete Core (Current)
1. ~~FG1.1 Meta Ads~~ ✅
2. ~~FG1.2 Reddit~~ ✅
3. ~~FG2.1-2.5 AI Processing~~ ✅
4. ~~FG3.1-3.6 Scoring~~ ✅

### Phase 2: Reports & Exports (Next)
1. FG4.1 Report Data API
2. FG4.2-4.6 Core Report Pages
3. FG4.11 PDF Export
4. FG4.12-4.13 CSV/JSON Export

### Phase 3: Testing
1. FG8.1 Test Setup
2. FG8.2-8.4 Unit Tests
3. FG8.5-8.6 Integration Tests

### Phase 4: Launch Prep
1. FG9.5-9.8 Production Infrastructure
2. FG7.3-7.5 Complete Payments
3. Final QA

### Phase 5: Enhancements (Post-Launch)
1. FG1.4 Google Ads
2. FG1.3.5 Android Apps
3. FG5.10-5.12 Advanced UI
4. FG8.7-8.9 E2E Tests

---

*Document maintained by development team. Update as features are completed.*
