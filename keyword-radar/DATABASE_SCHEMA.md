# KeywordRadar Database Schema

> Complete PostgreSQL/Supabase schema for the Market Radar keyword intelligence system.

---

## Table of Contents

1. [Entity Relationships](#entity-relationships)
2. [Core Tables](#core-tables)
3. [App Store Layer](#app-store-layer)
4. [Social Layer](#social-layer)
5. [Market Layer (Ads)](#market-layer-ads)
6. [Combined Scores](#combined-scores)
7. [Views & Queries](#views--queries)

---

## Entity Relationships

```
┌─────────────┐      ┌─────────────────────┐      ┌──────────────────┐
│  keywords   │──┬──→│ keyword_store_snapshot│     │    platforms     │
│             │  │   │ keyword_store_scores │←────│ (ios, android)   │
└─────────────┘  │   └─────────────────────┘      └──────────────────┘
       │         │
       │         │   ┌─────────────────────┐      ┌──────────────────┐
       │         ├──→│keyword_social_snapshot│    │ social_platforms │
       │         │   │keyword_social_scores │←────│(tiktok, ig, yt)  │
       │         │   └─────────────────────┘      └──────────────────┘
       │         │
       │         │   ┌─────────────────────┐
       │         └──→│ keyword_ads_snapshot │
       │             │keyword_market_scores │
       │             └─────────────────────┘
       │
       ↓
┌─────────────┐      ┌─────────────────────┐
│keyword_scores│     │   keyword_overview  │ (VIEW)
│  (combined) │─────→│   (huge overview)   │
└─────────────┘      └─────────────────────┘
```

---

## Core Tables

### Platforms & Base Tables

```sql
-- App stores & app-like platforms (Chrome Web Store etc.)
create table platforms (
  id                bigserial primary key,
  code              text not null unique,    -- 'ios', 'android', 'chrome_web'
  name              text not null,
  api_endpoint      text,
  created_at        timestamptz default now()
);

-- Seed data
insert into platforms (code, name) values
  ('ios', 'Apple App Store'),
  ('android', 'Google Play Store'),
  ('chrome_web', 'Chrome Web Store');

-- Social media platforms
create table social_platforms (
  id                bigserial primary key,
  code              text not null unique,    -- 'tiktok', 'instagram', 'youtube', 'x'
  name              text not null,
  api_endpoint      text,
  created_at        timestamptz default now()
);

-- Seed data
insert into social_platforms (code, name) values
  ('tiktok', 'TikTok'),
  ('instagram', 'Instagram'),
  ('youtube', 'YouTube'),
  ('x', 'X (Twitter)'),
  ('threads', 'Threads'),
  ('reddit', 'Reddit');
```

### Keywords

```sql
-- Canonical keywords
create table keywords (
  id                bigserial primary key,
  keyword           text not null unique,
  normalized        text not null,           -- lowercase, trimmed
  language          text default 'en',
  topic_cluster     text,                    -- optional: 'habit', 'finance', etc.
  keyword_type      text,                    -- 'generic', 'brand', 'feature', 'intent'
  is_tracked        boolean default true,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index on keywords (normalized);
create index on keywords (topic_cluster);
create index on keywords (is_tracked) where is_tracked = true;

-- Aliases: plurals, misspellings, brand variants
create table keyword_aliases (
  id                bigserial primary key,
  keyword_id        bigint not null references keywords(id) on delete cascade,
  alias             text not null,
  normalized        text not null,
  alias_type        text,                    -- 'plural', 'misspelling', 'synonym'
  created_at        timestamptz default now()
);

create index on keyword_aliases (normalized);
create index on keyword_aliases (keyword_id);
```

---

## App Store Layer

### Apps & Their Metrics

```sql
-- One row = one app on one store (bundle/package scoped)
create table apps (
  id                bigserial primary key,
  platform_id       bigint not null references platforms(id),
  store_app_id      text not null,           -- bundle id / package name / extension id
  name              text not null,
  publisher_name    text,
  publisher_id      text,
  primary_genre     text,
  secondary_genres  jsonb,
  is_brand          boolean default false,   -- if this is a branded term anchor
  icon_url          text,
  released_at       date,
  last_seen_at      timestamptz default now(),
  created_at        timestamptz default now(),
  
  unique(platform_id, store_app_id)
);

create index on apps (platform_id);
create index on apps (name);
create index on apps (primary_genre);

-- Daily snapshot of app strength metrics (for authority calculations)
create table app_metrics_snapshot (
  id                bigserial primary key,
  app_id            bigint not null references apps(id) on delete cascade,
  snapshot_date     date not null,
  
  -- Install/download metrics
  installs_low      bigint,                  -- lower bound (Android)
  installs_high     bigint,                  -- upper bound (Android)
  downloads_30d     bigint,                  -- if available
  
  -- Rating metrics
  rating            numeric(3,2),
  rating_count      bigint,
  rating_count_30d  bigint,                  -- new ratings in 30d
  
  -- Revenue (estimates)
  revenue_estimate  numeric,
  
  -- Chart presence
  chart_rank_free   integer,
  chart_rank_paid   integer,
  chart_rank_grossing integer,
  
  -- Computed
  authority_score   numeric(5,2),            -- precomputed for faster joins
  growth_rate       numeric(5,3),            -- vs prior period
  
  created_at        timestamptz default now(),
  
  unique (app_id, snapshot_date)
);

create index on app_metrics_snapshot (snapshot_date);
create index on app_metrics_snapshot (app_id, snapshot_date desc);
```

### Keyword ↔ Store Snapshots

```sql
-- Raw per-day metrics per keyword+store
create table keyword_store_snapshot (
  id                bigserial primary key,
  keyword_id        bigint not null references keywords(id) on delete cascade,
  platform_id       bigint not null references platforms(id),
  snapshot_date     date not null,
  
  -- SERP data
  total_results     int,
  
  -- Derived scores (raw, before normalization)
  popularity_raw    numeric,
  difficulty_raw    numeric,
  trend_velocity_raw numeric,                -- change in avg rank vs prior 30d
  
  -- Debug/explain data
  rank_distribution jsonb,                   -- histogram of positions
  top_apps_json     jsonb,                   -- ids + positions (cached)
  meta              jsonb,
  
  created_at        timestamptz default now(),
  
  unique (keyword_id, platform_id, snapshot_date)
);

create index on keyword_store_snapshot (platform_id, snapshot_date);
create index on keyword_store_snapshot (keyword_id, snapshot_date desc);

-- Per-app rankings for each keyword snapshot (for drill-down)
create table app_keyword_rankings (
  id                bigserial primary key,
  keyword_store_snapshot_id bigint not null
      references keyword_store_snapshot(id) on delete cascade,
  app_id            bigint not null references apps(id),
  rank_position     integer not null,        -- 1,2,3...
  page_index        integer,                 -- 1st page, 2nd page, etc.
  
  -- Keyword presence
  in_title          boolean default false,
  in_subtitle       boolean default false,
  in_short_desc     boolean default false,
  in_full_desc      boolean default false,
  
  -- App strength at time of snapshot
  authority_score   numeric(5,2),
  
  created_at        timestamptz default now()
);

create index on app_keyword_rankings (app_id);
create index on app_keyword_rankings (keyword_store_snapshot_id, rank_position);

-- Current normalized scores per keyword per store (fast query table)
create table keyword_store_scores (
  id                bigserial primary key,
  keyword_id        bigint not null references keywords(id) on delete cascade,
  platform_id       bigint not null references platforms(id),
  
  -- 0–100 scales, updated by nightly job
  popularity_score  numeric(5,2),
  difficulty_score  numeric(5,2),
  trend_velocity    numeric(5,2),            -- 0–100 rising/falling
  
  -- Additional metrics
  serp_saturation   numeric(5,2),            -- how many title matches
  brand_lock        boolean default false,   -- dominated by brand terms
  
  updated_at        timestamptz default now(),
  
  unique (keyword_id, platform_id)
);

create index on keyword_store_scores (platform_id, popularity_score desc);
create index on keyword_store_scores (keyword_id);
```

---

## Social Layer

### Keyword ↔ Social Snapshots

```sql
-- Raw per-day social metrics per keyword+platform
create table keyword_social_snapshot (
  id                bigserial primary key,
  keyword_id        bigint not null references keywords(id) on delete cascade,
  social_platform_id bigint not null references social_platforms(id),
  snapshot_date     date not null,
  
  -- Volume metrics (rolling 30 day)
  posts_30d         bigint,
  views_30d         bigint,
  likes_30d         bigint,
  comments_30d      bigint,
  shares_30d        bigint,
  
  -- Engagement
  engagement_rate   numeric(5,4),            -- engagement / views
  avg_engagement    numeric,
  
  -- Trend
  growth_rate       numeric(6,3),            -- vs prior period (e.g. 0.25 = +25%)
  velocity_7d       numeric(6,3),            -- 7-day acceleration
  
  -- Raw score (before normalization)
  buzz_raw          numeric,
  
  -- Debug
  meta              jsonb,
  
  created_at        timestamptz default now(),
  
  unique(keyword_id, social_platform_id, snapshot_date)
);

create index on keyword_social_snapshot (snapshot_date);
create index on keyword_social_snapshot (keyword_id, snapshot_date desc);

-- Current normalized social buzz per keyword
create table keyword_social_scores (
  id                bigserial primary key,
  keyword_id        bigint not null references keywords(id) on delete cascade,
  social_platform_id bigint,                 -- null = aggregated global
  
  -- 0-100 scores
  buzz_score        numeric(5,2),
  trend_score       numeric(5,2),            -- rising/falling
  engagement_score  numeric(5,2),
  
  -- Volume indicators
  post_volume       text,                    -- 'low', 'medium', 'high', 'viral'
  
  updated_at        timestamptz default now(),
  
  unique(keyword_id, social_platform_id)
);

create index on keyword_social_scores (buzz_score desc);
create index on keyword_social_scores (keyword_id);
```

---

## Market Layer (Ads)

### Keyword ↔ Ads Snapshots

```sql
-- Per-day Meta Ads metrics per keyword
create table keyword_ads_snapshot (
  id                bigserial primary key,
  keyword_id        bigint not null references keywords(id) on delete cascade,
  platform          text not null,           -- 'facebook' | 'instagram' | 'both'
  snapshot_date     date not null,
  
  -- Counts
  ad_count          int,
  active_ad_count   int,
  advertiser_count  int,
  
  -- Creative analysis
  creative_types    jsonb,                   -- ['video','image','carousel']
  cta_types         jsonb,                   -- ['Install','Shop Now','Learn More']
  
  -- Timing signals
  median_ad_age_days int,
  newest_ad_age_days int,
  oldest_ad_age_days int,
  ads_started_7d    int,                     -- new ads in last 7 days
  ads_started_30d   int,
  
  -- Geographic data
  geo               jsonb,                   -- {US:60%, EU:30%, ...}
  primary_geo       text,                    -- most common geo
  
  -- Spend estimates
  total_spend_low   numeric,
  total_spend_high  numeric,
  spend_currency    text default 'USD',
  
  -- Debug
  meta              jsonb,
  
  created_at        timestamptz default now(),
  
  unique(keyword_id, platform, snapshot_date)
);

create index on keyword_ads_snapshot (keyword_id, snapshot_date desc);
create index on keyword_ads_snapshot (snapshot_date);

-- Current market scores per keyword
create table keyword_market_scores (
  id                          bigserial primary key,
  keyword_id                  bigint not null references keywords(id) on delete cascade,
  
  -- 0-100 scores
  ad_validation_score         numeric(5,2),  -- demand proxy
  creative_intensity_score    numeric(5,2),  -- competition
  funnel_sophistication_score numeric(5,2),  -- market maturity
  spend_velocity_score        numeric(5,2),  -- money velocity
  
  -- Combined market score
  market_opportunity_score    numeric(5,2),
  
  -- Indicators
  has_video_ads               boolean default false,
  has_long_running_ads        boolean default false, -- 90+ days
  advertiser_diversity        text,          -- 'monopoly', 'oligopoly', 'fragmented'
  
  updated_at                  timestamptz default now(),
  
  unique(keyword_id)
);

create index on keyword_market_scores (market_opportunity_score desc);
create index on keyword_market_scores (ad_validation_score desc);
```

### Individual Ads (Optional Detail)

```sql
-- Individual ads for detailed competitive analysis
create table meta_ads (
  id                    bigserial primary key,
  meta_ad_id            text not null unique,
  keyword_id            bigint references keywords(id),
  
  -- Advertiser info
  page_id               text,
  page_name             text,
  
  -- Creative info
  creative_type         text,                -- 'video', 'image', 'carousel'
  ad_snapshot_url       text,
  creative_bodies       jsonb,
  link_titles           jsonb,
  link_captions         jsonb,
  
  -- Delivery info
  delivery_start_time   timestamptz,
  delivery_stop_time    timestamptz,
  is_active             boolean default true,
  days_running          int generated always as (
    extract(day from coalesce(delivery_stop_time, now()) - delivery_start_time)
  ) stored,
  
  -- Performance (ranges)
  impressions_low       bigint,
  impressions_high      bigint,
  spend_low             numeric,
  spend_high            numeric,
  spend_currency        text default 'USD',
  
  -- Targeting
  publisher_platforms   jsonb,               -- ['facebook', 'instagram']
  delivery_regions      jsonb,               -- {US: 50, UK: 30, ...}
  
  -- Landing page
  landing_page_url      text,
  landing_page_domain   text,
  
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index on meta_ads (keyword_id);
create index on meta_ads (page_name);
create index on meta_ads (days_running desc);
create index on meta_ads (is_active) where is_active = true;
```

---

## Combined Scores

### Master Keyword Scores Table

```sql
-- High-level combined scores per keyword (denormalized for fast queries)
create table keyword_scores (
  id                    bigserial primary key,
  keyword_id            bigint not null references keywords(id) on delete cascade,
  
  -- App Store: iOS
  popularity_ios        numeric(5,2),
  difficulty_ios        numeric(5,2),
  trend_ios             numeric(5,2),
  
  -- App Store: Android
  popularity_android    numeric(5,2),
  difficulty_android    numeric(5,2),
  trend_android         numeric(5,2),
  
  -- Social: Global + Per-platform
  social_buzz_global    numeric(5,2),
  social_buzz_tiktok    numeric(5,2),
  social_buzz_instagram numeric(5,2),
  social_buzz_youtube   numeric(5,2),
  social_buzz_reddit    numeric(5,2),
  social_trend_velocity numeric(5,2),
  
  -- Market (Ads)
  ad_validation_score   numeric(5,2),
  market_opportunity    numeric(5,2),
  
  -- Combined Opportunity Score (THE KEY METRIC)
  opportunity_score     numeric(5,2),
  
  -- Classification
  b2b_score             numeric(5,2),
  b2c_score             numeric(5,2),
  
  -- Confidence
  data_freshness_score  numeric(5,2),        -- how recent is our data
  confidence_score      numeric(5,2),        -- how much data we have
  
  updated_at            timestamptz default now(),
  
  unique (keyword_id)
);

create index on keyword_scores (opportunity_score desc);
create index on keyword_scores (popularity_ios desc);
create index on keyword_scores (social_buzz_global desc);
create index on keyword_scores (ad_validation_score desc);
```

---

## Views & Queries

### Keyword Overview View

```sql
-- The "huge overview" view combining everything
create or replace view keyword_overview as
select
  k.id,
  k.keyword,
  k.normalized,
  k.topic_cluster,
  k.keyword_type,
  
  -- App Store scores
  ks.popularity_ios,
  ks.difficulty_ios,
  ks.trend_ios,
  ks.popularity_android,
  ks.difficulty_android,
  ks.trend_android,
  
  -- Social scores
  ks.social_buzz_global,
  ks.social_buzz_tiktok,
  ks.social_buzz_instagram,
  ks.social_buzz_youtube,
  ks.social_buzz_reddit,
  ks.social_trend_velocity,
  
  -- Market scores
  ks.ad_validation_score,
  ks.market_opportunity,
  
  -- Combined
  ks.opportunity_score,
  ks.b2b_score,
  ks.b2c_score,
  ks.confidence_score,
  
  ks.updated_at

from keywords k
left join keyword_scores ks on ks.keyword_id = k.id
where k.is_tracked = true;
```

### Example Queries

```sql
-- Top 50 cross-platform opportunities
select *
from keyword_overview
order by opportunity_score desc nulls last
limit 50;

-- Niche radar: filter by topic + B2C focus
select *
from keyword_overview
where topic_cluster = 'habit'
  and b2c_score > 60
order by opportunity_score desc;

-- High social buzz + low competition
select *
from keyword_overview
where social_buzz_global > 70
  and difficulty_ios < 40
  and difficulty_android < 40
order by opportunity_score desc;

-- Validated demand (ads running) + rising social
select *
from keyword_overview
where ad_validation_score > 50
  and social_trend_velocity > 60
order by opportunity_score desc;

-- Emerging opportunities (low ads, rising social)
select *
from keyword_overview
where ad_validation_score < 30
  and social_buzz_global > 50
  and social_trend_velocity > 70
order by social_trend_velocity desc;
```

---

## Indexes Summary

```sql
-- Performance indexes for common queries
create index idx_keywords_active on keywords (is_tracked) where is_tracked = true;
create index idx_keyword_scores_opp on keyword_scores (opportunity_score desc);
create index idx_keyword_scores_pop_ios on keyword_scores (popularity_ios desc);
create index idx_keyword_scores_buzz on keyword_scores (social_buzz_global desc);
create index idx_store_snapshot_date on keyword_store_snapshot (snapshot_date desc);
create index idx_social_snapshot_date on keyword_social_snapshot (snapshot_date desc);
create index idx_ads_snapshot_date on keyword_ads_snapshot (snapshot_date desc);
```

---

*Database schema for KeywordRadar Market Edition*
*Compatible with PostgreSQL 14+ / Supabase*
*Last updated: January 2026*
