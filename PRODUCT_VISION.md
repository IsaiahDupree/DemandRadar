# DemandRadar - Product Vision Document

**Product Name:** DemandRadar (formerly GapRadar)  
**Numerology:** 47 → 11 (Visionary/Insight)  
**Last Updated:** January 16, 2026

---

## Executive Summary

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

## The Core Thesis (What Your Tool Really Outputs)

For any niche, produce:

1. **Market Reality Map** - Who's advertising, what offers, what angles, what claims
2. **Saturation & Stability** - What's been running longest + what's repeated everywhere
3. **User Pain Map** - Top complaints, "wish it did X", pricing friction, trust issues
4. **Gap List** - Where ads promise A but users complain B, or where demand exists but ads are weak
5. **"3% Better" Plan** - Tiny product/copy/offer changes that directly neutralize the biggest objections

---

## Data Sources & Integration Reality

### 1. Meta Ads Library (Primary)
- **API:** Graph API `ads_archive` endpoint
- **Coverage:** Political/social-issue ads globally; broader EU/UK coverage
- **Key Signal:** Longevity (days_running = today - first_seen) as proxy for performance
- **Auth:** Access token with ads_read permissions

### 2. Google Ads Transparency Center
- **Challenge:** No official API endpoint
- **Solution:** Third-party structured APIs (SerpApi, SearchAPI) or controlled scraper
- **Key Signal:** Repeated messages/claims, theme clustering

### 3. Reddit Data API
- **Rate Limits:** 100 queries per minute per OAuth client
- **Key Signal:** Pain points, desired features, pricing sentiment, trust objections
- **Strategy:** Aggressive caching + minimal retention

### 4. App Stores
- **iOS:** Apple iTunes Search API (free, no auth)
- **Android:** 3rd-party structured scraping API (SerpApi, etc.)
- **Key Signal:** Existence gap mapping (mobile vs web saturation)

### 5. TikTok (UGC Winners)
- **TikTok Creative Center:** Top Ads + Trend Discovery (hashtags/songs/creators/videos)
- **TikTok Commercial Content API:** Ad metadata, reach, first/last shown
- **Connected Accounts:** Video list + per-video metrics (views, likes, comments, shares)

### 6. Instagram (UGC Winners)
- **Instagram Public Content Access:** Hashtag Search (gated, limited)
- **Connected Professional Accounts:** Performance insights for owned media
- **Limitation:** Max 30 unique hashtags per 7 days per account

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
Measures how crowded the niche is in paid messaging.

```
saturation = 100 * sigmoid(0.6*log1p(A) + 0.3*log1p(C) + 0.8*R)
```
Where:
- A = unique_advertisers
- C = total_creatives
- R = repetition_index (top_3_angle_share, 0-1)

### B) Longevity Signal (0-100)
Proxy for "endurance" (not performance, but persistence).

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
"How much ads talk past users."

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
```

### UGC Tables (New)

```sql
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

## UGC Winners Module

### Three Lanes of Content

#### Lane 1: Ad-Tested UGC (Market-Wide)
**Sources:**
- TikTok Creative Center (Top Ads + Trend Discovery)
- TikTok Commercial Content API (ad metadata, reach, first/last shown)

**Output:**
- Ranked list of UGC-style ads in the niche
- "Longevity winners" + "Reach winners"
- Creative pattern breakdown

#### Lane 2: Organic Trend Signals
**Sources:**
- TikTok Creative Center Trend Discovery
- Instagram Public Content Access (Hashtag Search)

**Output:**
- "Top hook formats right now" for the niche
- Emerging angles/formats that are spiking
- Trend-to-script translation

#### Lane 3: User-Connected Performance
**Sources:**
- TikTok API "List Videos" (connected accounts)
- Instagram Graph API (professional accounts)

**Output:**
- "Your top 20 posts" + why they worked
- "What to recreate next week"

### Creative Pattern Extraction

For each winning asset, extract:
- **Hook type:** POV, pain point, hack, myth-bust, curiosity, authority
- **Format:** UGC selfie, screen-record, before/after, testimonial, stitch, listicle
- **Proof type:** Results, demo, social proof, "how it works", comparison
- **Objection handled:** Price, quality, trust, time, difficulty
- **CTA mechanic:** Comment keyword, free trial, "watch this", "download"

### UGC Playbook Output

1. **10 Hooks** - Tailored to niche's top objections
2. **5 Script Blueprints** - 15s, 30s, 45s, 60s, 90s formats
3. **Shot List + Captions** - What to film + what to overlay
4. **Angle Map** - Which angles to test first (low CAC likelihood)

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

## "3% Better" Rule

Only recommend improvements tied to:

1. A top 3 repeated Reddit objection, OR
2. A missing promise/feature competitors aren't claiming, OR
3. A pricing/trust friction shown repeatedly

**Example outputs:**
- "Competitors claim 'fast' but Reddit complains about 'fails on X use case' → build X handling + make it the headline."
- "Reddit says pricing feels scammy → add transparent limits + refund policy + show real examples in ads."
- "Everyone runs the same angle → position around the one thing users beg for that no one mentions."

---

## Gap Engine Rules (MVP)

### Rule 1: "Ads promise X, Reddit complains Y"
If a Reddit objection cluster frequency is high and ads frequently claim the opposite → gap.

### Rule 2: "Reddit asks for feature X, ads never mention it"
If desired_feature frequency high and feature absent in ad claims → positioning gap.

### Rule 3: "Pricing friction mismatch"
If "overpriced" cluster high and ads are vague about pricing/trial/refund → trust/pricing gap.

Each rule outputs a structured gap with evidence IDs.

---

## MVP Acceptance Criteria

- User enters niche → report in <10 minutes
- Report includes ≥30 ads (combined) OR "insufficient data" warning
- Report includes ≥50 Reddit mentions OR "insufficient data" warning
- 5 ranked gaps with evidence + recommendations
- Exports downloadable (CSV/JSON)
- Platform recommendation with reasoning
- At least 3 concept ideas ranked

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

## Name Options (Numerology-Aligned)

### 11 — Visionary/Insight (Recommended)
- **DemandRadar** → 47 → 11 ✓
- MarketRadar → 47 → 11
- InsightForge → 74 → 11
- GapLens → 29 → 11

### 22 — Master Builder
- AtlasLens → 22
- LensAtlas → 22

### 33 — Teacher/Guide
- IdeaLens → 33
- PulseLens → 33
- TrendAtlas → 33

### 8 — Power/Money/Execution
- TrendLoom → 44 → 8
- NicheLens → 44 → 8
- ProofPulse → 53 → 8

**Selected Name:** DemandRadar (11 - Visionary)

---

*Document created from product vision conversation. Update as product evolves.*
