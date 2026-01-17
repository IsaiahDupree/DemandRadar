# Meta Ads Library - Implementation Guide (Public CSV Export)

> Complete technical guide for integrating Facebook/Instagram Ads Library data into KeywordRadar using **public CSV exports** (no API approval required).

---

## Table of Contents

1. [Overview: Why CSV Exports](#overview-why-csv-exports)
2. [Accessing the Ad Library](#accessing-the-ad-library)
3. [CSV Export Process](#csv-export-process)
4. [Data Fields Available](#data-fields-available)
5. [Database Schema for Ads Data](#database-schema-for-ads-data)
6. [Automated Ingestion Pipeline](#automated-ingestion-pipeline)

---

## 1. Overview: Why CSV Exports

### API vs CSV Export Comparison

| Approach | Pros | Cons |
|----------|------|------|
| **API (`/ads_archive`)** | Real-time, programmable | Requires App Review, `ads_read` permission, identity verification |
| **CSV Export (Public)** | No approval needed, immediate access | Manual download, batch processing |

**Our Approach:** Use the **public Ad Library website** to export CSV files. This provides:
- ✅ No API permissions required
- ✅ Same data as API (ad text, page info, dates, platforms)
- ✅ Can search by keyword or advertiser
- ✅ Available for all countries

---

## 2. Accessing the Ad Library

### Step 1: Go to Ad Library

**URL:** [https://www.facebook.com/ads/library](https://www.facebook.com/ads/library)

### Step 2: Search for Keywords or Advertisers

1. Select **Country** (e.g., United States)
2. Select **Ad category**: "All ads"
3. Enter **search term** (keyword or advertiser name)
4. Apply filters:
   - **Platform**: Facebook, Instagram, Messenger, Audience Network
   - **Media type**: Images, Videos, Memes, etc.
   - **Active status**: Active, Inactive, or All
   - **Date range**: Last 7 days, 30 days, 90 days, or custom

### Step 3: Export Results

1. After searching, click **"Download"** button (top right)
2. Select date range for export
3. Download the CSV file

---

## 3. CSV Export Process

### Manual Export Workflow

```
1. Search Ad Library for keyword (e.g., "habit tracker")
2. Apply filters (country, platform, date range)
3. Click Download → Select CSV
4. Save file: meta_ads_{keyword}_{date}.csv
5. Upload to ingestion pipeline
```

### Recommended Search Strategy

For each tracked keyword:

| Search Type | Purpose |
|-------------|---------|
| **Keyword search** | Find all ads mentioning the keyword |
| **Competitor search** | Track specific advertiser pages |
| **Category search** | Browse by ad category |

### File Naming Convention

```
meta_ads_{keyword}_{country}_{YYYYMMDD}.csv

Examples:
- meta_ads_habit-tracker_US_20260114.csv
- meta_ads_fitness-app_US_20260114.csv
```

---

## 4. Data Fields Available

### CSV Export Columns

| Column | Description | Example |
|--------|-------------|---------|
| `ad_id` | Unique ad identifier | `123456789` |
| `page_id` | Advertiser's Facebook Page ID | `987654321` |
| `page_name` | Advertiser name | `FitLife App` |
| `ad_creation_time` | When ad was created | `2026-01-10T14:30:00` |
| `ad_delivery_start_time` | When ad started running | `2026-01-10T15:00:00` |
| `ad_delivery_stop_time` | When ad stopped (if inactive) | `2026-01-12T08:00:00` |
| `ad_creative_bodies` | Ad copy text | `Track your habits...` |
| `ad_creative_link_captions` | Link preview text | `Download Now` |
| `ad_creative_link_titles` | Ad headline | `Build Better Habits` |
| `ad_creative_link_descriptions` | Link description | `The #1 habit tracking app` |
| `ad_snapshot_url` | Link to view ad creative | `https://fb.com/ads/...` |
| `publisher_platforms` | Where ad runs | `facebook,instagram` |
| `languages` | Ad language | `en` |
| `target_locations` | Geographic targeting | `United States` |
| `estimated_audience_size` | Reach estimate (EU only) | `1M-5M` |
| `impressions` | Impression range (EU/political) | `10K-50K` |
| `spend` | Spend range (EU/political) | `$100-$500` |

### Data Limitations

| What's Available | What's NOT Available |
|------------------|---------------------|
| Ad creative text | Click-through rate |
| Advertiser info | Conversion data |
| Delivery dates | Exact spend (US non-political) |
| Platforms | Audience demographics |
| Ad snapshot URL | Performance metrics |

**For KeywordRadar:** We extract:
- **Ad count** per keyword → market validation signal
- **Advertiser count** → competition level
- **Ad longevity** → indicates profitability
- **Creative patterns** → funnel sophistication

---

## 5. Database Schema for Ads Data

### Raw Ingest Table

```sql
-- One row per ad from CSV import
create table meta_ads_raw (
  id                      bigserial primary key,
  ad_id                   text not null,              -- from CSV
  page_id                 text,
  page_name               text,
  publisher_platforms     text[],                     -- parsed from CSV
  ad_creation_time        timestamptz,
  ad_delivery_start_time  timestamptz,
  ad_delivery_stop_time   timestamptz,
  ad_creative_body        text,
  ad_creative_link_title  text,
  ad_creative_link_caption text,
  ad_snapshot_url         text,
  languages               text[],
  target_locations        text[],
  source_file             text,                       -- CSV filename for tracking
  source_keyword          text,                       -- search term used
  ingested_at             timestamptz default now()
);

create index on meta_ads_raw (page_id);
create index on meta_ads_raw (source_keyword);
create unique index on meta_ads_raw (ad_id);
```

### Keyword-Ad Association Table

```sql
-- Link keywords to discovered ads
create table keyword_ads_map (
  id                bigserial primary key,
  keyword_id        bigint not null references keywords(id) on delete cascade,
  ad_id             text not null,
  matched_by        text not null,      -- 'csv_search' | 'text_match' | 'nlp'
  relevance_score   numeric(5,2),       -- 0–1 match confidence
  created_at        timestamptz default now()
);

create index on keyword_ads_map (keyword_id);
create index on keyword_ads_map (ad_id);
```

### Daily Aggregate Snapshot

```sql
-- Aggregated stats per keyword per day
create table keyword_ads_snapshot (
  id                bigserial primary key,
  keyword_id        bigint not null references keywords(id),
  snapshot_date     date not null,
  
  -- Counts
  ad_count          int,
  advertiser_count  int,
  
  -- Timing
  median_ad_age_days int,
  active_share      numeric(5,2),       -- % active vs inactive
  
  -- Creative analysis
  creative_types    jsonb,              -- {video: 40, image: 60}
  placement_mix     jsonb,              -- {FACEBOOK: 50, INSTAGRAM: 40}
  
  updated_at        timestamptz default now(),
  
  unique (keyword_id, snapshot_date)
);

create index on keyword_ads_snapshot (keyword_id, snapshot_date desc);
```

---

## 6. Automated Ingestion Pipeline

### CSV Processing Script (Python)

```python
import pandas as pd
from datetime import datetime
from pathlib import Path
import os

def parse_meta_ads_csv(filepath: str) -> list[dict]:
    """Parse Meta Ads Library CSV export into normalized records."""
    
    df = pd.read_csv(filepath)
    
    # Extract metadata from filename
    filename = Path(filepath).stem
    parts = filename.split('_')
    source_keyword = parts[2] if len(parts) > 2 else 'unknown'
    
    records = []
    for _, row in df.iterrows():
        record = {
            'ad_id': str(row.get('ad_id', '')),
            'page_id': str(row.get('page_id', '')),
            'page_name': row.get('page_name', ''),
            'ad_creation_time': parse_datetime(row.get('ad_creation_time')),
            'ad_delivery_start_time': parse_datetime(row.get('ad_delivery_start_time')),
            'ad_delivery_stop_time': parse_datetime(row.get('ad_delivery_stop_time')),
            'ad_creative_body': row.get('ad_creative_bodies', ''),
            'ad_creative_link_title': row.get('ad_creative_link_titles', ''),
            'ad_creative_link_caption': row.get('ad_creative_link_captions', ''),
            'ad_snapshot_url': row.get('ad_snapshot_url', ''),
            'publisher_platforms': parse_platforms(row.get('publisher_platforms', '')),
            'languages': parse_list(row.get('languages', '')),
            'target_locations': parse_list(row.get('target_locations', '')),
            'source_file': filename,
            'source_keyword': source_keyword
        }
        records.append(record)
    
    return records


def parse_datetime(value) -> datetime | None:
    """Parse datetime from CSV."""
    if pd.isna(value) or not value:
        return None
    try:
        return pd.to_datetime(value)
    except:
        return None


def parse_platforms(value: str) -> list[str]:
    """Parse comma-separated platforms."""
    if pd.isna(value) or not value:
        return []
    return [p.strip().upper() for p in str(value).split(',')]


def parse_list(value: str) -> list[str]:
    """Parse comma-separated list."""
    if pd.isna(value) or not value:
        return []
    return [item.strip() for item in str(value).split(',')]


def compute_ad_metrics(records: list[dict]) -> dict:
    """Compute aggregate metrics from ad records."""
    
    if not records:
        return {
            'ad_count': 0,
            'advertiser_count': 0,
            'median_ad_age_days': 0,
            'active_share': 0
        }
    
    # Unique advertisers
    page_ids = set(r['page_id'] for r in records if r['page_id'])
    
    # Calculate ad ages and active status
    now = datetime.now()
    ages = []
    active_count = 0
    
    for record in records:
        start = record['ad_delivery_start_time']
        stop = record['ad_delivery_stop_time']
        
        if start:
            age = (now - start.replace(tzinfo=None)).days
            ages.append(age)
        
        if not stop:  # Still active
            active_count += 1
    
    return {
        'ad_count': len(records),
        'advertiser_count': len(page_ids),
        'median_ad_age_days': sorted(ages)[len(ages)//2] if ages else 0,
        'active_share': round(active_count / len(records), 2) if records else 0
    }


def ingest_csv_to_supabase(filepath: str, supabase_client):
    """Ingest CSV file into Supabase database."""
    
    records = parse_meta_ads_csv(filepath)
    
    # Upsert ads (avoid duplicates)
    for record in records:
        supabase_client.table('meta_ads_raw').upsert(
            record,
            on_conflict='ad_id'
        ).execute()
    
    # Compute and return metrics
    metrics = compute_ad_metrics(records)
    print(f"Ingested {metrics['ad_count']} ads from {metrics['advertiser_count']} advertisers")
    
    return metrics
```

### Batch Processing Workflow

```python
def process_all_csv_files(directory: str):
    """Process all CSV files in a directory."""
    
    csv_files = Path(directory).glob('meta_ads_*.csv')
    
    all_metrics = []
    for csv_file in csv_files:
        print(f"Processing: {csv_file.name}")
        metrics = ingest_csv_to_supabase(str(csv_file), supabase)
        metrics['file'] = csv_file.name
        all_metrics.append(metrics)
    
    return all_metrics


# Usage
if __name__ == '__main__':
    from supabase import create_client
    
    supabase = create_client(
        os.getenv('SUPABASE_URL'),
        os.getenv('SUPABASE_SERVICE_KEY')
    )
    
    # Process all CSV exports
    results = process_all_csv_files('./data/meta_ads_exports/')
    
    for r in results:
        print(f"{r['file']}: {r['ad_count']} ads, {r['advertiser_count']} advertisers")
```

---

## 7. Semi-Automated Export (Future Enhancement)

For higher volume, consider browser automation:

```python
# Playwright example for automated export (requires manual CAPTCHA)
from playwright.sync_api import sync_playwright

def export_ads_for_keyword(keyword: str, country: str = 'US'):
    """Semi-automated Ad Library export using Playwright."""
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Show browser for CAPTCHAs
        page = browser.new_page()
        
        # Navigate to Ad Library
        page.goto('https://www.facebook.com/ads/library')
        
        # Select country
        page.click('[aria-label="Country"]')
        page.fill('[aria-label="Search countries"]', country)
        page.click(f'text="{country}"')
        
        # Select "All ads"
        page.click('text="All ads"')
        
        # Enter search term
        page.fill('[placeholder="Search by keyword or advertiser"]', keyword)
        page.press('[placeholder="Search by keyword or advertiser"]', 'Enter')
        
        # Wait for results
        page.wait_for_selector('[data-testid="ad_card"]', timeout=10000)
        
        # Click download (user completes CAPTCHA if needed)
        page.click('text="Download"')
        
        # Wait for download
        input("Press Enter after download completes...")
        
        browser.close()
```

---

## References

- [Meta Ad Library](https://www.facebook.com/ads/library) - Public search interface
- [Ad Library Report](https://www.facebook.com/ads/library/report/) - Aggregate reports by country
- [Ad Library API Docs](https://www.facebook.com/ads/library/api/) - For future API access

---

*Meta Ads Library Implementation Guide (CSV Export Method)*  
*Last updated: January 2026*
