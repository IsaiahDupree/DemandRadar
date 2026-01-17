# KeywordRadar - Scoring Formulas

> Complete mathematical specification for computing Opportunity Score from raw signals.

---

## Table of Contents

1. [Normalization](#1-normalization)
2. [App Store Scores](#2-app-store-scores)
3. [Social Buzz & Velocity](#3-social-buzz--velocity)
4. [Ads Library / Market Scores](#4-ads-library--market-scores)
5. [Final Opportunity Score](#5-final-opportunity-score)
6. [Implementation Examples](#6-implementation-examples)

---

## 1. Normalization

All raw metrics are normalized to 0–1 scale using min-max normalization with rolling percentiles.

### Formula

```
norm(x) = (x - min_x) / (max_x - min_x + ε)
clipped to [0, 1]
```

Where:
- `min_x`, `max_x` = rolling min/max values (or percentile ranks)
- `ε` = small constant to avoid division by zero (e.g., 0.001)

### Apply to:
- `popularity_raw` → `popularity_norm`
- `difficulty_raw` → `difficulty_norm`
- `social_buzz_raw` → `social_norm`
- `ad_count`, `advertiser_count`, etc.

---

## 2. App Store Scores

### 2.1 Popularity (per platform)

From `keyword_store_snapshot`:

```python
popularity_norm_ios = norm(popularity_raw WHERE platform = 'ios')
popularity_norm_android = norm(popularity_raw WHERE platform = 'android')
```

### 2.2 Difficulty (per platform)

```python
difficulty_norm_ios = norm(difficulty_raw WHERE platform = 'ios')
difficulty_norm_android = norm(difficulty_raw WHERE platform = 'android')
```

### 2.3 Combined Store Scores

```python
# Combined difficulty (equal weight iOS/Android)
difficulty_store_norm = 0.5 * difficulty_norm_ios + 0.5 * difficulty_norm_android

# Combined popularity
popularity_store_norm = 0.5 * popularity_norm_ios + 0.5 * popularity_norm_android
```

---

## 3. Social Buzz & Velocity

### 3.1 Raw Metrics (from `keyword_social_snapshot`)

| Metric | Definition |
|--------|------------|
| `views_30d` | Sum of views across TikTok/IG/YT (last 30 days) |
| `engagement_rate` | engagement / views |
| `growth_rate` | (views_30d - views_prev_30d) / max(views_prev_30d, 1) |

### 3.2 Per-Platform Raw Buzz

```python
buzz_raw_platform = (
    a1 * log(views_30d + 1) +
    a2 * engagement_rate +
    a3 * growth_rate
)

# Suggested weights:
# a1 = 0.5 (volume)
# a2 = 0.3 (engagement quality)
# a3 = 0.2 (trend direction)
```

### 3.3 Normalized Per-Platform

```python
social_norm_tiktok = norm(buzz_raw_tiktok)
social_norm_instagram = norm(buzz_raw_instagram)
social_norm_youtube = norm(buzz_raw_youtube)
```

### 3.4 Global Social Buzz (weighted)

```python
social_norm_global = (
    0.50 * social_norm_tiktok +
    0.30 * social_norm_instagram +
    0.20 * social_norm_youtube
)
```

**Rationale:** TikTok weighted highest because it's the leading indicator for consumer trends.

---

## 4. Ads Library / Market Scores

From `keyword_ads_snapshot`:

| Metric | Description |
|--------|-------------|
| `ad_count` | Total ads found (last 30 days) |
| `advertiser_count` | Unique advertisers |
| `median_ad_age_days` | How long ads have been running |
| `active_share` | % of ads still active (ACTIVE / ALL) |
| `creative_types` | Distribution: video vs image vs carousel |
| `url_domains` | Landing page diversity |

### 4.1 Ad Validation Score

**Purpose:** "Is real money being spent here?"

**Heuristics:**
- More advertisers & ads = more validation
- Old ads still active = profitable
- 0 advertisers but high social buzz = early/unproven

```python
ad_count_norm = norm(ad_count)
advertiser_count_norm = norm(advertiser_count)

# Age factor: ≥90 days running = max score
age_factor = clamp(median_ad_age_days / 90, 0, 1)

# Active factor: already 0–1
active_factor = active_share

# Final formula
ad_validation_score = (
    0.40 * advertiser_count_norm +
    0.30 * ad_count_norm +
    0.20 * age_factor +
    0.10 * active_factor
)
```

**Range:** 0–1

### 4.2 Creative Intensity Score

**Purpose:** "How crowded is the creative battlefield?"

High ad_count + high advertiser_count + many variations = more competition.

```python
creative_intensity_score = (
    0.50 * ad_count_norm +
    0.50 * advertiser_count_norm
)
```

**Range:** 0–1

### 4.3 Funnel Sophistication Score

**Purpose:** "Are competitors' funnels mature?"

```python
# Landing page diversity
domain_count = count_distinct_domains(keyword)
domain_count_norm = norm(domain_count)

# Offer signal (from NLP analysis of ad copy)
# Initially set to 0.5 for all, refine later with ML
offer_signal_norm = norm(offer_signal_raw)  # or default 0.5

# Final formula
funnel_sophistication_score = (
    0.60 * domain_count_norm +
    0.40 * offer_signal_norm
)
```

**Range:** 0–1

---

## 5. Final Opportunity Score

### 5.1 Input Variables

```python
pop  = popularity_store_norm      # 0–1
soc  = social_norm_global         # 0–1
diff = difficulty_store_norm      # 0–1
adv  = ad_validation_score        # 0–1
ci   = creative_intensity_score   # 0–1
fs   = funnel_sophistication_score # 0–1
```

### 5.2 Competition Penalty

```python
competition_penalty = 0.60 * ci + 0.40 * fs
```

### 5.3 Base Opportunity Score

**Goal:** High when:
- ✅ Store popularity is high
- ✅ Social buzz is high/rising
- ✅ Store difficulty is NOT too high
- ✅ Ad validation is present (money being spent)

```python
opportunity_norm = (
    0.40 * pop +      # demand from stores
    0.25 * soc +      # cultural/social demand
    0.20 * adv +      # validated ad spend
    0.15 * (1 - diff) # easier SERP is better
)
```

### 5.4 Adjusted Opportunity (with competition penalty)

```python
opportunity_adjusted = opportunity_norm * (0.70 + 0.30 * (1 - competition_penalty))
```

**Interpretation:**
- If competition_penalty = 0 → multiplier = 1.0 (no penalty)
- If competition_penalty = 1 → multiplier = 0.7 (30% penalty)

### 5.5 Final Score (0–100)

```python
opportunity_score = round(100 * opportunity_adjusted, 2)
```

---

## 6. Implementation Examples

### SQL View for Scoring

```sql
-- Compute opportunity score for all keywords
create or replace view keyword_opportunity_calc as
with 
  store_scores as (
    select 
      keyword_id,
      avg(case when platform_id = 1 then popularity_score end) as pop_ios,
      avg(case when platform_id = 2 then popularity_score end) as pop_android,
      avg(case when platform_id = 1 then difficulty_score end) as diff_ios,
      avg(case when platform_id = 2 then difficulty_score end) as diff_android
    from keyword_store_scores
    group by keyword_id
  ),
  social_scores as (
    select
      keyword_id,
      avg(case when social_platform_id = 1 then buzz_score end) as buzz_tiktok,
      avg(case when social_platform_id = 2 then buzz_score end) as buzz_instagram,
      avg(case when social_platform_id = 3 then buzz_score end) as buzz_youtube
    from keyword_social_scores
    group by keyword_id
  ),
  market_scores as (
    select
      keyword_id,
      ad_validation_score,
      creative_intensity_score,
      funnel_sophistication_score
    from keyword_market_scores
  )
select
  k.id as keyword_id,
  k.keyword,
  
  -- Store scores
  coalesce(ss.pop_ios, 0) / 100.0 as pop_ios_norm,
  coalesce(ss.pop_android, 0) / 100.0 as pop_android_norm,
  coalesce(ss.diff_ios, 0) / 100.0 as diff_ios_norm,
  coalesce(ss.diff_android, 0) / 100.0 as diff_android_norm,
  
  -- Combined store scores
  (coalesce(ss.pop_ios, 0) + coalesce(ss.pop_android, 0)) / 200.0 as pop_store_norm,
  (coalesce(ss.diff_ios, 0) + coalesce(ss.diff_android, 0)) / 200.0 as diff_store_norm,
  
  -- Social scores
  coalesce(soc.buzz_tiktok, 0) / 100.0 as buzz_tiktok_norm,
  coalesce(soc.buzz_instagram, 0) / 100.0 as buzz_instagram_norm,
  coalesce(soc.buzz_youtube, 0) / 100.0 as buzz_youtube_norm,
  (
    0.50 * coalesce(soc.buzz_tiktok, 0) +
    0.30 * coalesce(soc.buzz_instagram, 0) +
    0.20 * coalesce(soc.buzz_youtube, 0)
  ) / 100.0 as social_global_norm,
  
  -- Market scores
  coalesce(ms.ad_validation_score, 0) as adv,
  coalesce(ms.creative_intensity_score, 0) as ci,
  coalesce(ms.funnel_sophistication_score, 0) as fs,
  
  -- Competition penalty
  (0.60 * coalesce(ms.creative_intensity_score, 0) + 
   0.40 * coalesce(ms.funnel_sophistication_score, 0)) as competition_penalty,
  
  -- Opportunity calculation
  (
    0.40 * (coalesce(ss.pop_ios, 0) + coalesce(ss.pop_android, 0)) / 200.0 +
    0.25 * (0.50 * coalesce(soc.buzz_tiktok, 0) + 0.30 * coalesce(soc.buzz_instagram, 0) + 0.20 * coalesce(soc.buzz_youtube, 0)) / 100.0 +
    0.20 * coalesce(ms.ad_validation_score, 0) +
    0.15 * (1 - (coalesce(ss.diff_ios, 0) + coalesce(ss.diff_android, 0)) / 200.0)
  ) * (0.70 + 0.30 * (1 - (0.60 * coalesce(ms.creative_intensity_score, 0) + 0.40 * coalesce(ms.funnel_sophistication_score, 0)))) * 100
  as opportunity_score

from keywords k
left join store_scores ss on ss.keyword_id = k.id
left join social_scores soc on soc.keyword_id = k.id
left join market_scores ms on ms.keyword_id = k.id
where k.is_tracked = true;
```

### Python Implementation

```python
from dataclasses import dataclass
from typing import Optional
import math

@dataclass
class KeywordScores:
    # Store scores (0-100)
    popularity_ios: float = 0
    popularity_android: float = 0
    difficulty_ios: float = 0
    difficulty_android: float = 0
    
    # Social scores (0-100)
    buzz_tiktok: float = 0
    buzz_instagram: float = 0
    buzz_youtube: float = 0
    
    # Market scores (0-1)
    ad_validation_score: float = 0
    creative_intensity_score: float = 0
    funnel_sophistication_score: float = 0


def compute_opportunity_score(scores: KeywordScores) -> float:
    """
    Compute the final Opportunity Score (0-100).
    """
    # Normalize store scores to 0-1
    pop_ios = scores.popularity_ios / 100.0
    pop_android = scores.popularity_android / 100.0
    diff_ios = scores.difficulty_ios / 100.0
    diff_android = scores.difficulty_android / 100.0
    
    # Combined store scores
    pop_store = 0.5 * pop_ios + 0.5 * pop_android
    diff_store = 0.5 * diff_ios + 0.5 * diff_android
    
    # Normalize social scores to 0-1
    buzz_tiktok = scores.buzz_tiktok / 100.0
    buzz_instagram = scores.buzz_instagram / 100.0
    buzz_youtube = scores.buzz_youtube / 100.0
    
    # Global social (weighted)
    social_global = (
        0.50 * buzz_tiktok +
        0.30 * buzz_instagram +
        0.20 * buzz_youtube
    )
    
    # Market scores already 0-1
    adv = scores.ad_validation_score
    ci = scores.creative_intensity_score
    fs = scores.funnel_sophistication_score
    
    # Competition penalty
    competition_penalty = 0.60 * ci + 0.40 * fs
    
    # Base opportunity
    opportunity_norm = (
        0.40 * pop_store +
        0.25 * social_global +
        0.20 * adv +
        0.15 * (1 - diff_store)
    )
    
    # Adjusted with competition penalty
    opportunity_adjusted = opportunity_norm * (0.70 + 0.30 * (1 - competition_penalty))
    
    # Scale to 0-100
    return round(100 * opportunity_adjusted, 2)


# Example usage
scores = KeywordScores(
    popularity_ios=78,
    popularity_android=81,
    difficulty_ios=45,
    difficulty_android=52,
    buzz_tiktok=88,
    buzz_instagram=70,
    buzz_youtube=55,
    ad_validation_score=0.69,
    creative_intensity_score=0.58,
    funnel_sophistication_score=0.43
)

opportunity = compute_opportunity_score(scores)
print(f"Opportunity Score: {opportunity}")  # ~72.5
```

### TypeScript Implementation

```typescript
interface KeywordScores {
  // Store scores (0-100)
  popularityIos: number;
  popularityAndroid: number;
  difficultyIos: number;
  difficultyAndroid: number;
  
  // Social scores (0-100)
  buzzTiktok: number;
  buzzInstagram: number;
  buzzYoutube: number;
  
  // Market scores (0-1)
  adValidationScore: number;
  creativeIntensityScore: number;
  funnelSophisticationScore: number;
}

function computeOpportunityScore(scores: KeywordScores): number {
  // Normalize store scores to 0-1
  const popIos = scores.popularityIos / 100;
  const popAndroid = scores.popularityAndroid / 100;
  const diffIos = scores.difficultyIos / 100;
  const diffAndroid = scores.difficultyAndroid / 100;
  
  // Combined store scores
  const popStore = 0.5 * popIos + 0.5 * popAndroid;
  const diffStore = 0.5 * diffIos + 0.5 * diffAndroid;
  
  // Normalize social scores to 0-1
  const buzzTiktok = scores.buzzTiktok / 100;
  const buzzInstagram = scores.buzzInstagram / 100;
  const buzzYoutube = scores.buzzYoutube / 100;
  
  // Global social (weighted)
  const socialGlobal = 
    0.50 * buzzTiktok +
    0.30 * buzzInstagram +
    0.20 * buzzYoutube;
  
  // Market scores already 0-1
  const adv = scores.adValidationScore;
  const ci = scores.creativeIntensityScore;
  const fs = scores.funnelSophisticationScore;
  
  // Competition penalty
  const competitionPenalty = 0.60 * ci + 0.40 * fs;
  
  // Base opportunity
  const opportunityNorm = 
    0.40 * popStore +
    0.25 * socialGlobal +
    0.20 * adv +
    0.15 * (1 - diffStore);
  
  // Adjusted with competition penalty
  const opportunityAdjusted = opportunityNorm * (0.70 + 0.30 * (1 - competitionPenalty));
  
  // Scale to 0-100
  return Math.round(100 * opportunityAdjusted * 100) / 100;
}
```

---

## Score Interpretation Guide

| Score | Interpretation | Action |
|-------|---------------|--------|
| **80-100** | 🟢 Strong opportunity | Move fast, validate PMF |
| **60-79** | 🟡 Good opportunity | Worth exploring, find differentiation |
| **40-59** | 🟠 Moderate | Needs unique angle or timing |
| **20-39** | 🔴 Challenging | High competition or low demand |
| **0-19** | ⚫ Poor fit | Likely saturated or no market |

---

*Scoring Formulas Documentation*
*Last updated: January 2026*
