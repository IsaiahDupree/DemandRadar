# DemandRadar Work Breakdown Structure

**Last Updated:** January 16, 2026  
**Total Estimated Effort:** 25-30 days  
**Current Completion:** ~55%

---

## Sprint Overview

| Sprint | Focus | Duration | Status |
|--------|-------|----------|--------|
| Sprint 1 | Core Infrastructure | 5 days | ✅ Complete |
| Sprint 2 | Data Collection | 5 days | ⚠️ 70% Complete |
| Sprint 3 | AI & Scoring | 4 days | ✅ Complete |
| Sprint 4 | Reports & Exports | 4 days | ❌ Not Started |
| Sprint 5 | Testing | 4 days | ❌ Not Started |
| Sprint 6 | Polish & Deploy | 3 days | ❌ Not Started |

---

## Detailed Work Breakdown

### SPRINT 1: Core Infrastructure ✅ COMPLETE

#### 1.1 Project Setup (Day 1) ✅
- [x] Initialize Next.js 14+ project
- [x] Configure TypeScript
- [x] Set up Tailwind CSS
- [x] Install shadcn/ui components
- [x] Configure ESLint/Prettier

#### 1.2 Database Setup (Day 2) ✅
- [x] Set up local Supabase Docker
- [x] Create database schema (16 tables)
- [x] Implement RLS policies
- [x] Create database triggers
- [x] Add performance indexes

#### 1.3 Authentication (Day 3) ✅
- [x] Configure Supabase Auth
- [x] Create login page
- [x] Create signup page
- [x] Implement auth middleware
- [x] Add protected routes

#### 1.4 Basic UI Structure (Day 4-5) ✅
- [x] Create dashboard layout
- [x] Build sidebar navigation
- [x] Create placeholder pages
- [x] Set up routing structure

**Deliverables:**
- Working local development environment
- Database with all tables
- Basic auth flow
- Dashboard shell

---

### SPRINT 2: Data Collection ⚠️ 70% COMPLETE

#### 2.1 Meta Ads Collector (Day 6-7) ✅
- [x] Marketing API integration (v24.0)
- [x] Ad Library browser scraper
- [x] URL parameter filter support
- [x] Data normalization
- [x] Mock data fallback
- [x] API endpoint creation

**Files Created:**
- `src/lib/collectors/meta.ts`
- `src/lib/collectors/ad-library-scraper.ts`
- `src/app/api/scrape/ad-library/route.ts`

#### 2.2 Reddit Collector (Day 8) ✅
- [x] Public JSON API integration
- [x] Subreddit search function
- [x] Entity matching
- [x] Rate limiting
- [x] Mock data fallback

**Files Created:**
- `src/lib/collectors/reddit.ts`

#### 2.3 App Store Collector (Day 9) ⚠️ PARTIAL
- [x] iOS iTunes Search API
- [x] Data normalization
- [ ] Android Play Store (SerpAPI) ❌
- [ ] Web competitor search ❌

**Files Created:**
- `src/lib/collectors/appstore.ts`

**Missing Work:**

| Task | Effort | Priority |
|------|--------|----------|
| Android Play Store collector | 1 day | Medium |
| Web competitor search | 0.5 day | Low |

#### 2.4 Google Ads Collector (Day 10) ❌ NOT STARTED
- [ ] SerpAPI integration
- [ ] Data normalization
- [ ] API endpoint
- [ ] Mock data fallback

**Estimated Effort:** 2 days

**Implementation Plan:**
```typescript
// src/lib/collectors/google.ts (TO CREATE)
interface GoogleAd {
  source: 'google';
  advertiser_name: string;
  headline: string;
  description: string;
  display_url: string;
  keywords?: string[];
  raw_payload?: Record<string, unknown>;
}

export async function collectGoogleAds(
  query: string,
  options?: { country?: string; limit?: number }
): Promise<GoogleAd[]>
```

#### 2.5 UGC Collectors (Future) ❌ NOT STARTED
- [ ] TikTok Creative Center API
- [ ] Instagram Graph API
- [ ] Data normalization

**Estimated Effort:** 4 days (optional for MVP)

---

### SPRINT 3: AI & Scoring ✅ COMPLETE

#### 3.1 LLM Integration (Day 11) ✅
- [x] OpenAI client setup
- [x] API key configuration
- [x] Error handling
- [x] Mock data fallback

#### 3.2 Insight Extractor (Day 12) ✅
- [x] Structured extraction prompts
- [x] JSON response parsing
- [x] Offer/claim/angle extraction
- [x] Objection/feature extraction
- [x] Sentiment analysis

**Files Created:**
- `src/lib/ai/extractor.ts`

#### 3.3 Clustering (Day 12) ✅
- [x] Insight clustering logic
- [x] Frequency calculation
- [x] Intensity scoring

#### 3.4 Gap Generator (Day 13) ✅
- [x] Gap identification prompts
- [x] Evidence linking
- [x] Recommendation generation
- [x] Opportunity scoring

**Files Created:**
- `src/lib/ai/gap-generator.ts`

#### 3.5 Concept Generator (Day 13) ✅
- [x] Product idea generation
- [x] Platform recommendation
- [x] MVP spec generation
- [x] Metrics estimation

**Files Created:**
- `src/lib/ai/concept-generator.ts`

#### 3.6 UGC Generator (Day 14) ✅
- [x] Hook generation
- [x] Script outlines
- [x] Shot list creation
- [x] Angle mapping

**Files Created:**
- `src/lib/ai/ugc-generator.ts`

#### 3.7 Scoring Engine (Day 14) ✅
- [x] Saturation score formula
- [x] Longevity score formula
- [x] Dissatisfaction score formula
- [x] Misalignment score formula
- [x] Opportunity score formula
- [x] Confidence score formula
- [ ] Build-to-Profit score ⚠️ Partial
- [ ] UGC scoring formula ❌

**Files Created:**
- `src/lib/scoring.ts`

**Missing Work:**

| Task | Effort | Priority |
|------|--------|----------|
| Build-to-Profit score completion | 0.5 day | Medium |
| UGC scoring formula | 0.5 day | Low |

---

### SPRINT 4: Reports & Exports ❌ NOT STARTED

#### 4.1 Report Data API (Day 15)
- [ ] GET /api/reports/[id] endpoint
- [ ] Aggregate all run data
- [ ] Format for display
- [ ] Caching layer

**Estimated Effort:** 1 day

**Implementation Plan:**
```typescript
// src/app/api/reports/[id]/route.ts (TO CREATE)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Fetch run + all related data
  // Aggregate into report structure
  // Return formatted response
}
```

#### 4.2 Report Web Renderer (Day 16-17)
- [ ] Executive Summary page
- [ ] Paid Market Snapshot
- [ ] User Pain Map
- [ ] Platform Existence Gap
- [ ] Gap Opportunities (ranked)
- [ ] Modeled Economics
- [ ] Buildability Assessment
- [ ] UGC Winners Pack
- [ ] Action Plan

**Estimated Effort:** 2 days

**Implementation Plan:**
```
src/app/dashboard/reports/[id]/
├── page.tsx           # Main report page
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
└── loading.tsx        # Loading state
```

#### 4.3 PDF Generator (Day 18)
- [ ] Install PDF library (react-pdf or puppeteer)
- [ ] Create PDF template
- [ ] Style for print
- [ ] Download endpoint

**Estimated Effort:** 1 day

**Options:**
1. **@react-pdf/renderer** - React components to PDF
2. **Puppeteer** - Render HTML to PDF
3. **jsPDF** - Programmatic PDF generation

**Recommended:** `@react-pdf/renderer` for React-native PDF creation

```typescript
// src/lib/report-generator.ts (TO CREATE)
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

export async function generateReportPDF(reportData: ReportData): Promise<Blob> {
  const ReportDocument = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        <ExecutiveSummarySection data={reportData.summary} />
        <MarketSnapshotSection data={reportData.market} />
        {/* ... more sections */}
      </Page>
    </Document>
  );
  
  return await pdf(<ReportDocument />).toBlob();
}
```

#### 4.4 CSV/JSON Exports (Day 18)
- [ ] CSV export for ads
- [ ] CSV export for mentions
- [ ] CSV export for gaps
- [ ] JSON full data export

**Estimated Effort:** 0.5 day

**Implementation Plan:**
```typescript
// src/app/api/exports/[runId]/route.ts (TO CREATE)
export async function GET(request: NextRequest, { params }) {
  const format = request.nextUrl.searchParams.get('format') || 'json';
  
  // Fetch all run data
  const data = await getRunData(params.runId);
  
  if (format === 'csv') {
    return new Response(convertToCSV(data), {
      headers: { 'Content-Type': 'text/csv' }
    });
  }
  
  return NextResponse.json(data);
}
```

#### 4.5 Share Links (Day 19)
- [ ] Generate shareable report URLs
- [ ] Optional password protection
- [ ] Expiration handling

**Estimated Effort:** 0.5 day

---

### SPRINT 5: Testing ❌ NOT STARTED

#### 5.1 Test Setup (Day 20)
- [ ] Install Jest + testing-library
- [ ] Configure test environment
- [ ] Create test utilities
- [ ] Set up mocks

**Estimated Effort:** 0.5 day

#### 5.2 Unit Tests (Day 20-21)
- [ ] Scoring module tests
- [ ] Collector tests (meta, reddit, appstore)
- [ ] AI module tests
- [ ] Utility function tests

**Estimated Effort:** 1.5 days

**Priority Test Files:**
1. `__tests__/lib/scoring.test.ts` - Critical
2. `__tests__/lib/collectors/reddit.test.ts` - Critical
3. `__tests__/lib/ai/gap-generator.test.ts` - High
4. `__tests__/lib/ai/extractor.test.ts` - High

#### 5.3 Integration Tests (Day 22)
- [ ] API route tests
- [ ] Pipeline integration tests
- [ ] Database operation tests

**Estimated Effort:** 1.5 days

#### 5.4 E2E Tests (Day 23)
- [ ] Install Playwright
- [ ] Auth flow tests
- [ ] New run flow tests
- [ ] Report viewing tests

**Estimated Effort:** 1 day

---

### SPRINT 6: Polish & Deploy ❌ NOT STARTED

#### 6.1 Error Handling (Day 24)
- [ ] Global error boundary
- [ ] API error responses
- [ ] User-friendly error messages
- [ ] Error logging (Sentry)

**Estimated Effort:** 0.5 day

#### 6.2 Performance (Day 24)
- [ ] Implement caching
- [ ] Optimize database queries
- [ ] Add loading states
- [ ] Lazy load components

**Estimated Effort:** 0.5 day

#### 6.3 Production Setup (Day 25)
- [ ] Create Supabase Cloud project
- [ ] Run migrations
- [ ] Configure production env vars
- [ ] Set up Vercel deployment

**Estimated Effort:** 0.5 day

#### 6.4 Deployment (Day 25-26)
- [ ] Deploy to Vercel
- [ ] Configure domain (demandradar.app)
- [ ] SSL certificate
- [ ] DNS configuration

**Estimated Effort:** 0.5 day

#### 6.5 Stripe Production (Day 26)
- [ ] Switch to live Stripe keys
- [ ] Test payment flow
- [ ] Configure webhooks
- [ ] Verify subscription handling

**Estimated Effort:** 0.5 day

#### 6.6 Final QA (Day 26-27)
- [ ] Full feature smoke test
- [ ] Cross-browser testing
- [ ] Mobile responsiveness check
- [ ] Performance audit

**Estimated Effort:** 1 day

---

## Work Remaining Summary

### By Priority

#### P0 - Critical (Must Have for Launch)

| Task | Sprint | Effort | Blocked By |
|------|--------|--------|------------|
| Report Web Renderer | 4 | 2 days | - |
| PDF Export | 4 | 1 day | Report Renderer |
| CSV/JSON Export | 4 | 0.5 day | - |
| Unit Tests (Core) | 5 | 1.5 days | - |
| Production Deployment | 6 | 1 day | All above |

**Total P0 Effort: ~6 days**

#### P1 - High Priority (Should Have)

| Task | Sprint | Effort | Blocked By |
|------|--------|--------|------------|
| Google Ads Collector | 2 | 2 days | - |
| Integration Tests | 5 | 1.5 days | Unit Tests |
| Error Handling | 6 | 0.5 day | - |
| Stripe Production | 6 | 0.5 day | Deployment |

**Total P1 Effort: ~4.5 days**

#### P2 - Medium Priority (Nice to Have)

| Task | Sprint | Effort | Blocked By |
|------|--------|--------|------------|
| Android App Store | 2 | 1 day | - |
| E2E Tests | 5 | 1 day | Integration Tests |
| UGC Scoring Formula | 3 | 0.5 day | - |
| Action Plan Generator | 4 | 1 day | - |

**Total P2 Effort: ~3.5 days**

#### P3 - Low Priority (Future)

| Task | Sprint | Effort | Blocked By |
|------|--------|--------|------------|
| TikTok Collector | 2 | 2 days | API Access |
| Instagram Collector | 2 | 2 days | API Access |
| Comparison View | Future | 1 day | Reports |
| Mobile Optimization | Future | 1 day | - |

**Total P3 Effort: ~6 days**

---

### Effort by Category

| Category | Total Effort | Completed | Remaining |
|----------|--------------|-----------|-----------|
| Infrastructure | 5 days | 5 days | 0 days |
| Data Collection | 7 days | 5 days | 2 days |
| AI & Scoring | 4 days | 3.5 days | 0.5 days |
| Reports & Exports | 5 days | 0 days | 5 days |
| Testing | 4 days | 0 days | 4 days |
| Polish & Deploy | 3 days | 0 days | 3 days |
| **TOTAL** | **28 days** | **13.5 days** | **14.5 days** |

---

## Critical Path to Launch

```
Week 1: Reports & Exports
├── Day 1: Report Data API
├── Day 2-3: Report Web Renderer
├── Day 4: PDF Generator
└── Day 5: CSV/JSON Exports

Week 2: Testing & Polish
├── Day 6: Test Setup + Unit Tests
├── Day 7: Unit Tests (cont.)
├── Day 8: Integration Tests
├── Day 9: Error Handling + Performance
└── Day 10: Production Setup + Deploy

Week 3: Launch Prep
├── Day 11: Final QA
├── Day 12: Bug fixes
└── Day 13: LAUNCH 🚀
```

**Minimum Viable Launch: 13 working days**

---

## Risk Register

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| OpenAI API rate limits | High | Medium | Implement caching, queue system |
| Reddit API blocks | Medium | Low | Fallback to mock data |
| Ad Library scraping fails | High | Medium | Manual fallback, multiple selectors |
| Supabase outage | High | Low | Error handling, retry logic |
| Stripe webhook failures | High | Low | Idempotent handlers, logging |

---

## Resource Requirements

### External Services

| Service | Purpose | Cost Estimate |
|---------|---------|---------------|
| Supabase Pro | Database | $25/month |
| Vercel Pro | Hosting | $20/month |
| OpenAI API | LLM | $50-100/month |
| Stripe | Payments | 2.9% + $0.30/txn |
| Sentry | Error tracking | $26/month |
| Domain | demandradar.app | $12/year |

**Estimated Monthly Cost: ~$120-170**

### API Keys Needed

- [x] OpenAI API Key
- [x] Supabase Keys
- [x] Meta Access Token
- [x] RapidAPI Key
- [ ] SerpAPI Key (for Google Ads)
- [ ] Stripe Live Keys

---

*Document maintained by development team. Update as work progresses.*
