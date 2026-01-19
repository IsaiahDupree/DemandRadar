# PRD: Unified Demand Score System

> **Status:** Draft  
> **Priority:** High  
> **Estimated Effort:** 2-3 weeks  
> **Created:** January 19, 2026

---

## Problem Statement

Currently, DemandRadar only uses Reddit and Meta Ad signals for demand analysis. The original spec defines a **5-signal weighted scoring system** that provides more accurate market opportunity assessment. Without all signals integrated, users get an incomplete picture of market demand.

### Current State
- ✅ Reddit pain point signals (25% weight)
- ✅ Meta ad spend signals (25% weight)
- ❌ Google search demand (20% weight) — collector exists, not integrated
- ❌ YouTube content gaps (15% weight) — collector exists, not integrated
- ❌ App Store signals (15% weight) — collector exists, not integrated

---

## Goals

1. **Accurate Scoring:** Implement the full 5-signal demand score formula
2. **Better Recommendations:** More data = better "what to build" suggestions
3. **Trend Detection:** Enable trend velocity tracking across all signals
4. **Differentiation:** Competitors only use 1-2 signals; we use 5

### Success Metrics
| Metric | Target |
|--------|--------|
| Signal coverage | 5/5 sources integrated |
| Score accuracy | >80% correlation with actual market success |
| API response time | <2s for unified score calculation |
| User engagement | 40% increase in run completions |

---

## User Stories

1. **As a founder**, I want to see a demand score that factors in search volume, so I know if people are actively looking for solutions.

2. **As a marketer**, I want to see YouTube content gaps, so I can identify underserved tutorial opportunities.

3. **As an agency**, I want App Store signals, so I can recommend mobile-first vs web-first strategies to clients.

4. **As a user**, I want to see which signals are driving my demand score, so I can validate the recommendation.

---

## Technical Specification

### Database Schema Updates

```sql
-- Add missing columns to demand_snapshots or create unified_scores table
ALTER TABLE demand_snapshots ADD COLUMN IF NOT EXISTS search_score DECIMAL(5,2) DEFAULT 0;
ALTER TABLE demand_snapshots ADD COLUMN IF NOT EXISTS content_score DECIMAL(5,2) DEFAULT 0;
ALTER TABLE demand_snapshots ADD COLUMN IF NOT EXISTS app_score DECIMAL(5,2) DEFAULT 0;

-- Add signal breakdown for transparency
ALTER TABLE demand_snapshots ADD COLUMN IF NOT EXISTS signal_breakdown JSONB DEFAULT '{}';

-- Ensure demand_score uses unified formula
-- Formula: (pain * 0.25) + (spend * 0.25) + (search * 0.20) + (content * 0.15) + (app * 0.15)
```

### API Endpoints

```typescript
// Enhanced demand collection
POST /api/demand/collect
Body: {
  niche: string,
  sources: ['reddit', 'meta', 'google', 'youtube', 'appstore'] // all by default
}

// Get unified score with breakdown
GET /api/demand/score?niche={niche}
Response: {
  niche: string,
  demand_score: number,
  breakdown: {
    pain_score: { value: number, weight: 0.25, signals: Signal[] },
    spend_score: { value: number, weight: 0.25, signals: Signal[] },
    search_score: { value: number, weight: 0.20, signals: Signal[] },
    content_score: { value: number, weight: 0.15, signals: Signal[] },
    app_score: { value: number, weight: 0.15, signals: Signal[] }
  },
  trend: 'rising' | 'stable' | 'declining',
  trend_velocity: number,
  confidence: number
}
```

### Scoring Functions

```typescript
// src/lib/scoring/unified-score.ts

interface SignalScores {
  pain_score: number;      // Reddit
  spend_score: number;     // Meta
  search_score: number;    // Google
  content_score: number;   // YouTube
  app_score: number;       // App Store
}

const WEIGHTS = {
  pain: 0.25,
  spend: 0.25,
  search: 0.20,
  content: 0.15,
  app: 0.15
};

export function calculateUnifiedDemandScore(scores: SignalScores): number {
  return Math.round(
    (scores.pain_score * WEIGHTS.pain) +
    (scores.spend_score * WEIGHTS.spend) +
    (scores.search_score * WEIGHTS.search) +
    (scores.content_score * WEIGHTS.content) +
    (scores.app_score * WEIGHTS.app)
  );
}

// Individual score calculators
export function calculateSearchScore(googleData: GoogleTrendsData): number {
  // Volume * 0.4 + Growth Rate * 0.4 + Commercial Intent * 0.2
  const volumeScore = normalizeVolume(googleData.searchVolume);
  const growthScore = normalizeGrowth(googleData.growthRate);
  const intentScore = calculateCommercialIntent(googleData.relatedQueries);
  
  return Math.round((volumeScore * 0.4) + (growthScore * 0.4) + (intentScore * 0.2));
}

export function calculateContentScore(youtubeData: YouTubeData): number {
  // View Velocity * 0.4 + Comment Questions * 0.3 + Gap Size * 0.3
  const velocityScore = normalizeViewVelocity(youtubeData.avgViews);
  const questionScore = analyzeCommentQuestions(youtubeData.comments);
  const gapScore = identifyContentGaps(youtubeData.videos);
  
  return Math.round((velocityScore * 0.4) + (questionScore * 0.3) + (gapScore * 0.3));
}

export function calculateAppScore(appStoreData: AppStoreData): number {
  // Downloads * 0.3 + Negative Reviews * 0.3 + Feature Requests * 0.4
  const downloadScore = normalizeDownloads(appStoreData.downloads);
  const reviewScore = analyzeNegativeReviews(appStoreData.reviews);
  const requestScore = extractFeatureRequests(appStoreData.reviews);
  
  return Math.round((downloadScore * 0.3) + (reviewScore * 0.3) + (requestScore * 0.4));
}
```

### Collector Integration

```typescript
// src/lib/demand-intelligence/unified-collector.ts

export async function collectAllSignals(niche: string): Promise<SignalScores> {
  // Parallel collection for speed
  const [reddit, meta, google, youtube, appstore] = await Promise.allSettled([
    collectRedditMentions(niche),
    collectMetaAds(niche),
    collectGoogleTrends(niche),
    collectYouTubeContent(niche),
    collectAppStoreData(niche)
  ]);

  return {
    pain_score: reddit.status === 'fulfilled' ? calculatePainScore(reddit.value) : 0,
    spend_score: meta.status === 'fulfilled' ? calculateSpendScore(meta.value) : 0,
    search_score: google.status === 'fulfilled' ? calculateSearchScore(google.value) : 0,
    content_score: youtube.status === 'fulfilled' ? calculateContentScore(youtube.value) : 0,
    app_score: appstore.status === 'fulfilled' ? calculateAppScore(appstore.value) : 0
  };
}
```

---

## UI Requirements

### Score Breakdown Card
Display a visual breakdown showing contribution from each signal:

```
┌─────────────────────────────────────────┐
│ Demand Score: 78/100          ▲ Rising  │
├─────────────────────────────────────────┤
│ Pain Points (Reddit)    ████████░░  82  │
│ Ad Spend (Meta)         ███████░░░  71  │
│ Search Demand (Google)  █████████░  89  │
│ Content Gaps (YouTube)  ██████░░░░  64  │
│ App Market              █████░░░░░  55  │
└─────────────────────────────────────────┘
```

### Signal Deep Dive
Clicking each signal shows supporting data:
- **Pain Points:** Top Reddit posts with upvotes
- **Ad Spend:** Winning ads with run times
- **Search:** Trending keywords with volume
- **Content:** YouTube videos and gap opportunities
- **App Market:** Top apps and review complaints

---

## Implementation Phases

### Phase 1: Google Trends Integration (Week 1)
- [ ] Create `/api/demand/google` endpoint
- [ ] Implement `calculateSearchScore()`
- [ ] Add to unified collector
- [ ] Update UI with search signal

### Phase 2: YouTube Integration (Week 1-2)
- [ ] Create `/api/demand/youtube` endpoint
- [ ] Implement `calculateContentScore()`
- [ ] Add comment question analysis
- [ ] Update UI with content signal

### Phase 3: App Store Integration (Week 2)
- [ ] Create `/api/demand/appstore` endpoint
- [ ] Implement `calculateAppScore()`
- [ ] Add review sentiment analysis
- [ ] Update UI with app signal

### Phase 4: Unified Scoring (Week 2-3)
- [ ] Implement `calculateUnifiedDemandScore()`
- [ ] Add signal breakdown to API response
- [ ] Create score breakdown UI component
- [ ] Add trend velocity calculation

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Google Trends collector | ✅ Exists | `src/lib/collectors/google.ts` |
| YouTube collector | ✅ Exists | `src/lib/collectors/youtube.ts` |
| App Store collector | ✅ Exists | `src/lib/collectors/appstore.ts` |
| OpenAI for analysis | ✅ Active | For sentiment/intent analysis |
| Database migrations | ⏳ Needed | Add new score columns |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| API rate limits | Implement caching, stagger requests |
| Slow response times | Parallel collection, background jobs |
| Missing data for niche | Show partial score with confidence indicator |
| Score gaming | Weight signals dynamically based on data quality |

---

## Out of Scope

- Real-time score updates (batch processing is fine)
- Custom weight configuration by users (v2)
- Historical score comparisons (v2)
- Competitive score benchmarking (separate PRD)

---

*Document Owner: DemandRadar Product Team*
