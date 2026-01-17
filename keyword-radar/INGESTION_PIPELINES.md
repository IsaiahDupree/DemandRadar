# KeywordRadar - Ingestion & Scoring Pipelines

> Operational architecture for data collection, processing, and scoring.

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Scheduler Design](#2-scheduler-design)
3. [Worker Specifications](#3-worker-specifications)
4. [API Design](#4-api-design)
5. [Implementation Examples](#5-implementation-examples)

---

## 1. High-Level Architecture

### Data Flow Diagram

```
                    SCHEDULER (cron / queue)
                            │
            ┌───────────────┼────────────────┐
            │               │                │
            ▼               ▼                ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │  App Store    │ │    Social     │ │  Meta Ads     │
    │ Ingest Worker │ │ Ingest Worker │ │ Ingest Worker │
    └───────┬───────┘ └───────┬───────┘ └───────┬───────┘
            │               │                │
            ▼               ▼                ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │keyword_store_ │ │keyword_social_│ │ meta_ads_raw  │
    │  snapshot     │ │   snapshot    │ │keyword_ads_map│
    │    apps       │ │               │ │               │
    └───────┬───────┘ └───────┬───────┘ └───────┬───────┘
            │               │                │
            └───────────────┼────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Scoring Worker│
                    └───────┬───────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │   keyword_store_scores        │
            │   keyword_social_scores       │
            │   keyword_market_scores       │
            │   keyword_scores (final)      │
            └───────────────┬───────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ REST/GraphQL  │
                    │     API       │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  Frontend UI  │
                    └───────────────┘
```

### Data Sources

| Category | Sources |
|----------|---------|
| **App Stores** | Apple App Store, Google Play, Chrome Web Store |
| **Social** | TikTok, Instagram, YouTube (via RapidAPI) |
| **Ads** | Meta Ads Library (`/ads_archive`) |

### Core Storage

| Table | Purpose |
|-------|---------|
| `keywords` | Canonical keyword list |
| `keyword_aliases` | Plurals, misspellings, synonyms |
| `platforms` | iOS, Android, Chrome |
| `apps` | App metadata |
| `app_metrics_snapshot` | Daily app metrics |
| `keyword_store_snapshot` | Daily store metrics per keyword |
| `app_keyword_rankings` | SERP positions |
| `keyword_store_scores` | Normalized store scores |
| `social_platforms` | TikTok, IG, YT |
| `keyword_social_snapshot` | Daily social metrics |
| `keyword_social_scores` | Normalized social scores |
| `meta_ads_raw` | Raw ad data |
| `keyword_ads_snapshot` | Daily ad aggregates |
| `keyword_market_scores` | Normalized market scores |
| `keyword_scores` | Final combined scores |

---

## 2. Scheduler Design

Use a single "master" cron (or n8n/Make workflow) that enqueues jobs into **BullMQ / Redis**.

### Nightly Jobs (UTC off-peak, e.g., 3-6 AM)

| Job | Priority | Description |
|-----|----------|-------------|
| `seed_keywords_from_stores` | 1 | Scrape top charts & new apps → add/update keywords |
| `crawl_keyword_store_serps` | 2 | For each active keyword & platform, pull SERPs & details |
| `crawl_keyword_social_stats` | 3 | Hit social APIs for each keyword |
| `crawl_meta_ads_for_keywords` | 4 | Run Ads Library queries for each keyword |

### Daily/Hourly Jobs

| Job | Frequency | Description |
|-----|-----------|-------------|
| `compute_scores` | Daily | Recompute normalized & opportunity scores |
| `generate_niche_reports` | Daily | Refresh caches for top topics |
| `check_alerts` | Hourly | Check watchlists for threshold triggers |

### Cron Schedule Example

```bash
# /etc/cron.d/keywordradar

# Seed keywords from top charts (weekly)
0 3 * * 0 /app/workers/seed_keywords.sh

# Crawl store SERPs (nightly)
0 4 * * * /app/workers/crawl_stores.sh

# Crawl social stats (nightly)
0 5 * * * /app/workers/crawl_social.sh

# Crawl Meta Ads (nightly)
0 6 * * * /app/workers/crawl_ads.sh

# Compute scores (after all crawls complete)
0 7 * * * /app/workers/compute_scores.sh

# Check alerts (hourly)
0 * * * * /app/workers/check_alerts.sh
```

---

## 3. Worker Specifications

### 3.1 App Store Ingest Worker

**For each keyword `k` and platform `p`:**

```
1. Call Search API (Apple/Play/Chrome)
   └─ GET search results for keyword

2. For top N apps (e.g., 50):
   ├─ Upsert into `apps` table
   └─ Fetch app details (installs, rating, etc.)
       └─ Insert into `app_metrics_snapshot`

3. Compute raw scores:
   ├─ popularity_raw = weighted sum of authority by rank
   └─ difficulty_raw = avg authority of top 10 * targeting strength

4. Insert row into `keyword_store_snapshot`
```

**Popularity Formula:**

```python
popularity_raw = sum(
    log(installs[i] + 1) * position_weight[i]
    for i in top_apps
)

# Position weights:
# rank 1-3:   1.0
# rank 4-10:  0.7
# rank 11-30: 0.4
# rank 31-50: 0.2
```

**Difficulty Formula:**

```python
for app in top_10_apps:
    authority = (
        w1 * log(installs) +
        w2 * log(rating_count) +
        w3 * rating_avg +
        w4 * age_in_years
    )
    
    targeting_strength = (
        1.0 if keyword_in_title else
        0.7 if keyword_in_subtitle else
        0.4 if keyword_in_short_desc else
        0.1
    )

difficulty_raw = avg(authority * targeting_strength for top_10)
```

### 3.2 Social Ingest Worker

**For each keyword `k` and social platform `p`:**

```
1. Call search endpoint (hashtag/keyword)
   ├─ TikTok: search by hashtag
   ├─ Instagram: search by hashtag/keyword
   └─ YouTube: search by keyword

2. Aggregate metrics:
   ├─ posts_30d
   ├─ views_30d
   ├─ engagement_rate = engagement / views
   └─ growth_rate = (views_30d - views_prev_30d) / views_prev_30d

3. Insert into `keyword_social_snapshot`
```

**Buzz Formula:**

```python
buzz_raw = (
    0.5 * log(views_30d + 1) +
    0.3 * engagement_rate +
    0.2 * growth_rate
)
```

### 3.3 Meta Ads Library Ingest Worker

**For each keyword (EU/UK or political ads):**

```
1. Build query:
   {
     ad_reached_countries: ['GB', 'DE', ...],
     search_terms: k,
     ad_active_status: 'ALL'
   }

2. Page through results (limit 100-500 per page)
   └─ Handle pagination bugs by adjusting limit

3. Insert raw ads into `meta_ads_raw`
   └─ Dedupe on ad_library_id

4. Insert keyword association into `keyword_ads_map`

5. Aggregate for `keyword_ads_snapshot`:
   ├─ ad_count
   ├─ advertiser_count
   ├─ median_ad_age_days
   ├─ active_share
   ├─ creative_types histogram
   ├─ placement_mix
   └─ url_domains from landing URLs
```

### 3.4 Scoring Worker

**Step 1: Store Scores**

```python
for (keyword_id, platform_id) in keyword_store_snapshot:
    popularity_score = normalize(popularity_raw)
    difficulty_score = normalize(difficulty_raw)
    trend_velocity = compute_trend(keyword_id, platform_id)
    
    upsert keyword_store_scores
```

**Step 2: Social Scores**

```python
for (keyword_id, social_platform_id) in keyword_social_snapshot:
    buzz_score = normalize(buzz_raw)
    
    upsert keyword_social_scores
```

**Step 3: Market (Ads) Scores**

```python
for keyword_id in keyword_ads_snapshot:
    ad_validation_score = compute_ad_validation(keyword_id)
    creative_intensity_score = compute_creative_intensity(keyword_id)
    funnel_sophistication_score = compute_funnel_sophistication(keyword_id)
    
    upsert keyword_market_scores
```

**Step 4: Final keyword_scores**

```python
for keyword_id in keywords:
    # Join all score sources
    store = get_store_scores(keyword_id)  # ios + android
    social = get_social_scores(keyword_id)  # aggregated
    market = get_market_scores(keyword_id)
    
    # Compute opportunity
    opportunity_score = compute_opportunity(store, social, market)
    
    upsert keyword_scores
```

---

## 4. API Design

### Endpoints (v1)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/keywords/search` | Search keywords by text |
| GET | `/keywords/:id` | Get full keyword details |
| GET | `/niches/:topic` | Get keywords in a topic cluster |
| GET | `/reports/:keywordId` | Generate PDF report |
| POST | `/watchlist` | Add keyword to watchlist |
| GET | `/alerts` | Get triggered alerts |

### `GET /keywords/search`

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search text (matches keyword/aliases) |
| `min_opportunity` | number | Filter by min score |
| `topic_cluster` | string | Filter by topic |
| `platform` | string | Filter by platform emphasis |
| `sort` | string | `opportunity`, `popularity`, `difficulty` |
| `limit` | number | Max results (default 50) |

**Response:**

```json
[
  {
    "keyword": "habit tracker",
    "id": 123,
    "opportunity_score": 87.2,
    "popularity": { "ios": 0.78, "android": 0.81 },
    "difficulty": { "ios": 0.45, "android": 0.52 },
    "social_buzz": { "global": 0.74 },
    "ad_validation_score": 0.69
  }
]
```

### `GET /keywords/:id`

**Response:**

```json
{
  "keyword": "habit tracker",
  "id": 123,
  "scores": {
    "opportunity": 87.2,
    "popularity": { "ios": 0.78, "android": 0.81 },
    "difficulty": { "ios": 0.45, "android": 0.52 },
    "social_buzz": {
      "global": 0.74,
      "tiktok": 0.88,
      "instagram": 0.70,
      "youtube": 0.55
    },
    "ad_validation": 0.69,
    "creative_intensity": 0.58,
    "funnel_sophistication": 0.43
  },
  "app_store": {
    "ios_top_apps": [
      {
        "name": "Habitify",
        "bundle_id": "co.habitify.ios",
        "rank": 1,
        "installs": "1M+",
        "rating": 4.8
      }
    ],
    "android_top_apps": [...]
  },
  "social_examples": {
    "tiktok": [
      {
        "video_id": "123",
        "views": 1500000,
        "thumbnail": "https://..."
      }
    ],
    "instagram": [...]
  },
  "ads_examples": [
    {
      "ad_library_id": "456",
      "page_name": "Habitica",
      "creative_body": "Track your habits...",
      "days_running": 120
    }
  ],
  "recommendations": {
    "product_ideas": [
      "iOS habit tracker for couples",
      "B2B Chrome extension for HR teams"
    ],
    "creative_angles": [
      "before/after transformation",
      "screen recordings + voiceover"
    ],
    "platform_fit": {
      "mobile": true,
      "web": true,
      "chrome_extension": false
    }
  }
}
```

---

## 5. Implementation Examples

### Node.js Worker with BullMQ

```typescript
// workers/store-crawler.ts
import { Worker, Queue } from 'bullmq';
import { createClient } from '@supabase/supabase-js';

const connection = { host: 'localhost', port: 6379 };
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

// Queue for store crawl jobs
const storeQueue = new Queue('store-crawl', { connection });

// Worker to process jobs
const worker = new Worker('store-crawl', async (job) => {
  const { keywordId, platformId } = job.data;
  
  // 1. Fetch keyword
  const { data: keyword } = await supabase
    .from('keywords')
    .select('keyword')
    .eq('id', keywordId)
    .single();
  
  // 2. Search app store
  const searchResults = await searchAppStore(keyword.keyword, platformId);
  
  // 3. Fetch app details & compute scores
  const { popularityRaw, difficultyRaw, topApps } = await processResults(searchResults);
  
  // 4. Insert snapshot
  await supabase.from('keyword_store_snapshot').insert({
    keyword_id: keywordId,
    platform_id: platformId,
    snapshot_date: new Date().toISOString().split('T')[0],
    popularity_raw: popularityRaw,
    difficulty_raw: difficultyRaw,
    top_apps_json: topApps
  });
  
  return { success: true };
}, { connection });

// Scheduler to enqueue jobs
async function scheduleStoreCrawl() {
  const { data: keywords } = await supabase
    .from('keywords')
    .select('id')
    .eq('is_tracked', true);
  
  const platforms = [1, 2]; // iOS, Android
  
  for (const keyword of keywords!) {
    for (const platformId of platforms) {
      await storeQueue.add('crawl', {
        keywordId: keyword.id,
        platformId
      });
    }
  }
}
```

### Python Worker with Celery

```python
# workers/tasks.py
from celery import Celery
from supabase import create_client
import os

app = Celery('keywordradar', broker='redis://localhost:6379/0')
supabase = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_KEY'])

@app.task
def crawl_store_serp(keyword_id: int, platform_id: int):
    """Crawl app store SERP for a keyword."""
    
    # 1. Get keyword
    keyword = supabase.table('keywords').select('keyword').eq('id', keyword_id).single().execute()
    
    # 2. Search store (via RapidAPI)
    results = search_app_store(keyword.data['keyword'], platform_id)
    
    # 3. Process results
    popularity_raw, difficulty_raw, top_apps = process_serp(results)
    
    # 4. Insert snapshot
    supabase.table('keyword_store_snapshot').insert({
        'keyword_id': keyword_id,
        'platform_id': platform_id,
        'snapshot_date': datetime.now().date().isoformat(),
        'popularity_raw': popularity_raw,
        'difficulty_raw': difficulty_raw,
        'top_apps_json': top_apps
    }).execute()


@app.task
def crawl_social_stats(keyword_id: int, social_platform_id: int):
    """Crawl social platform stats for a keyword."""
    
    keyword = supabase.table('keywords').select('keyword').eq('id', keyword_id).single().execute()
    
    # Search social platform
    if social_platform_id == 1:  # TikTok
        stats = search_tiktok(keyword.data['keyword'])
    elif social_platform_id == 2:  # Instagram
        stats = search_instagram(keyword.data['keyword'])
    elif social_platform_id == 3:  # YouTube
        stats = search_youtube(keyword.data['keyword'])
    
    # Insert snapshot
    supabase.table('keyword_social_snapshot').insert({
        'keyword_id': keyword_id,
        'social_platform_id': social_platform_id,
        'snapshot_date': datetime.now().date().isoformat(),
        **stats
    }).execute()


@app.task
def crawl_meta_ads(keyword_id: int):
    """Crawl Meta Ads Library for a keyword."""
    
    keyword = supabase.table('keywords').select('keyword').eq('id', keyword_id).single().execute()
    
    # Search ads library
    ads = search_meta_ads(keyword.data['keyword'])
    
    # Insert raw ads
    for ad in ads:
        supabase.table('meta_ads_raw').upsert({
            'ad_library_id': ad['id'],
            **ad
        }, on_conflict='ad_library_id').execute()
        
        # Link to keyword
        supabase.table('keyword_ads_map').insert({
            'keyword_id': keyword_id,
            'ad_library_id': ad['id'],
            'matched_by': 'search_terms'
        }).execute()
    
    # Aggregate snapshot
    snapshot = aggregate_ads_snapshot(keyword_id, ads)
    supabase.table('keyword_ads_snapshot').insert(snapshot).execute()


@app.task
def compute_all_scores():
    """Recompute all normalized and opportunity scores."""
    
    # Get all tracked keywords
    keywords = supabase.table('keywords').select('id').eq('is_tracked', True).execute()
    
    for kw in keywords.data:
        compute_keyword_scores.delay(kw['id'])


@app.task
def compute_keyword_scores(keyword_id: int):
    """Compute scores for a single keyword."""
    
    # Get latest snapshots
    store_data = get_latest_store_snapshot(keyword_id)
    social_data = get_latest_social_snapshot(keyword_id)
    ads_data = get_latest_ads_snapshot(keyword_id)
    
    # Compute normalized scores
    store_scores = normalize_store_scores(store_data)
    social_scores = normalize_social_scores(social_data)
    market_scores = compute_market_scores(ads_data)
    
    # Compute opportunity
    opportunity = compute_opportunity_score(store_scores, social_scores, market_scores)
    
    # Upsert final scores
    supabase.table('keyword_scores').upsert({
        'keyword_id': keyword_id,
        **store_scores,
        **social_scores,
        **market_scores,
        'opportunity_score': opportunity
    }, on_conflict='keyword_id').execute()
```

### Celery Beat Schedule

```python
# celery_config.py
from celery.schedules import crontab

beat_schedule = {
    'seed-keywords-weekly': {
        'task': 'workers.tasks.seed_keywords_from_stores',
        'schedule': crontab(hour=3, minute=0, day_of_week=0),
    },
    'crawl-stores-nightly': {
        'task': 'workers.tasks.crawl_all_store_serps',
        'schedule': crontab(hour=4, minute=0),
    },
    'crawl-social-nightly': {
        'task': 'workers.tasks.crawl_all_social_stats',
        'schedule': crontab(hour=5, minute=0),
    },
    'crawl-ads-nightly': {
        'task': 'workers.tasks.crawl_all_meta_ads',
        'schedule': crontab(hour=6, minute=0),
    },
    'compute-scores-daily': {
        'task': 'workers.tasks.compute_all_scores',
        'schedule': crontab(hour=7, minute=0),
    },
    'check-alerts-hourly': {
        'task': 'workers.tasks.check_alerts',
        'schedule': crontab(minute=0),
    },
}
```

---

## Pipeline Monitoring

### Health Checks

```sql
-- Check last successful crawl per source
select 
  'store' as source,
  max(snapshot_date) as last_crawl,
  count(*) as records_today
from keyword_store_snapshot
where snapshot_date = current_date

union all

select 
  'social' as source,
  max(snapshot_date) as last_crawl,
  count(*) as records_today
from keyword_social_snapshot
where snapshot_date = current_date

union all

select 
  'ads' as source,
  max(snapshot_date) as last_crawl,
  count(*) as records_today
from keyword_ads_snapshot
where snapshot_date = current_date;
```

### Alert on Stale Data

```python
@app.task
def check_data_freshness():
    """Alert if any pipeline hasn't run in 24h."""
    
    result = supabase.rpc('check_pipeline_health').execute()
    
    for row in result.data:
        if row['last_crawl'] < datetime.now().date() - timedelta(days=1):
            send_alert(f"Pipeline {row['source']} is stale!")
```

---

*Ingestion & Scoring Pipelines Documentation*
*Last updated: January 2026*
