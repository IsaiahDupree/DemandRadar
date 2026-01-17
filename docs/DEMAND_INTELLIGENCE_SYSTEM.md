# Demand Intelligence System

> **Mission:** Tell us what software to build next based on real market signals

---

## Available Data Connections

| Source | Type | Status | Signal Type |
|--------|------|--------|-------------|
| **Reddit API** | Pain points, discussions | ✅ Active | Demand signals, problems to solve |
| **Meta Ad Library** | Competitor ads | ✅ Active | Ad spend, winning creatives |
| **OpenAI** | LLM analysis | ✅ Active | Pattern extraction, summarization |
| **Supabase** | Database | ✅ Active | Storage, queries |
| **YouTube** | Video content | ✅ Collector | Tutorial demand, content gaps |
| **TikTok** | Short-form trends | ✅ Collector | Viral niches, emerging trends |
| **App Store** | App rankings | ✅ Collector | Category demand, ratings |
| **Google** | Search trends | ✅ Collector | Search volume, intent |
| **Instagram** | Visual trends | ✅ Collector | Creative trends, influencer activity |
| **Stripe MCP** | Payment data | ✅ MCP Tool | SaaS pricing, revenue patterns |

---

## Signal Types & What They Mean

### 1. Pain Point Signals (Reddit)
```
Source: Reddit discussions
Indicators:
- Posts asking "Is there a tool that..."
- Complaints about existing solutions
- Requests for recommendations
- High upvote counts on problem descriptions

Score Formula:
pain_score = (upvotes * 0.4) + (comments * 0.3) + (recency * 0.3)
```

### 2. Ad Spend Signals (Meta)
```
Source: Meta Ad Library
Indicators:
- Number of active ads in niche
- Ad run duration (30+ days = profitable)
- Number of advertisers
- Creative variety (more = scaling)

Score Formula:
spend_score = (active_ads * 0.3) + (avg_run_time * 0.4) + (advertiser_count * 0.3)
```

### 3. Search Demand Signals (Google)
```
Source: Google Trends, Search Console
Indicators:
- Search volume growth
- Related query expansion
- Commercial intent keywords
- "Best X for Y" searches

Score Formula:
search_score = (volume * 0.4) + (growth_rate * 0.4) + (commercial_intent * 0.2)
```

### 4. Content Gap Signals (YouTube)
```
Source: YouTube API
Indicators:
- Tutorial video demand
- Comment questions
- "How to" search volume
- Competitor content gaps

Score Formula:
content_score = (view_velocity * 0.4) + (comment_questions * 0.3) + (gap_size * 0.3)
```

### 5. App Market Signals (App Store)
```
Source: App Store/Play Store
Indicators:
- Category rankings
- Review complaints
- Feature requests in reviews
- Rating distribution

Score Formula:
app_score = (downloads * 0.3) + (negative_reviews * 0.3) + (feature_requests * 0.4)
```

---

## Unified Demand Score

### Formula
```javascript
function calculateDemandScore(niche) {
  const weights = {
    pain_points: 0.25,    // Reddit signals
    ad_spend: 0.25,       // Meta signals  
    search_demand: 0.20,  // Google signals
    content_gaps: 0.15,   // YouTube signals
    app_market: 0.15      // App Store signals
  };
  
  return (
    (niche.pain_score * weights.pain_points) +
    (niche.spend_score * weights.ad_spend) +
    (niche.search_score * weights.search_demand) +
    (niche.content_score * weights.content_gaps) +
    (niche.app_score * weights.app_market)
  ) * 100;
}
```

### Score Interpretation
| Score | Interpretation | Action |
|-------|----------------|--------|
| 80-100 | 🔥 Hot opportunity | Build immediately |
| 60-79 | 📈 Growing demand | Research deeper, validate |
| 40-59 | ⚖️ Moderate interest | Monitor, wait for signals |
| 20-39 | 📉 Low demand | Avoid unless passionate |
| 0-19 | ❄️ No signal | Skip |

---

## Database Schema

### `demand_signals` Table
```sql
CREATE TABLE demand_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche VARCHAR(255) NOT NULL,
  signal_type VARCHAR(50) NOT NULL, -- 'pain_point', 'ad_spend', 'search', 'content', 'app'
  source VARCHAR(50) NOT NULL,      -- 'reddit', 'meta', 'google', 'youtube', 'appstore'
  raw_data JSONB,
  score DECIMAL(5,2),
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_signals_niche ON demand_signals(niche);
CREATE INDEX idx_signals_type ON demand_signals(signal_type);
CREATE INDEX idx_signals_detected ON demand_signals(detected_at DESC);
```

### `niche_opportunities` Table
```sql
CREATE TABLE niche_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100),
  
  -- Individual scores
  pain_score DECIMAL(5,2) DEFAULT 0,
  spend_score DECIMAL(5,2) DEFAULT 0,
  search_score DECIMAL(5,2) DEFAULT 0,
  content_score DECIMAL(5,2) DEFAULT 0,
  app_score DECIMAL(5,2) DEFAULT 0,
  
  -- Unified score
  demand_score DECIMAL(5,2) GENERATED ALWAYS AS (
    (pain_score * 0.25) + (spend_score * 0.25) + 
    (search_score * 0.20) + (content_score * 0.15) + (app_score * 0.15)
  ) STORED,
  
  -- Trend
  trend VARCHAR(20) DEFAULT 'stable', -- 'rising', 'stable', 'declining'
  trend_velocity DECIMAL(5,2),
  
  -- Metadata
  first_detected TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  signal_count INT DEFAULT 0,
  
  -- Recommendations
  recommended_action TEXT,
  build_complexity VARCHAR(20), -- 'low', 'medium', 'high'
  estimated_market_size VARCHAR(50)
);

CREATE INDEX idx_opportunities_score ON niche_opportunities(demand_score DESC);
CREATE INDEX idx_opportunities_trend ON niche_opportunities(trend, trend_velocity DESC);
```

### `build_recommendations` Table
```sql
CREATE TABLE build_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id UUID REFERENCES niche_opportunities(id),
  
  -- What to build
  product_idea TEXT NOT NULL,
  product_type VARCHAR(50), -- 'saas', 'tool', 'api', 'marketplace', 'content'
  target_audience TEXT,
  
  -- Why to build it
  pain_points JSONB,        -- Array of pain points from Reddit
  competitor_ads JSONB,     -- Sample winning ads
  search_queries JSONB,     -- High-intent keywords
  
  -- How to market it
  recommended_hooks JSONB,  -- Ad hooks based on winning ads
  recommended_channels JSONB,
  estimated_cac_range VARCHAR(50),
  
  -- Confidence
  confidence_score DECIMAL(5,2),
  reasoning TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Signal Collection Pipeline

### Daily Collection Jobs

```javascript
// 1. Reddit Pain Points (every 6 hours)
async function collectRedditSignals(niches) {
  for (const niche of niches) {
    const mentions = await collectRedditMentions(niche);
    const painPoints = extractPainPoints(mentions);
    await storeDemandSignal('pain_point', 'reddit', niche, painPoints);
  }
}

// 2. Meta Ad Library (every 12 hours)
async function collectAdSignals(niches) {
  for (const niche of niches) {
    const ads = await collectMetaAds(niche);
    const adMetrics = analyzeAdPerformance(ads);
    await storeDemandSignal('ad_spend', 'meta', niche, adMetrics);
  }
}

// 3. Google Trends (daily)
async function collectSearchSignals(niches) {
  for (const niche of niches) {
    const trends = await getGoogleTrends(niche);
    await storeDemandSignal('search', 'google', niche, trends);
  }
}

// 4. YouTube Content Gaps (daily)
async function collectContentSignals(niches) {
  for (const niche of niches) {
    const videos = await searchYouTube(niche);
    const gaps = identifyContentGaps(videos);
    await storeDemandSignal('content', 'youtube', niche, gaps);
  }
}

// 5. App Store Analysis (weekly)
async function collectAppSignals(niches) {
  for (const niche of niches) {
    const apps = await searchAppStore(niche);
    const analysis = analyzeAppReviews(apps);
    await storeDemandSignal('app', 'appstore', niche, analysis);
  }
}
```

### Score Aggregation (hourly)

```javascript
async function updateNicheScores() {
  const niches = await getActiveNiches();
  
  for (const niche of niches) {
    const signals = await getRecentSignals(niche, '7 days');
    
    const scores = {
      pain_score: calculatePainScore(signals.filter(s => s.type === 'pain_point')),
      spend_score: calculateSpendScore(signals.filter(s => s.type === 'ad_spend')),
      search_score: calculateSearchScore(signals.filter(s => s.type === 'search')),
      content_score: calculateContentScore(signals.filter(s => s.type === 'content')),
      app_score: calculateAppScore(signals.filter(s => s.type === 'app')),
    };
    
    const trend = calculateTrend(niche, scores);
    
    await updateNicheOpportunity(niche, { ...scores, trend });
  }
}
```

---

## "What to Build Next" Algorithm

```javascript
async function getWhatToBuildNext(filters = {}) {
  // 1. Get top opportunities
  const opportunities = await db.query(`
    SELECT * FROM niche_opportunities 
    WHERE demand_score >= 60
      AND trend IN ('rising', 'stable')
    ORDER BY 
      CASE trend WHEN 'rising' THEN 1 ELSE 2 END,
      demand_score DESC
    LIMIT 10
  `);
  
  // 2. For each opportunity, generate build recommendation
  const recommendations = [];
  
  for (const opp of opportunities) {
    // Get supporting signals
    const painPoints = await getTopPainPoints(opp.niche, 5);
    const winningAds = await getWinningAds(opp.niche, 5);
    const searchQueries = await getTopSearches(opp.niche, 10);
    
    // Generate product idea with LLM
    const productIdea = await generateProductIdea({
      niche: opp.niche,
      painPoints,
      winningAds,
      searchQueries
    });
    
    // Generate marketing recommendations
    const marketingPlan = await generateMarketingPlan({
      niche: opp.niche,
      winningAds,
      searchQueries
    });
    
    recommendations.push({
      niche: opp.niche,
      demand_score: opp.demand_score,
      trend: opp.trend,
      product_idea: productIdea,
      marketing_plan: marketingPlan,
      supporting_data: {
        painPoints,
        winningAds,
        searchQueries
      }
    });
  }
  
  return recommendations;
}
```

---

## Dashboard Views

### 1. Opportunity Radar
- Visual heatmap of niches by demand score
- Trend indicators (rising/stable/declining)
- Click to drill down into signals

### 2. Signal Feed
- Real-time feed of new demand signals
- Filter by source, niche, score
- Quick actions: save, investigate, dismiss

### 3. Build Queue
- Ranked list of product recommendations
- Each with: idea, reasoning, supporting data
- Actions: start project, schedule, archive

### 4. Competitive Intelligence
- Winning ads in each niche
- Competitor ad strategies
- Creative patterns that work

### 5. Trend Alerts
- New niches crossing score thresholds
- Trending topics from Reddit
- Ad spend spikes in categories

---

## API Endpoints

```typescript
// Get top opportunities
GET /api/opportunities?limit=10&min_score=60&trend=rising

// Get build recommendations
GET /api/recommendations?niche=ai-tools

// Get signals for a niche
GET /api/signals?niche=ai-tools&type=pain_point&days=7

// Trigger signal collection
POST /api/collect?sources=reddit,meta&niche=ai-tools

// Get winning ads
GET /api/ads?niche=ai-tools&min_runtime=30

// Subscribe to alerts
POST /api/alerts { niche: "ai-tools", threshold: 70 }
```

---

## Implementation Phases

### Phase 1: Core Signal Collection (Week 1)
- [x] Reddit collector
- [x] Meta Ad collector
- [ ] Database schema
- [ ] Basic scoring

### Phase 2: Score Aggregation (Week 2)
- [ ] Unified demand score
- [ ] Trend calculation
- [ ] Niche opportunity table

### Phase 3: Recommendations (Week 3)
- [ ] LLM-powered product ideas
- [ ] Marketing recommendations
- [ ] Build queue UI

### Phase 4: Dashboard (Week 4)
- [ ] Opportunity radar
- [ ] Signal feed
- [ ] Alert system

---

## Quick Start: Software Niches to Monitor

Based on current ad activity and Reddit discussions:

| Niche | Why Monitor |
|-------|-------------|
| AI writing tools | Massive ad spend, clear demand |
| No-code builders | High pain point volume |
| Project management | Saturated but profitable |
| Video editing SaaS | Growing TikTok demand |
| Email marketing | Evergreen, high LTV |
| Landing page builders | High ad competition |
| CRM for [vertical] | Niche CRMs trending |
| API tools | Developer demand rising |
| Automation/Zapier alts | Integration pain points |
| Analytics dashboards | Data visualization demand |

---

*Created January 17, 2026 - DemandRadar Intelligence System*
