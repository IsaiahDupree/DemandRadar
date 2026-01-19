# PRD: Build Recommendations Engine

> **Status:** Draft  
> **Priority:** High  
> **Estimated Effort:** 2-3 weeks  
> **Created:** January 19, 2026

---

## Problem Statement

Users can see demand signals and scores, but they're left to interpret what to build on their own. The spec defines a **"What to Build Next" algorithm** that generates actionable product recommendations with supporting data. This is the core differentiator that turns data into decisions.

### Current State
- ✅ Demand signals collected
- ✅ Pain points extracted
- ✅ Winning ads identified
- ❌ No automated product idea generation
- ❌ No marketing plan recommendations
- ❌ No build queue UI

---

## Goals

1. **Actionable Output:** Generate specific product ideas, not just data
2. **Decision Support:** Provide reasoning and supporting evidence
3. **Marketing Ready:** Include hooks, angles, and channel recommendations
4. **Prioritization:** Rank recommendations by opportunity score

### Success Metrics
| Metric | Target |
|--------|--------|
| Recommendations generated per run | 3-5 quality ideas |
| User action rate | 30% click "Start Project" or save |
| Time to first action | <5 min from run completion |
| NPS on recommendations | >40 |

---

## User Stories

1. **As a founder**, I want to see specific product ideas based on market demand, so I can decide what to build next.

2. **As a solo builder**, I want to see build complexity estimates, so I can choose projects matching my skills/resources.

3. **As a marketer**, I want pre-written hooks and angles based on winning ads, so I can start campaigns immediately.

4. **As an agency**, I want to save recommendations to a queue, so I can present options to clients.

---

## Technical Specification

### Database Schema

```sql
-- Build recommendations table
CREATE TABLE build_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES runs(id),
  niche_id UUID REFERENCES niches(id),
  user_id UUID REFERENCES profiles(id),
  
  -- What to build
  product_idea TEXT NOT NULL,
  product_type VARCHAR(50), -- 'saas', 'tool', 'api', 'marketplace', 'mobile_app', 'chrome_extension'
  one_liner TEXT,
  target_audience TEXT,
  
  -- Why to build it
  pain_points JSONB,        -- Array of pain points with sources
  competitor_gaps JSONB,    -- Gaps in existing solutions
  search_queries JSONB,     -- High-intent keywords
  
  -- How to market it
  recommended_hooks JSONB,  -- Ad hook templates
  recommended_channels JSONB, -- Best marketing channels
  sample_ad_copy JSONB,     -- Generated ad variations
  landing_page_angle TEXT,
  
  -- Feasibility
  build_complexity VARCHAR(20), -- 'weekend', 'month', 'quarter'
  tech_stack_suggestion JSONB,
  estimated_time_to_mvp VARCHAR(50),
  estimated_cac_range VARCHAR(50),
  
  -- Confidence
  confidence_score DECIMAL(5,2),
  reasoning TEXT,
  supporting_signals INT DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'new', -- 'new', 'saved', 'in_progress', 'completed', 'dismissed'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recommendations_user ON build_recommendations(user_id);
CREATE INDEX idx_recommendations_niche ON build_recommendations(niche_id);
CREATE INDEX idx_recommendations_status ON build_recommendations(status);
CREATE INDEX idx_recommendations_confidence ON build_recommendations(confidence_score DESC);
```

### API Endpoints

```typescript
// Generate recommendations for a niche
POST /api/recommendations/generate
Body: {
  niche: string,
  run_id?: string,
  count?: number // default 3
}
Response: {
  recommendations: Recommendation[],
  generated_at: string
}

// Get user's recommendation queue
GET /api/recommendations?status=new&limit=10
Response: {
  recommendations: Recommendation[],
  total: number
}

// Update recommendation status
PATCH /api/recommendations/{id}
Body: {
  status: 'saved' | 'in_progress' | 'completed' | 'dismissed'
}

// Get single recommendation with full details
GET /api/recommendations/{id}
Response: Recommendation
```

### Recommendation Generation

```typescript
// src/lib/recommendations/generator.ts

interface RecommendationInput {
  niche: string;
  painPoints: PainPoint[];
  winningAds: WinningAd[];
  searchQueries: SearchQuery[];
  competitorGaps: Gap[];
  demandScore: number;
}

interface Recommendation {
  product_idea: string;
  product_type: ProductType;
  one_liner: string;
  target_audience: string;
  pain_points: PainPoint[];
  recommended_hooks: string[];
  recommended_channels: Channel[];
  sample_ad_copy: AdCopy[];
  build_complexity: 'weekend' | 'month' | 'quarter';
  tech_stack_suggestion: string[];
  confidence_score: number;
  reasoning: string;
}

export async function generateRecommendations(
  input: RecommendationInput,
  count: number = 3
): Promise<Recommendation[]> {
  
  // Build context for LLM
  const context = buildRecommendationContext(input);
  
  // Generate with OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: RECOMMENDATION_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: context
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7
  });
  
  const recommendations = parseRecommendations(response);
  
  // Enrich with marketing data
  return Promise.all(
    recommendations.map(rec => enrichWithMarketing(rec, input.winningAds))
  );
}

const RECOMMENDATION_SYSTEM_PROMPT = `
You are a product strategist helping founders identify what to build next.

Given market signals (pain points, winning ads, search queries, competitor gaps), generate specific, actionable product recommendations.

For each recommendation, provide:
1. **Product Idea**: Specific, buildable concept (not vague)
2. **One-liner**: Compelling tagline
3. **Target Audience**: Specific persona
4. **Why Now**: What signals indicate this is timely
5. **Build Complexity**: Weekend project / 1 month / 1 quarter
6. **Recommended Hooks**: 3 ad hooks based on winning ads
7. **Channels**: Best 3 marketing channels for this product
8. **Confidence Score**: 0-100 based on signal strength

Output JSON format:
{
  "recommendations": [
    {
      "product_idea": "...",
      "product_type": "saas|tool|api|marketplace|mobile_app|chrome_extension",
      "one_liner": "...",
      "target_audience": "...",
      "why_now": "...",
      "build_complexity": "weekend|month|quarter",
      "tech_stack": ["..."],
      "recommended_hooks": ["...", "...", "..."],
      "recommended_channels": ["...", "...", "..."],
      "sample_ad_copy": {
        "headline": "...",
        "body": "...",
        "cta": "..."
      },
      "confidence_score": 85,
      "reasoning": "..."
    }
  ]
}
`;

function buildRecommendationContext(input: RecommendationInput): string {
  return `
## Niche: ${input.niche}
## Demand Score: ${input.demandScore}/100

## Top Pain Points from Reddit:
${input.painPoints.slice(0, 5).map(p => `- "${p.text}" (${p.upvotes} upvotes)`).join('\n')}

## Winning Ads Running 30+ Days:
${input.winningAds.slice(0, 5).map(a => `- ${a.headline}: "${a.hook}" (${a.runDays} days)`).join('\n')}

## High-Intent Search Queries:
${input.searchQueries.slice(0, 10).map(q => `- "${q.query}" (${q.volume}/mo)`).join('\n')}

## Competitor Gaps Identified:
${input.competitorGaps.slice(0, 5).map(g => `- ${g.competitor}: ${g.gap}`).join('\n')}

Generate 3 specific product recommendations based on this data.
`;
}
```

### Hook Generation from Winning Ads

```typescript
// src/lib/recommendations/hooks.ts

export async function generateHooksFromAds(
  winningAds: WinningAd[],
  productIdea: string
): Promise<string[]> {
  
  // Extract patterns from winning ads
  const hookPatterns = extractHookPatterns(winningAds);
  
  // Generate adapted hooks for the new product
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Generate 5 ad hooks for a new product, inspired by these winning ad patterns.
        
Winning ad hooks:
${hookPatterns.map(h => `- ${h.type}: "${h.example}"`).join('\n')}

Rules:
- Adapt the pattern, don't copy
- Make specific to the new product
- Include problem-agitation and benefit-led hooks
- Keep under 10 words each`
      },
      {
        role: 'user',
        content: `Product: ${productIdea}`
      }
    ]
  });
  
  return parseHooks(response);
}

function extractHookPatterns(ads: WinningAd[]): HookPattern[] {
  // Categorize hooks by type
  return ads.map(ad => ({
    type: classifyHookType(ad.hook),
    example: ad.hook,
    performance: ad.runDays
  })).sort((a, b) => b.performance - a.performance);
}

type HookType = 
  | 'question'      // "Struggling with X?"
  | 'statistic'     // "87% of founders..."
  | 'problem'       // "X is broken"
  | 'benefit'       // "Get Y in minutes"
  | 'social_proof'  // "10,000 teams use..."
  | 'comparison';   // "Unlike X, we..."
```

---

## UI Requirements

### Build Queue Page (`/dashboard/build-queue`)

```
┌─────────────────────────────────────────────────────────────┐
│ 🏗️ Build Queue                                    [Generate] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📱 Chrome Extension for [Niche]           🎯 87% match  │ │
│ │ "One-click competitor tracking for busy founders"       │ │
│ │                                                         │ │
│ │ 🔨 Weekend Project  │  💰 Low CAC  │  📈 Rising demand │ │
│ │                                                         │ │
│ │ [Start Building] [Save] [View Details] [Dismiss]        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🖥️ SaaS Dashboard for [Niche]             🎯 82% match  │ │
│ │ "Track all your metrics in one beautiful dashboard"     │ │
│ │                                                         │ │
│ │ 🔨 1 Month  │  💰 Medium CAC  │  📈 Stable demand       │ │
│ │                                                         │ │
│ │ [Start Building] [Save] [View Details] [Dismiss]        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Recommendation Detail Modal

```
┌───────────────────────────────────────────────────────────────┐
│ Chrome Extension for Competitor Tracking                   ✕ │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ ## The Idea                                                   │
│ A browser extension that automatically tracks competitor      │
│ pricing, feature changes, and new content.                    │
│                                                               │
│ ## Why Now                                                    │
│ - 12 Reddit posts asking for this in last 30 days             │
│ - No dominant player (top competitor has 2.1⭐ rating)        │
│ - Search volume for "competitor tracker" up 45%               │
│                                                               │
│ ## Target Audience                                            │
│ Solo founders and small marketing teams who manually track    │
│ 5-10 competitors weekly                                       │
│                                                               │
│ ## Build Estimate                                             │
│ 🔨 Weekend Project | Tech: React, Chrome APIs, Supabase      │
│                                                               │
│ ## Recommended Hooks                                          │
│ 1. "Stop stalking competitors manually"                       │
│ 2. "Know when competitors change pricing—instantly"           │
│ 3. "Your competitors are watching you. Are you watching them?"│
│                                                               │
│ ## Sample Ad Copy                                             │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ Headline: Never miss a competitor move again              │ │
│ │                                                           │ │
│ │ Body: Get instant alerts when competitors change          │ │
│ │ pricing, launch features, or publish content. One-click   │ │
│ │ install, works in the background.                         │ │
│ │                                                           │ │
│ │ CTA: Install Free Extension →                             │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                               │
│ ## Best Channels                                              │
│ 1. 🔍 Google Ads (high intent: "competitor tracking tool")   │
│ 2. 🐦 Twitter/X (indie hacker audience)                      │
│ 3. 📺 YouTube (tutorial content)                             │
│                                                               │
│ [🚀 Start Building] [💾 Save to Queue] [📤 Export Brief]     │
└───────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Core Generation (Week 1)
- [ ] Create `build_recommendations` table migration
- [ ] Implement `generateRecommendations()` with OpenAI
- [ ] Create `/api/recommendations/generate` endpoint
- [ ] Add recommendations to run completion flow

### Phase 2: Marketing Enrichment (Week 1-2)
- [ ] Implement `generateHooksFromAds()`
- [ ] Add channel recommendation logic
- [ ] Generate sample ad copy
- [ ] Add tech stack suggestions

### Phase 3: Build Queue UI (Week 2)
- [ ] Create `/dashboard/build-queue` page
- [ ] Build recommendation cards
- [ ] Add detail modal
- [ ] Implement status management (save, start, dismiss)

### Phase 4: Export & Actions (Week 2-3)
- [ ] Export recommendation as brief (PDF/Markdown)
- [ ] "Start Building" flow (create project template)
- [ ] Integration with saved ideas feature
- [ ] Email digest of new recommendations

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| OpenAI GPT-4o | ✅ Active | For idea generation |
| Unified demand score | ⏳ PRD | Feeds into confidence |
| Winning ads data | ✅ Exists | For hook generation |
| Pain points data | ✅ Exists | For context |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Low-quality AI outputs | Human review, confidence thresholds |
| Generic recommendations | More specific prompts, niche context |
| Slow generation | Background jobs, streaming |
| User overwhelm | Limit to 3-5 recommendations |

---

## Future Enhancements (v2)

- User feedback loop to improve recommendations
- Collaborative recommendations for teams
- Integration with no-code builders (Bubble, Webflow)
- Automatic landing page generation
- Revenue/pricing recommendations

---

*Document Owner: DemandRadar Product Team*
