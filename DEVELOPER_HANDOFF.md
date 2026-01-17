# Developer Handoff — DemandRadar

> **Project:** DemandRadar (Market Gap Analysis Tool)  
> **Domain:** demandradar.app  
> **Last Updated:** January 17, 2026

---

## Quick Start

```bash
cd gap-radar
cp .env.example .env.local  # Configure environment
npm install
npm run dev                  # http://localhost:3000
```

---

## 📁 Documentation Index

### Core Product Docs

| File | Purpose | Priority |
|------|---------|----------|
| `PRD.md` | Product Requirements Document - full spec | 🔴 Critical |
| `IMPLEMENTATION.md` | Technical implementation guide | 🔴 Critical |
| `DEVELOPER_GUIDE.md` | Developer onboarding & architecture | 🔴 Critical |
| `PRODUCT_VISION.md` | High-level product vision | 🟡 Important |

### Competitive Analysis (Hookd.ai)

| File | Purpose | Priority |
|------|---------|----------|
| `docs/HOOKD_COMPLETE_SITE_SPEC.md` | Complete site specification (750+ lines, 63+ screenshots) | 🔴 Critical |
| `docs/UX_TEARDOWN_HOOKD.md` | UX patterns & implementation checklist | 🔴 Critical |

### Technical Specs

| File | Purpose | Priority |
|------|---------|----------|
| `TESTING_PLAN.md` | Testing strategy & coverage | 🟡 Important |
| `FEATURE_GROUPS.md` | Feature groupings & dependencies | 🟡 Important |
| `DEVELOPMENT_STATUS.md` | Current build status | 🟡 Important |
| `FULL_FEATURE_LIST.md` | Complete feature inventory | 🟢 Reference |

### Database & API

| File | Purpose | Priority |
|------|---------|----------|
| `gap-radar/supabase/migrations/*.sql` | Database schema | 🔴 Critical |
| `RAPIDAPI_REFERENCE.md` | External API integrations | 🟡 Important |

---

## 🏗️ Project Structure

```
WhatsCurrentlyInTheMarket/
├── gap-radar/                    # Main Next.js application
│   ├── src/
│   │   ├── app/                  # Next.js App Router pages
│   │   │   ├── api/              # API routes
│   │   │   ├── dashboard/        # Dashboard pages
│   │   │   └── page.tsx          # Landing page
│   │   ├── components/           # React components
│   │   │   └── landing/          # Landing page components
│   │   └── lib/                  # Core libraries
│   │       ├── ai/               # OpenAI integration
│   │       ├── collectors/       # Data collectors (Meta, Reddit)
│   │       ├── supabase/         # Database client
│   │       └── scoring.ts        # Scoring algorithms
│   ├── supabase/
│   │   └── migrations/           # Database migrations
│   └── .env.local                # Environment variables
├── docs/                         # Documentation
│   ├── HOOKD_COMPLETE_SITE_SPEC.md
│   └── UX_TEARDOWN_HOOKD.md
├── PRD.md                        # Product Requirements
├── IMPLEMENTATION.md             # Implementation Guide
└── DEVELOPER_GUIDE.md            # Developer Guide
```

---

## 🔑 Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# Reddit API
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=

# Meta API
META_ACCESS_TOKEN=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

---

## 📊 Database Schema (16 Tables)

| Table | Purpose |
|-------|---------|
| `users` | User accounts |
| `projects` | Analysis projects |
| `runs` | Analysis runs |
| `ad_creatives` | Collected Meta ads |
| `reddit_mentions` | Reddit posts/comments |
| `llm_extractions` | AI-extracted insights |
| `clusters` | Grouped insights |
| `gap_opportunities` | Identified market gaps |
| `concept_ideas` | Generated concepts |
| `reports` | Final reports |
| `ugc_assets` | UGC content |
| `ugc_patterns` | UGC patterns |
| `ugc_recommendations` | UGC suggestions |
| `action_plans` | Recommended actions |

---

## 🎯 Key Features to Build

### From PRD (Core MVP)

1. **NLP Search** — Natural language market queries
2. **Gap Detection** — AI-powered opportunity identification
3. **Scoring System** — Saturation, Longevity, Opportunity scores
4. **Report Generation** — Comprehensive gap analysis reports
5. **Trend Tracking** — Reddit/social monitoring

### From Hookd Teardown (UX Patterns)

1. **Filter Panel** — Accordion-style, multi-select filters
2. **Results Grid** — Card-based results with metrics
3. **Detail Modal** — Full analysis view
4. **Onboarding Checklist** — Progress-based onboarding
5. **Credits System** — Usage-based billing
6. **Paywall Components** — Feature gating

---

## 🔗 Key Files Reference

### API Routes
- `/api/runs/route.ts` — Create/list analysis runs
- `/api/runs/[id]/execute/route.ts` — Execute analysis pipeline
- `/api/reports/[runId]/route.ts` — Generate reports
- `/api/trends/route.ts` — Fetch trending topics

### Core Libraries
- `/lib/collectors/meta.ts` — Meta Ad Library collector
- `/lib/collectors/reddit.ts` — Reddit data collector
- `/lib/ai/extractor.ts` — AI insight extraction
- `/lib/ai/gap-generator.ts` — Gap opportunity generation
- `/lib/scoring.ts` — All scoring formulas

### Components
- `/components/landing/NLPSearch.tsx` — Search component
- `/components/landing/TrendingTopics.tsx` — Trends display
- `/components/landing/Features.tsx` — Feature cards

---

## 📸 Competitive Screenshots (63+)

All screenshots captured from Hookd.ai are documented in:
`docs/HOOKD_COMPLETE_SITE_SPEC.md` → Section 10: Screenshot Inventory

Categories:
- Auth/Onboarding (5)
- Discover Ads (12)
- All Filter States (15)
- Detail Views (3)
- Create Ads (6)
- Chrome Extension (2)
- Marketing Page (13)
- UI States (7)

---

## ✅ Current Status

| Component | Status |
|-----------|--------|
| Database Schema | ✅ Complete |
| API Routes | ✅ Core complete |
| Data Collectors | ✅ Meta + Reddit |
| AI Pipeline | ✅ Working |
| Scoring System | ✅ Implemented |
| Landing Page | ✅ Basic |
| Dashboard | 🟡 In Progress |
| Filter Panel | ❌ Not Started |
| Report UI | ❌ Not Started |

---

## 🚀 Next Steps

1. Build Dashboard UI based on Hookd patterns
2. Implement Filter Panel component
3. Create Gap Card component
4. Build Report viewer
5. Add Stripe billing integration
6. Deploy to production

---

## 📞 Questions?

Refer to:
- `DEVELOPER_GUIDE.md` for architecture details
- `PRD.md` for product requirements
- `docs/HOOKD_COMPLETE_SITE_SPEC.md` for UI reference
