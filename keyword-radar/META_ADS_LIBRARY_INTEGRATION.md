# Meta Ads Library Integration Guide

> How to integrate Facebook/Instagram Ads Library data into your Market Radar system for demand validation and competitive intelligence.

---

## Table of Contents

1. [What Data Is Useful](#what-data-is-useful)
2. [How It Fits the Schema](#how-it-fits-the-schema)
3. [Required Access & Permissions](#required-access--permissions)
4. [API Endpoints & Parameters](#api-endpoints--parameters)
5. [Database Tables](#database-tables)
6. [Pipeline Integration](#pipeline-integration)

---

## What Data Is Useful

For a Market Radar product, these are the **most valuable signals** from Meta Ads Library:

### 1. Existence of Ads in Niche

| Signal | Value |
|--------|-------|
| Is anyone running UGC ads? | Demand validation |
| Are multiple brands running in same niche? | Market maturity |
| How new are these ads? (fresh = demand) | Timing signal |
| How many variations per creative? | Competition intensity |

→ Indicates **commercial viability** or **validated demand**

### 2. Creative Type

Meta Ads Library provides:
- Image
- Video
- Carousel
- Copy text
- CTA types ("Install", "Learn More", "Shop Now")

→ Useful for matching with **UGC trend signals** from TikTok/IG

### 3. Platform Placement

Ads Library returns placements:
- Facebook Feed
- Instagram Feed
- Instagram Stories
- Reels
- Audience Network

→ Helps determine **B2B vs B2C vs DTC** distribution strategies

### 4. Geographic Reach

Ads show delivery regions:
- US only
- Worldwide
- Western EU, etc.

→ Useful for **TAM classification** and localization signals

### 5. Running Status / Freshness

Ads provide:
- Start date
- End date (if inactive)
- Active/Inactive status

**Gold for trend scoring:**
- Running for **120+ days** = likely profitable
- Just launched in past **14 days** = signal of emerging opportunity

### 6. Advertiser Identity

- Business name
- Page name
- Links to landing pages

→ Allows you to:
- Cluster competitors
- Discover similar products
- Reverse-engineer funnels

### 7. Landing Page Link Extraction

For SaaS + mobile apps, LP URLs show:
- Pricing models
- Feature positioning
- ICP targeting

Analyze landing page copy for:
- Value props
- Conversion angles
- Objection handling patterns

---

## How It Fits the Schema

### Three-Layer Architecture

```
App Store Layer  → Popularity & Difficulty
Social Layer     → Buzz & Velocity
Market Layer     → Demand & Spend (Meta Ads Library)
```

### Meta Data → Score Contributions

| Meta Data | Insights | Score Contributions |
|-----------|----------|---------------------|
| Active ads | Validation that people buy | + Opportunity |
| Creative count | Competition intensity | + Difficulty |
| Creative type | ICP / channel mapping | + Vertical alignment |
| Ad longevity | Profitability proxy | + Viability |
| Landing pages | Funnel maturity | + Market sophistication |
| Geo | TAM size & locale | + TAM score |
| CTA | Monetization type | + Business Model Score |

### Updated Opportunity Formula

```python
Opportunity = f(
    App_Store_Popularity,
    App_Store_Difficulty,
    Social_Buzz,
    Ad_Validation,        # NEW: from Meta Ads
    Trend_Velocity,
    Market_Sophistication # NEW: from landing page analysis
)
```

---

## Required Access & Permissions

### Path A: Public Ads Library (No Auth)

**Endpoint:**
```
https://graph.facebook.com/v21.0/ads_archive
```

**Available without auth for:**
- Political issues
- Public interests
- Civic transparency

**NOT available for commercial ads without permissions.**

### Path B: Authenticated with Meta App

**Required Permissions:**
```
✔ ads_management
✔ pages_show_list
✔ read_insights (optional but useful)
```

**For Instagram placements:**
```
✔ instagram_basic
✔ instagram_content_publish (optional)
```

**Additional Requirements:**
- Business Verification
- App Review (for some data)

### Token Types Needed

| Token Type | Use Case |
|------------|----------|
| **User Access Token** | Testing (short-lived) |
| **System User Token** | Production server-to-server ingestion |
| **Long-lived App Token** | Background jobs |
| **Page Access Tokens** | Deeper insights |

---

## API Endpoints & Parameters

### Ads Archive Search

**Endpoint:**
```
GET https://graph.facebook.com/v21.0/ads_archive
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search_terms` | string | Keywords to search |
| `ad_type` | enum | `ALL`, `POLITICAL_AND_ISSUE_ADS` |
| `ad_reached_countries` | array | Country codes (e.g., `["US", "GB"]`) |
| `ad_active_status` | enum | `ACTIVE`, `INACTIVE`, `ALL` |
| `publisher_platforms` | array | `["facebook", "instagram"]` |
| `fields` | string | Comma-separated field list |
| `limit` | int | Results per page |

**Available Fields:**
```
id,
ad_creation_time,
ad_creative_bodies,
ad_creative_link_captions,
ad_creative_link_titles,
ad_delivery_start_time,
ad_delivery_stop_time,
ad_snapshot_url,
bylines,
currency,
delivery_by_region,
estimated_audience_size,
impressions,
languages,
page_id,
page_name,
publisher_platforms,
spend
```

### Example Request

```python
import requests
import os

def search_meta_ads(keyword: str, countries: list = ["US"]):
    url = "https://graph.facebook.com/v21.0/ads_archive"
    
    params = {
        "access_token": os.getenv("META_ACCESS_TOKEN"),
        "search_terms": keyword,
        "ad_type": "ALL",
        "ad_reached_countries": countries,
        "ad_active_status": "ACTIVE",
        "publisher_platforms": ["facebook", "instagram"],
        "fields": ",".join([
            "id",
            "ad_creation_time",
            "ad_delivery_start_time",
            "ad_snapshot_url",
            "page_name",
            "publisher_platforms",
            "impressions",
            "spend"
        ]),
        "limit": 100
    }
    
    response = requests.get(url, params=params)
    return response.json()
```

### Response Example

```json
{
  "data": [
    {
      "id": "123456789",
      "ad_creation_time": "2025-10-15",
      "ad_delivery_start_time": "2025-10-16",
      "page_name": "Example SaaS",
      "publisher_platforms": ["facebook", "instagram"],
      "impressions": {
        "lower_bound": "10000",
        "upper_bound": "50000"
      },
      "spend": {
        "lower_bound": "500",
        "upper_bound": "1000",
        "currency": "USD"
      }
    }
  ],
  "paging": {
    "cursors": {
      "after": "abc123..."
    }
  }
}
```

---

## Database Tables

### Keyword Ads Snapshot

```sql
create table keyword_ads_snapshot (
  id                  serial primary key,
  keyword_id          bigint not null references keywords(id),
  platform            text not null,           -- 'facebook' | 'instagram'
  snapshot_date       date not null,
  
  -- Counts
  ad_count            int,
  advertiser_count    int,
  active_ad_count     int,
  
  -- Creative analysis
  creative_types      jsonb,                   -- ['video','image','carousel']
  cta_types           jsonb,                   -- ['Install','Shop Now','Learn More']
  
  -- Timing signals
  median_ad_age_days  int,                     -- how long running
  newest_ad_age_days  int,
  oldest_ad_age_days  int,
  
  -- Geographic data
  geo                 jsonb,                   -- {US:60%, EU:30%, ...}
  
  -- Spend estimates (if available)
  total_spend_low     numeric,
  total_spend_high    numeric,
  spend_currency      text default 'USD',
  
  updated_at          timestamptz default now(),
  
  unique(keyword_id, platform, snapshot_date)
);

create index on keyword_ads_snapshot (keyword_id, snapshot_date);
```

### Keyword Market Scores

```sql
create table keyword_market_scores (
  id                          serial primary key,
  keyword_id                  bigint not null references keywords(id),
  
  -- Derived scores (0-100)
  ad_validation_score         numeric(5,2),    -- demand proxy
  creative_intensity_score    numeric(5,2),    -- competition
  funnel_sophistication_score numeric(5,2),    -- market maturity
  spend_velocity_score        numeric(5,2),    -- money in market
  
  -- Combined market score
  market_opportunity_score    numeric(5,2),
  
  updated_at                  timestamptz default now(),
  
  unique(keyword_id)
);

create index on keyword_market_scores (market_opportunity_score desc);
```

### Individual Ads (for detailed analysis)

```sql
create table meta_ads (
  id                    serial primary key,
  meta_ad_id            text not null unique,
  keyword_id            bigint references keywords(id),
  
  -- Advertiser info
  page_id               text,
  page_name             text,
  
  -- Creative info
  creative_type         text,                  -- 'video', 'image', 'carousel'
  ad_snapshot_url       text,
  creative_bodies       jsonb,
  link_titles           jsonb,
  link_captions         jsonb,
  
  -- Delivery info
  delivery_start_time   timestamptz,
  delivery_stop_time    timestamptz,
  is_active             boolean default true,
  days_running          int,
  
  -- Performance (ranges)
  impressions_low       bigint,
  impressions_high      bigint,
  spend_low             numeric,
  spend_high            numeric,
  spend_currency        text default 'USD',
  
  -- Targeting
  publisher_platforms   jsonb,                 -- ['facebook', 'instagram']
  delivery_regions      jsonb,                 -- {US: 50, UK: 30, ...}
  
  -- Landing page
  landing_page_url      text,
  
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index on meta_ads (keyword_id);
create index on meta_ads (page_name);
create index on meta_ads (days_running desc);
```

---

## Pipeline Integration

### Combined Pipeline Flow

```
[Keyword]
    │
    ├─→ App Store Search
    │       → Popularity + Difficulty
    │
    ├─→ Social Search
    │       → Buzz + Trend
    │
    ├─→ Meta Ads Library Search ← NEW
    │       → Validation + Market + Creative + Spend
    │
    └─→ Scoring Engine
            → Opportunity Score
            → UI Layer / Reports
```

### Scoring Integration

```python
def compute_ad_validation_score(ads_snapshot: dict) -> float:
    """
    Compute demand validation score from Meta Ads data.
    
    Signals:
    - More active ads = higher validation
    - Longer running ads = proven demand
    - Multiple advertisers = market exists
    - Video creatives = serious investment
    """
    
    ad_count = ads_snapshot.get("ad_count", 0)
    advertiser_count = ads_snapshot.get("advertiser_count", 0)
    median_age = ads_snapshot.get("median_ad_age_days", 0)
    creative_types = ads_snapshot.get("creative_types", [])
    
    # Base score from ad count (log scale)
    count_score = min(30, log(ad_count + 1) * 10)
    
    # Advertiser diversity bonus
    diversity_score = min(25, advertiser_count * 5)
    
    # Longevity signal (ads running 60+ days = validated)
    longevity_score = min(25, (median_age / 60) * 25)
    
    # Creative investment (video = serious)
    creative_score = 20 if "video" in creative_types else 10
    
    return min(100, count_score + diversity_score + longevity_score + creative_score)
```

### What This Enables

With **App Store + Social + Ads + Trends** you can answer:

> "Should I build this app/product, and how should I position it?"

**Example Scenarios:**

| Signals | Interpretation |
|---------|----------------|
| ✅ High app store search<br>✅ High TikTok buzz<br>✅ Ads running 120+ days<br>✅ Low difficulty | **Insane green light** |
| ✅ High buzz<br>✅ High ads spend<br>❌ No app yet | **Mobile-first opportunity** |
| ✅ Heavy ads<br>❌ No buzz<br>❌ Saturated SERP | **Paid arbitrage requires differentiation** |
| ✅ Rising social buzz<br>❌ No ads yet<br>✅ Low competition | **First-mover advantage** |

---

*Documentation for Meta Ads Library integration*
*Last updated: January 2026*
