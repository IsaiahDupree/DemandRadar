# GapRadar - Product Requirements Document

## Product Overview

**Product Name:** GapRadar (working name)

**One-liner:** Enter a niche → get a ranked list of market gaps backed by (1) what's running in ads and (2) what users complain about on Reddit, plus a "3% better" plan (product + offer + copy).

**Primary Users:** Indie founders, growth marketers, agencies, operators validating a product/offer or improving conversions.

---

## Core Jobs-to-be-Done

1. "Show me what's already working (ads)."
2. "Show me what customers actually hate/love (Reddit)."
3. "Tell me where the mismatch is and what to change first."
4. "Should this be a mobile app or web app?"
5. "How hard is it to build and sell?"
6. "What UGC content style works best for this niche?"

---

## Landing Page (NLP + Live Trends)

### Purpose

The landing page is the primary top-of-funnel entry point. It must:

1. Immediately communicate the product value proposition ("find market gaps").
2. Let users explore demand via a natural language input (NLP-style search).
3. Showcase live, real-world trend signals (with clear source attribution).
4. Convert visitors into sign-ups and first runs.

### Primary Users

- Indie founders exploring markets
- Growth marketers validating niches/offers
- Agencies prospecting client opportunities

### Goals (Success Metrics)

- Increase landing → signup conversion rate
- Increase landing → first run initiation rate
- Lower time-to-value (user sees something useful within ~10 seconds)
- Build credibility via live signals and transparent data sourcing

### Non-Goals

- The landing page does **not** execute a full run by itself without auth.
- The landing page does **not** store user-entered niches in DB unless the user signs up/logs in.
- The landing page does **not** expose any secrets (no API keys in the client).

### User Stories

1. As a visitor, I can type a niche in plain English ("AI tools for content creators") and understand that DemandRadar can analyze it.
2. As a visitor, I can click a trending topic to instantly see an example niche and proceed to run analysis.
3. As a visitor, I can see trending topics sourced from real data (e.g., Reddit) with a timestamp and source attribution.
4. As a visitor, I can clearly navigate to sign up / log in.

### UX Requirements

#### IA / Sections

- Navigation (logo, Sign In, Get Started)
- Hero (value prop + short explanation)
- NLP Search input (primary CTA)
- Trending Topics grid (live data)
- Feature highlights (how the product works)
- Social proof (optional)
- CTA footer

#### NLP Search Input Behavior (v1)

- The input accepts natural language (niche, competitor, pain statement).
- As the user types, show lightweight "NLP-style" suggestions:
  - Category inference (e.g., AI, marketing, productivity)
  - Suggested query refinements (e.g., "best X 2025", "X with better pricing")
  - Confidence indicator (0-100)
- Suggestions are client-side heuristics in v1; they must be:
  - Fast (no blocking network calls required)
  - Deterministic enough to avoid confusing the user
- On submit:
  - If not authenticated, route to Signup (or Login) and preserve the query in the URL or local storage.
  - If authenticated, route to the "Create Run" flow with the query prefilled.

#### NLP Search Input Behavior (v2)

- Upgrade the suggestions to a server-powered NLP service:
  - Embedding-based keyword expansion
  - Competitor/entity recognition
  - Suggested seed terms and competitor sets
  - Optional LLM-based query rewrite

#### Trending Topics Grid

- Show 9–12 cards.
- Each card shows:
  - Topic title
  - Category
  - Opportunity score (0–100)
  - Growth indicator (0–100)
  - Sentiment indicator (positive/neutral/negative)
  - Sources (e.g., r/SaaS)
  - Related terms (chips)
- Cards are clickable:
  - Clicking a topic pre-fills the NLP search input.
  - Optionally triggers a “See how DemandRadar analyzes this” flow.

### Data Requirements: Live Trends

#### Trend Sources (v1)

- Reddit public endpoints (no auth):
  - Hot posts from selected subreddits (example set):
    - r/entrepreneur
    - r/startups
    - r/SaaS
    - r/smallbusiness
- Topic extraction:
  - Extract topic candidates primarily from post titles using simple NLP heuristics.
  - Dedupe by normalized topic string.

#### Trend Sources (v2)

- Add more sources (must be clearly attributed):
  - ProductHunt (if API available)
  - Google Trends (via official/3P integration)
  - X/Twitter (only if compliant + stable)

#### Caching & Rate Limiting

- The trends endpoint MUST be cached and not fetch on every request.
- Cache TTL: 5 minutes (or configurable).
- Hard cap outbound calls per request:
  - v1: <= 4 subreddit fetches
  - v2: must include per-source limits and exponential backoff
- If external sources error or rate limit:
  - Return last cached results if available
  - Otherwise return curated fallback trends

#### Data Quality & Disclosure

- Display "Updated at" timestamp.
- Disclose that trend signals are:
  - directional indicators
  - not financial advice
  - may be noisy

### API Contract: Trends

#### Endpoint

- `GET /api/trends`

#### Response Shape

```json
{
  "trends": [
    {
      "id": "string",
      "topic": "string",
      "category": "string",
      "volume": 12345,
      "growth": 75,
      "sentiment": "positive",
      "sources": ["r/SaaS"],
      "relatedTerms": ["keyword1", "keyword2"],
      "opportunityScore": 82
    }
  ],
  "lastUpdated": "2026-01-01T00:00:00.000Z",
  "sources": ["Reddit"]
}
```

#### Error Shape

```json
{ "error": "Failed to fetch trends" }
```

### SEO / Performance / Accessibility

#### SEO

- Landing page must include:
  - Title + description
  - OpenGraph / Twitter cards
  - Structured content (H1/H2 hierarchy)

#### Performance

- Targets:
  - LCP <= 2.5s on mid-tier device
  - TTFB <= 500ms for cached trends
- Trends fetch should be client-side with a skeleton state; cached server response should be fast.

#### Accessibility

- NLP suggestions must be keyboard navigable.
- Focus states visible.
- Color contrast compliant.
- Ensure interactive cards are accessible (button semantics / aria labels).

### Analytics / Telemetry

Track:

- Landing views
- CTA clicks (Sign In / Get Started)
- NLP search submits
- Trend topic clicks
- Conversion: signup started / completed

### Acceptance Criteria

1. Landing page renders with:
   - Hero + NLP search + trends + features
2. `GET /api/trends` returns 9–12 trend cards within 1s when cached.
3. Trends section shows an updated timestamp and at least one source label per trend.
4. If Reddit is unavailable, curated fallback trends are returned and UI still renders.
5. NLP search suggestions appear within 300ms after typing and are keyboard navigable.
6. No secrets are present in client bundles; API keys never appear in responses.

---

## Onboarding & App Shell UX

### Purpose

Post-signup, users need guided activation to reach their first "aha moment" (seeing a gap report). The app shell must support efficient navigation, credit visibility, and upgrade paths.

### Information Architecture

#### Primary Navigation (Sidebar)

| Section | Route | Purpose |
|---------|-------|---------|
| **Discover** | `/discover` | Browse analyzed gaps, trending niches |
| **My Reports** | `/reports` | User's saved/generated reports |
| **Run Analysis** | `/runs/new` | Start a new niche analysis |
| **Run History** | `/runs` | Past analysis runs |
| **Integrations** | `/integrations` | Slack, Discord, Webhooks |
| **Settings** | `/settings` | Account, billing, API keys |

#### Secondary Elements
- **Credits indicator** — visible remaining runs in sidebar
- **Upgrade CTA** — persistent but dismissible banner
- **Help/Support** — Intercom or similar widget

### Onboarding Flow (`/get-started`)

#### Checklist Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Setup Guide                    │  Video/Tutorial Card     │
│  ─────────────────────────────  │  - Thumbnail             │
│  ✓ Welcome aboard               │  - "See DemandRadar      │
│  ○ Run your first analysis      │     in action"           │
│    - Enter a niche              │  - Play button           │
│    - Review gap results         │                          │
│    - Save a report              │                          │
│  ○ Explore trending gaps        │                          │
│  ○ Set up notifications         │                          │
│  ○ Invite team members          │                          │
└─────────────────────────────────────────────────────────────┘
```

#### Checklist Requirements
- **Progress persistence** — store in DB (`user_onboarding` table)
- **Expandable sub-tasks** — break large steps into micro-actions
- **Auto-complete detection** — mark steps done when user completes action elsewhere
- **Skip option** — allow power users to dismiss

### Component Library Requirements

#### Filter Panel
- Collapsible accordion sections
- Multi-select checkboxes with search
- Range sliders for scores (0-100)
- Quick-filter chips/tags
- Clear all / Apply buttons

#### Results Card (Gap Card)
- Title + category badge
- Opportunity score (large, prominent)
- Confidence indicator
- Key metrics: saturation, dissatisfaction, misalignment
- Source indicators (Meta, Reddit, App Store)
- Hover actions: Save, Analyze deeper, Export

#### Empty State
- Reusable component with slots for:
  - Illustration
  - Headline
  - Description
  - Primary CTA
  - Secondary CTA (optional)

#### Paywall/Upgrade Gate
- Feature name being accessed
- "Upgrade to unlock" message
- Plan comparison (optional)
- Primary CTA to pricing/checkout
- No content preview (clean gate)

### State Management

| State | UI Treatment |
|-------|--------------|
| **Loading** | Skeleton loaders matching card shape |
| **Empty** | Empty state component with CTA |
| **Error** | Error message + retry button |
| **Populated** | Card grid/list with filters |
| **Paywall** | Upgrade gate (no partial content) |

### Engagement Patterns

1. **Credits visibility** — always show remaining in sidebar
2. **Progress indicators** — onboarding completion percentage
3. **Upgrade prompts** — contextual, based on feature access
4. **Notification opt-in** — prompt for Slack/email alerts
5. **Social proof** — testimonials in upgrade flows

### Acceptance Criteria

1. New users land on `/get-started` after first login
2. Onboarding checklist persists progress across sessions
3. Completing "Run your first analysis" auto-marks sub-tasks
4. Sidebar shows credits remaining (e.g., "3 runs left")
5. Paywall gate appears for tier-locked features
6. Empty states include actionable CTAs
7. Filter panel state persists in URL params

---

## Data Sources & Integrations

### 1. Meta Ads Library
- **Purpose:** "What's working in paid (and how long it's been working)"
- **Data Available:** Advertiser name, creative text, CTA, landing page URL, start date, active status, media type, regions/platforms
- **Key Signal:** Longevity (days_running = today - first_seen) as proxy for ad performance

### 2. Google Ads Transparency Center
- **Purpose:** "What's working in search/display + what messages advertisers repeat"
- **Implementation:** Via 3rd-party structured API (SerpApi, SearchAPI) or controlled scraper
- **Data Available:** Advertiser, creative text, repeated messages/claims, themes

### 3. Reddit Data API
- **Purpose:** "What users actually complain about / love / pay for / refuse to pay for"
- **Rate Limits:** 100 queries per minute per OAuth client
- **Data Available:** Pain points, desired features, pricing sentiment, trust objections, switching triggers

### 4. App Stores (iOS + Android)
- **Purpose:** Existence gap mapping - "Does this already exist on mobile, on web, or both?"
- **iOS:** Apple iTunes Search API (free, no auth)
- **Android:** 3rd-party structured scraping API (SerpApi, etc.)
- **Data Available:** App count, ratings, keyword overlap, positioning saturation

### 5. TikTok (UGC Winners)
- **Sources:**
  - TikTok Creative Center (Top Ads + Trend Discovery)
  - TikTok Commercial Content API (ad metadata, reach, first/last shown)
  - Connected user accounts (video metrics: views, likes, comments, shares)
- **Purpose:** What UGC styles actually work for the niche

### 6. Instagram (UGC Winners)
- **Sources:**
  - Instagram Public Content Access (Hashtag Search - limited)
  - Connected professional accounts (performance insights)
- **Purpose:** Trend patterns + owned content performance

---

## Core Product Outputs

### 1. Market Reality Map
- Who's advertising
- What offers/angles/claims they use
- What creative patterns repeat

### 2. Saturation & Stability Signals
- What's been running longest
- What's repeated everywhere
- Platform-specific saturation (iOS vs Android vs Web)

### 3. User Pain Map
- Top complaints (ranked)
- "Wish it did X" feature requests
- Pricing friction points
- Trust issues (refunds, privacy, support)

### 4. Gap List
- Where ads promise A but users complain B
- Where demand exists but ads are weak
- Platform existence gaps (mobile-only, web-only, both, none)

### 5. "3% Better" Plan
- Tiny product changes that directly neutralize biggest objections
- Copy/offer changes that match user reality
- MVP spec tied to top complaints

### 6. Idea Cards + Leaderboard
- Ranked app/web ideas with:
  - Platform recommendation (Mobile vs Web vs Hybrid)
  - B2B vs B2C classification
  - Industry + ICP
  - Estimated CPC/CPM/CAC ranges (modeled)
  - TAM estimation
  - Implementation difficulty score
  - Human touch required (High/Med/Low)
  - Autonomous coding suitability (High/Med/Low)

### 7. UGC Winners Pack
- Top performing ad-tested UGC creatives
- Trend signals (hashtags, sounds, formats)
- Creative pattern extraction (hooks, formats, proof types, CTAs)
- 10 hooks + 5 script blueprints + shot lists

---

## Scoring Formulas

### A) Ad Saturation Score (0-100)
```
saturation = 100 * sigmoid(0.6*log1p(A) + 0.3*log1p(C) + 0.8*R)
```
Where:
- A = unique_advertisers
- C = total_creatives
- R = repetition_index (top_3_angle_share, 0-1)

### B) Longevity Signal (0-100)
```
longevity = clamp(100 * log1p(days_running) / log1p(180), 0, 100)
```
(180 days normalization window)

### C) Reddit Dissatisfaction Score (0-100)
```
dissatisfaction = 100 * sigmoid(0.5*log1p(F) + 0.7*I + 0.6*S + 0.2*log1p(W))
```
Where:
- F = frequency (# mentions in top objection clusters)
- I = intensity (LLM-rated strength 0-1)
- S = sentiment_neg_ratio (0-1)
- W = weighted_score (sum of upvoted complaints)

### D) Misalignment Score (0-100)
```
misalignment = 100 * (0.5*(1 - P) + 0.3*M + 0.2*T)
```
Where:
- P = promise_coverage
- M = missing_feature_rate
- T = trust_gap

### E) Opportunity Score (0-100)
```
opportunity = 0.35*longevity + 0.35*dissatisfaction + 0.30*misalignment
opportunity_adj = opportunity - 0.15*saturation
```

### F) Confidence Score (0-1)
```
confidence = clamp(0.4*data_sufficiency + 0.4*cross_source_alignment + 0.2*recency, 0, 1)
```

### G) Build-to-Profit Score (Idea Ranking)
```
Score = (Opportunity × TAM_factor × Margin_factor × TimeToValue_factor) / (CAC_proxy × Complexity × Touch_factor)
```

### H) UGC Scoring

**Ad-tested lane:**
```
Score = 0.45*Longevity + 0.35*Reach + 0.20*EngagementProxy
```

**Trend lane:**
```
Score = 0.6*Recency + 0.4*RelevanceToNiche
```

**Connected performance:**
```
Score = 0.4*SharesRate + 0.3*CommentRate + 0.2*LikeRate + 0.1*ViewVelocity
```

---

## Database Schema

### Core Tables

```sql
-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Runs (Analysis Jobs)
CREATE TABLE runs (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  niche_query TEXT NOT NULL,
  seed_terms JSONB,
  competitors JSONB,
  geo TEXT,
  status TEXT CHECK (status IN ('queued', 'running', 'complete', 'failed')),
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  error TEXT
);

-- Ad Creatives (Meta + Google)
CREATE TABLE ad_creatives (
  id UUID PRIMARY KEY,
  run_id UUID REFERENCES runs(id),
  source TEXT CHECK (source IN ('meta', 'google')),
  advertiser_name TEXT,
  creative_text TEXT,
  headline TEXT,
  description TEXT,
  cta TEXT,
  landing_url TEXT,
  first_seen TIMESTAMP,
  last_seen TIMESTAMP,
  is_active BOOLEAN,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'carousel', 'unknown')),
  raw_payload JSONB
);

-- Reddit Mentions
CREATE TABLE reddit_mentions (
  id UUID PRIMARY KEY,
  run_id UUID REFERENCES runs(id),
  subreddit TEXT,
  type TEXT CHECK (type IN ('post', 'comment')),
  title TEXT,
  text TEXT,
  score INTEGER,
  num_comments INTEGER,
  created_at TIMESTAMP,
  permalink TEXT,
  matched_entities JSONB,
  raw_payload JSONB
);

-- LLM Extractions
CREATE TABLE extractions (
  id UUID PRIMARY KEY,
  run_id UUID REFERENCES runs(id),
  source_type TEXT CHECK (source_type IN ('ad', 'reddit')),
  source_id UUID,
  offers JSONB,
  claims JSONB,
  angles JSONB,
  objections JSONB,
  desired_features JSONB,
  sentiment JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clusters
CREATE TABLE clusters (
  id UUID PRIMARY KEY,
  run_id UUID REFERENCES runs(id),
  cluster_type TEXT CHECK (cluster_type IN ('angle', 'objection', 'feature', 'offer')),
  label TEXT,
  examples JSONB,
  frequency INTEGER,
  intensity NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Gap Opportunities
CREATE TABLE gap_opportunities (
  id UUID PRIMARY KEY,
  run_id UUID REFERENCES runs(id),
  gap_type TEXT CHECK (gap_type IN ('product', 'offer', 'positioning', 'trust', 'pricing')),
  title TEXT,
  problem TEXT,
  evidence_ads JSONB,
  evidence_reddit JSONB,
  recommendation TEXT,
  opportunity_score NUMERIC,
  confidence NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reports
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  run_id UUID REFERENCES runs(id),
  report_url TEXT,
  pdf_url TEXT,
  export_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- App Store Results
CREATE TABLE app_store_results (
  id UUID PRIMARY KEY,
  run_id UUID REFERENCES runs(id),
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  app_name TEXT,
  app_id TEXT,
  developer TEXT,
  rating NUMERIC,
  review_count INTEGER,
  description TEXT,
  category TEXT,
  price TEXT,
  raw_payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Concept Ideas (Vetted Product Ideas)
CREATE TABLE concept_ideas (
  id UUID PRIMARY KEY,
  run_id UUID REFERENCES runs(id),
  name TEXT,
  one_liner TEXT,
  platform_recommendation TEXT CHECK (platform_recommendation IN ('web', 'mobile', 'hybrid')),
  platform_reasoning TEXT,
  industry TEXT,
  icp TEXT,
  business_model TEXT CHECK (business_model IN ('b2b', 'b2c', 'b2b2c')),
  gap_thesis TEXT,
  mvp_spec JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Concept Metrics Estimates
CREATE TABLE concept_metrics (
  id UUID PRIMARY KEY,
  concept_id UUID REFERENCES concept_ideas(id),
  cpc_low NUMERIC,
  cpc_expected NUMERIC,
  cpc_high NUMERIC,
  cac_low NUMERIC,
  cac_expected NUMERIC,
  cac_high NUMERIC,
  tam_low NUMERIC,
  tam_expected NUMERIC,
  tam_high NUMERIC,
  implementation_difficulty INTEGER,
  human_touch_level TEXT CHECK (human_touch_level IN ('high', 'medium', 'low')),
  autonomous_suitability TEXT CHECK (autonomous_suitability IN ('high', 'medium', 'low')),
  build_difficulty INTEGER,
  distribution_difficulty INTEGER,
  opportunity_score NUMERIC,
  confidence NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

-- UGC Assets
CREATE TABLE ugc_assets (
  id UUID PRIMARY KEY,
  run_id UUID REFERENCES runs(id),
  source TEXT CHECK (source IN ('tiktok_top_ads', 'tiktok_commercial', 'tiktok_trend', 'ig_hashtag', 'tiktok_connected', 'ig_connected')),
  platform TEXT CHECK (platform IN ('tiktok', 'instagram')),
  url TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  created_at TIMESTAMP,
  raw_payload JSONB
);

-- UGC Metrics
CREATE TABLE ugc_metrics (
  id UUID PRIMARY KEY,
  ugc_asset_id UUID REFERENCES ugc_assets(id),
  views INTEGER,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  reach_unique_users INTEGER,
  first_shown TIMESTAMP,
  last_shown TIMESTAMP,
  score NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

-- UGC Patterns
CREATE TABLE ugc_patterns (
  id UUID PRIMARY KEY,
  ugc_asset_id UUID REFERENCES ugc_assets(id),
  hook_type TEXT,
  format TEXT,
  proof_type TEXT,
  objection_handled TEXT,
  cta_style TEXT,
  notes TEXT,
  confidence NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

-- UGC Recommendations
CREATE TABLE ugc_recommendations (
  id UUID PRIMARY KEY,
  run_id UUID REFERENCES runs(id),
  hooks JSONB,
  scripts JSONB,
  shot_list JSONB,
  angle_map JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Report Structure (Vetted Product Idea Dossier)

### Page 1 — Executive Summary
- Niche name
- Overall Opportunity Score (0-100) + Confidence
- Top 3 gaps (one-liners)
- Platform recommendation

### Page 2 — Paid Market Snapshot
- Top advertisers table
- Top repeated angles (with examples)
- Longest-running signal creatives
- Offer patterns (pricing, trials, guarantees)

### Page 3 — What Customers Actually Say (Reddit)
- Top objections (ranked)
- Top desired features (ranked)
- Pricing + trust friction (quotes/snippets)
- Switching triggers

### Page 4 — Platform Existence Gap
- iOS saturation score + top apps
- Android saturation score + top apps
- Web saturation score + top competitors
- Recommended launch surface + rationale

### Page 5 — Gap Opportunities (Ranked)
For each gap:
- Gap title + type
- Evidence (ads + reddit)
- Recommendation: "3% better"
- Expected impact

### Page 6 — Modeled Economics
- CPC range (low/expected/high)
- CAC range (low/expected/high)
- TAM range + assumptions
- Budget scenarios ($1k/$10k spend)
- Sensitivity controls

### Page 7 — Buildability Assessment
- Implementation difficulty score
- Time-to-MVP estimate (S/M/L)
- Human touch level
- Autonomous agent suitability
- Risk flags (compliance, platform policy, etc.)

### Page 8 — UGC Winners Pack
- Top ad-tested UGC creatives
- Trend signals (hashtags, sounds)
- Creative patterns breakdown
- 10 hooks + 5 scripts + shot list

### Page 9 — Action Plan
- 7-day quick wins
- 30-day roadmap
- 3 ad test concepts
- Landing page structure
- Top keywords to target

### Appendix — Data Exports
- CSV/JSON links
- Raw data access

---

## Pricing Model

### Subscription Plans (Credits-based)
| Plan | Price | Runs/Month | Per-Run |
|------|-------|------------|---------|
| Starter | $29/mo | 2 | $14.50 |
| Builder | $99/mo | 10 | $9.90 |
| Agency | $249/mo | 35 | $7.10 |
| Studio | $499/mo | 90 | $5.54 |

### One-off Reports
- **$49** - "Vetted Idea Pack" (light run)
- **$149** - "Full Dossier" (deep run + 3 ad concepts + MVP spec + TAM/CAC model)
- **$399** - "Agency-ready" (deep run + landing page + 10 ad angles + objection handling + backlog)

### Run Types
- **Light Run:** Fewer ads/mentions, smaller LLM budget, 1-3 gaps + quick MVP + platform rec
- **Deep Run:** Full sources, stronger clustering, complete dossier + execution kit + sensitivity model

---

## Variable Cost Estimates (per run)

| Component | Cost Range |
|-----------|------------|
| SERP API (Google/Play) | $0.20 - $1.50 |
| LLM (extraction + reports) | $0.50 - $4.00 |
| Infra + Storage | ~$0.05 |
| **Total** | **$0.75 - $6.00** |

Target gross margin: 85-90%

---

## MVP Scope (2-Week Build)

### Week 1: Data + Normalization + First Report
- Day 1: Repo + DB schema + runs orchestration + basic UI
- Day 2: Meta collector + normalize to ad_creatives
- Day 3: Reddit collector + normalize to reddit_mentions
- Day 4: Google collector + App Store collectors
- Day 5: LLM extraction pass + naive clustering

### Week 2: Scoring + Gap Engine + Polish
- Day 6: Implement scoring formulas + gap_opportunities rules
- Day 7: Report generator v1 (web + PDF) + exports
- Day 8: UX polish (run history, downloads, share links)
- Day 9: Quality pass (dedupe, filter junk, improve labels)
- Day 10: Launch-ready (onboarding, pricing, demo niches)

---

## Technical Architecture

### Services
- **collector-meta** - Ad Library API ingestion
- **collector-google** - Transparency Center via 3P API
- **collector-reddit** - Reddit Data API ingestion
- **collector-appstore** - iOS/Android app discovery
- **collector-ugc** - TikTok/Instagram content ingestion
- **normalizer** - Unifies to common schemas
- **insights-engine** - LLM extraction + clustering + scoring
- **report-generator** - PDF/web report + exports

### Storage
- PostgreSQL for structured data
- Object storage for raw payloads + media + reports
- Vector store (optional) for semantic search

### Key Patterns
- Aggressive caching (especially Reddit, scraping sources)
- Rate limiting with backoff
- Incremental updates where possible
- Clear "data source limitations" messaging in reports

---

## Compliance & Risk Notes

1. Build for rate limits + caching (especially Reddit)
2. Avoid storing personal info; store only needed text snippets + permalinks
3. Make "data source limitations" explicit in reports
4. Treat "longevity" as a proxy signal, not proof of profitability
5. CPC/CAC are modeled estimates, not actual performance data
6. App store scraping may need ToS review
7. UGC content: link to originals, don't host copies

---

## Success Metrics

### MVP Acceptance Criteria
- User enters niche → report in <10 minutes
- Report includes ≥30 ads (combined) OR "insufficient data" warning
- Report includes ≥50 Reddit mentions OR "insufficient data" warning
- 5 ranked gaps with evidence + recommendations
- Exports downloadable (CSV/JSON)
- Platform recommendation with reasoning
- At least 3 concept ideas ranked

### Growth Metrics
- Reports generated per week
- Conversion: free → paid
- Report completion rate
- User return rate (runs per user per month)
