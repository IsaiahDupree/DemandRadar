# ASO Keyword Research Methodology

> How App Store Optimization tools determine keyword popularity and difficulty from Apple App Store and Google Play.

---

## Table of Contents

1. [Overview](#overview)
2. [Keyword Popularity (Search Volume)](#keyword-popularity-search-volume)
3. [Keyword Difficulty (Competition)](#keyword-difficulty-competition)
4. [Building Your Own Keyword Tool](#building-your-own-keyword-tool)
5. [Data Pipeline Architecture](#data-pipeline-architecture)
6. [Scoring Formulas](#scoring-formulas)

---

## Overview

ASO (App Store Optimization) keyword tools like AppTweak, AppFollow, Sensor Tower compute two primary metrics:

| Metric | Definition |
|--------|------------|
| **Popularity** | Estimate of how often people search that term in the store (0-100 scale) |
| **Difficulty** | Model of how hard it is to reach the top results for that keyword (0-100 scale) |

**Mental Model:**
- **Popularity** ≈ "How many people search this?"
- **Difficulty** ≈ "How hard will it be to outrank what's already there?"

---

## Keyword Popularity (Search Volume)

### iOS App Store (Apple)

Apple provides an official relative metric in **Apple Ads** called **Search Popularity**:
- Based on App Store searches
- Shown as a relative indicator (1–5 with 5 being most popular)
- Apple also has variants like "search popularity in genre" (1–100) in some contexts

**How ASO tools use this:**
1. Map Apple Ads popularity signal into their own scale (often 0–100)
2. Smooth it over time (to reduce noise)
3. Optionally blend in other signals (trend history, related terms)

**Tools that explicitly use Apple Ads data:**
- Astro: Extracts popularity data directly from Apple Search Ads
- AppFollow: Popularity Score matches Apple Search Ads values exactly

### Google Play

Google does **NOT** provide an Apple-Ads-style "search popularity" number publicly.

**Popularity in Play Store tools is typically modeled/inferred using:**

| Signal | How It's Used |
|--------|---------------|
| **Autocomplete/suggestions** | What Google Play suggests as you type |
| **Rank-tracking outcomes** | How apps move in results over time |
| **App performance proxies** | Installs/reviews/velocity of ranking apps |
| **External proxies** | Google Keyword Planner + adjustments (imperfect) |

---

## Keyword Difficulty (Competition)

Difficulty is **NOT** a number Apple/Google hands out. It's a proprietary score computed by analyzing the apps currently ranking for that keyword.

### Common Computation Pattern

1. Pull the **Top 10 apps** ranking for the keyword
2. Score how "strong" they are (downloads/velocity, authority, etc.)
3. Add extra penalties for "hard mode" situations:
   - Lots of title matches
   - Branded terms
   - High-authority competitors

### AppFollow's Approach

Difficulty score (max 100) uses:
- **Store Performance Index** (strength) of apps in the top 10
- How many apps use the keyword in their **titles** (strong signal)
- Extra penalty if the keyword is **branded/owned** by a specific company

### AppTweak's Approach

Difficulty accounts for:
- Top 10 apps ranking
- Their **App Power/authority**
- Market concentration

---

## Building Your Own Keyword Tool

### Required API Endpoints

| Endpoint | Platform | Purpose |
|----------|----------|---------|
| Search in Apple App Store | iOS | Get SERP for keyword |
| Search in Google Play | Android | Get SERP for keyword |
| Top Free/Paid/Trending/Grossing | Both | Chart presence signals |
| App Details | Both | Ratings, reviews, installs |

### Data You Can Extract for a Keyword `k`

**From Search APIs:**
- List of apps + rank positions for that query

**From App Details (for each app in top N):**
- iOS: rating, rating count, category, ranking info
- Android: installs range (1k+, 10k+, 100k+), rating, rating count

**From Top Charts:**
- How many apps containing `k` appear in charts
- Title/subtitle/short description keyword presence

---

## Data Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     KEYWORD DISCOVERY                            │
│  Extract n-grams from app titles/desc, top charts, autocomplete │
│  + User-submitted keywords                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      STORE CRAWL (Nightly)                       │
│  For each keyword:                                               │
│    → Hit Search in Apple App Store                               │
│    → Hit Search in Google Play                                   │
│    → For each app in SERP: Hit App Details                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      SOCIAL SYNC                                 │
│  For same keyword set:                                           │
│    → Hit TikTok/IG/YT search endpoints                          │
│    → Aggregate 7–30 day metrics                                  │
│    → Store snapshots                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      SCORING JOB                                 │
│  Compute:                                                        │
│    → Popularity 0–100                                            │
│    → Difficulty 0–100                                            │
│    → SocialBuzz 0–100                                            │
│    → TrendVelocity                                               │
│    → Opportunity Score                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      UI / API LAYER                              │
│  Keyword Explorer | App Breakdown | Niche Radar | Overview       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Scoring Formulas

### Popularity Score (per store)

```python
# For each store S and keyword k:
# Take top N apps from Search(S, k)

for app_i in top_apps:
    strength_i = log(installs_i or rating_count_i + 1)

popularity_raw = sum(
    strength_i * position_weight_i
    for i in top_apps
)

# Position weights:
# rank 1-3:   1.0
# rank 4-10:  0.7
# rank 11-30: 0.4
# rank 31-50: 0.2

# Normalize across all keywords
popularity_score = normalize_to_100(popularity_raw)
```

**Boost/Penalty modifiers:**
- **Boost**: keyword appears in many top lists (Top Free/Paid/Trending)
- **Boost**: keyword found in many app titles
- **Penalty**: keyword only appears deep in descriptions

### Difficulty Score (per store)

```python
# For top 10-20 apps returned by search for k:

for app_i in top_10_apps:
    authority_score_i = (
        w1 * log(installs) +
        w2 * log(rating_count) +
        w3 * rating_avg +
        w4 * age_in_years +
        w5 * is_top_chart_flag
    )
    
    targeting_strength_i = (
        1.0 if keyword_in_title else
        0.7 if keyword_in_subtitle else
        0.4 if keyword_in_short_desc else
        0.1  # only in full description
    )

difficulty_raw = average(
    authority_score_i * targeting_strength_i
    for i in top_10_apps
)

difficulty_score = normalize_to_100(difficulty_raw)
```

**Extra Rules:**
- If top results are **branded** (e.g., "tiktok", "paypal"), bump difficulty to high end
- If many apps in top 10 have **keyword in title**, increase difficulty
- If SERP is **fragmented** (mixed small apps, low installs), difficulty drops

### Social Buzz Score (per platform)

```python
# For each platform P (TikTok/IG/YT/X):
# Search by hashtag #k, exact phrase "k", app name variants

buzz_raw = (
    a1 * log(posts_30d + 1) +
    a2 * log(total_views_30d + 1) +
    a3 * engagement_rate +
    a4 * growth_rate_vs_last_30d
)

buzz_score_per_platform = normalize_to_100(buzz_raw)

# Global social buzz = weighted average across platforms
social_buzz_global = weighted_average(buzz_scores, weights=[0.4, 0.3, 0.2, 0.1])
```

### Opportunity Score (the secret sauce)

```python
# Fuse store + social signals:

normalized_pop = popularity / 100
normalized_diff = difficulty / 100
normalized_buzz = social_buzz / 100
normalized_trend = trend_velocity / 100

opportunity = 100 * (
    (0.5 * normalized_pop) *
    (0.5 * normalized_buzz + 0.5 * normalized_trend) *
    (1 - normalized_diff)
)
```

**Interpretation:**
- ✅ High volume in the store
- ✅ High social buzz
- ✅ Difficulty not insane
- → **Big "build or launch" signal**

---

## Important Caveats

1. **Scores are relative, not absolute**
   - "50 popularity" in US ≠ "50 popularity" in another country
   - Tool A's "difficulty 40" ≠ Tool B's "difficulty 40"

2. **Treat them as directional for prioritization**

3. **Always verify by:**
   - Manually searching the keyword in the store
   - Looking at the top results (are they giants? direct competitors?)

4. **Apple's upstream changes affect everyone**
   - If Apple's popularity data shifts/glitches, all tools' numbers swing

---

*Documentation compiled from ASO tool analysis and industry best practices*
*Last updated: January 2026*
