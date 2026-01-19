# PRD: Competitive Intelligence System

> **Status:** Draft  
> **Priority:** Medium-High  
> **Estimated Effort:** 3-4 weeks  
> **Created:** January 19, 2026

---

## Problem Statement

Users can see point-in-time snapshots of competitors, but they can't **track changes over time** or get **alerts when competitors make moves**. The spec defines competitive intelligence features including brand tracking, ad creative monitoring, and campaign alerts—none of which are implemented.

### Current State
- ✅ One-time competitor ad search
- ✅ Gap analysis between user and competitors
- ❌ No persistent competitor tracking
- ❌ No change detection
- ❌ No alerts for competitor moves
- ❌ No historical competitor data

---

## Goals

1. **Proactive Monitoring:** Track competitors without manual effort
2. **Timely Alerts:** Know when competitors launch new campaigns
3. **Strategic Insights:** Understand competitor patterns over time
4. **Actionable Intel:** Turn competitor data into action items

### Success Metrics
| Metric | Target |
|--------|--------|
| Users with active watchlists | 40% of active users |
| Alert open rate | >50% |
| Avg competitors tracked per user | 5+ |
| Retention impact | +15% for users with watchlists |

---

## User Stories

1. **As a founder**, I want to track my top 5 competitors' ads, so I can see when they launch new campaigns.

2. **As a marketer**, I want to see competitor creative changes over time, so I can spot trends in their strategy.

3. **As an agency**, I want to monitor multiple brands for clients, so I can provide competitive reports.

4. **As a user**, I want email alerts when competitors make significant changes, so I don't have to check daily.

---

## Technical Specification

### Database Schema

```sql
-- Competitor watchlist
CREATE TABLE competitor_watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  name VARCHAR(255) NOT NULL, -- "Main Competitors", "Enterprise Players"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracked competitors
CREATE TABLE tracked_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id UUID REFERENCES competitor_watchlists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  
  -- Competitor info
  competitor_name VARCHAR(255) NOT NULL,
  competitor_domain VARCHAR(255),
  meta_page_id VARCHAR(100), -- For Meta Ad Library tracking
  
  -- Tracking settings
  track_ads BOOLEAN DEFAULT true,
  track_pricing BOOLEAN DEFAULT false,
  track_features BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_checked TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, competitor_name)
);

-- Competitor snapshots (historical data)
CREATE TABLE competitor_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES tracked_competitors(id) ON DELETE CASCADE,
  
  -- Snapshot data
  snapshot_date DATE NOT NULL,
  active_ads_count INT DEFAULT 0,
  new_ads_count INT DEFAULT 0,
  stopped_ads_count INT DEFAULT 0,
  
  -- Ad data
  ads_data JSONB, -- Array of ad summaries
  
  -- Detected changes
  changes JSONB, -- {type: 'new_campaign', details: {...}}
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(competitor_id, snapshot_date)
);

-- Competitor alerts
CREATE TABLE competitor_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  competitor_id UUID REFERENCES tracked_competitors(id) ON DELETE CASCADE,
  
  -- Alert details
  alert_type VARCHAR(50) NOT NULL, -- 'new_campaign', 'ad_spike', 'pricing_change', 'new_feature'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  data JSONB,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tracked_competitors_user ON tracked_competitors(user_id);
CREATE INDEX idx_competitor_snapshots_date ON competitor_snapshots(competitor_id, snapshot_date DESC);
CREATE INDEX idx_competitor_alerts_user ON competitor_alerts(user_id, is_read, created_at DESC);
```

### API Endpoints

```typescript
// Watchlist management
POST /api/competitors/watchlists
GET /api/competitors/watchlists
DELETE /api/competitors/watchlists/{id}

// Competitor tracking
POST /api/competitors/track
Body: {
  watchlist_id?: string,
  competitor_name: string,
  competitor_domain?: string,
  track_ads?: boolean,
  track_pricing?: boolean
}

GET /api/competitors
Response: {
  competitors: TrackedCompetitor[],
  total: number
}

DELETE /api/competitors/{id}

// Competitor intelligence
GET /api/competitors/{id}/snapshots?days=30
Response: {
  competitor: TrackedCompetitor,
  snapshots: Snapshot[],
  changes: Change[]
}

GET /api/competitors/{id}/ads
Response: {
  current_ads: Ad[],
  new_this_week: Ad[],
  stopped_this_week: Ad[]
}

// Alerts
GET /api/competitors/alerts?unread=true
PATCH /api/competitors/alerts/{id}
Body: { is_read?: boolean, is_dismissed?: boolean }
```

### Change Detection System

```typescript
// src/lib/competitors/change-detector.ts

interface CompetitorChange {
  type: ChangeType;
  competitor_id: string;
  detected_at: Date;
  data: any;
  significance: 'low' | 'medium' | 'high';
}

type ChangeType = 
  | 'new_campaign'      // New ad creative launched
  | 'campaign_ended'    // Long-running ad stopped
  | 'ad_spike'          // Significant increase in ad count
  | 'creative_shift'    // Major change in creative style
  | 'messaging_change'  // New value props or hooks
  | 'pricing_change'    // Pricing page update
  | 'new_feature';      // Feature announcement

export async function detectCompetitorChanges(
  competitor: TrackedCompetitor,
  previousSnapshot: Snapshot,
  currentSnapshot: Snapshot
): Promise<CompetitorChange[]> {
  const changes: CompetitorChange[] = [];
  
  // Detect new campaigns
  const newAds = currentSnapshot.ads.filter(
    ad => !previousSnapshot.ads.find(prev => prev.id === ad.id)
  );
  
  if (newAds.length > 0) {
    changes.push({
      type: 'new_campaign',
      competitor_id: competitor.id,
      detected_at: new Date(),
      data: { ads: newAds, count: newAds.length },
      significance: newAds.length > 5 ? 'high' : 'medium'
    });
  }
  
  // Detect stopped ads (especially long-running ones)
  const stoppedAds = previousSnapshot.ads.filter(
    ad => !currentSnapshot.ads.find(curr => curr.id === ad.id)
  );
  
  const stoppedWinners = stoppedAds.filter(ad => ad.run_days > 30);
  if (stoppedWinners.length > 0) {
    changes.push({
      type: 'campaign_ended',
      competitor_id: competitor.id,
      detected_at: new Date(),
      data: { ads: stoppedWinners },
      significance: 'medium'
    });
  }
  
  // Detect ad volume spike
  const adCountChange = currentSnapshot.active_ads_count - previousSnapshot.active_ads_count;
  const percentChange = (adCountChange / previousSnapshot.active_ads_count) * 100;
  
  if (percentChange > 50) {
    changes.push({
      type: 'ad_spike',
      competitor_id: competitor.id,
      detected_at: new Date(),
      data: { 
        previous: previousSnapshot.active_ads_count,
        current: currentSnapshot.active_ads_count,
        percent_change: percentChange
      },
      significance: 'high'
    });
  }
  
  // Detect creative/messaging shifts using LLM
  if (newAds.length >= 3) {
    const shift = await analyzeCreativeShift(previousSnapshot.ads, newAds);
    if (shift.detected) {
      changes.push({
        type: 'creative_shift',
        competitor_id: competitor.id,
        detected_at: new Date(),
        data: shift,
        significance: 'high'
      });
    }
  }
  
  return changes;
}

async function analyzeCreativeShift(
  previousAds: Ad[],
  newAds: Ad[]
): Promise<{ detected: boolean; summary?: string; details?: any }> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'system',
      content: `Analyze if there's a significant creative or messaging shift between old and new ads.
      
Output JSON: { "detected": boolean, "summary": "...", "shift_type": "..." }`
    }, {
      role: 'user',
      content: `Previous ads: ${JSON.stringify(previousAds.slice(0, 5).map(a => a.headline + ': ' + a.body))}
      
New ads: ${JSON.stringify(newAds.map(a => a.headline + ': ' + a.body))}`
    }],
    response_format: { type: 'json_object' }
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

### Daily Monitoring Cron Job

```typescript
// src/app/api/cron/competitor-monitor/route.ts

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const supabase = await createClient();
  
  // Get all active tracked competitors
  const { data: competitors } = await supabase
    .from('tracked_competitors')
    .select('*')
    .eq('is_active', true);
  
  const results = {
    processed: 0,
    changes_detected: 0,
    alerts_created: 0
  };
  
  for (const competitor of competitors) {
    // Get current snapshot
    const currentSnapshot = await collectCompetitorSnapshot(competitor);
    
    // Get previous snapshot
    const { data: previousSnapshot } = await supabase
      .from('competitor_snapshots')
      .select('*')
      .eq('competitor_id', competitor.id)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single();
    
    // Save current snapshot
    await supabase.from('competitor_snapshots').insert({
      competitor_id: competitor.id,
      snapshot_date: new Date().toISOString().split('T')[0],
      active_ads_count: currentSnapshot.ads.length,
      new_ads_count: currentSnapshot.newAds?.length || 0,
      ads_data: currentSnapshot.ads
    });
    
    // Detect changes if we have a previous snapshot
    if (previousSnapshot) {
      const changes = await detectCompetitorChanges(
        competitor,
        previousSnapshot,
        currentSnapshot
      );
      
      // Create alerts for significant changes
      for (const change of changes) {
        if (change.significance !== 'low') {
          await supabase.from('competitor_alerts').insert({
            user_id: competitor.user_id,
            competitor_id: competitor.id,
            alert_type: change.type,
            title: generateAlertTitle(change),
            description: generateAlertDescription(change),
            data: change.data
          });
          results.alerts_created++;
        }
        results.changes_detected++;
      }
    }
    
    results.processed++;
  }
  
  return Response.json(results);
}
```

---

## UI Requirements

### Competitor Dashboard (`/dashboard/competitors`)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎯 Competitive Intelligence                      [+ Track New] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 🔔 3 New Alerts                                    [View All →] │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🚀 Competitor X launched 7 new ads         2 hours ago     │ │
│ │ 📈 Competitor Y ad volume up 65%           Yesterday       │ │
│ │ ⏹️ Competitor Z stopped their top campaign  Yesterday       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Watchlist: Main Competitors (5)                    [Edit]   │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │                                                             │ │
│ │  Competitor A          12 active ads    ▲ 3 new this week  │ │
│ │  competitor-a.com      Last: 2h ago     [View Ads]         │ │
│ │                                                             │ │
│ │  Competitor B          28 active ads    ▼ 5 stopped        │ │
│ │  competitor-b.com      Last: 2h ago     [View Ads]         │ │
│ │                                                             │ │
│ │  Competitor C          6 active ads     → No change        │ │
│ │  competitor-c.com      Last: 2h ago     [View Ads]         │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ 📊 Competitive Landscape (30 days)                              │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │         ╭──────────────────────────────╮                    │ │
│ │    30 ─ │  A ───────────────────────── │                    │ │
│ │    25 ─ │     ╲                        │                    │ │
│ │    20 ─ │       B ─────────────────────│                    │ │
│ │    15 ─ │                              │                    │ │
│ │    10 ─ │  C ──────────────────────────│                    │ │
│ │     5 ─ │                              │                    │ │
│ │         ╰──────────────────────────────╯                    │ │
│ │         Jan 1        Jan 15        Jan 30                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Competitor Detail View

```
┌───────────────────────────────────────────────────────────────────┐
│ ← Back    Competitor A                            [⚙️] [🗑️]      │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│ competitor-a.com    │ 12 Active Ads │ Tracking since Jan 1       │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐   │
│ │ 📈 Ad Activity                                              │   │
│ │                                                             │   │
│ │ This Week:  +3 new  │  -1 stopped  │  = 2 unchanged        │   │
│ │ This Month: +12 new │  -8 stopped  │  Overall trend: ▲     │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                   │
│ 🆕 New Ads This Week                                              │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐       │
│ │ [Ad Preview]    │ │ [Ad Preview]    │ │ [Ad Preview]    │       │
│ │ Hook: "..."     │ │ Hook: "..."     │ │ Hook: "..."     │       │
│ │ Started: 2d ago │ │ Started: 3d ago │ │ Started: 5d ago │       │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘       │
│                                                                   │
│ 🏆 Top Performing Ads (30+ days)                                  │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐       │
│ │ [Ad Preview]    │ │ [Ad Preview]    │ │ [Ad Preview]    │       │
│ │ Running: 45 days│ │ Running: 38 days│ │ Running: 32 days│       │
│ │ Hook: "..."     │ │ Hook: "..."     │ │ Hook: "..."     │       │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘       │
│                                                                   │
│ 📝 Creative Patterns Detected                                     │
│ • Heavy use of UGC-style content                                  │
│ • Problem-agitation hooks dominate                                │
│ • Consistent "free trial" CTA                                     │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Core Tracking (Week 1)
- [ ] Create database tables (watchlists, tracked_competitors, snapshots)
- [ ] Build `/api/competitors` CRUD endpoints
- [ ] Create watchlist management UI
- [ ] Add competitor tracking flow

### Phase 2: Snapshot Collection (Week 1-2)
- [ ] Implement `collectCompetitorSnapshot()`
- [ ] Create daily cron job for monitoring
- [ ] Store historical snapshots
- [ ] Build snapshot comparison logic

### Phase 3: Change Detection (Week 2-3)
- [ ] Implement `detectCompetitorChanges()`
- [ ] Add LLM creative shift analysis
- [ ] Create alerts table and API
- [ ] Build alert notification UI

### Phase 4: Intelligence Dashboard (Week 3-4)
- [ ] Build competitor dashboard page
- [ ] Create competitor detail view
- [ ] Add ad activity charts
- [ ] Implement pattern detection display

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Meta Ad Library API | ✅ Active | Core data source |
| OpenAI GPT-4o | ✅ Active | For pattern analysis |
| Cron jobs (Vercel) | ✅ Available | For daily monitoring |
| Email notifications | ✅ Resend | For alert delivery |

---

## Pricing Tier Considerations

| Feature | Free | Pro | Studio |
|---------|------|-----|--------|
| Tracked competitors | 2 | 10 | Unlimited |
| Alert frequency | Weekly digest | Daily | Real-time |
| Historical data | 7 days | 30 days | 90 days |
| Creative analysis | ❌ | ✅ | ✅ |

---

*Document Owner: DemandRadar Product Team*
