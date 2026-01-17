# PRD: Demand Brief - Weekly Subscription Feature

**Version:** 1.0  
**Date:** January 16, 2026  
**Status:** Draft  

---

## Executive Summary

Transform DemandRadar from a one-time analysis tool into a **sticky subscription product** with weekly "Demand Brief" emails that tell users: **"what changed + what to do next"** for their niche.

**Value Proposition:**  
*"Tell us what you sell → we monitor demand signals → you get a weekly 'what changed + what to do next' email."*

---

## 1. Onboarding Flow

### 1.1 Single Input → Structured Data

**User Input:** One text box for their offering
- Examples: "BlankLogo", "email newsletter course", "mobile car audio install"

**Auto-Extracted Fields:**

| Field | Source | Editable |
|-------|--------|----------|
| **Offering Name** | User input | Yes |
| **Category + Niche Tags** | AI auto-suggest | Yes |
| **Customer Profile** | AI inference (B2C/B2B, creator/agency/SMB, price point) | Yes |
| **Competitors** | Auto-detected (5-10 similar tools) | Yes |
| **Keywords** | Auto-generated (primary + adjacent) | Yes |
| **Geo** | Optional (US/state/global) | Yes |

### 1.2 Preview Screen

Show user what they're subscribing to:
```
"We'll track these keywords + competitors weekly:"
- Keywords: [keyword1], [keyword2], [keyword3]...
- Competitors: [comp1], [comp2], [comp3]...
- Sources: Meta Ads, Google Ads, Reddit, TikTok, App Stores
```

### 1.3 Database Schema: User Config

```sql
CREATE TABLE user_niches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  offering_name TEXT NOT NULL,
  category TEXT,
  niche_tags TEXT[],
  customer_profile JSONB, -- {type: 'B2C', segment: 'creator', price_point: 'mid'}
  competitors TEXT[],
  keywords TEXT[],
  geo TEXT DEFAULT 'US',
  sources_enabled TEXT[] DEFAULT ARRAY['meta', 'google', 'reddit', 'tiktok', 'appstore'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2. Weekly Demand Brief Email

### 2.1 Email Structure

**Subject Line:** `📊 {offering_name} Demand Brief: Score {score} ({trend})`

#### Section A: Demand Score (0-100) + Trend

```
┌─────────────────────────────────────┐
│  DEMAND SCORE: 73  ▲ +12 this week  │
│  ════════════════════════════════   │
│                                     │
│  Why it changed:                    │
│  • 3 new advertisers entered        │
│  • "alternative to X" searches +40% │
│  • Pain mentions up in r/niche      │
└─────────────────────────────────────┘
```

#### Section B: What Changed This Week

| Signal Type | What We Saw |
|-------------|-------------|
| **🎯 Ads** | New angles: "no watermark", "1-click export". 2 competitors running longer. |
| **🔍 Search** | Rising: "best {keyword} 2026", "{competitor} alternative" |
| **📱 UGC** | Working formats: demo videos (32% engagement), before/after (28%) |
| **💬 Forums** | Top complaints: "too expensive", "slow rendering". Top desires: "batch processing" |
| **⚔️ Competitors** | {Competitor1} dropped price 20%. {Competitor2} added new feature. |

#### Section C: What To Do Next (3 Plays)

```
1. 🛠️ PRODUCT PLAY: Add batch processing (mentioned 47 times this week)
2. 💰 OFFER PLAY: Test "first 10 exports free" vs current trial
3. 📣 DISTRIBUTION PLAY: Run "before/after" UGC angle on TikTok
```

#### Section D: Copy You Can Paste

```
AD HOOKS:
• "Remove watermarks in 1 click (no quality loss)"
• "The tool {competitor} users are switching to"
• "Why 10,000 creators ditched {competitor}"

SUBJECT LINES:
• "Your videos deserve better than watermarks"
• "The export hack that saves 2 hours/week"
• "What {competitor} won't tell you"

LANDING PAGE PARAGRAPH:
"Stop wasting time on [pain point]. {Product} gives you 
[benefit] in [timeframe]. Join [social proof] who already 
[outcome]. Start free today."
```

### 2.2 Database Schema: Weekly Snapshots

```sql
CREATE TABLE demand_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id UUID REFERENCES user_niches(id),
  week_start DATE NOT NULL,
  
  -- Scores
  demand_score INTEGER CHECK (demand_score BETWEEN 0 AND 100),
  demand_score_change INTEGER,
  opportunity_score INTEGER,
  message_market_fit_score INTEGER,
  
  -- Raw signals
  ad_signals JSONB,       -- {new_advertisers: 3, top_angles: [...], top_offers: [...]}
  search_signals JSONB,   -- {rising_keywords: [...], buyer_intent: [...]}
  ugc_signals JSONB,      -- {top_formats: [...], engagement_rates: {...}}
  forum_signals JSONB,    -- {top_complaints: [...], top_desires: [...]}
  competitor_signals JSONB, -- {pricing_changes: [...], feature_changes: [...]}
  
  -- Generated content
  plays JSONB,            -- [{type: 'product', action: '...', evidence: '...'}, ...]
  ad_hooks TEXT[],
  subject_lines TEXT[],
  landing_copy TEXT,
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_snapshots_niche_week ON demand_snapshots(niche_id, week_start);
```

---

## 3. Demand Score Formula

### 3.1 Core Score (0-100)

| Factor | Weight | Measurement |
|--------|--------|-------------|
| **Ad Activity** | 30% | # advertisers × avg creative longevity |
| **Buyer Intent Keywords** | 25% | Volume of "best", "alternative", "pricing", "vs", "review" |
| **Chatter Velocity** | 20% | Week-over-week growth rate of mentions |
| **Pain Intensity** | 15% | Frequency of complaints → purchase triggers |
| **Competitive Heat** | 10% | # active competitors (inverse - more = lower score) |

### 3.2 Companion Metrics

```typescript
interface DemandMetrics {
  demandScore: number;           // 0-100, main score
  opportunityScore: number;      // demand - competitive_heat
  messageMarketFit: number;      // how well ads match detected pains
  trend: 'up' | 'down' | 'stable';
  trendDelta: number;            // +/- change from last week
}
```

### 3.3 Implementation

```typescript
// src/lib/scoring/demand-score.ts

export function calculateDemandScore(signals: WeeklySignals): DemandMetrics {
  const adScore = calculateAdActivity(signals.ads);           // 0-100
  const intentScore = calculateBuyerIntent(signals.search);   // 0-100
  const velocityScore = calculateChatterVelocity(signals.mentions); // 0-100
  const painScore = calculatePainIntensity(signals.forums);   // 0-100
  const heatScore = calculateCompetitiveHeat(signals.competitors); // 0-100
  
  const demandScore = Math.round(
    adScore * 0.30 +
    intentScore * 0.25 +
    velocityScore * 0.20 +
    painScore * 0.15 +
    (100 - heatScore) * 0.10  // Invert: less competition = higher score
  );
  
  const opportunityScore = Math.round(demandScore - (heatScore * 0.5));
  
  return {
    demandScore,
    opportunityScore,
    messageMarketFit: calculateMessageFit(signals.ads, signals.forums),
    trend: determineTrend(demandScore, signals.previousScore),
    trendDelta: demandScore - (signals.previousScore || demandScore)
  };
}
```

---

## 4. Subscription Tiers

### 4.1 Pricing Plans

| Plan | Niches | Features | Price |
|------|--------|----------|-------|
| **Starter** | 1 | Weekly email + dashboard snapshot | $29/mo |
| **Builder** | 3 | Weekly + alerts (spikes, competitor changes) | $79/mo |
| **Agency** | 10-25 | Client-ready PDF + exports + API | $199/mo |

### 4.2 Add-Ons

| Add-On | Description | Price |
|--------|-------------|-------|
| **Ad Angle Pack** | 10 hooks + 5 scripts weekly | +$19/mo |
| **Landing Page Rewrites** | Keyword-to-copy suggestions | +$29/mo |
| **Competitor Watchlists** | Pricing/feature change alerts | +$19/mo |

### 4.3 Database Schema: Subscriptions

```sql
ALTER TABLE profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN max_niches INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN addons TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE TABLE subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  month DATE NOT NULL,
  niches_used INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  alerts_sent INTEGER DEFAULT 0,
  exports_generated INTEGER DEFAULT 0,
  UNIQUE(user_id, month)
);
```

---

## 5. Retention Mechanics

### 5.1 Between-Brief Alerts

Trigger alerts for significant events:

```typescript
interface Alert {
  type: 'competitor_price' | 'trend_spike' | 'new_angle' | 'pain_surge';
  title: string;
  body: string;
  urgency: 'low' | 'medium' | 'high';
}

// Example alerts:
// "🚨 Competitor dropped price 20%"
// "📈 New angle trending: 'remove watermark without quality loss'"
// "🔍 Spike in 'alternative to X' searches (+340%)"
```

### 5.2 Progress Tracking

Show users their niche evolution:

```
"Your niche demand score has risen 34% in 6 weeks"
"Most consistent winning offer: free credits vs free trial"
"Your competitors have launched 3 new features this month"
```

### 5.3 Experiment Loop

Every email ends with:
```
🧪 THIS WEEK'S EXPERIMENT:
"Test a 'before/after' video format on TikTok using hook #2"

📊 LAST WEEK'S EXPERIMENT RESULTS:
"Did it work? Here's what we saw in the ecosystem..."
```

---

## 6. Technical Implementation

### 6.1 Weekly Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  1. Collect │ ──▶ │ 2. Process  │ ──▶ │  3. Score   │
│   Signals   │     │  & Dedupe   │     │  & Rank     │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  6. Store   │ ◀── │  5. Send    │ ◀── │ 4. Generate │
│  Snapshot   │     │   Email     │     │   Content   │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 6.2 New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/niches` | GET/POST | List/create user niches |
| `/api/niches/[id]` | GET/PUT/DELETE | Manage single niche |
| `/api/niches/[id]/snapshots` | GET | Get historical snapshots |
| `/api/briefs/[id]` | GET | Get latest brief for niche |
| `/api/briefs/generate` | POST | Trigger manual brief generation |
| `/api/alerts` | GET | List user alerts |

### 6.3 New Pages

| Page | Route | Purpose |
|------|-------|---------|
| Onboarding | `/onboarding` | New user niche setup |
| My Niches | `/dashboard/niches` | Manage tracked niches |
| Niche Detail | `/dashboard/niches/[id]` | View niche history + settings |
| Brief View | `/dashboard/briefs/[id]` | Web version of email |
| Alerts | `/dashboard/alerts` | View all alerts |

### 6.4 Email Service (Resend)

```typescript
// src/lib/email/demand-brief.ts

import { Resend } from 'resend';
import { DemandBriefEmail } from './templates/demand-brief';

export async function sendDemandBrief(
  userId: string,
  nicheId: string,
  snapshot: DemandSnapshot
) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  await resend.emails.send({
    from: 'DemandRadar <briefs@demandradar.io>',
    to: [user.email],
    subject: `📊 ${snapshot.offering_name} Demand Brief: Score ${snapshot.demand_score} (${snapshot.trend})`,
    react: DemandBriefEmail({ snapshot }),
  });
}
```

### 6.5 Cron Job (Weekly Pipeline)

```typescript
// src/app/api/cron/weekly-briefs/route.ts

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Get all active niches
  const niches = await getActiveNiches();
  
  for (const niche of niches) {
    // 1. Collect signals
    const signals = await collectWeeklySignals(niche);
    
    // 2. Calculate scores
    const metrics = calculateDemandScore(signals);
    
    // 3. Generate content (AI)
    const content = await generateBriefContent(niche, signals, metrics);
    
    // 4. Store snapshot
    const snapshot = await storeSnapshot(niche.id, metrics, content);
    
    // 5. Send email
    await sendDemandBrief(niche.user_id, niche.id, snapshot);
  }
  
  return Response.json({ processed: niches.length });
}
```

---

## 7. Success Metrics

| Metric | Target |
|--------|--------|
| **Email Open Rate** | >50% |
| **Click-through Rate** | >15% |
| **Week 4 Retention** | >70% |
| **Month 3 Retention** | >50% |
| **NPS** | >40 |

---

## 8. Implementation Phases

### Phase 1: Core Brief (2 weeks)
- [ ] Onboarding flow
- [ ] Niche config storage
- [ ] Weekly signal collection
- [ ] Demand score calculation
- [ ] Basic email template

### Phase 2: Content Generation (1 week)
- [ ] AI-generated plays
- [ ] AI-generated copy (hooks, subject lines)
- [ ] Landing page suggestions

### Phase 3: Alerts & Retention (1 week)
- [ ] Between-brief alerts
- [ ] Progress tracking dashboard
- [ ] Experiment loop

### Phase 4: Subscription Management (1 week)
- [ ] Tier enforcement
- [ ] Add-on purchases
- [ ] Usage tracking

---

## 9. Positioning

**One-liner:**  
*"Demand Radar: weekly demand intel for your niche — what's rising, what's working in ads, what people complain about, and what to do next."*
