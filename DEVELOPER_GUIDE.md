# DemandRadar Developer Guide

> Comprehensive documentation for developers working on the DemandRadar market gap analysis platform.

**Last Updated:** January 2026  
**Version:** 0.1.0  
**Product Name:** DemandRadar (formerly GapRadar)

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Overview](#project-overview)
3. [Architecture](#architecture)
4. [Directory Structure](#directory-structure)
5. [Database Schema](#database-schema)
6. [API Reference](#api-reference)
7. [Core Modules](#core-modules)
8. [Data Collectors](#data-collectors)
9. [Scoring System](#scoring-system)
10. [Testing](#testing)
11. [Environment Variables](#environment-variables)
12. [PRD & Feature Status](#prd--feature-status)
13. [Contributing Guidelines](#contributing-guidelines)

---

## Quick Start

### Prerequisites

- **Node.js** 18+ 
- **Docker Desktop** (for local Supabase)
- **pnpm** or **npm**

### 1. Clone & Install

```bash
cd /Users/isaiahdupree/Documents/Software/WhatsCurrentlyInTheMarket/gap-radar
npm install
```

### 2. Start Database (Supabase)

```bash
# Start Docker Desktop first, then:
supabase start
```

This starts:
- **PostgreSQL:** `localhost:54321`
- **Supabase Studio:** `http://localhost:54323`
- **API:** `http://localhost:54321`

### 3. Configure Environment

Copy `.env.local.example` to `.env.local` and fill in:

```env
# Supabase (auto-filled by supabase start)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase start output>

# Required for AI features
OPENAI_API_KEY=sk-...

# Optional - for live data (falls back to mock)
META_ACCESS_TOKEN=<facebook token>
RAPIDAPI_KEY=<rapidapi key>
SERPAPI_KEY=<serpapi key>

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 4. Run Development Server

```bash
npm run dev
```

App runs at: **http://localhost:3000**

### 5. Run Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

---

## Project Overview

### What is DemandRadar?

DemandRadar is a market gap analysis tool that:

1. **Collects** ad data from Meta, Google, and competitor intelligence
2. **Analyzes** user sentiment from Reddit discussions
3. **Extracts** offers, claims, objections, and desired features using LLMs
4. **Identifies** gaps between what ads promise and what users complain about
5. **Generates** actionable "3% Better" recommendations
6. **Produces** vetted product idea dossiers with CAC/TAM estimates

### Core Jobs-to-be-Done

1. "Show me what's already working (ads)."
2. "Show me what customers hate/love (Reddit)."
3. "Tell me where the mismatch is and what to change first."
4. "Should this be a mobile app or web app?"
5. "How hard is it to build and sell?"
6. "What UGC content style works best?"

### Key Documents

| Document | Location | Purpose |
|----------|----------|---------|
| **PRD** | `/PRD.md` | Product requirements, scoring formulas, schema |
| **Product Vision** | `/PRODUCT_VISION.md` | Full vision, pricing, UGC module |
| **Implementation** | `/IMPLEMENTATION.md` | Technical implementation guide |
| **Development Status** | `/DEVELOPMENT_STATUS.md` | Current completion status |
| **Feature Groups** | `/FEATURE_GROUPS.md` | Feature categorization |
| **Work Breakdown** | `/WORK_BREAKDOWN.md` | Sprint planning, estimates |
| **Testing Plan** | `/TESTING_PLAN.md` | Test strategy and coverage |
| **RapidAPI Reference** | `/RAPIDAPI_REFERENCE.md` | API integrations reference |

---

## Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TailwindCSS, shadcn/ui |
| **Backend** | Next.js API Routes, Server Actions |
| **Database** | PostgreSQL via Supabase |
| **Auth** | Supabase Auth |
| **AI** | OpenAI GPT-4 |
| **Payments** | Stripe |
| **External APIs** | Meta Marketing API, Reddit, RapidAPI (TikTok, Instagram), SerpAPI |

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Request                              │
│                    (niche query + seeds)                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Data Collection                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │   Meta   │  │  Google  │  │  Reddit  │  │   UGC    │        │
│  │   Ads    │  │   Ads    │  │ Mentions │  │ TikTok/IG│        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
└───────┼─────────────┼─────────────┼─────────────┼───────────────┘
        │             │             │             │
        └─────────────┴──────┬──────┴─────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LLM Extraction                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Offers │ Claims │ Angles │ Objections │ Features        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Clustering                                   │
│  Group similar insights → Label clusters → Calculate frequency  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Scoring Engine                                 │
│  Saturation │ Longevity │ Dissatisfaction │ Opportunity         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Gap Detection                                  │
│  Promise vs Reality │ Missing Features │ Pricing Friction       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Report Generation                              │
│  Web Report │ PDF Export │ CSV/JSON Data │ UGC Playbook         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
gap-radar/
├── __tests__/                    # Test files
│   ├── setup.ts                  # Global test setup
│   ├── lib/
│   │   ├── scoring.test.ts       # Scoring formula tests
│   │   └── collectors/
│   │       └── reddit.test.ts    # Collector tests
│   └── integration/
│       └── pipeline.test.ts      # E2E pipeline tests
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API Routes
│   │   │   ├── runs/             # Run management
│   │   │   │   ├── route.ts      # GET/POST runs
│   │   │   │   └── [id]/
│   │   │   │       └── execute/route.ts  # Execute pipeline
│   │   │   ├── meta/             # Meta API endpoints
│   │   │   ├── exports/[runId]/  # CSV/JSON exports
│   │   │   ├── reports/[runId]/  # Report data API
│   │   │   ├── test/             # Test endpoints
│   │   │   │   ├── run/route.ts  # Test pipeline
│   │   │   │   ├── ugc/route.ts  # Test UGC collection
│   │   │   │   └── google-ads/route.ts
│   │   │   └── webhooks/         # Stripe webhooks
│   │   ├── dashboard/            # Main dashboard
│   │   ├── projects/             # Project management
│   │   ├── auth/                 # Auth pages
│   │   └── layout.tsx            # Root layout
│   │
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── dashboard/            # Dashboard components
│   │   └── reports/              # Report components
│   │
│   └── lib/                      # Core business logic
│       ├── collectors/           # Data collectors
│       │   ├── meta.ts           # Meta Ads Library
│       │   ├── reddit.ts         # Reddit API
│       │   ├── google.ts         # Google Ads (SerpAPI)
│       │   ├── appstore.ts       # iOS App Store
│       │   ├── tiktok.ts         # TikTok UGC
│       │   ├── instagram.ts      # Instagram UGC
│       │   └── ugc.ts            # Unified UGC collector
│       │
│       ├── ai/                   # AI/LLM modules
│       │   ├── extractor.ts      # Insight extraction
│       │   ├── gap-generator.ts  # Gap detection
│       │   ├── concept-generator.ts  # Idea generation
│       │   └── ugc-generator.ts  # UGC playbook
│       │
│       ├── scoring.ts            # All scoring formulas
│       ├── supabase/
│       │   ├── client.ts         # Browser client
│       │   └── server.ts         # Server client
│       └── stripe.ts             # Stripe integration
│
├── supabase/
│   ├── config.toml               # Supabase config
│   └── migrations/               # Database migrations
│       └── 20260116000000_initial_schema.sql
│
├── public/                       # Static assets
├── jest.config.js                # Jest configuration
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## Database Schema

### Core Tables

```sql
-- Users (managed by Supabase Auth)
users (id, email, full_name, avatar_url, plan, runs_used, runs_limit)

-- Projects (user workspaces)
projects (id, owner_id, name, created_at)

-- Runs (analysis jobs)
runs (id, project_id, niche_query, seed_terms, competitors, geo, status, started_at, finished_at, error)
```

### Data Collection Tables

```sql
-- Ad creatives from Meta/Google
ad_creatives (id, run_id, source, advertiser_name, creative_text, headline, description, cta, landing_url, first_seen, last_seen, is_active, media_type, raw_payload)

-- Reddit posts/comments
reddit_mentions (id, run_id, subreddit, type, title, text, score, num_comments, created_at, permalink, matched_entities, raw_payload)

-- App Store results
app_store_results (id, run_id, platform, app_name, app_id, developer, rating, review_count, description, category, price, raw_payload)
```

### Analysis Tables

```sql
-- LLM extractions
extractions (id, run_id, source_type, source_id, offers, claims, angles, objections, desired_features, sentiment)

-- Clustered insights
clusters (id, run_id, cluster_type, label, examples, frequency, intensity)

-- Gap opportunities
gap_opportunities (id, run_id, gap_type, title, problem, evidence_ads, evidence_reddit, recommendation, opportunity_score, confidence)

-- Concept ideas
concept_ideas (id, run_id, name, one_liner, platform_recommendation, industry, icp, business_model, gap_thesis, mvp_spec)

-- Concept metrics
concept_metrics (id, concept_id, cpc_low/expected/high, cac_low/expected/high, tam_low/expected/high, implementation_difficulty, human_touch_level, autonomous_suitability)
```

### UGC Tables

```sql
-- UGC assets (TikTok/Instagram)
ugc_assets (id, run_id, source, platform, url, thumbnail_url, caption, created_at, raw_payload)

-- UGC metrics
ugc_metrics (id, ugc_asset_id, views, likes, comments, shares, reach_unique_users, first_shown, last_shown, score)

-- UGC patterns
ugc_patterns (id, ugc_asset_id, hook_type, format, proof_type, objection_handled, cta_style, notes, confidence)

-- UGC recommendations
ugc_recommendations (id, run_id, hooks, scripts, shot_list, angle_map)
```

### Entity Relationship

```
users 1:N projects 1:N runs 1:N ad_creatives
                              1:N reddit_mentions
                              1:N app_store_results
                              1:N extractions
                              1:N clusters
                              1:N gap_opportunities
                              1:N concept_ideas 1:1 concept_metrics
                              1:N ugc_assets 1:1 ugc_metrics
                                             1:1 ugc_patterns
                              1:1 ugc_recommendations
                              1:1 reports
```

---

## API Reference

### Runs API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/runs` | GET | List user's runs |
| `/api/runs` | POST | Create new run |
| `/api/runs/[id]` | GET | Get run details |
| `/api/runs/[id]/execute` | POST | Execute pipeline |

### Test Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/test/run` | POST | Test full pipeline |
| `/api/test/ugc` | POST | Test UGC collection |
| `/api/test/google-ads` | GET/POST | Test Google Ads |

### Export & Reports

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/exports/[runId]?format=csv&type=all` | GET | Export run data |
| `/api/reports/[runId]` | GET | Full report data |

### Meta API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/meta/accounts` | GET | List ad accounts |
| `/api/meta/ads/[accountId]` | GET | Get account ads |
| `/api/scrape/ad-library` | POST | Scrape Ad Library |

---

## Core Modules

### 1. Collectors (`/src/lib/collectors/`)

Each collector follows this interface:

```typescript
interface CollectorResult<T> {
  data: T[];
  errors?: string[];
  metadata?: Record<string, unknown>;
}

// Example: Meta collector
export async function collectMetaAds(
  nicheQuery: string,
  seedTerms: string[],
  geo?: string
): Promise<MetaAd[]>
```

| Collector | File | API Used | Auth Required |
|-----------|------|----------|---------------|
| Meta Ads | `meta.ts` | Graph API v24.0 | OAuth Token |
| Reddit | `reddit.ts` | Public JSON API | None |
| Google Ads | `google.ts` | SerpAPI | API Key |
| App Store | `appstore.ts` | iTunes Search | None |
| TikTok | `tiktok.ts` | RapidAPI | API Key |
| Instagram | `instagram.ts` | RapidAPI | API Key |
| Unified UGC | `ugc.ts` | Combines TT+IG | API Key |

### 2. AI Modules (`/src/lib/ai/`)

| Module | File | Purpose |
|--------|------|---------|
| Extractor | `extractor.ts` | Extract offers, claims, angles, objections |
| Gap Generator | `gap-generator.ts` | Identify market gaps |
| Concept Generator | `concept-generator.ts` | Generate product ideas |
| UGC Generator | `ugc-generator.ts` | Create UGC playbooks |

### 3. Scoring (`/src/lib/scoring.ts`)

All scoring formulas from PRD §5:

```typescript
// Core scores (0-100)
calculateSaturationScore(ads, clusters)
calculateLongevityScore(ads)
calculateDissatisfactionScore(mentions, clusters)
calculateMisalignmentScore(ads, clusters)
calculateOpportunityScore(longevity, dissatisfaction, misalignment, saturation)
calculateConfidenceScore(ads, mentions, gaps)

// UGC scores (0-100)
calculateUGCAdTestedScore(asset, metrics)
calculateUGCTrendScore(asset, relevance)
calculateUGCConnectedScore(metrics, asset)
```

---

## Scoring System

### Saturation Score (0-100)

Measures how crowded the niche is:

```
saturation = 100 * sigmoid(0.6*log1p(A) + 0.3*log1p(C) + 0.8*R)
```

- `A` = unique advertisers
- `C` = total creatives  
- `R` = repetition index (0-1)

### Longevity Score (0-100)

Proxy for ad performance (longer = better):

```
longevity = clamp(100 * log1p(days_running) / log1p(180), 0, 100)
```

### Dissatisfaction Score (0-100)

User pain intensity:

```
dissatisfaction = 100 * sigmoid(0.5*log1p(F) + 0.7*I + 0.6*S + 0.2*log1p(W))
```

- `F` = objection frequency
- `I` = intensity (LLM-rated)
- `S` = negative sentiment ratio
- `W` = weighted score (upvotes)

### Opportunity Score (0-100)

Combined signal:

```
opportunity = 0.35*longevity + 0.35*dissatisfaction + 0.30*misalignment
opportunity_adj = opportunity - 0.15*saturation
```

### Confidence Score (0-1)

Data quality indicator:

```
confidence = 0.4*data_sufficiency + 0.4*cross_source_alignment + 0.2*recency
```

---

## Testing

### Test Structure

```
__tests__/
├── setup.ts                    # Global mocks, env setup
├── lib/
│   ├── scoring.test.ts         # Unit tests for scoring
│   └── collectors/
│       └── reddit.test.ts      # Collector unit tests
└── integration/
    └── pipeline.test.ts        # E2E pipeline tests
```

### Running Tests

```bash
npm test                  # Run all
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
npm test -- scoring       # Run specific file
```

### Test Categories

| Category | Coverage | Description |
|----------|----------|-------------|
| **Scoring** | ~90% | All formulas, edge cases |
| **Collectors** | ~60% | API mocking, error handling |
| **Pipeline** | ~70% | Full flow integration |
| **API Routes** | ~40% | Request/response validation |

### Writing Tests

```typescript
// Use describe/it/expect from Jest
describe('calculateSaturationScore', () => {
  it('returns 0 for empty ads', () => {
    expect(calculateSaturationScore([], [])).toBe(0);
  });

  it('increases with more advertisers', () => {
    const few = calculateSaturationScore([ad1], []);
    const many = calculateSaturationScore([ad1, ad2, ad3], []);
    expect(many).toBeGreaterThan(few);
  });
});
```

---

## Environment Variables

### Required

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `supabase start` output |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | `supabase start` output |
| `OPENAI_API_KEY` | OpenAI API key | platform.openai.com |

### Optional (Live Data)

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `META_ACCESS_TOKEN` | Facebook Graph API token | developers.facebook.com |
| `RAPIDAPI_KEY` | RapidAPI key for TikTok/Instagram | rapidapi.com |
| `SERPAPI_KEY` | SerpAPI key for Google Ads | serpapi.com |

### Payments

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `STRIPE_SECRET_KEY` | Stripe secret key | dashboard.stripe.com |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | dashboard.stripe.com |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Stripe webhook settings |

---

## PRD & Feature Status

### Completion Summary

| Category | Status | Progress |
|----------|--------|----------|
| **Data Sources** | 5/6 | 83% |
| **Core Outputs** | 6/7 | 85% |
| **Scoring Formulas** | 8/8 | 100% |
| **Database Schema** | 16/16 | 100% |
| **API Endpoints** | 12/15 | 80% |
| **UI Components** | 8/12 | 67% |
| **Tests** | - | ~60% |

### What's Implemented ✅

- [x] Meta Ads collector (API + scraper)
- [x] Reddit collector (public JSON)
- [x] Google Ads collector (SerpAPI)
- [x] iOS App Store collector
- [x] TikTok UGC collector
- [x] Instagram UGC collector
- [x] LLM extraction (OpenAI)
- [x] Clustering algorithm
- [x] All scoring formulas
- [x] Gap detection rules
- [x] Concept generation
- [x] UGC playbook generation
- [x] CSV/JSON exports
- [x] Report data API
- [x] Auth (Supabase)
- [x] Database schema

### What's Remaining ❌

- [ ] PDF report generation
- [ ] Web report renderer
- [ ] Android App Store collector
- [ ] Stripe payment integration
- [ ] User onboarding flow
- [ ] Share links for reports

### Priority Tasks

1. **High:** PDF report generation
2. **High:** Web report renderer
3. **Medium:** Stripe integration
4. **Medium:** Android collector
5. **Low:** Share links

---

## Contributing Guidelines

### Code Style

- TypeScript strict mode
- Functional components (React)
- Use existing patterns from codebase
- No comments unless explaining "why"

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes, commit
git add .
git commit -m "feat: add feature description"

# Push and create PR
git push origin feature/your-feature
```

### Commit Messages

Use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Adding tests

### PR Checklist

- [ ] Tests pass (`npm test`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] Updated relevant docs
- [ ] Added tests for new features

---

## Troubleshooting

### Common Issues

**Supabase won't start:**
- Ensure Docker Desktop is running
- Run `supabase stop` then `supabase start`

**Mock data instead of live:**
- Check API keys in `.env.local`
- Collectors fall back to mock when keys missing

**TypeScript errors in tests:**
- Run `npm install` to get Jest types
- Errors resolve after installation

**Database connection failed:**
- Verify Supabase is running (`supabase status`)
- Check `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`

### Debug Mode

```typescript
// Enable verbose logging
process.env.DEBUG = 'true';

// In collectors, check for:
console.log('[Collector] API response:', data);
```

### Support

- Check `/docs` folder for additional documentation
- Review existing PRD documents for requirements
- Test endpoints at `/api/test/*` for debugging

---

*This guide is maintained as part of the DemandRadar project. Update as features are added.*
