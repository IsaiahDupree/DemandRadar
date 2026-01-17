# Reddit Niche Research Tool - Developer Documentation

> Complete implementation guide for the Reddit RapidAPI integration and research tools.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Directory Structure](#directory-structure)
3. [Environment Setup](#environment-setup)
4. [RapidAPI Integration](#rapidapi-integration)
5. [Core Modules](#core-modules)
6. [CLI Commands](#cli-commands)
7. [Research Scripts](#research-scripts)
8. [API Reference](#api-reference)
9. [Output & Reports](#output--reports)
10. [Extending the Tool](#extending-the-tool)

---

## Project Overview

This tool systematically analyzes Reddit communities to discover SaaS opportunities by extracting pain points, questions, feature requests, and market signals from user discussions.

**Key Capabilities:**
- Search and discover relevant subreddits for any niche
- Fetch and analyze top posts from communities
- Extract pain points, questions, and feature requests using pattern matching
- Generate SaaS opportunity insights
- Support for custom research scripts targeting specific niches

---

## Directory Structure

```
reddit-niche-search/
├── main.py                      # CLI entry point - primary user interface
├── requirements.txt             # Python dependencies
├── .env                         # API credentials (create from .env.example)
├── .env.example                 # Template for environment variables
├── ENDPOINTS.md                 # API endpoint documentation
├── README.md                    # Project overview
├── DEVELOPER_DOCS.md            # This file
│
├── src/                         # Core library modules
│   ├── __init__.py              # Package initialization
│   ├── api_client.py            # Reddit RapidAPI client wrapper
│   ├── niche_analyzer.py        # Content analysis & pattern matching
│   └── researcher.py            # Research workflow orchestration
│
├── test_api.py                  # API endpoint verification tests
├── research_crm_network.py      # CRM/Networking niche research script
├── research_watermark.py        # Watermark remover niche research
├── run_watermark_research.py    # Alternative watermark research approach
│
└── reports/                     # Generated research reports (JSON/MD)
    ├── api_test_results.json    # API test output
    └── *.json                   # Niche research reports
```

---

## Environment Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

**Required packages:**
| Package | Version | Purpose |
|---------|---------|---------|
| `requests` | >=2.31.0 | HTTP client for API calls |
| `python-dotenv` | >=1.0.0 | Environment variable management |
| `rich` | >=13.7.0 | Terminal formatting and tables |
| `openai` | >=1.12.0 | Optional AI-powered analysis |
| `pandas` | >=2.1.0 | Data manipulation |

### 2. Configure API Key

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your RapidAPI key
```

**`.env` file format:**
```env
RAPIDAPI_KEY=your_rapidapi_key_here
RAPIDAPI_HOST=reddit13.p.rapidapi.com
```

### 3. Get Your API Key

1. Go to [RapidAPI](https://rapidapi.com/)
2. Search for "Reddit" or navigate to: `reddit13.p.rapidapi.com`
3. Subscribe to a plan (free tier available)
4. Copy your `X-RapidAPI-Key` from the dashboard

---

## RapidAPI Integration

### API Configuration

| Setting | Value |
|---------|-------|
| **Host** | `reddit13.p.rapidapi.com` |
| **Base URL** | `https://reddit13.p.rapidapi.com` |
| **Required Headers** | `X-RapidAPI-Key`, `X-RapidAPI-Host` |

### Working Endpoints

All endpoints are implemented in `src/api_client.py`:

#### 1. Search (`GET /v1/reddit/search`)

Search Reddit for posts, subreddits, or users.

```python
from src.api_client import RedditAPIClient

client = RedditAPIClient()

# Search for posts
result = client.search(
    query="email marketing",
    search_type="posts",      # 'posts', 'subreddits', 'users'
    sort="relevance",         # 'relevance', 'hot', 'top', 'new', 'comments'
    time_filter="all",        # 'hour', 'day', 'week', 'month', 'year', 'all'
    limit=25
)

# Search for subreddits specifically
subreddits = client.search_subreddits("project management", limit=20)
```

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Search term |
| `search_type` | string | No | `posts`, `subreddits`, `users` |
| `subreddit` | string | No | Filter within specific subreddit |
| `sort` | string | No | Sort order |
| `time_filter` | string | No | Time range |
| `limit` | int | No | Max results |

---

#### 2. Subreddit Posts (`GET /v1/reddit/posts`)

Fetch posts from a specific subreddit.

```python
# Get hot posts from a subreddit
result = client.get_posts(
    subreddit="entrepreneur",
    sort="top",               # 'hot', 'new', 'top', 'rising'
    time_filter="year",       # For 'top': 'hour', 'day', 'week', 'month', 'year', 'all'
    limit=100
)

# Convenience method for top posts from past year
top_posts = client.get_top_posts_year("saas", limit=50)
```

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `subreddit` | string | Yes | Subreddit name (without r/) |
| `sort` | string | No | Sort method |
| `time_filter` | string | No | Time range for 'top' sort |
| `limit` | int | No | Max posts |

---

#### 3. Post Details with Comments (`GET /v1/reddit/post-details`)

Get full post content including all comments.

```python
result = client.get_post_details(
    post_id="abc123",
    subreddit="entrepreneur",
    sort="best",              # 'best', 'top', 'new', 'controversial'
    comment_limit=100
)
```

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `post_id` | string | Yes | Reddit post ID |
| `subreddit` | string | Yes | Subreddit name |
| `sort` | string | No | Comment sort order |
| `comment_limit` | int | No | Max comments to fetch |

---

#### 4. Popular Subreddits (`GET /v1/reddit/subreddit/popular`)

Get list of trending/popular subreddits.

```python
result = client.get_popular_subreddits(limit=25)

# With pagination
result = client.get_popular_subreddits(limit=25, after="cursor_token")
```

---

#### 5. New Subreddits (`GET /v1/reddit/subreddit/new`)

Get newly created subreddits.

```python
result = client.get_new_subreddits(limit=25)
```

---

#### 6. Subreddit Comments (`GET /v1/reddit/subreddit/comments`)

Get recent comments from a subreddit (useful for real-time sentiment).

```python
result = client.get_subreddit_comments(
    subreddit="startups",
    limit=100
)
```

---

#### 7. User Data (`GET /v1/reddit/user-data`)

Get user profile and activity.

```python
# Get user profile
result = client.get_user_data(
    username="spez",
    filter_type="posts",      # 'posts', 'comments', 'submitted', 'gilded'
    sort="new"                # 'new', 'hot', 'top', 'controversial'
)

# Convenience methods
comments = client.get_user_comments("username", sort="top")
posts = client.get_user_posts("username", sort="new")
```

---

## Core Modules

### `src/api_client.py` - RedditAPIClient

The main API wrapper class handling all HTTP requests to RapidAPI.

```python
from src.api_client import RedditAPIClient

# Initialize with .env credentials
client = RedditAPIClient()

# Or pass API key directly
client = RedditAPIClient(api_key="your_key_here")
```

**Key Methods:**
| Method | Description |
|--------|-------------|
| `search()` | General Reddit search |
| `search_subreddits()` | Search for subreddits |
| `get_posts()` | Get posts from subreddit |
| `get_top_posts_year()` | Get top posts (yearly) |
| `get_post_details()` | Get post with comments |
| `get_popular_subreddits()` | Get trending subreddits |
| `get_new_subreddits()` | Get new subreddits |
| `get_subreddit_comments()` | Get recent comments |
| `get_user_data()` | Get user profile/activity |
| `get_user_comments()` | Get user's comments |
| `get_user_posts()` | Get user's posts |

**Error Handling:**
```python
result = client.search("query")
if 'error' in result:
    print(f"API Error: {result['error']}")
else:
    # Process successful result
    posts = result.get('data', {}).get('children', [])
```

---

### `src/niche_analyzer.py` - NicheAnalyzer

Pattern-based content analysis for extracting insights.

```python
from src.niche_analyzer import NicheAnalyzer, InsightCategory

analyzer = NicheAnalyzer()

# Analyze a single post
post = {'title': 'How do I...', 'selftext': 'I am struggling with...'}
insights = analyzer.analyze_post(post)
# Returns: {'pain_points': [...], 'questions': [...], 'requests': [...], ...}

# Analyze comments
comments = [{'body': '...'}, {'body': '...'}]
comment_insights = analyzer.analyze_comments(comments)

# Extract common themes from post titles
themes = analyzer.extract_common_themes(posts, top_n=20)

# Categorize post intent
category = analyzer.categorize_post_by_intent(post)
# Returns: 'question', 'complaint', 'request', 'showcase', or 'discussion'

# Generate SaaS opportunity ideas
opportunities = analyzer.generate_saas_opportunities(insight_category)
```

**Pattern Categories:**

| Category | Detects |
|----------|---------|
| `pain` | Struggles, frustrations, problems, complaints |
| `question` | Help-seeking, recommendations, alternatives |
| `request` | Feature requests, wishes, needs |
| `solution` | Tool mentions, recommendations, what people use |
| `belief` | Opinions, perspectives, viewpoints |

**Data Classes:**
```python
@dataclass
class InsightCategory:
    pain_points: List[str]
    questions: List[str]
    frustrations: List[str]
    requests: List[str]
    solutions_mentioned: List[str]
    beliefs: List[str]
    perspectives: List[str]

@dataclass
class SubredditInsight:
    name: str
    subscribers: int
    description: str
    top_posts: List[Dict]
    insights: InsightCategory
    common_themes: List[str]
```

---

### `src/researcher.py` - NicheResearcher

High-level research workflow orchestration.

```python
from src.researcher import NicheResearcher, ResearchReport

researcher = NicheResearcher()

# Full niche research workflow
report = researcher.research_niche(
    niche="email marketing",
    max_subreddits=5,
    posts_per_subreddit=50
)

# Save report to JSON
report.to_json("reports/my_research.json")

# Individual operations
subreddits = researcher.discover_subreddits("freelancing", max_subreddits=20)
posts = researcher.get_top_posts("entrepreneur", time_filter="year", limit=100)
analysis = researcher.analyze_subreddit("saas", post_limit=50)
```

**ResearchReport Structure:**
```python
@dataclass
class ResearchReport:
    niche: str
    timestamp: str
    subreddits_found: List[Dict]
    total_posts_analyzed: int
    top_posts: List[Dict]
    pain_points: List[str]
    questions: List[str]
    frustrations: List[str]
    requests: List[str]
    solutions_mentioned: List[str]
    beliefs: List[str]
    common_themes: List[str]
    saas_opportunities: List[Dict]
```

---

## CLI Commands

### Main Entry Point: `main.py`

```bash
python main.py <command> [options]
```

### `research` - Full Niche Research

```bash
python main.py research "email marketing" --max-subs 5 --posts 50
```

| Option | Default | Description |
|--------|---------|-------------|
| `--max-subs` | 5 | Max subreddits to analyze |
| `--posts` | 50 | Posts per subreddit |

**Output:**
- Discovered subreddits table
- Pain points panel
- Questions panel
- Feature requests panel
- Existing solutions mentioned
- Common themes
- SaaS opportunities table
- JSON report saved to `reports/`

---

### `discover` - Find Subreddits

```bash
python main.py discover "project management" --limit 20
```

| Option | Default | Description |
|--------|---------|-------------|
| `--limit` | 20 | Max subreddits to return |

---

### `analyze` - Analyze Single Subreddit

```bash
python main.py analyze entrepreneur --posts 100
```

| Option | Default | Description |
|--------|---------|-------------|
| `--posts` | 50 | Number of posts to analyze |

---

## Research Scripts

### `test_api.py` - API Endpoint Verification

Tests all API endpoints to verify connectivity and responses.

```bash
python test_api.py
```

**Tests performed:**
1. Search endpoint
2. Posts endpoint
3. Popular subreddits
4. New subreddits
5. Subreddit comments
6. User data

**Output:** Results saved to `reports/api_test_results.json`

---

### `research_crm_network.py` - CRM/Networking Niche

Targeted research for relationship management tools (e.g., EverReach).

```bash
python research_crm_network.py
```

**Target Subreddits:**
- r/sales, r/Entrepreneur, r/smallbusiness, r/startups
- r/networking, r/careerguidance, r/freelance
- r/consulting, r/realestate, r/recruiting
- r/productivity, r/socialskills, r/introverts

**Relevant Keywords Tracked:**
- follow up, keep in touch, reach out, networking
- crm, contacts, relationships, cold outreach
- linkedin, connections, reconnect

**Output:** Comprehensive report with ad targeting insights, audience segments, and messaging angles.

---

### `research_watermark.py` & `run_watermark_research.py` - Watermark Remover Niche

Research scripts for watermark removal SaaS opportunities.

```bash
python research_watermark.py
# or
python run_watermark_research.py
```

**Target Subreddits:**
- r/PhotoshopRequest, r/graphic_design, r/VideoEditing
- r/photoshop, r/AfterEffects, r/Filmmakers
- r/ContentCreators, r/NewTubers, r/freelance

**Keywords Tracked:**
- watermark, remove, stock, shutterstock, getty
- adobe stock, logo, overlay, copyright, istock

---

## API Reference

### Response Handling

The RapidAPI responses vary in structure. Handle both formats:

```python
result = client.get_posts("subreddit")

# Format 1: Standard Reddit structure
posts = result.get('data', {}).get('children', [])

# Format 2: Simplified structure
posts = result.get('posts', [])

# Format 3: Body wrapper
posts = result.get('body', [])

# Universal approach used in scripts:
posts = []
if isinstance(result, dict):
    posts = result.get('body', result.get('data', result.get('posts', [])))
    if isinstance(posts, dict):
        posts = posts.get('children', [])
```

### Rate Limiting

Implement delays between API calls to avoid rate limits:

```python
import time

for subreddit in subreddits:
    result = client.get_posts(subreddit)
    # Process result...
    time.sleep(2)  # 2 second delay between calls
```

### Post Data Structure

```python
post_data = {
    'id': 'abc123',
    'title': 'Post title',
    'selftext': 'Post body text',
    'score': 150,
    'num_comments': 42,
    'url': 'https://reddit.com/...',
    'permalink': '/r/subreddit/comments/...',
    'created_utc': 1704067200,
    'subreddit': 'entrepreneur'
}
```

---

## Output & Reports

### Report Directory: `reports/`

All generated reports are saved to the `reports/` directory.

**File Naming Convention:**
```
reports/{research_type}_{niche}_{YYYYMMDD_HHMMSS}.json
```

**Examples:**
- `reports/email_marketing_20260115_143022.json`
- `reports/crm_network_research_20260103_162756.json`
- `reports/watermark_research_20260103_145720.json`
- `reports/api_test_results.json`

### JSON Report Structure

```json
{
  "niche": "email marketing",
  "timestamp": "2026-01-15T14:30:22.123456",
  "subreddits_found": [
    {
      "name": "emailmarketing",
      "subscribers": 45000,
      "description": "...",
      "url": "https://reddit.com/r/emailmarketing"
    }
  ],
  "total_posts_analyzed": 250,
  "top_posts": [...],
  "pain_points": ["I struggle with...", "..."],
  "questions": ["How do I...", "..."],
  "requests": ["I wish there was...", "..."],
  "solutions_mentioned": ["I use Mailchimp...", "..."],
  "common_themes": ["automation", "deliverability", "..."],
  "saas_opportunities": [
    {
      "type": "pain_point",
      "signal": "...",
      "opportunity": "Tool to address: ..."
    }
  ]
}
```

### Existing Strategy Reports

| File | Description |
|------|-------------|
| `EVERREACH_CRM_STRATEGY.md` | CRM/networking tool strategy |
| `WATERMARK_REMOVER_STRATEGY.md` | Watermark SaaS strategy |

---

## Extending the Tool

### Creating a Custom Research Script

```python
#!/usr/bin/env python3
"""
Custom Niche Research Script
"""

import os
import json
import time
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

from src.api_client import RedditAPIClient
from src.niche_analyzer import NicheAnalyzer

# Define target subreddits for your niche
TARGET_SUBREDDITS = [
    "your_niche_sub1",
    "your_niche_sub2",
    # ...
]

# Define relevant keywords to filter posts
RELEVANT_KEYWORDS = [
    "keyword1", "keyword2", "keyword3"
]

def run_research():
    api = RedditAPIClient()
    analyzer = NicheAnalyzer()
    
    all_posts = []
    all_insights = {
        'pain_points': [],
        'questions': [],
        'requests': [],
        'solutions': [],
        'beliefs': [],
    }
    
    for sub in TARGET_SUBREDDITS:
        print(f"Analyzing r/{sub}...")
        
        result = api.get_posts(sub, sort="hot")
        
        if 'error' in result:
            print(f"Error: {result['error']}")
            time.sleep(2)
            continue
        
        # Handle response structure
        posts = result.get('body', result.get('data', result.get('posts', [])))
        if isinstance(posts, dict):
            posts = posts.get('children', [])
        
        for post in posts:
            post_data = post.get('data', post)
            title = post_data.get('title', '').lower()
            body = post_data.get('selftext', '').lower()
            
            # Filter for relevance
            is_relevant = any(kw in title or kw in body for kw in RELEVANT_KEYWORDS)
            
            if is_relevant:
                insights = analyzer.analyze_post(post_data)
                for key in all_insights:
                    if key in insights:
                        all_insights[key].extend(insights[key])
        
        time.sleep(2)  # Rate limiting
    
    # Save report
    os.makedirs('reports', exist_ok=True)
    filename = f"reports/custom_research_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, 'w') as f:
        json.dump({
            'insights': all_insights,
            'timestamp': datetime.now().isoformat()
        }, f, indent=2)
    
    print(f"Report saved: {filename}")

if __name__ == "__main__":
    run_research()
```

### Adding New Analysis Patterns

Edit `src/niche_analyzer.py` to add custom patterns:

```python
class NicheAnalyzer:
    # Add new pattern category
    CUSTOM_PATTERNS = [
        r'\b(your|custom|patterns)\b',
        r'\b(more|patterns|here)\b',
    ]
    
    def __init__(self):
        self.compiled_patterns = {
            # ... existing patterns ...
            'custom': [re.compile(p, re.IGNORECASE) for p in self.CUSTOM_PATTERNS],
        }
```

### Adding New API Methods

Extend `src/api_client.py`:

```python
class RedditAPIClient:
    # Add new method
    def custom_endpoint(self, param1: str, param2: int = 10) -> Dict[str, Any]:
        """
        Custom API endpoint wrapper.
        """
        params = {
            "param1": param1,
            "param2": param2
        }
        return self._request("/v1/reddit/custom-endpoint", params)
```

---

## Quick Reference

### Common Workflows

```bash
# 1. Verify API is working
python test_api.py

# 2. Research a new niche
python main.py research "your niche" --max-subs 10 --posts 100

# 3. Find relevant subreddits
python main.py discover "your keywords" --limit 30

# 4. Deep-dive a specific subreddit
python main.py analyze subredditname --posts 200

# 5. Run specialized research
python research_crm_network.py
python research_watermark.py
```

### File Access Quick Reference

| What You Need | Where To Find It |
|---------------|------------------|
| API Client | `src/api_client.py` |
| Content Analyzer | `src/niche_analyzer.py` |
| Research Workflow | `src/researcher.py` |
| CLI Interface | `main.py` |
| API Tests | `test_api.py` |
| CRM Research | `research_crm_network.py` |
| Watermark Research | `research_watermark.py`, `run_watermark_research.py` |
| Generated Reports | `reports/*.json` |
| Strategy Docs | `reports/*.md` |
| API Docs | `ENDPOINTS.md` |

---

## Troubleshooting

### Common Issues

**1. "RAPIDAPI_KEY not found"**
```bash
# Ensure .env file exists with your key
cp .env.example .env
# Edit .env and add: RAPIDAPI_KEY=your_key_here
```

**2. Empty API responses**
- Check rate limits on your RapidAPI plan
- Add delays between requests: `time.sleep(2)`
- Verify subreddit name is correct (no r/ prefix)

**3. "Connection error" or timeouts**
- Check internet connection
- Verify API host is correct: `reddit13.p.rapidapi.com`
- Increase timeout in `api_client.py` (default: 30s)

**4. No relevant posts found**
- Broaden keyword list
- Try different subreddits
- Adjust time filters (year → all)

---

*Documentation generated for the Reddit Niche Research Tool*
*Last updated: January 2026*
