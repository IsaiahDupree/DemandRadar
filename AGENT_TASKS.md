# DemandRadar - Coding Agent Task Breakdown

**Generated:** January 16, 2026  
**Project Path:** `/Users/isaiahdupree/Documents/Software/WhatsCurrentlyInTheMarket/gap-radar`  
**Total Tasks:** 49  
**Estimated Total Effort:** 14-18 days

---

## How to Use This Document

This task breakdown is organized by priority (P0 → P3) and sprint. Each task includes:
- **Task ID** - Unique identifier
- **Description** - What needs to be done
- **Files** - Files to create or modify
- **Dependencies** - Tasks that must be completed first
- **Effort** - Estimated time
- **Acceptance Criteria** - How to verify completion

---

## SPRINT 1: REPORT GENERATION (P0 - Critical)

### Task 1.1: Report Detail Page Structure
**ID:** `TASK-001`  
**Priority:** P0  
**Effort:** 4 hours  
**Dependencies:** None

**Description:** Create the report detail page that displays a complete analysis report with all 9 sections from PRD §7.

**Files to Create:**
```
src/app/dashboard/reports/[id]/
├── page.tsx                 # Main report page with tabs/sections
├── loading.tsx              # Loading skeleton
└── components/
    ├── ReportNav.tsx        # Navigation between sections
    └── ReportHeader.tsx     # Report title, date, export buttons
```

**Acceptance Criteria:**
- [ ] Route `/dashboard/reports/[runId]` renders report page
- [ ] Fetches report data from `/api/reports/[runId]`
- [ ] Shows loading state while fetching
- [ ] Handles error states gracefully
- [ ] Navigation between 9 report sections works

---

### Task 1.2: Executive Summary Component
**ID:** `TASK-002`  
**Priority:** P0  
**Effort:** 3 hours  
**Dependencies:** TASK-001

**Description:** Build the Executive Summary section (PRD §7.1) showing key scores, top 3 gaps, and primary recommendation.

**File:** `src/app/dashboard/reports/[id]/components/ExecutiveSummary.tsx`

**Data Required:**
```typescript
interface ExecutiveSummaryData {
  nicheQuery: string;
  scores: {
    saturation: number;
    longevity: number;
    dissatisfaction: number;
    misalignment: number;
    opportunity: number;
    confidence: number;
  };
  topGaps: GapOpportunity[]; // Top 3
  primaryRecommendation: string;
  dataPoints: {
    adsAnalyzed: number;
    redditMentions: number;
    appsFound: number;
  };
}
```

**Acceptance Criteria:**
- [ ] Displays all 6 scores with visual indicators (gauge/progress)
- [ ] Shows top 3 gap opportunities with titles
- [ ] Shows primary recommendation
- [ ] Shows data collection summary stats
- [ ] Responsive design

---

### Task 1.3: Market Snapshot Component
**ID:** `TASK-003`  
**Priority:** P0  
**Effort:** 3 hours  
**Dependencies:** TASK-001

**Description:** Build the Paid Market Snapshot section (PRD §7.2) showing top advertisers, common angles, and ad longevity data.

**File:** `src/app/dashboard/reports/[id]/components/MarketSnapshot.tsx`

**Data Required:**
```typescript
interface MarketSnapshotData {
  topAdvertisers: { name: string; adCount: number; longestRunning: number }[];
  commonAngles: { angle: string; frequency: number; intensity: number }[];
  commonOffers: { offer: string; frequency: number }[];
  mediaTypeBreakdown: { type: string; count: number }[];
  averageAdAge: number;
  totalAds: number;
}
```

**Acceptance Criteria:**
- [ ] Table of top 10 advertisers with ad counts
- [ ] Bar chart of common angles by frequency
- [ ] List of common offers
- [ ] Pie chart of media type breakdown
- [ ] Longevity statistics

---

### Task 1.4: Pain Map Component
**ID:** `TASK-004`  
**Priority:** P0  
**Effort:** 3 hours  
**Dependencies:** TASK-001

**Description:** Build the User Pain Map section (PRD §7.3) visualizing Reddit objections, feature requests, and sentiment.

**File:** `src/app/dashboard/reports/[id]/components/PainMap.tsx`

**Data Required:**
```typescript
interface PainMapData {
  objectionClusters: Cluster[];
  featureClusters: Cluster[];
  sentimentBreakdown: { positive: number; negative: number; neutral: number };
  topSubreddits: { name: string; mentionCount: number }[];
  sampleQuotes: { text: string; source: string; score: number }[];
}
```

**Acceptance Criteria:**
- [ ] Heatmap or treemap of objection clusters by intensity
- [ ] List of top feature requests with frequency
- [ ] Sentiment pie chart
- [ ] Top subreddits table
- [ ] Expandable sample quotes section

---

### Task 1.5: Platform Gap Component
**ID:** `TASK-005`  
**Priority:** P0  
**Effort:** 2 hours  
**Dependencies:** TASK-001

**Description:** Build the Platform Existence Gap section (PRD §7.4) showing iOS/Android/Web competitor presence.

**File:** `src/app/dashboard/reports/[id]/components/PlatformGap.tsx`

**Data Required:**
```typescript
interface PlatformGapData {
  platforms: {
    ios: { apps: AppStoreResult[]; count: number };
    android: { apps: AppStoreResult[]; count: number };
    web: { competitors: string[]; count: number };
  };
  gapAnalysis: string; // AI-generated analysis
}
```

**Acceptance Criteria:**
- [ ] 3-column layout for iOS/Android/Web
- [ ] List top 5 apps per platform with ratings
- [ ] Show gap analysis text
- [ ] Visual indicator of platform saturation

---

### Task 1.6: Gap Opportunities Component
**ID:** `TASK-006`  
**Priority:** P0  
**Effort:** 3 hours  
**Dependencies:** TASK-001

**Description:** Build the Gap Opportunities section (PRD §7.5) with ranked list of market gaps.

**File:** `src/app/dashboard/reports/[id]/components/GapList.tsx`

**Data Required:**
```typescript
interface GapListData {
  gaps: GapOpportunity[];
}

interface GapOpportunity {
  id: string;
  gap_type: 'product' | 'offer' | 'positioning' | 'trust' | 'pricing';
  title: string;
  problem: string;
  evidence_ads: string[];
  evidence_reddit: string[];
  recommendation: string;
  opportunity_score: number;
  confidence: number;
}
```

**Acceptance Criteria:**
- [ ] Ranked list of all gaps by opportunity score
- [ ] Each gap card shows type badge, title, problem
- [ ] Expandable evidence section with ad/reddit quotes
- [ ] Recommendation display
- [ ] Score visualization

---

### Task 1.7: Economics Component
**ID:** `TASK-007`  
**Priority:** P1  
**Effort:** 2 hours  
**Dependencies:** TASK-001

**Description:** Build the Modeled Economics section (PRD §7.6) showing CPC, CAC, and TAM estimates.

**File:** `src/app/dashboard/reports/[id]/components/Economics.tsx`

**Acceptance Criteria:**
- [ ] Table of concept ideas with metrics
- [ ] Range displays for CPC (low/expected/high)
- [ ] Range displays for CAC (low/expected/high)
- [ ] Range displays for TAM (low/expected/high)
- [ ] Confidence indicators

---

### Task 1.8: Buildability Component
**ID:** `TASK-008`  
**Priority:** P1  
**Effort:** 2 hours  
**Dependencies:** TASK-001

**Description:** Build the Buildability Assessment section (PRD §7.7) showing difficulty and feasibility.

**File:** `src/app/dashboard/reports/[id]/components/Buildability.tsx`

**Acceptance Criteria:**
- [ ] Implementation difficulty score (1-10) per concept
- [ ] Human touch level indicator
- [ ] Autonomous suitability assessment
- [ ] Technology requirements list

---

### Task 1.9: UGC Pack Component
**ID:** `TASK-009`  
**Priority:** P1  
**Effort:** 3 hours  
**Dependencies:** TASK-001

**Description:** Build the UGC Winners Pack section (PRD §7.8) showing hooks, scripts, and shot lists.

**File:** `src/app/dashboard/reports/[id]/components/UGCPack.tsx`

**Acceptance Criteria:**
- [ ] List of 10 hooks with copy-to-clipboard
- [ ] 5 script outlines with expandable structure
- [ ] 6 shot list items with descriptions
- [ ] 5 angle mappings with priority ranking
- [ ] Download all as text option

---

### Task 1.10: Action Plan Component
**ID:** `TASK-010`  
**Priority:** P2  
**Effort:** 3 hours  
**Dependencies:** TASK-001, AI-2.6

**Description:** Build the Action Plan section (PRD §7.9) showing 7-day and 30-day plans.

**File:** `src/app/dashboard/reports/[id]/components/ActionPlan.tsx`

**Note:** Requires Action Plan AI generator (TASK-020) to be implemented first for real data.

**Acceptance Criteria:**
- [ ] 7-day quick start checklist
- [ ] 30-day detailed action plan
- [ ] Task prioritization display
- [ ] Resource/effort estimates

---

### Task 1.11: PDF Export
**ID:** `TASK-011`  
**Priority:** P0  
**Effort:** 6 hours  
**Dependencies:** TASK-001 through TASK-009

**Description:** Implement PDF report generation using @react-pdf/renderer.

**Files to Create:**
```
src/lib/report-generator.ts           # PDF generation logic
src/app/api/reports/[id]/pdf/route.ts # PDF download endpoint
```

**Implementation:**
```typescript
// src/lib/report-generator.ts
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

export async function generateReportPDF(reportData: ReportData): Promise<Blob> {
  // Build PDF document with all sections
}
```

**Acceptance Criteria:**
- [ ] `npm install @react-pdf/renderer` added to dependencies
- [ ] PDF includes all 9 report sections
- [ ] Professional styling with DemandRadar branding
- [ ] Download triggers from UI button
- [ ] Filename format: `demandradar-{niche}-{date}.pdf`

---

## SPRINT 2: DATA COLLECTION ENHANCEMENTS (P1)

### Task 2.1: Android Play Store Collector
**ID:** `TASK-012`  
**Priority:** P1  
**Effort:** 4 hours  
**Dependencies:** None

**Description:** Extend app store collector to support Android Play Store via SerpAPI.

**File:** `src/lib/collectors/appstore.ts` (modify)

**Implementation:**
```typescript
export async function searchPlayStore(
  query: string,
  options?: { country?: string; limit?: number }
): Promise<AppStoreResult[]> {
  const serpApiKey = process.env.SERPAPI_KEY;
  if (!serpApiKey) return generateMockAndroidApps(query);
  
  // Use SerpAPI google_play endpoint
  const response = await fetch(
    `https://serpapi.com/search.json?engine=google_play&q=${query}&store=apps`
  );
  // Parse and normalize results
}
```

**Acceptance Criteria:**
- [ ] `searchPlayStore()` function implemented
- [ ] Mock data fallback when no API key
- [ ] Integrated into `collectAppStoreResults()`
- [ ] Results normalized to `AppStoreResult` interface

---

### Task 2.2: Google Ads Integration into Pipeline
**ID:** `TASK-013`  
**Priority:** P1  
**Effort:** 2 hours  
**Dependencies:** None (collector exists)

**Description:** Integrate existing Google Ads collector into the main execution pipeline.

**File:** `src/app/api/runs/[id]/execute/route.ts` (modify)

**Changes:**
```typescript
import { collectGoogleAds } from '@/lib/collectors/google';

// In execute route, add to parallel collection:
const [metaAds, googleAds, redditMentions, appStoreResults] = await Promise.all([
  collectMetaAds(...),
  collectGoogleAds(niche_query, seed_terms).catch(err => []),
  collectRedditMentions(...),
  collectAppStoreResults(...),
]);

// Combine ad sources
const allAds = [...metaAds, ...googleAds];
```

**Acceptance Criteria:**
- [ ] Google Ads collected in parallel with other sources
- [ ] Combined with Meta Ads for processing
- [ ] Stored in `ad_creatives` table with source='google'
- [ ] Pipeline completes successfully with both sources

---

### Task 2.3: UGC Collection into Pipeline
**ID:** `TASK-014`  
**Priority:** P1  
**Effort:** 3 hours  
**Dependencies:** None (collectors exist)

**Description:** Integrate TikTok and Instagram collectors into the main pipeline.

**File:** `src/app/api/runs/[id]/execute/route.ts` (modify)

**Changes:**
```typescript
import { collectUGC } from '@/lib/collectors/ugc';

// Add to parallel collection:
const ugcResults = await collectUGC(niche_query, seed_terms).catch(err => ({
  tiktok: [],
  instagram: []
}));

// Store UGC data
if (ugcResults.tiktok.length > 0 || ugcResults.instagram.length > 0) {
  await supabase.from('ugc_assets').insert([
    ...ugcResults.tiktok.map(r => ({ ...r.asset, run_id: runId })),
    ...ugcResults.instagram.map(r => ({ ...r.asset, run_id: runId })),
  ]);
}
```

**Acceptance Criteria:**
- [ ] UGC data collected in pipeline
- [ ] Stored in `ugc_assets`, `ugc_metrics`, `ugc_patterns` tables
- [ ] Mock data used when RapidAPI key unavailable
- [ ] Pipeline completes with UGC data

---

## SPRINT 3: AI ENHANCEMENTS (P1-P2)

### Task 3.1: Action Plan Generator
**ID:** `TASK-020`  
**Priority:** P2  
**Effort:** 4 hours  
**Dependencies:** None

**Description:** Create AI module to generate actionable 7-day and 30-day plans based on analysis.

**File to Create:** `src/lib/ai/action-plan.ts`

**Implementation:**
```typescript
import OpenAI from 'openai';

export interface ActionPlan {
  sevenDay: ActionItem[];
  thirtyDay: ActionItem[];
}

export interface ActionItem {
  day: number;
  task: string;
  category: 'research' | 'build' | 'marketing' | 'content';
  effort: 'low' | 'medium' | 'high';
  resources?: string[];
}

export async function generateActionPlan(
  gaps: GapOpportunity[],
  concepts: ConceptIdea[],
  ugcRecs: UGCRecommendations,
  nicheQuery: string
): Promise<ActionPlan> {
  const openai = new OpenAI();
  
  const prompt = `Based on the following market analysis for "${nicheQuery}", 
  create a detailed 7-day quick start plan and 30-day comprehensive action plan...`;
  
  // Call OpenAI and parse response
}
```

**Acceptance Criteria:**
- [ ] Generates 7-day plan with daily tasks
- [ ] Generates 30-day plan with weekly milestones
- [ ] Tasks categorized and prioritized
- [ ] Mock fallback when no API key
- [ ] Integrated into pipeline execution

---

### Task 3.2: Build-to-Profit Score Completion
**ID:** `TASK-021`  
**Priority:** P2  
**Effort:** 2 hours  
**Dependencies:** None

**Description:** Complete the Build-to-Profit score implementation per PRD §5.G.

**File:** `src/lib/scoring.ts` (modify)

**Formula from PRD:**
```
B2P = (TAM × GM × Prob_Success) / (Dev_Cost + Marketing_Cost)

Where:
- TAM = Total Addressable Market estimate
- GM = Gross Margin (typically 70-90% for SaaS)
- Prob_Success = Confidence score × Market fit factor
- Dev_Cost = Estimated development cost based on complexity
- Marketing_Cost = Estimated first-year marketing budget
```

**Acceptance Criteria:**
- [ ] Full formula implemented
- [ ] Uses concept metrics for inputs
- [ ] Returns score normalized to 0-100
- [ ] Added to `calculateScores()` output

---

## SPRINT 4: TESTING (P0-P1)

### Task 4.1: Collector Unit Tests
**ID:** `TASK-030`  
**Priority:** P0  
**Effort:** 4 hours  
**Dependencies:** None

**Description:** Write unit tests for all data collectors.

**Files to Create:**
```
__tests__/lib/collectors/
├── reddit.test.ts
├── meta.test.ts
├── google.test.ts
├── appstore.test.ts
├── tiktok.test.ts
└── instagram.test.ts
```

**Key Test Cases:**
- Returns array of correct interface type
- Handles API errors gracefully
- Falls back to mock data when needed
- Deduplicates results correctly
- Rate limiting works

**Acceptance Criteria:**
- [ ] All collector functions have tests
- [ ] Tests pass with mocked fetch
- [ ] Coverage > 80% for collectors
- [ ] `npm test` runs successfully

---

### Task 4.2: AI Module Unit Tests
**ID:** `TASK-031`  
**Priority:** P1  
**Effort:** 4 hours  
**Dependencies:** None

**Description:** Write unit tests for AI processing modules.

**Files to Create:**
```
__tests__/lib/ai/
├── extractor.test.ts
├── gap-generator.test.ts
├── concept-generator.test.ts
└── ugc-generator.test.ts
```

**Key Test Cases:**
- Returns correct data structure
- Handles empty input gracefully
- Works with mock data when no API key
- JSON parsing handles edge cases

**Acceptance Criteria:**
- [ ] All AI functions have tests
- [ ] Tests mock OpenAI client
- [ ] Coverage > 75% for AI modules
- [ ] `npm test` runs successfully

---

### Task 4.3: API Integration Tests
**ID:** `TASK-032`  
**Priority:** P1  
**Effort:** 4 hours  
**Dependencies:** TASK-030, TASK-031

**Description:** Write integration tests for API routes.

**Files to Create:**
```
__tests__/integration/api/
├── runs.test.ts
├── reports.test.ts
└── exports.test.ts
```

**Acceptance Criteria:**
- [ ] POST /api/runs creates run correctly
- [ ] GET /api/runs/[id] returns run data
- [ ] POST /api/runs/[id]/execute completes pipeline
- [ ] GET /api/reports/[runId] returns report data
- [ ] Export endpoints return correct formats

---

### Task 4.4: E2E Tests Setup
**ID:** `TASK-033`  
**Priority:** P2  
**Effort:** 4 hours  
**Dependencies:** TASK-032

**Description:** Set up Playwright and write E2E tests for critical flows.

**Files to Create:**
```
e2e/
├── auth.spec.ts
├── new-run.spec.ts
└── report.spec.ts
playwright.config.ts
```

**Acceptance Criteria:**
- [ ] Playwright installed and configured
- [ ] Auth flow test passes
- [ ] New run creation test passes
- [ ] Report viewing test passes
- [ ] `npm run test:e2e` works

---

### Task 4.5: Accessibility E2E Tests (Axe)
**ID:** `TASK-106`  
**Priority:** P1  
**Effort:** 3 hours  
**Dependencies:** TASK-033

**Description:** Add Playwright accessibility scans using `@axe-core/playwright` for key public + dashboard pages.

**Files to Create/Modify:**
```
e2e/accessibility.spec.ts
package.json
```

**Acceptance Criteria:**
- [ ] `npm run test:e2e` includes an accessibility spec
- [ ] Tests scan at least landing/login + one authenticated/dashboard page
- [ ] Fails when WCAG violations are detected (log violations to console for debugging)

---

### Task 4.6: Production Smoke Diagnostics
**ID:** `TASK-107`  
**Priority:** P1  
**Effort:** 4 hours  
**Dependencies:** TASK-033

**Description:** Add tests that can run against production to detect 404/500 issues, missing API endpoints, and console errors.

**Files to Create/Modify:**
```
e2e/production-diagnostics.spec.ts
playwright.config.ts
.env.e2e.example
```

**Acceptance Criteria:**
- [ ] Can run with `TEST_ENV=production` (or equivalent) targeting `PRODUCTION_URL`
- [ ] Verifies critical API routes exist (not 404)
- [ ] Detects/flags 500s on critical endpoints
- [ ] Captures console errors for investigation

---

### Task 4.7: Resilience & Error Handling E2E
**ID:** `TASK-108`  
**Priority:** P1  
**Effort:** 4 hours  
**Dependencies:** TASK-033

**Description:** Add offline-mode, API failure simulation, and friendly 404/error-boundary verification tests.

**Files to Create/Modify:**
```
e2e/error-handling.spec.ts
```

**Acceptance Criteria:**
- [ ] Friendly 404 page behavior verified
- [ ] Offline mode scenario handled gracefully
- [ ] Simulated API failures do not hard-crash the UI

---

### Task 4.8: Cross-Browser + Mobile E2E Matrix
**ID:** `TASK-109`  
**Priority:** P2  
**Effort:** 3 hours  
**Dependencies:** TASK-033

**Description:** Run critical E2E flows across chromium/firefox/webkit + mobile profiles and collect traces/screenshots on failure.

**Files to Create/Modify:**
```
playwright.config.ts
e2e/smoke-matrix.spec.ts
```

**Acceptance Criteria:**
- [ ] CI/local can run a smoke matrix across configured projects
- [ ] Captures trace/screenshots on failure
- [ ] At least one critical flow passes across all targeted browsers

---

## SPRINT 5: UI ENHANCEMENTS (P1-P2)

### Task 5.1: Run Progress UI
**ID:** `TASK-040`  
**Priority:** P1  
**Effort:** 4 hours  
**Dependencies:** None

**Description:** Add real-time progress indicator for running analyses.

**Files to Create:**
```
src/components/RunProgress.tsx    # Progress component
src/hooks/use-run-status.ts      # Polling/realtime hook
```

**Implementation Options:**
1. Polling: Fetch run status every 2 seconds
2. Supabase Realtime: Subscribe to run status changes

**Acceptance Criteria:**
- [ ] Shows current step in pipeline
- [ ] Progress bar or step indicator
- [ ] Auto-updates without refresh
- [ ] Shows completion time estimate
- [ ] Handles errors gracefully

---

### Task 5.2: Mobile Responsive Polish
**ID:** `TASK-041`  
**Priority:** P2  
**Effort:** 4 hours  
**Dependencies:** None

**Description:** Ensure all dashboard pages work well on mobile devices.

**Files to Modify:** All `src/app/dashboard/*/page.tsx` files

**Key Areas:**
- Sidebar becomes hamburger menu on mobile
- Tables become cards on small screens
- Charts resize appropriately
- Touch-friendly tap targets

**Acceptance Criteria:**
- [ ] Dashboard usable on 375px width
- [ ] No horizontal scrolling
- [ ] All features accessible on mobile
- [ ] Touch interactions work

---

## SPRINT 6: DEPLOYMENT (P0)

### Task 6.1: Production Supabase Setup
**ID:** `TASK-050`  
**Priority:** P0  
**Effort:** 2 hours  
**Dependencies:** All features complete

**Description:** Set up production Supabase project.

**Steps:**
1. Create new Supabase project
2. Run all migrations
3. Configure RLS policies
4. Set up auth providers
5. Get production keys

**Acceptance Criteria:**
- [ ] Production project created
- [ ] All 16 tables exist
- [ ] RLS policies active
- [ ] Auth working
- [ ] Keys documented

---

### Task 6.2: Vercel Deployment
**ID:** `TASK-051`  
**Priority:** P0  
**Effort:** 2 hours  
**Dependencies:** TASK-050

**Description:** Deploy to Vercel with production configuration.

**Steps:**
1. Connect GitHub repo to Vercel
2. Configure environment variables
3. Set up custom domain (demandradar.app)
4. Configure build settings

**Acceptance Criteria:**
- [ ] App deploys successfully
- [ ] All env vars configured
- [ ] Domain configured
- [ ] SSL working
- [ ] No build errors

---

### Task 6.3: Stripe Production
**ID:** `TASK-052`  
**Priority:** P0  
**Effort:** 2 hours  
**Dependencies:** TASK-051

**Description:** Configure Stripe for production payments.

**Steps:**
1. Switch to live Stripe keys
2. Create products/prices
3. Configure webhook endpoint
4. Test payment flow

**Acceptance Criteria:**
- [ ] Live keys configured
- [ ] All plans purchasable
- [ ] Webhooks processing
- [ ] Test transaction successful

---

### Task 6.4: Error Monitoring
**ID:** `TASK-053`  
**Priority:** P1  
**Effort:** 2 hours  
**Dependencies:** TASK-051

**Description:** Set up Sentry for error tracking.

**Implementation:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Acceptance Criteria:**
- [ ] Sentry SDK installed
- [ ] Errors captured in production
- [ ] Source maps uploaded
- [ ] Alerts configured

---

## TASK SUMMARY BY PRIORITY

### P0 - Must Have for Launch (12 tasks, ~45 hours)
| ID | Task | Sprint | Effort |
|----|------|--------|--------|
| TASK-001 | Report Detail Page Structure | 1 | 4h |
| TASK-002 | Executive Summary Component | 1 | 3h |
| TASK-003 | Market Snapshot Component | 1 | 3h |
| TASK-004 | Pain Map Component | 1 | 3h |
| TASK-005 | Platform Gap Component | 1 | 2h |
| TASK-006 | Gap Opportunities Component | 1 | 3h |
| TASK-011 | PDF Export | 1 | 6h |
| TASK-030 | Collector Unit Tests | 4 | 4h |
| TASK-050 | Production Supabase | 6 | 2h |
| TASK-051 | Vercel Deployment | 6 | 2h |
| TASK-052 | Stripe Production | 6 | 2h |

### P1 - Should Have (18 tasks, ~45 hours)
| ID | Task | Sprint | Effort |
|----|------|--------|--------|
| TASK-007 | Economics Component | 1 | 2h |
| TASK-008 | Buildability Component | 1 | 2h |
| TASK-009 | UGC Pack Component | 1 | 3h |
| TASK-012 | Android Play Store | 2 | 4h |
| TASK-013 | Google Ads Integration | 2 | 2h |
| TASK-014 | UGC Pipeline Integration | 2 | 3h |
| TASK-031 | AI Module Tests | 4 | 4h |
| TASK-032 | API Integration Tests | 4 | 4h |
| TASK-106 | Accessibility E2E (Axe) | 4 | 3h |
| TASK-107 | Production Smoke Diagnostics | 4 | 4h |
| TASK-108 | Resilience & Error Handling E2E | 4 | 4h |
| TASK-040 | Run Progress UI | 5 | 4h |
| TASK-053 | Error Monitoring | 6 | 2h |

### P2 - Nice to Have (9 tasks, ~25 hours)
| ID | Task | Sprint | Effort |
|----|------|--------|--------|
| TASK-010 | Action Plan Component | 1 | 3h |
| TASK-020 | Action Plan Generator | 3 | 4h |
| TASK-021 | Build-to-Profit Score | 3 | 2h |
| TASK-033 | E2E Tests | 4 | 4h |
| TASK-109 | Cross-Browser + Mobile E2E Matrix | 4 | 3h |
| TASK-041 | Mobile Polish | 5 | 4h |

---

## RECOMMENDED EXECUTION ORDER

```
Week 1: Report Generation Foundation
├── Day 1: TASK-001, TASK-002
├── Day 2: TASK-003, TASK-004
├── Day 3: TASK-005, TASK-006
├── Day 4: TASK-007, TASK-008, TASK-009
└── Day 5: TASK-011 (PDF)

Week 2: Data & Testing
├── Day 6: TASK-012, TASK-013
├── Day 7: TASK-014, TASK-030
├── Day 8: TASK-031
├── Day 9: TASK-032
└── Day 10: TASK-040

Week 3: Deployment
├── Day 11: TASK-050
├── Day 12: TASK-051, TASK-052
├── Day 13: TASK-053, Final QA
└── Day 14: LAUNCH 🚀
```

---

## QUICK REFERENCE

### Key Files
- **Pipeline:** `src/app/api/runs/[id]/execute/route.ts`
- **Scoring:** `src/lib/scoring.ts`
- **Collectors:** `src/lib/collectors/*.ts`
- **AI Modules:** `src/lib/ai/*.ts`
- **Database:** `supabase/migrations/`

### Test Commands
```bash
npm test                    # Run unit tests
npm run test:integration    # Run integration tests
npm run test:e2e           # Run E2E tests
npm run test:coverage      # Generate coverage report
```

### Development Commands
```bash
cd gap-radar
npm run dev                # Start dev server (port 3001)
npx supabase start         # Start local Supabase
```

---

**Document Version:** 1.0  
**Last Updated:** January 16, 2026
