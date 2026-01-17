# SaaS Ad Intelligence Product Specification

> A system to identify winning software ads, spot emerging trends, and guide ad strategy for DemandRadar

---

## Problem Statement

1. **For our own ads:** We don't know what ad strategies work best for software/SaaS products
2. **For trend spotting:** We can't easily identify emerging software niches where heavy ad spend indicates market demand
3. **For competitive intelligence:** We lack visibility into what messaging and creative strategies competitors use

---

## Winning Ad Identification Strategies

### Strategy 1: Run Time Analysis
**Principle:** Ads that run for a long time are profitable (advertisers don't pay for losing ads)

| Run Time | Signal |
|----------|--------|
| 1-7 days | Testing phase |
| 7-30 days | Showing promise |
| 30-90 days | Proven winner |
| 90+ days | Evergreen performer |

**Action:** Filter for ads running 30+ days in software/SaaS category

### Strategy 2: Performance Metrics
Look for these signals in ad libraries:
- **High engagement** (likes, comments, shares)
- **Multiple ad variations** (indicates scaling)
- **Consistent messaging** across variants
- **Landing page alignment** with ad promise

### Strategy 3: Brand Velocity Tracking
- Monitor how fast a brand is publishing new ads
- High velocity = active testing/scaling phase
- Track ad spend estimates where available

### Strategy 4: Creative Pattern Recognition
Identify recurring patterns in winning ads:
- **Hook types** that stop the scroll
- **Value propositions** that resonate
- **Social proof formats** that convert
- **CTA variations** that drive action

---

## Software/SaaS Ad Categories to Monitor

### By Product Type
| Category | Examples | Ad Characteristics |
|----------|----------|-------------------|
| **Productivity** | Notion, Asana, Monday | Feature demos, workflow videos |
| **Design Tools** | Canva, Figma | Before/after, speed demos |
| **AI Tools** | ChatGPT wrappers, AI writers | Problem→solution, magic moments |
| **Marketing Tools** | Ad spy tools, email tools | ROI claims, case studies |
| **Finance/Accounting** | QuickBooks, FreshBooks | Pain point focus, time savings |
| **Developer Tools** | APIs, hosting, databases | Technical demos, developer testimonials |
| **E-commerce Tools** | Shopify apps, dropship tools | Revenue claims, success stories |

### By Ad Format
| Format | Best For | Metrics to Track |
|--------|----------|------------------|
| **UGC Video** | Trust building | View duration, saves |
| **Demo/Tutorial** | Feature showcase | Click-through |
| **Testimonial** | Social proof | Engagement rate |
| **Problem-Agitation-Solution** | Pain point targeting | Conversion |
| **Comparison** | Competitive positioning | Shares |

---

## Trend Spotting System

### Early Trend Indicators
1. **New brand velocity** - Many new brands entering a niche
2. **Ad spend acceleration** - Existing brands scaling budgets
3. **Creative innovation** - New ad formats emerging
4. **Messaging shifts** - New pain points being addressed

### Trend Detection Algorithm (Conceptual)
```
For each niche category:
  - Track # of active advertisers over time
  - Track average ad run time
  - Track creative diversity (unique concepts)
  - Calculate trend score = (new_advertisers * 0.4) + 
                           (spend_growth * 0.3) + 
                           (creative_diversity * 0.3)
  - Alert when trend_score > threshold
```

### Actionable Trend Categories
| Trend Type | Signal | Opportunity |
|------------|--------|-------------|
| **Emerging** | New advertisers, short run times | Build fast, first-mover advantage |
| **Growing** | Increasing spend, longer run times | Enter with differentiation |
| **Mature** | Stable advertisers, evergreen ads | Compete on features/price |
| **Declining** | Decreasing spend, fewer new ads | Avoid or pivot |

---

## Product Features for DemandRadar

### Core Features

#### 1. Ad Discovery Engine
- Search 68M+ ads by keyword, niche, brand
- Filter by run time, performance, format
- Save to swipe file for inspiration

#### 2. SaaS Ad Feed
- Curated feed of software/SaaS ads only
- Sorted by performance signals
- Daily/weekly digest of new winners

#### 3. Trend Radar
- Dashboard showing emerging niches
- Alert system for new opportunities
- Historical trend data

#### 4. Competitive Intelligence
- Track specific competitor brands
- Monitor their ad creative changes
- Receive alerts on new campaigns

#### 5. Ad Brief Generator
- Input: Niche/product type
- Output: Recommended ad strategy based on what's working
- Include: Hook templates, value props, CTA recommendations

### Data Sources
| Source | Data Type | Update Frequency |
|--------|-----------|------------------|
| Meta Ad Library | Facebook/Instagram ads | Real-time |
| TikTok Creative Center | TikTok ads | Daily |
| Google Ads Transparency | Search/Display ads | Weekly |
| LinkedIn Ad Library | B2B ads | Weekly |

---

## Immediate Actions for DemandRadar Ads

### Based on Hookd Research

#### Winning SaaS Ad Formulas

**Formula 1: Problem-Demo-CTA**
```
Hook: "Struggling with [pain point]?"
Demo: 15-30 sec product walkthrough
CTA: "Try free for 14 days"
```

**Formula 2: Before/After**
```
Hook: "This is how [task] used to look..."
Before: Manual/painful process
After: Streamlined with product
CTA: "See the difference"
```

**Formula 3: Social Proof Lead**
```
Hook: "[X] companies switched this month"
Body: Customer testimonial clips
CTA: "Join them"
```

**Formula 4: Feature Spotlight**
```
Hook: "Did you know you can [benefit]?"
Demo: Single feature deep-dive
CTA: "Unlock this feature"
```

### Recommended Ad Strategy for DemandRadar

1. **Create UGC-style demos** showing gap analysis in action
2. **Lead with pain points**: "Still manually tracking market gaps?"
3. **Show real results**: Revenue numbers, time saved
4. **Test multiple hooks**: Question, stat, problem statement
5. **Use competitor comparison**: "Unlike [tool], we [differentiator]"

---

## Implementation Roadmap

### Phase 1: Manual Research (Now)
- [ ] Daily review of Hookd for SaaS ads
- [ ] Save winning ads to swipe file
- [ ] Document patterns in spreadsheet

### Phase 2: Automated Collection (Week 2-4)
- [ ] Build Meta Ad Library API integration
- [ ] Create database for ad tracking
- [ ] Set up daily scraping jobs

### Phase 3: Intelligence Layer (Month 2)
- [ ] Build trend detection algorithm
- [ ] Create alert system
- [ ] Build recommendation engine

### Phase 4: Self-Service (Month 3)
- [ ] User-facing dashboard
- [ ] Custom tracking lists
- [ ] API access for power users

---

## Related Documentation

- [Hookd Screenshots](screenshots/hookd/README.md)
- [Video Ads Course Summary](tutorials/VIDEO_ADS_COURSE_SUMMARY.md)
- [Complete Site Spec](HOOKD_COMPLETE_SITE_SPEC.md)

---

*Created January 17, 2026 - DemandRadar Ad Intelligence Initiative*
