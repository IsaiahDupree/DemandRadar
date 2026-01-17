# KeywordRadar Market Edition - Product Requirements Document

> A unified market intelligence platform that combines App Store keyword analysis, social media trend detection, and ad spend validation to identify product opportunities.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Product Vision](#product-vision)
4. [Core Jobs-To-Be-Done](#core-jobs-to-be-done)
5. [Data Sources & Integrations](#data-sources--integrations)
6. [Scoring System](#scoring-system)
7. [Core Product Outputs](#core-product-outputs)
8. [User Interface](#user-interface)
9. [Technical Architecture](#technical-architecture)
10. [MVP Scope](#mvp-scope)
11. [Pricing Model](#pricing-model)
12. [Success Metrics](#success-metrics)
13. [Roadmap](#roadmap)

---

## Executive Summary

**KeywordRadar Market Edition** is a comprehensive market intelligence tool that answers: *"Should I build this product, and how should I position it?"*

It combines three layers of market signals:
1. **App Store Layer** → Popularity & Difficulty
2. **Social Layer** → Buzz & Velocity
3. **Market Layer** → Demand & Spend (Ad validation)

The output is an **Opportunity Score** (0-100) that ranks product ideas by their likelihood of success, backed by real market data.

---

## Problem Statement

### Current State

Founders, indie hackers, and product teams use fragmented tools:
- **ASO tools** (AppTweak, Sensor Tower) for app store keywords
- **Social listening** (Sprout, Brand24) for social buzz
- **Ad spy tools** (Facebook Ads Library, AdSpy) for competitor ads
- **Trend tools** (Google Trends, Exploding Topics) for rising demand

**Problems:**
1. **No unified view** - Data lives in 5+ different tools
2. **No scoring** - No way to compare opportunities objectively
3. **Social is ignored** - ASO tools don't consider TikTok/IG trends
4. **Ads are ignored** - No demand validation signal
5. **Too expensive** - Full stack of tools costs $500+/month

### Target Users

| Persona | Needs |
|---------|-------|
| **Indie Hackers** | Validate SaaS/app ideas quickly |
| **Mobile App Studios** | Find underserved niches |
| **DTC Founders** | Discover product opportunities |
| **Growth Teams** | Identify keyword targets with demand |
| **VCs/Analysts** | Assess market size and competition |

---

## Product Vision

### One-Liner
*"The market radar for product opportunities - combining app stores, social trends, and ad spend into a single Opportunity Score."*

### Three-Layer Intelligence

```
┌─────────────────────────────────────────────────────────────────┐
│                    OPPORTUNITY SCORE (0-100)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  APP STORE   │  │    SOCIAL    │  │    MARKET    │           │
│  │    LAYER     │  │    LAYER     │  │    LAYER     │           │
│  │              │  │              │  │              │           │
│  │ • Popularity │  │ • TikTok     │  │ • Active Ads │           │
│  │ • Difficulty │  │ • Instagram  │  │ • Ad Longevity│           │
│  │ • Trend      │  │ • YouTube    │  │ • Spend Est. │           │
│  │ • SERP       │  │ • Reddit     │  │ • Advertisers│           │
│  │              │  │ • Velocity   │  │ • Creative   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Differentiators

| Feature | KeywordRadar | Traditional ASO Tools |
|---------|--------------|----------------------|
| Social trend data | ✅ TikTok, IG, YT, Reddit | ❌ None |
| Ad spend validation | ✅ Meta Ads Library | ❌ None |
| Cross-platform view | ✅ iOS + Android + Social | 🟡 iOS + Android only |
| Opportunity scoring | ✅ Combined formula | 🟡 Basic popularity/difficulty |
| Price | $49-199/mo | $100-500/mo |

---

## Core Jobs-To-Be-Done

### Job 1: Validate a Product Idea
> "I have an idea for a habit tracker app. Is there demand? Who's already competing? Is social buzz rising?"

**Inputs:** Keyword or product idea
**Outputs:** Opportunity Score, competitive landscape, social velocity

### Job 2: Find Untapped Niches
> "I want to build a mobile app. Show me niches with high demand but low competition."

**Inputs:** Topic cluster or "explore"
**Outputs:** Ranked list of keywords by Opportunity Score

### Job 3: Monitor Market Changes
> "Alert me when a competitor starts running ads, or when social buzz spikes for my keywords."

**Inputs:** Watchlist of keywords/competitors
**Outputs:** Alerts, weekly digest

### Job 4: Competitive Intelligence
> "What keywords are my competitors ranking for? What ads are they running?"

**Inputs:** App name or bundle ID
**Outputs:** Keyword breakdown, ad creative gallery, positioning analysis

---

## Data Sources & Integrations

### App Store APIs

| Source | Data | API |
|--------|------|-----|
| **Apple App Store** | Search, Top Charts, App Details | RapidAPI / Official |
| **Google Play Store** | Search, Top Charts, App Details | RapidAPI / Official |
| **Chrome Web Store** | Extensions (optional) | Chrome API |

### Social APIs

| Source | Data | API |
|--------|------|-----|
| **TikTok** | Hashtag search, video metrics | RapidAPI |
| **Instagram** | Profile, posts, reels metrics | RapidAPI |
| **YouTube** | Search, video metrics, comments | Official / RapidAPI |
| **Reddit** | Posts, comments, sentiment | RapidAPI / Official |
| **X (Twitter)** | Posts, engagement (limited) | RapidAPI |

### Market/Ads APIs

| Source | Data | API |
|--------|------|-----|
| **Meta Ads Library** | Active ads, longevity, spend | Official Graph API |
| **Google Ads Transparency** | Search/display ads | SerpApi |
| **Landing Pages** | Copy analysis, pricing | Custom scraper |

### Enrichment

| Source | Purpose |
|--------|---------|
| **OpenAI GPT-4** | Landing page analysis, creative categorization |
| **Google Trends** | Trend direction validation |

---

## Scoring System

### Opportunity Score Formula

```python
Opportunity_Score = (
    0.25 * Demand_Signal +
    0.25 * Social_Momentum +
    0.20 * Ad_Validation +
    0.15 * (100 - Competition) +
    0.15 * Trend_Velocity
)
```

### Component Scores

#### 1. Demand Signal (0-100)
```python
# App Store search volume proxy
demand = weighted_average(
    popularity_ios * 0.5,
    popularity_android * 0.5
)
```

#### 2. Social Momentum (0-100)
```python
# Social buzz across platforms
social = (
    0.35 * tiktok_buzz +
    0.25 * instagram_buzz +
    0.20 * youtube_buzz +
    0.15 * reddit_buzz +
    0.05 * twitter_buzz
)
```

#### 3. Ad Validation (0-100)
```python
# People spending money = validated demand
ad_validation = (
    30 * min(1, log(ad_count + 1) / 3) +
    25 * min(1, advertiser_count / 10) +
    25 * min(1, median_ad_age / 90) +
    20 * (1 if has_video_ads else 0.5)
)
```

#### 4. Competition (0-100)
```python
# Lower is better for opportunity
competition = average(
    difficulty_ios,
    difficulty_android
)
```

#### 5. Trend Velocity (0-100)
```python
# Rising vs falling
velocity = (
    0.4 * social_growth_rate +
    0.3 * store_rank_improvement +
    0.3 * new_ads_velocity
)
```

### Interpretation Guide

| Score | Interpretation | Action |
|-------|---------------|--------|
| **80-100** | 🟢 Strong opportunity | Move fast, validate product-market fit |
| **60-79** | 🟡 Good opportunity | Worth exploring, identify differentiation |
| **40-59** | 🟠 Moderate | Needs unique angle or timing |
| **20-39** | 🔴 Challenging | High competition or low demand |
| **0-19** | ⚫ Poor fit | Likely saturated or no market |

---

## Core Product Outputs

### 1. Keyword Explorer

**Input:** Single keyword or phrase
**Output:**

| Section | Contents |
|---------|----------|
| **Opportunity Score** | 0-100 with breakdown |
| **Demand Signals** | iOS popularity, Android popularity, trend direction |
| **Social Buzz** | Per-platform scores + top posts/videos |
| **Competition** | iOS difficulty, Android difficulty, top 10 apps |
| **Ad Landscape** | Active ads count, top advertisers, creative types |
| **Related Keywords** | Suggestions with their scores |

### 2. Niche Radar

**Input:** Topic cluster (e.g., "fitness", "productivity")
**Output:**

| Section | Contents |
|---------|----------|
| **Opportunity Matrix** | Keywords plotted by Demand vs Competition |
| **Top 20 Opportunities** | Ranked by Opportunity Score |
| **Rising Stars** | Highest velocity keywords |
| **Validated Niches** | Keywords with ad spend proof |
| **Quick Wins** | High demand + low competition |

### 3. App Breakdown

**Input:** App name or bundle ID
**Output:**

| Section | Contents |
|---------|----------|
| **App Profile** | Name, ratings, installs, category |
| **Keyword Rankings** | Keywords they rank for + positions |
| **Keyword Opportunities** | Keywords they're missing |
| **Ad Intelligence** | Their active ads, creatives, messaging |
| **Competitor Overlap** | Apps competing for same keywords |

### 4. Market Overview Dashboard

**Input:** None (global view)
**Output:**

| Section | Contents |
|---------|----------|
| **Top 50 Opportunities** | Across all tracked keywords |
| **Trending Now** | Fastest rising social buzz |
| **New Ad Activity** | Keywords with new ads in past 7 days |
| **Category Breakdown** | Opportunities by topic cluster |
| **Alerts** | Significant changes in tracked keywords |

### 5. Watchlist & Alerts

**Input:** User-defined keywords/apps
**Output:**

| Alert Type | Trigger |
|------------|---------|
| **Opportunity Spike** | Score increases 15+ points |
| **New Competitor Ads** | Competitor starts running ads |
| **Social Surge** | Buzz score increases 30+ points |
| **Rank Change** | App moves 10+ positions |
| **Weekly Digest** | Summary of all watched items |

---

## User Interface

### Pages

| Page | Purpose |
|------|---------|
| **Dashboard** | Global overview, top opportunities |
| **Keyword Explorer** | Deep-dive on single keyword |
| **Niche Radar** | Explore topic clusters |
| **App Breakdown** | Analyze specific apps |
| **Watchlist** | Track keywords/apps |
| **Reports** | Export PDF/CSV reports |
| **Settings** | Account, alerts, API keys |

### Design Principles

1. **Data density** - Show maximum info without clutter
2. **Scannable scores** - Color-coded 0-100 scales everywhere
3. **Drill-down** - Click any score to see breakdown
4. **Compare** - Side-by-side keyword/app comparison
5. **Export** - Every view exportable to CSV/PDF

---

## Technical Architecture

### Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React, TailwindCSS, shadcn/ui |
| **Backend** | Next.js API Routes / FastAPI |
| **Database** | Supabase (PostgreSQL) |
| **Cache** | Redis (optional) |
| **Jobs** | Supabase Edge Functions / Celery |
| **AI** | OpenAI GPT-4 |
| **Hosting** | Vercel / Railway |

### Data Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                     KEYWORD DISCOVERY                            │
│  Seeds: Top charts, autocomplete, user submissions               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      NIGHTLY CRAWL                               │
│  • App Store Search (iOS + Android)                              │
│  • App Details for top N results                                 │
│  • Social Search (TikTok, IG, YT, Reddit)                        │
│  • Meta Ads Library                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      SCORING JOB                                 │
│  Compute: Popularity, Difficulty, Buzz, Validation, Opportunity │
│  Store: keyword_scores, keyword_overview                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API / UI LAYER                              │
│  • REST API for all data                                         │
│  • Real-time dashboard                                           │
│  • Alerts (email, webhook)                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema (Summary)

| Table | Purpose |
|-------|---------|
| `keywords` | Canonical keywords |
| `keyword_aliases` | Plurals, synonyms |
| `platforms` | iOS, Android, Chrome |
| `social_platforms` | TikTok, IG, YT, Reddit, X |
| `apps` | App metadata |
| `app_metrics_snapshot` | Daily app metrics |
| `keyword_store_snapshot` | Daily store metrics per keyword |
| `app_keyword_rankings` | SERP positions |
| `keyword_store_scores` | Normalized store scores |
| `keyword_social_snapshot` | Daily social metrics |
| `keyword_social_scores` | Normalized social scores |
| `keyword_ads_snapshot` | Daily ads metrics |
| `keyword_market_scores` | Normalized market scores |
| `keyword_scores` | Combined scores (denormalized) |
| `meta_ads` | Individual ad creatives |

*Full schema: See DATABASE_SCHEMA.md*

---

## MVP Scope

### MVP Features (v1.0)

| Feature | Priority |
|---------|----------|
| ✅ Keyword Explorer | P0 |
| ✅ Opportunity Score | P0 |
| ✅ iOS App Store data | P0 |
| ✅ Android Play data | P0 |
| ✅ TikTok buzz | P0 |
| ✅ Instagram buzz | P0 |
| ✅ Meta Ads Library | P0 |
| ✅ Basic Dashboard | P0 |
| 🟡 Niche Radar | P1 |
| 🟡 App Breakdown | P1 |
| 🟡 Watchlist | P1 |
| ❌ YouTube data | P2 |
| ❌ Reddit data | P2 |
| ❌ Alerts | P2 |
| ❌ PDF Reports | P2 |
| ❌ Team accounts | P3 |

### MVP Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **Phase 1** | 2 weeks | Database schema, crawlers, scoring |
| **Phase 2** | 2 weeks | API layer, Keyword Explorer UI |
| **Phase 3** | 1 week | Dashboard, polish, beta launch |
| **Phase 4** | 2 weeks | Niche Radar, App Breakdown |
| **Phase 5** | Ongoing | Watchlist, alerts, reports |

---

## Pricing Model

### Plans

| Plan | Price | Limits |
|------|-------|--------|
| **Free** | $0/mo | 10 keyword lookups/day, no history |
| **Starter** | $49/mo | 100 keywords tracked, daily refresh |
| **Pro** | $99/mo | 500 keywords, hourly refresh, alerts |
| **Team** | $199/mo | 2000 keywords, 5 seats, API access |
| **Enterprise** | Custom | Unlimited, dedicated support |

### Feature Matrix

| Feature | Free | Starter | Pro | Team |
|---------|------|---------|-----|------|
| Keyword Explorer | ✅ | ✅ | ✅ | ✅ |
| Opportunity Score | ✅ | ✅ | ✅ | ✅ |
| App Store Data | ✅ | ✅ | ✅ | ✅ |
| Social Data | 🟡 (TikTok only) | ✅ | ✅ | ✅ |
| Ads Data | ❌ | ✅ | ✅ | ✅ |
| Historical Data | ❌ | 30 days | 90 days | 1 year |
| Watchlist | ❌ | 20 items | 100 items | 500 items |
| Alerts | ❌ | Email | Email + Webhook | All |
| API Access | ❌ | ❌ | ❌ | ✅ |
| Team Seats | 1 | 1 | 1 | 5 |

---

## Success Metrics

### North Star Metric
**Weekly Active Users (WAU)** who perform 3+ keyword searches

### Leading Indicators

| Metric | Target (6 months) |
|--------|-------------------|
| Registered users | 5,000 |
| Paid subscribers | 200 |
| MRR | $15,000 |
| Churn rate | <5% monthly |
| NPS | >50 |

### Usage Metrics

| Metric | Target |
|--------|--------|
| Keywords searched/user/week | 15+ |
| Return rate (7-day) | 40% |
| Feature adoption (Niche Radar) | 30% |
| Alert engagement rate | 25% |

### Data Quality Metrics

| Metric | Target |
|--------|--------|
| Keyword coverage | 100K+ tracked |
| Data freshness | <24 hours |
| Score accuracy (user feedback) | >80% "helpful" |

---

## Roadmap

### Q1 2026 (MVP Launch)

- [x] Database schema
- [ ] Store crawlers (iOS + Android)
- [ ] Social crawlers (TikTok + IG)
- [ ] Meta Ads integration
- [ ] Scoring engine
- [ ] Keyword Explorer UI
- [ ] Basic Dashboard
- [ ] Beta launch

### Q2 2026 (Growth)

- [ ] Niche Radar
- [ ] App Breakdown
- [ ] Watchlist & Alerts
- [ ] YouTube + Reddit data
- [ ] PDF/CSV exports
- [ ] Stripe billing
- [ ] Public launch

### Q3 2026 (Scale)

- [ ] API access (Team plan)
- [ ] Chrome extension
- [ ] Slack integration
- [ ] Custom scoring weights
- [ ] Competitor tracking
- [ ] Landing page analysis (AI)

### Q4 2026 (Enterprise)

- [ ] Team workspaces
- [ ] SSO
- [ ] Custom data sources
- [ ] White-label option
- [ ] Agency features

---

## Appendix

### Related Documentation

| Document | Purpose |
|----------|---------|
| `ASO_KEYWORD_METHODOLOGY.md` | How popularity/difficulty are computed |
| `META_ADS_LIBRARY_INTEGRATION.md` | Meta API integration guide |
| `DATABASE_SCHEMA.md` | Full PostgreSQL schema |
| `SCORING_FORMULAS.md` | Detailed scoring math |

### Competitive Landscape

| Tool | Strengths | Weaknesses |
|------|-----------|------------|
| **AppTweak** | Deep ASO, Apple Ads integration | No social, expensive |
| **Sensor Tower** | Enterprise scale, revenue estimates | Very expensive, no social |
| **AppFollow** | Reviews, ratings, good UI | Limited keyword data |
| **Exploding Topics** | Trend detection | No app store data |
| **SpyFu/AdSpy** | Ad intelligence | No app/social data |

**KeywordRadar's positioning:** First tool to unify App Store + Social + Ads into a single Opportunity Score at indie-friendly pricing.

---

*Product Requirements Document for KeywordRadar Market Edition*
*Version 1.0*
*Last updated: January 2026*
