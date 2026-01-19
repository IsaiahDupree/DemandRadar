# PRD: Additional Feature Opportunities

> **Status:** Draft (Backlog Ideas)  
> **Priority:** Various  
> **Created:** January 19, 2026

---

## Overview

This document captures additional feature opportunities identified through gap analysis, user feedback patterns, and competitive research. These are organized by priority and effort.

---

## High-Value Opportunities

### 1. LinkedIn Ad Library Integration

**Problem:** B2B SaaS companies heavily use LinkedIn ads, but we don't track them.

**Solution:** Integrate LinkedIn Ad Library for B2B intelligence.

| Aspect | Details |
|--------|---------|
| Data Source | LinkedIn Ad Library (transparency.linkedin.com) |
| Update Frequency | Weekly |
| Key Signals | B2B targeting, ad formats, messaging |
| Effort | Medium (2 weeks) |

**Implementation:**
```typescript
// src/lib/collectors/linkedin.ts
export interface LinkedInAd {
  id: string;
  advertiser_name: string;
  ad_text: string;
  target_audience: string[];
  impressions_range: string;
  date_range: { start: Date; end: Date };
}

export async function collectLinkedInAds(niche: string): Promise<LinkedInAd[]>;
```

---

### 2. TikTok Creative Center Integration

**Problem:** TikTok is a major ad platform for consumer SaaS, but we only have trend data.

**Solution:** Full TikTok Creative Center integration for ad intelligence.

| Aspect | Details |
|--------|---------|
| Data Source | TikTok Creative Center API |
| Update Frequency | Daily |
| Key Signals | Winning ads, trending sounds, creator patterns |
| Effort | Medium (2 weeks) |

**Features:**
- Top-performing TikTok ads by category
- Trending sounds used in SaaS ads
- Creator collaboration patterns
- Video format analysis (UGC, demo, testimonial)

---

### 3. Landing Page Analysis

**Problem:** Users can see ads but can't analyze the landing pages they link to.

**Solution:** Automated landing page capture and analysis.

| Aspect | Details |
|--------|---------|
| Tech | Puppeteer/Playwright for screenshots |
| Analysis | LLM-powered copy analysis |
| Output | Structure, messaging, conversion elements |
| Effort | Medium-High (3 weeks) |

**Features:**
```typescript
interface LandingPageAnalysis {
  url: string;
  screenshot: string;
  headline: string;
  subheadline: string;
  cta_text: string;
  social_proof: string[];
  pricing_visible: boolean;
  form_fields: string[];
  page_structure: {
    sections: string[];
    scroll_depth: number;
  };
  messaging_analysis: {
    value_props: string[];
    pain_points_addressed: string[];
    tone: string;
  };
}
```

---

### 4. Ad Creative Templates

**Problem:** Users see winning ads but struggle to create their own.

**Solution:** Generate customizable ad templates based on winning patterns.

| Aspect | Details |
|--------|---------|
| Input | User's product + winning ad patterns |
| Output | Customizable ad templates (copy + structure) |
| Formats | Static, video script, carousel |
| Effort | Medium (2 weeks) |

**Features:**
- Hook variations based on winning ads
- Body copy templates with fill-in-the-blanks
- CTA recommendations
- Visual composition guidelines
- Export to Canva/Figma

---

### 5. Niche Comparison Tool

**Problem:** Users want to compare multiple niches before committing.

**Solution:** Side-by-side niche comparison dashboard.

| Aspect | Details |
|--------|---------|
| Inputs | 2-4 niches to compare |
| Output | Comparative analysis grid |
| Metrics | All 5 demand signals + trends |
| Effort | Low-Medium (1-2 weeks) |

**UI Mock:**
```
┌─────────────────────────────────────────────────────────────┐
│ Compare Niches                                              │
├─────────────────────────────────────────────────────────────┤
│ Metric          │ AI Writers │ No-Code    │ CRM Tools      │
├─────────────────────────────────────────────────────────────┤
│ Demand Score    │ 82 🔥      │ 71 📈      │ 65 ⚖️          │
│ Pain Score      │ 88         │ 72         │ 58             │
│ Ad Spend        │ 79         │ 68         │ 71             │
│ Search Volume   │ 85         │ 74         │ 62             │
│ Trend           │ ▲ Rising   │ → Stable   │ ▼ Declining    │
│ Competition     │ High       │ Medium     │ High           │
│ Build Effort    │ Medium     │ High       │ High           │
├─────────────────────────────────────────────────────────────┤
│ Recommendation  │ ⭐ Best    │ Good       │ Caution        │
└─────────────────────────────────────────────────────────────┘
```

---

### 6. Historical Trend Analysis

**Problem:** Users only see current state, not how niches evolved.

**Solution:** Time-series visualization of niche demand over time.

| Aspect | Details |
|--------|---------|
| Data | Historical demand snapshots |
| Visualization | Line charts, trend indicators |
| Timeframes | 7d, 30d, 90d, 1y |
| Effort | Medium (2 weeks) |

**Database Addition:**
```sql
-- Store historical snapshots
CREATE TABLE demand_history (
  id UUID PRIMARY KEY,
  niche VARCHAR(255),
  snapshot_date DATE,
  demand_score DECIMAL(5,2),
  pain_score DECIMAL(5,2),
  spend_score DECIMAL(5,2),
  search_score DECIMAL(5,2),
  signal_count INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_demand_history_niche_date ON demand_history(niche, snapshot_date DESC);
```

---

### 7. AI-Powered Niche Discovery

**Problem:** Users must know what niches to search for.

**Solution:** AI suggests unexplored niches based on signals.

| Aspect | Details |
|--------|---------|
| Algorithm | Cross-signal pattern matching |
| Sources | Rising Reddit topics, new ad categories |
| Output | "Emerging niche" recommendations |
| Effort | Medium-High (3 weeks) |

**Algorithm Concept:**
```typescript
async function discoverEmergingNiches(): Promise<NicheRecommendation[]> {
  // 1. Find Reddit topics with sudden upvote spikes
  const risingTopics = await findRisingRedditTopics();
  
  // 2. Find new advertisers in growing categories
  const newAdvertisers = await findNewAdvertisers();
  
  // 3. Find search queries with accelerating volume
  const risingSearches = await findRisingSearchQueries();
  
  // 4. Cross-reference to find niches appearing in 2+ sources
  const candidates = crossReferenceSignals(risingTopics, newAdvertisers, risingSearches);
  
  // 5. Filter out saturated niches
  const emerging = filterSaturatedNiches(candidates);
  
  // 6. Score and rank
  return rankByOpportunityScore(emerging);
}
```

---

### 8. Slack/Discord Integration

**Problem:** Users want alerts in their communication tools.

**Solution:** Real-time alerts via Slack/Discord webhooks.

| Aspect | Details |
|--------|---------|
| Platforms | Slack, Discord |
| Alert Types | Demand spikes, competitor moves, weekly digests |
| Setup | OAuth or webhook URL |
| Effort | Low (1 week) |

**Implementation:**
```typescript
// src/lib/integrations/slack.ts
export async function sendSlackAlert(
  webhookUrl: string,
  alert: DemandAlert
): Promise<void> {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: `📊 ${alert.title}` }
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: alert.description }
        },
        {
          type: 'actions',
          elements: [{
            type: 'button',
            text: { type: 'plain_text', text: 'View Details' },
            url: `https://demandradar.app/dashboard/alerts/${alert.id}`
          }]
        }
      ]
    })
  });
}
```

---

### 9. API Access for Power Users

**Problem:** Agencies and developers want programmatic access.

**Solution:** Public REST API with rate limiting and authentication.

| Aspect | Details |
|--------|---------|
| Auth | API keys (already partially built) |
| Endpoints | Demand scores, signals, runs |
| Rate Limits | Based on subscription tier |
| Effort | Medium (2 weeks) |

**API Endpoints:**
```
GET  /api/v1/demand/score?niche={niche}
GET  /api/v1/demand/signals?niche={niche}&source={source}
GET  /api/v1/runs/{runId}
POST /api/v1/runs
GET  /api/v1/trends?category={category}
GET  /api/v1/competitors/{id}/ads
```

**Rate Limits by Tier:**
| Tier | Requests/hour | Endpoints |
|------|---------------|-----------|
| Pro | 100 | Read-only |
| Studio | 1000 | Full access |

---

### 10. White-Label Reports Enhancement

**Problem:** Studio users want fully branded client deliverables.

**Solution:** Enhanced white-label PDF/HTML reports.

| Aspect | Details |
|--------|---------|
| Customization | Logo, colors, fonts, footer |
| Formats | PDF, HTML, Notion export |
| Templates | Executive summary, detailed analysis |
| Effort | Medium (2 weeks) |

**Report Sections:**
1. Executive Summary (1 page)
2. Demand Score Breakdown
3. Top Pain Points (with sources)
4. Winning Ad Analysis
5. Competitor Landscape
6. Recommendations
7. Appendix: Raw Data

---

## Medium-Value Opportunities

### 11. Saved Searches & Folders
Organize runs and saved items into folders for better management.

### 12. Team Collaboration
Share runs, notes, and recommendations with team members.

### 13. Custom Scoring Weights
Allow users to adjust the 5-signal weights based on their priorities.

### 14. Integration with No-Code Tools
One-click export to Bubble, Webflow, or Carrd templates.

### 15. Chrome Extension
Quick demand lookup while browsing competitor sites.

---

## Lower Priority (Future Consideration)

### 16. Mobile App
Native iOS/Android for on-the-go checks.

### 17. Podcast/YouTube Mention Tracking
Track brand mentions in audio/video content.

### 18. Pricing Intelligence
Track competitor pricing changes over time.

### 19. Review Aggregation
Centralize G2, Capterra, ProductHunt reviews.

### 20. AI Chatbot for Queries
"What niches are trending in B2B SaaS?" natural language interface.

---

## Implementation Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Unified Demand Score | High | Medium | P1 |
| Build Recommendations | High | Medium | P1 |
| Competitive Intelligence | High | High | P1 |
| Testing Coverage | High | Medium | P1 |
| Niche Comparison | Medium | Low | P2 |
| LinkedIn Integration | Medium | Medium | P2 |
| TikTok Creative Center | Medium | Medium | P2 |
| Landing Page Analysis | Medium | High | P2 |
| Historical Trends | Medium | Medium | P2 |
| Slack/Discord | Medium | Low | P2 |
| API Access | Medium | Medium | P2 |
| Ad Templates | Medium | Medium | P3 |
| AI Niche Discovery | High | High | P3 |
| White-Label Enhancement | Low | Medium | P3 |

---

## Quick Wins (< 1 Week Each)

1. **Niche Comparison** - Basic side-by-side view
2. **Slack Webhooks** - Simple alert forwarding
3. **Export Improvements** - Better PDF formatting
4. **Saved Searches** - Bookmark frequent queries
5. **Dashboard Widgets** - Customizable layout

---

## Technical Debt to Address

| Item | Impact | Effort |
|------|--------|--------|
| Add comprehensive error handling | High | Low |
| Implement request caching (Redis/Upstash) | High | Medium |
| Add rate limiting per user | High | Low |
| Improve TypeScript strictness | Medium | Medium |
| Add request logging/monitoring | Medium | Low |
| Optimize database queries | Medium | Medium |
| Add health check endpoints | Low | Low |

---

*Document Owner: DemandRadar Product Team*
