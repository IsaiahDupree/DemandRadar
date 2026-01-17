# RapidAPI Scripts & Services Reference

> Comprehensive reference for all RapidAPI integrations across projects

**Last Updated:** January 2026  
**Total API Subscriptions:** 58

---

## Table of Contents

1. [Scripts Reference](#scripts-reference)
2. [Key Services](#key-services)
3. [Verified Working APIs](#verified-working-apis)
4. [Non-Working APIs](#non-working--blocked-apis)
5. [API Configuration](#api-key-configuration)
6. [Usage Examples](#common-usage-examples)
7. [DemandRadar Integration](#demandradar-integration)

---

## Scripts Reference

### MediaPoster Scripts (`Backend/scripts/`)

| Script | API Host | Purpose |
|--------|----------|---------|
| `backfill_tiktok_metrics.py` | `tiktok-scraper7.p.rapidapi.com` | Fetch TikTok video metrics by ID/URL |
| `backfill_instagram_metrics.py` | `instagram-looter2.p.rapidapi.com` | Fetch Instagram post metrics by shortcode |
| `download_from_manifest.py` | `instagram-looter2.p.rapidapi.com` | Download videos from Safari-collected shortcodes |
| `download_tiktok_video.py` | `tiktok-video-no-watermark2.p.rapidapi.com` | Download TikTok videos without watermark |
| `download_competitor_videos.py` | `instagram-looter2.p.rapidapi.com` | Batch download competitor Instagram videos |
| `discover_rapidapi_endpoints.py` | `instagram-scraper-stable-api.p.rapidapi.com` | Test/discover working API endpoints |
| `check_api_status.py` | Multiple | Health check for all API endpoints |

---

## Key Services

### MediaPoster Services (`Backend/services/`)

| Service | Description |
|---------|-------------|
| `rapidapi_social_fetcher.py` | Unified fetcher for TikTok/Instagram data |
| `rapidapi_scraper.py` | General-purpose RapidAPI scraper |
| `rapidapi_comments_service.py` | Fetch comments from social posts |
| `realtime_metrics.py` | Live metrics fetching |
| `content_download/platform_downloader.py` | Multi-platform video downloads |
| `music/adapters/soundcloud.py` | SoundCloud track data via RapidAPI |
| `tiktok_captcha_solver.py` | TikTok captcha solving service |
| `competitor_audit/collector.py` | Competitor content collection |
| `scrapers/instagram_scraper.py` | Instagram scraping with provider failover |
| `scrapers/tiktok_providers.py` | TikTok API provider management |
| `influencer_analyzer.py` | Analyze influencer accounts |
| `trend_intelligence/ingest_service.py` | Trend data ingestion |

### DemandRadar Services (`gap-radar/src/lib/collectors/`)

| Service | Description |
|---------|-------------|
| `tiktok.ts` | TikTok UGC collection via RapidAPI |
| `instagram.ts` | Instagram hashtag/content search via RapidAPI |
| `ugc.ts` | Unified UGC collector (TikTok + Instagram) |

---

## Verified Working APIs

### TikTok APIs

| API Name | Host | Working Endpoints | Use Case |
|----------|------|-------------------|----------|
| **TikTok Scraper7** | `tiktok-scraper7.p.rapidapi.com` | `/user/info`, `/user/posts`, `/user/followers`, `/user/following`, `/music/info` | User profiles, video lists, follower data |
| **TikTok Video Feature Summary** | `tiktok-video-feature-summary.p.rapidapi.com` | `/user/info`, `/user/posts` | Backup for user data |
| **TikTok No Watermark** | `tiktok-video-no-watermark2.p.rapidapi.com` | `/` (download) | Video downloads |
| **TikTok API23** | `tiktok-api23.p.rapidapi.com` | `/api/search/general`, `/api/challenge/posts` | Search, hashtag content |

### Instagram APIs

| API Name | Host | Working Endpoints | Use Case |
|----------|------|-------------------|----------|
| **Instagram Looter2** | `instagram-looter2.p.rapidapi.com` | `/profile`, `/post`, `/v1/info`, `/v1/posts` | Profile data, post metrics |
| **Instagram Statistics** | `instagram-statistics-api.p.rapidapi.com` | `/community`, `/posts` | Community stats |
| **Instagram Scraper API2** | `instagram-scraper-api2.p.rapidapi.com` | `/v1/hashtag`, `/v1/search` | Hashtag search (DemandRadar) |

### YouTube APIs

| API Name | Host | Working Endpoints | Use Case |
|----------|------|-------------------|----------|
| **YT-API** | `yt-api.p.rapidapi.com` | `/video/info`, `/search`, `/playlist`, `/comments`, `/trending`, `/home` | Video data, search, comments |
| **YouTube MP3** | `youtube-mp36.p.rapidapi.com` | `/dl` | Audio downloads |

### Other Platform APIs

| API Name | Host | Working Endpoints | Use Case |
|----------|------|-------------------|----------|
| **Google Map Places** | `google-map-places.p.rapidapi.com` | `/maps/api/place/textsearch/json` | Location search |
| **Local Business Data** | `local-business-data.p.rapidapi.com` | `/search` | Business lookup |
| **Real-Time Amazon** | `real-time-amazon-data.p.rapidapi.com` | `/search` | Product search |
| **SoundCloud** | Various | Track data, search | Music metadata |

---

## Non-Working / Blocked APIs

| API | Host | Status | Notes |
|-----|------|--------|-------|
| Instagram Scraper API2 | `instagram-scraper-api2.p.rapidapi.com` | ❌ Returns 401 "Blocked User" | Use Looter2 instead |
| Instagram Premium 2023 | `instagram-premium-api-2023.p.rapidapi.com` | ❌ Deprecated | Discontinued |
| Reddit (RapidAPI) | Various | ⚠️ Inconsistent | Use Reddit public JSON API instead |

---

## API Key Configuration

### Environment Setup

**Location:** `.env` or `.env.local`

```env
RAPIDAPI_KEY=a87cab3052mshf494034b3141e1ep1aacb0jsn580589e4be0b
```

### Python Usage

```python
import os
from dotenv import load_dotenv
import requests

load_dotenv()
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")

headers = {
    "X-RapidAPI-Key": RAPIDAPI_KEY,
    "X-RapidAPI-Host": "tiktok-scraper7.p.rapidapi.com"
}
```

### TypeScript/Node.js Usage

```typescript
const rapidApiKey = process.env.RAPIDAPI_KEY;

const headers = {
  'X-RapidAPI-Key': rapidApiKey,
  'X-RapidAPI-Host': 'tiktok-scraper7.p.rapidapi.com',
};

const response = await fetch(url, { headers });
```

---

## Common Usage Examples

### TikTok: Fetch User Videos

```python
# Using tiktok-scraper7
import requests

response = requests.get(
    "https://tiktok-scraper7.p.rapidapi.com/user/posts",
    headers={
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "tiktok-scraper7.p.rapidapi.com"
    },
    params={
        "unique_id": "username",
        "count": 30
    }
)

data = response.json()
videos = data.get("data", {}).get("videos", [])
```

### TikTok: Search Content

```typescript
// Using tiktok-api23 (DemandRadar)
const response = await fetch(
  `https://tiktok-api23.p.rapidapi.com/api/search/general?keyword=${encodeURIComponent(query)}&count=20`,
  {
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'tiktok-api23.p.rapidapi.com',
    },
  }
);

const data = await response.json();
const videos = data.itemList || [];
```

### Instagram: Fetch Post Info

```python
# Using instagram-looter2
response = requests.get(
    "https://instagram-looter2.p.rapidapi.com/post",
    headers={
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "instagram-looter2.p.rapidapi.com"
    },
    params={
        "url": "https://www.instagram.com/reel/ABC123/"
    }
)

post_data = response.json()
```

### Instagram: Hashtag Search

```typescript
// Using instagram-scraper-api2 (DemandRadar)
const response = await fetch(
  `https://instagram-scraper-api2.p.rapidapi.com/v1/hashtag?hashtag=${encodeURIComponent(hashtag)}`,
  {
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com',
    },
  }
);

const data = await response.json();
const posts = data.data?.items || [];
```

### TikTok: Download Video (No Watermark)

```python
# Using tiktok-video-no-watermark2
response = requests.post(
    "https://tiktok-video-no-watermark2.p.rapidapi.com/",
    headers={
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "tiktok-video-no-watermark2.p.rapidapi.com"
    },
    data={
        "url": video_url,
        "hd": "1"
    }
)

download_url = response.json().get("data", {}).get("play")
```

### YouTube: Get Video Info

```python
# Using yt-api
response = requests.get(
    "https://yt-api.p.rapidapi.com/video/info",
    headers={
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "yt-api.p.rapidapi.com"
    },
    params={
        "id": "dQw4w9WgXcQ"
    }
)

video_info = response.json()
```

---

## DemandRadar Integration

### UGC Collection Architecture

```
gap-radar/src/lib/collectors/
├── tiktok.ts      # TikTok Creative Center + RapidAPI fallback
├── instagram.ts   # Instagram Hashtag Search + RapidAPI fallback
└── ugc.ts         # Unified collector combining both platforms
```

### Supported Endpoints

| Platform | RapidAPI Host | Endpoints Used |
|----------|---------------|----------------|
| TikTok | `tiktok-api23.p.rapidapi.com` | `/api/search/general`, `/api/challenge/posts` |
| Instagram | `instagram-scraper-api2.p.rapidapi.com` | `/v1/hashtag`, `/v1/search` |

### Test Endpoint

```bash
# Test UGC collection pipeline
curl -X POST http://localhost:3000/api/test/ugc \
  -H "Content-Type: application/json" \
  -d '{
    "nicheQuery": "fitness app",
    "seedTerms": ["workout", "gym"],
    "generatePlaybook": true
  }'
```

### Mock Data Fallback

Both TikTok and Instagram collectors include mock data generation when:
- `RAPIDAPI_KEY` is not set
- API returns errors or rate limits
- Endpoints are temporarily unavailable

---

## API Subscription Categories

### Social Media (40 APIs)
- **TikTok:** 10 APIs
- **Instagram:** 5 APIs
- **YouTube:** 19 APIs
- **Twitter:** 1 API
- **LinkedIn:** 2 APIs
- **Threads:** 1 API
- **Snapchat:** 1 API
- **Reddit:** 1 API

### Music (4 APIs)
- **SoundCloud:** 4 APIs

### Business (8 APIs)
- **Google Maps:** 5 APIs
- **Amazon:** 2 APIs
- **Etsy:** 1 API

### Other (6 APIs)
- **Email:** 3 APIs
- **Search:** 2 APIs
- **AI:** 2 APIs

---

## Rate Limits & Best Practices

### Rate Limiting

| Tier | Requests/Month | Requests/Second |
|------|----------------|-----------------|
| Basic | 500 | 5 |
| Pro | 10,000 | 10 |
| Ultra | 100,000 | 30 |
| Mega | 1,000,000 | 100 |

### Best Practices

1. **Implement Caching**
   ```typescript
   // Cache responses for 1 hour
   const cacheKey = `tiktok:${query}`;
   const cached = await cache.get(cacheKey);
   if (cached) return JSON.parse(cached);
   ```

2. **Add Retry Logic**
   ```typescript
   async function fetchWithRetry(url, options, retries = 3) {
     for (let i = 0; i < retries; i++) {
       const response = await fetch(url, options);
       if (response.ok) return response;
       await new Promise(r => setTimeout(r, 1000 * (i + 1)));
     }
     throw new Error('Max retries reached');
   }
   ```

3. **Handle Rate Limits**
   ```typescript
   if (response.status === 429) {
     const retryAfter = response.headers.get('Retry-After') || 60;
     await new Promise(r => setTimeout(r, retryAfter * 1000));
     return fetchWithRetry(url, options);
   }
   ```

4. **Use Provider Failover**
   ```typescript
   const providers = ['tiktok-scraper7', 'tiktok-api23'];
   for (const provider of providers) {
     try {
       return await fetchFromProvider(provider, query);
     } catch (e) {
       console.warn(`Provider ${provider} failed, trying next...`);
     }
   }
   ```

---

## Related Documentation

| Document | Location | Description |
|----------|----------|-------------|
| API Registry | `Backend/docs/rapidapi/api_registry.json` | Full API registry (58 subscriptions) |
| Endpoint Registry | `Backend/docs/rapidapi/ENDPOINT_REGISTRY.md` | Detailed endpoint specs |
| Provider Failover | `Backend/docs/rapidapi/PROVIDER_FAILOVER.md` | Failover configuration |
| DemandRadar UGC | `gap-radar/src/lib/collectors/` | UGC collection code |

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check `RAPIDAPI_KEY` is set correctly |
| 403 Forbidden | API may be blocked; try alternative provider |
| 429 Too Many Requests | Implement rate limiting/caching |
| Empty responses | Check endpoint parameters; some require specific formats |
| Timeout errors | Increase timeout; implement retry logic |

### Debug Mode

```typescript
// Enable debug logging
const DEBUG = process.env.DEBUG_RAPIDAPI === 'true';

if (DEBUG) {
  console.log('Request:', { url, headers, params });
  console.log('Response:', response.status, await response.text());
}
```

---

*Document maintained for cross-project RapidAPI reference. Update as new APIs are added or deprecated.*
