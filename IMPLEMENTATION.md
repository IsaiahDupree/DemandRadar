# GapRadar Implementation Guide

## Project Overview

**GapRadar** is a market gap analysis tool that helps founders and marketers identify opportunities by combining:
1. Ad data (Meta Ads Library, Google Transparency Center)
2. User sentiment (Reddit discussions)
3. App store presence (iOS, Android, Web)
4. UGC content analysis (TikTok, Instagram)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                        │
│  (shadcn/ui + Tailwind + TypeScript)                       │
├─────────────────────────────────────────────────────────────┤
│                      API Routes                             │
│  /api/runs, /api/checkout, /api/webhooks/stripe            │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                            │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────┐ │
│  │   Meta    │ │  Reddit   │ │ App Store │ │   OpenAI    │ │
│  │ Collector │ │ Collector │ │ Collector │ │  Pipeline   │ │
│  └───────────┘ └───────────┘ └───────────┘ └─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                     Supabase                                │
│  PostgreSQL + Auth + Realtime + Row Level Security         │
├─────────────────────────────────────────────────────────────┤
│                      Stripe                                 │
│  Subscriptions + Webhooks + Checkout                       │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
gap-radar/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── runs/
│   │   │   │   ├── route.ts              # GET/POST runs
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts          # GET/DELETE run
│   │   │   │       └── execute/
│   │   │   │           └── route.ts      # POST execute pipeline
│   │   │   ├── checkout/
│   │   │   │   └── route.ts              # POST create checkout
│   │   │   └── webhooks/
│   │   │       └── stripe/
│   │   │           └── route.ts          # POST webhook handler
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts              # OAuth callback
│   │   ├── dashboard/
│   │   │   ├── layout.tsx                # Dashboard layout with sidebar
│   │   │   ├── page.tsx                  # Main dashboard
│   │   │   ├── new-run/
│   │   │   │   └── page.tsx              # Create analysis
│   │   │   ├── runs/
│   │   │   │   └── page.tsx              # Run history
│   │   │   ├── gaps/
│   │   │   │   └── page.tsx              # Gap opportunities
│   │   │   ├── ideas/
│   │   │   │   └── page.tsx              # Product ideas
│   │   │   ├── ugc/
│   │   │   │   └── page.tsx              # UGC winners
│   │   │   ├── trends/
│   │   │   │   └── page.tsx              # Market trends
│   │   │   ├── reports/
│   │   │   │   └── page.tsx              # Generated reports
│   │   │   └── settings/
│   │   │       └── page.tsx              # Account settings
│   │   ├── login/
│   │   │   └── page.tsx                  # Login page
│   │   ├── signup/
│   │   │   └── page.tsx                  # Signup page
│   │   ├── layout.tsx                    # Root layout
│   │   ├── page.tsx                      # Redirect to dashboard
│   │   └── globals.css                   # Global styles
│   ├── components/
│   │   ├── ui/                           # shadcn/ui components
│   │   └── app-sidebar.tsx               # Navigation sidebar
│   ├── hooks/
│   │   └── use-runs.ts                   # Data fetching hooks
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                 # Browser client
│   │   │   ├── server.ts                 # Server client
│   │   │   └── middleware.ts             # Auth middleware
│   │   ├── collectors/
│   │   │   ├── meta.ts                   # Meta Ads Library
│   │   │   ├── reddit.ts                 # Reddit API
│   │   │   └── appstore.ts               # iOS/Android/Web
│   │   ├── ai/
│   │   │   ├── extractor.ts              # LLM extraction
│   │   │   ├── gap-generator.ts          # Gap identification
│   │   │   ├── concept-generator.ts      # Idea generation
│   │   │   └── ugc-generator.ts          # UGC recommendations
│   │   ├── scoring.ts                    # Scoring formulas
│   │   ├── stripe.ts                     # Stripe config
│   │   ├── mock-data.ts                  # Demo data
│   │   └── utils.ts                      # Utilities
│   ├── types/
│   │   └── index.ts                      # TypeScript types
│   └── middleware.ts                     # Next.js middleware
├── .env.local                            # Environment variables
├── package.json
└── tsconfig.json
```

## Database Schema

### Core Tables

```sql
-- Users (extends Supabase auth.users)
users (
  id UUID PRIMARY KEY,
  email TEXT,
  name TEXT,
  plan TEXT,           -- free|starter|builder|agency|studio
  runs_used INTEGER,
  runs_limit INTEGER,
  stripe_customer_id TEXT
)

-- Projects (group runs)
projects (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES users(id),
  name TEXT
)

-- Analysis Runs
runs (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  niche_query TEXT,
  seed_terms JSONB,
  competitors JSONB,
  geo TEXT,
  run_type TEXT,       -- light|deep
  status TEXT,         -- queued|running|complete|failed
  scores JSONB,
  started_at TIMESTAMP,
  finished_at TIMESTAMP
)
```

### Data Collection Tables

```sql
-- Ad Creatives (Meta + Google)
ad_creatives (
  id UUID PRIMARY KEY,
  run_id UUID,
  source TEXT,         -- meta|google
  advertiser_name TEXT,
  creative_text TEXT,
  headline TEXT,
  cta TEXT,
  landing_url TEXT,
  first_seen TIMESTAMP,
  is_active BOOLEAN,
  media_type TEXT
)

-- Reddit Mentions
reddit_mentions (
  id UUID PRIMARY KEY,
  run_id UUID,
  subreddit TEXT,
  type TEXT,           -- post|comment
  title TEXT,
  body TEXT,
  score INTEGER,
  permalink TEXT
)

-- App Store Results
app_store_results (
  id UUID PRIMARY KEY,
  run_id UUID,
  platform TEXT,       -- ios|android|web
  app_name TEXT,
  rating NUMERIC,
  review_count INTEGER
)
```

### Analysis Tables

```sql
-- LLM Extractions
extractions (
  id UUID PRIMARY KEY,
  run_id UUID,
  source_type TEXT,    -- ad|reddit
  offers JSONB,
  claims JSONB,
  angles JSONB,
  objections JSONB,
  desired_features JSONB,
  sentiment JSONB
)

-- Clusters
clusters (
  id UUID PRIMARY KEY,
  run_id UUID,
  cluster_type TEXT,   -- angle|objection|feature|offer
  label TEXT,
  examples JSONB,
  frequency INTEGER,
  intensity NUMERIC
)

-- Gap Opportunities
gap_opportunities (
  id UUID PRIMARY KEY,
  run_id UUID,
  gap_type TEXT,       -- product|offer|positioning|trust|pricing
  title TEXT,
  problem TEXT,
  evidence_ads JSONB,
  evidence_reddit JSONB,
  recommendation TEXT,
  opportunity_score NUMERIC,
  confidence NUMERIC
)

-- Concept Ideas
concept_ideas (
  id UUID PRIMARY KEY,
  run_id UUID,
  name TEXT,
  one_liner TEXT,
  platform_recommendation TEXT,
  business_model TEXT,
  gap_thesis TEXT,
  mvp_spec JSONB
)

-- Concept Metrics
concept_metrics (
  id UUID PRIMARY KEY,
  concept_id UUID,
  cpc_low/expected/high NUMERIC,
  cac_low/expected/high NUMERIC,
  tam_low/expected/high NUMERIC,
  implementation_difficulty INTEGER,
  human_touch_level TEXT,
  autonomous_suitability TEXT,
  opportunity_score NUMERIC
)
```

### UGC Tables

```sql
-- UGC Assets
ugc_assets (
  id UUID PRIMARY KEY,
  run_id UUID,
  source TEXT,
  platform TEXT,
  url TEXT,
  caption TEXT
)

-- UGC Metrics
ugc_metrics (
  ugc_asset_id UUID,
  views INTEGER,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  score NUMERIC
)

-- UGC Patterns
ugc_patterns (
  ugc_asset_id UUID,
  hook_type TEXT,
  format TEXT,
  proof_type TEXT,
  cta_style TEXT
)

-- UGC Recommendations
ugc_recommendations (
  run_id UUID,
  hooks JSONB,
  scripts JSONB,
  shot_list JSONB,
  angle_map JSONB
)
```

## Scoring Formulas

### Saturation Score (0-100)
```
saturation = 100 * sigmoid(0.6*log1p(A) + 0.3*log1p(C) + 0.8*R)

A = unique advertisers
C = total creatives
R = repetition index (top 3 angle share)
```

### Longevity Score (0-100)
```
longevity = clamp(100 * log1p(days_running) / log1p(180), 0, 100)
```

### Dissatisfaction Score (0-100)
```
dissatisfaction = 100 * sigmoid(0.5*log1p(F) + 0.7*I + 0.6*S + 0.2*log1p(W))

F = frequency (objection cluster mentions)
I = intensity (0-1)
S = negative sentiment ratio (0-1)
W = weighted score (upvoted complaints)
```

### Misalignment Score (0-100)
```
misalignment = 100 * (0.5*(1-P) + 0.3*M + 0.2*T)

P = promise coverage
M = missing feature rate
T = trust gap
```

### Opportunity Score (0-100)
```
opportunity = 0.35*longevity + 0.35*dissatisfaction + 0.30*misalignment
opportunity_adj = opportunity - 0.15*saturation
```

### Confidence Score (0-1)
```
confidence = clamp(0.4*data_sufficiency + 0.4*cross_source_alignment + 0.2*recency, 0, 1)
```

## Analysis Pipeline

```
1. User submits niche query
         ↓
2. Create run record (status: queued)
         ↓
3. Execute pipeline (status: running)
   ├── Collect Meta Ads
   ├── Collect Reddit mentions
   └── Collect App Store results
         ↓
4. Store raw data in DB
         ↓
5. LLM Extraction
   ├── Extract offers, claims, angles (ads)
   └── Extract objections, features, sentiment (reddit)
         ↓
6. Cluster similar items
         ↓
7. Generate gap opportunities
         ↓
8. Generate concept ideas + metrics
         ↓
9. Generate UGC recommendations
         ↓
10. Calculate scores
         ↓
11. Update run (status: complete)
```

## Pricing Plans

| Plan    | Price   | Runs/Month | Features                                    |
|---------|---------|------------|---------------------------------------------|
| Free    | $0      | 2          | Basic reports, Community support            |
| Starter | $29     | 2          | Full dossiers, Email support                |
| Builder | $99     | 10         | Full dossiers, UGC pack, Priority support   |
| Agency  | $249    | 35         | + API access, Dedicated support             |
| Studio  | $499    | 90         | + White-label, Account manager              |

## Environment Variables

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://owcutgdfteomvfqhfwce.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard>

# OpenAI (Required for real analysis)
OPENAI_API_KEY=sk-...

# Reddit API (Optional - uses mock without)
REDDIT_CLIENT_ID=<reddit app client id>
REDDIT_CLIENT_SECRET=<reddit app client secret>

# Meta Ads (Optional - uses mock without)
META_ACCESS_TOKEN=<facebook app token with ads_archive permission>

# Stripe (Required for billing)
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## Running Locally

```bash
# Install dependencies
cd gap-radar
npm install

# Set up environment
cp .env.local.example .env.local
# Edit .env.local with your keys

# Run development server
npm run dev
# App runs at http://localhost:3001

# The app works with mock data when API keys aren't configured
```

## Deployment Checklist

1. **Supabase Setup**
   - [x] Create project
   - [x] Run migrations (schema created)
   - [x] Enable RLS policies
   - [ ] Get anon key from dashboard
   - [ ] Configure OAuth providers (Google)

2. **API Keys**
   - [ ] OpenAI API key
   - [ ] Reddit app credentials (optional)
   - [ ] Meta app with ads_archive (optional)

3. **Stripe Setup**
   - [ ] Create products/prices for each plan
   - [ ] Set price IDs in environment
   - [ ] Configure webhook endpoint
   - [ ] Test checkout flow

4. **Deploy**
   - [ ] Deploy to Vercel/Netlify
   - [ ] Set environment variables
   - [ ] Update NEXT_PUBLIC_APP_URL
   - [ ] Test OAuth redirect URLs

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/lib/collectors/meta.ts` | Meta Ads Library integration |
| `src/lib/collectors/reddit.ts` | Reddit API integration |
| `src/lib/collectors/appstore.ts` | App store search |
| `src/lib/ai/extractor.ts` | LLM extraction pipeline |
| `src/lib/ai/gap-generator.ts` | Gap opportunity identification |
| `src/lib/ai/concept-generator.ts` | Product idea generation |
| `src/lib/ai/ugc-generator.ts` | UGC content recommendations |
| `src/lib/scoring.ts` | Scoring formula implementations |
| `src/lib/stripe.ts` | Billing plans configuration |
| `src/app/api/runs/[id]/execute/route.ts` | Main analysis pipeline |

## Mock Data Behavior

When API keys are not configured, the collectors return mock data:
- **Meta**: 3 sample ads with realistic copy
- **Reddit**: 4 sample posts with objections
- **App Stores**: 2 iOS + 2 Android + 2 Web results
- **OpenAI**: Pre-computed extractions and recommendations

This allows demoing the full UI without external dependencies.

## Future Enhancements

1. **Data Sources**
   - Google Ads Transparency Center (via SerpApi)
   - TikTok Creative Center integration
   - Instagram hashtag sampling

2. **Features**
   - Real-time run progress updates (Supabase Realtime)
   - PDF report generation
   - Saved searches / alerts
   - Team workspaces

3. **AI Improvements**
   - Vector embeddings for semantic clustering
   - Fine-tuned models for extraction
   - Competitive intelligence scoring

---

*Last updated: January 2026*
