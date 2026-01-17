# UX Teardown: Hookd.ai (Ads Research Platform)

> **Purpose:** Competitive UX analysis to inform DemandRadar feature development.  
> **Date:** January 2026  
> **Source:** Automated screenshot capture of authenticated app flow

---

## 1. Information Architecture

### Primary Navigation (Left Sidebar)

| Section | Sub-sections | Purpose |
|---------|--------------|---------|
| **Discover Ads** | Explore Ads, Swipe File, Brand Spy, Expert Picks | Browse/search ad library |
| **Analyze Ads** | Creative Analyzer, Dashboard | Performance analytics (paid tier) |
| **Create Ads** | Clone Ads, Video Scripts, Brand Assets, Image Ad Templates, Funnel Templates | AI ad generation (paid tier) |
| **Integrations** | Discord | Community + notifications |
| **Success Guide** | Get Started, Our Blog, Features Explained | Onboarding + education |

### Secondary Elements
- **Folders & Boards** — user-created collections
- **Credits indicator** — "40 left" shown in sidebar
- **Chrome Extension CTA** — persistent download prompt
- **Intercom chat widget** — bottom-right
- **Upgrade banner** — persistent bottom banner with CTA

---

## 2. Flow Map: Get Started (Onboarding)

```
┌─────────────────────────────────────────────────────────────┐
│                    /get-started                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌──────────────────────────────┐  │
│  │ Setup Guide         │  │ Video Course Promo Card      │  │
│  │ (Checklist)         │  │ - Thumbnail + play button    │  │
│  │                     │  │ - "$542k creative strategy"  │  │
│  │ ✓ Welcome aboard    │  │ - CTA: "Play video"          │  │
│  │ ○ Product tour (0/7)│  └──────────────────────────────┘  │
│  │   - Filter ads      │                                    │
│  │   - Search ads      │                                    │
│  │   - Favorite search │                                    │
│  │   - Sort ads        │                                    │
│  │   - Ad card         │                                    │
│  │   - Highlight details│                                   │
│  │   - Save ads        │                                    │
│  │ ○ Find top ads      │                                    │
│  │ ○ Install extension │                                    │
│  │ ○ Follow brands     │                                    │
│  └─────────────────────┘                                    │
├─────────────────────────────────────────────────────────────┤
│  Sidebar Guide Accordion:                                   │
│  - Navigation                                               │
│  - Discover (expandable)                                    │
│  - Analyze (expandable)                                     │
│  - Create (expandable)                                      │
└─────────────────────────────────────────────────────────────┘
```

### Onboarding Patterns Observed
1. **Checklist-driven** — visual progress with checkmarks
2. **Expandable sub-tasks** — breaks large tasks into micro-steps
3. **Video content upsell** — premium educational content promoted
4. **In-context guidance** — accordion with section-specific tutorials

---

## 3. Component Inventory

### A. Explore Ads Page

| Component | Description | Interaction |
|-----------|-------------|-------------|
| **Filter Panel** (left) | Country, EU transparency, Performance, Ad format, Status, Niche | Collapsible accordions with checkboxes/selects |
| **Search Bar** | Full-width with "Favorite searches" quick-access | Text input + save functionality |
| **View Toggle** | "Spied Brands only" toggle, Ad view dropdown, Sort dropdown | Toggle + dropdowns |
| **Ad Card** | Brand avatar, name, date range, engagement metrics (likes/comments/shares), video thumbnail with duration, caption preview | Hover: shows action menu |
| **Metrics Pills** | Green/red pills showing engagement counts | Visual status indicators |
| **Filter Tags** | "Best of the Month", "Quiz Funnels", "VSL's", "Advertorials" | Quick-filter chips |

### B. Swipe File Page

| Component | Description |
|-----------|-------------|
| **Tabs** | "My Ads" / "Brands" |
| **Create New Button** | Primary CTA top-right |
| **Empty State** | Illustration + "No ads saved" + "Explore Ads →" CTA |
| **Same Filter Panel** | Reuses Explore filters |

### C. Brand Spy Page

| Component | Description |
|-----------|-------------|
| **Header** | "Brands you spy this month" |
| **Spy New Brand Button** | Primary CTA |
| **Search brands** | Text input |
| **Filters** | Favorites only toggle, Folders dropdown, Sort dropdown, Niche dropdown |
| **Empty State** | "No brands found!" |

### D. Analyze Ads Page (Paid Feature)

| Component | Description |
|-----------|-------------|
| **Sub-nav** | Creative Analyzer, Dashboard |
| **Paywall State** | "This feature is not available in your current plan!" + "Upgrade your plan" button |

### E. Create Ads Page (Paid Feature)

| Component | Description |
|-----------|-------------|
| **Sub-nav** | Clone Ads, Video Scripts, Brand Assets, Image Ad Templates, Funnel Templates |
| **Paywall State** | Same paywall pattern as Analyze |

### F. Integrations Page

| Component | Description |
|-----------|-------------|
| **Discord Card** | Logo, status badge ("Inactive"), member count, "Connect Discord" CTA |
| **Channel List** | #hook-of-the-week, #image-of-the-week, #video-of-the-week, #landing-of-the-week with descriptions |

---

## 4. Copy Patterns (Structure, Not Verbatim)

### Headlines
- **Action-oriented:** "See what X are doing before Y do"
- **Social proof prefix:** "Trusted by N+ [personas]"
- **Benefit-focused subtitles:** "Instantly uncover X, Y, and Z that drive [outcome]"

### Value Props (Checklist Style)
- ✓ No charges during free trial
- ✓ Cancel anytime

### Empty States
- Friendly illustration
- Clear "nothing here yet" message
- Single CTA to primary action

### Paywall Copy
- "This feature is not available in your current plan!"
- Single upgrade CTA button

### Testimonial Pattern
- Avatar image
- Quote with specific numbers ("$340k a day")
- Name + role ("Jose, Ecom Brand Owner")
- Star rating

### Persistent Upsell Banner
- Lightbulb/idea icon
- Value proposition question
- "Book a free call" CTA
- Dismiss X

---

## 5. Interaction Model

### States Observed

| State | Implementation |
|-------|----------------|
| **Loading** | Not captured (likely skeleton loaders) |
| **Empty** | Illustration + message + CTA |
| **Populated** | Card grid with filters |
| **Paywall** | Message + upgrade button (no preview) |
| **Success** | Green checkmark (onboarding) |
| **Pending** | Empty circle (onboarding) |

### Navigation Patterns
- **Persistent sidebar** — always visible, collapsible
- **Section headers** — icon + title + optional collapse
- **Breadcrumb-style tabs** — Ads / Brands tabs in Explore
- **Accordion filters** — expand/collapse filter groups

### Engagement Hooks
- **Credits system** — visible remaining credits
- **Chrome extension** — persistent download CTA
- **Discord community** — integration promotion
- **Video course** — educational content upsell
- **Book a call** — persistent sales CTA

---

## 6. Design System Observations

### Colors
- **Primary:** Blue (#3B82F6-ish)
- **Secondary:** Light blue background panels
- **Success:** Green
- **Destructive/Negative:** Red (for downward metrics)
- **Neutral:** Gray text hierarchy

### Typography
- Clean sans-serif (likely Inter or similar)
- Clear hierarchy: Page title > Section title > Card title > Body

### Spacing
- Generous whitespace
- Card-based layouts with consistent padding
- Sidebar width: ~240px

### Iconography
- Consistent icon set (likely Lucide or similar)
- Icons paired with text labels in nav

---

## 7. Key Takeaways for DemandRadar

### Features to Consider Adapting

1. **Onboarding Checklist**
   - Step-by-step with expandable sub-tasks
   - Visual progress indicators
   - Video content integration

2. **Filter Panel Pattern**
   - Collapsible accordion sections
   - Multi-select with search
   - Quick-filter chips/tags

3. **Card-Based Results**
   - Rich preview (thumbnail, metrics, brand info)
   - Hover actions
   - Save/favorite functionality

4. **Credits/Usage Display**
   - Visible remaining quota
   - Clear upgrade path

5. **Empty States**
   - Helpful illustrations
   - Clear next-action CTAs

6. **Persistent Upsell**
   - Non-intrusive but always present
   - Dismissible

### Differentiators for DemandRadar

| Hookd Focus | DemandRadar Focus |
|-------------|-------------------|
| Ad creative discovery | Market gap analysis |
| Save ads for inspiration | Generate opportunity reports |
| Track competitor ads | Analyze Reddit sentiment + ad mismatch |
| Clone ad creatives | Build-to-profit scoring |
| Single-brand spy | Niche-wide analysis |

---

## 8. Implementation Checklist for DemandRadar

### Phase 1: Core UX Patterns

- [ ] **Sidebar Navigation**
  - Primary sections: Discover, Analyze, Create, Settings
  - Collapsible with icons + labels
  - Active state highlighting
  - Credits/usage indicator

- [ ] **Onboarding Flow** (`/get-started`)
  - Welcome step (auto-complete on first login)
  - Product tour checklist (expandable sub-steps)
  - Video tutorial integration
  - Progress persistence (localStorage or DB)

- [ ] **Filter Panel Component**
  - Accordion sections
  - Checkbox groups with search
  - Range sliders (for scores)
  - Quick-filter chips

- [ ] **Results Card Component**
  - Thumbnail/preview area
  - Title + metadata
  - Score badges (opportunity, confidence)
  - Hover action menu (save, analyze, export)

- [ ] **Empty State Component**
  - Reusable with custom illustration slot
  - Message + CTA props

- [ ] **Paywall/Upgrade Component**
  - Feature name
  - Upgrade message
  - CTA button
  - Optional feature preview

### Phase 2: Page Implementations

- [ ] **Explore Gaps** (≈ Explore Ads)
  - Search bar with saved searches
  - Filter panel (category, score ranges, sentiment)
  - Gap cards grid
  - View toggles (grid/list)

- [ ] **My Reports** (≈ Swipe File)
  - Saved reports list
  - Folders/organization
  - Empty state with CTA to create first report

- [ ] **Run History** (≈ Brand Spy)
  - Past analysis runs
  - Re-run capability
  - Compare runs

- [ ] **Integrations**
  - Slack/Discord notifications
  - API key management
  - Webhook configuration

### Phase 3: Engagement Features

- [ ] **Persistent Upsell Banner**
  - Dismissible (with cookie/localStorage)
  - Contextual messaging based on page

- [ ] **Chrome Extension** (future)
  - Save opportunities while browsing
  - Quick analysis trigger

- [ ] **Success Guide**
  - Feature explainers
  - Best practices content
  - Video tutorials

---

---

## 9. Pricing Model (Captured)

### Tiers

| Plan | Price | Credits | Seats | Key Features |
|------|-------|---------|-------|--------------|
| **Launch** | $19/mo | 40/mo | 1 | Explore Ads, Save Ads, Brand Spy, Ads Transcription, Video Scripts |
| **Grow** (Most Popular) | $59/mo | 200/mo | 3 | All Launch + Clone Ads, Creative Analyzer (1 account) |
| **Scale** | $149/mo | 800/mo | 10 | All Grow + Creative Analyzer (5 accounts) |
| **Enterprise** | Custom | Custom | Custom | Premium support, tailored features |

### Pricing Page Patterns

- **Monthly/Yearly toggle** — 25% savings on yearly
- **"Most Popular" badge** — on mid-tier (Grow)
- **7-day free trial** — all plans, card required
- **Feature comparison** — expandable "Compare to all features"
- **Credits-based model** — usage metering

### Marketing Page Sections (in order)

1. Hero — Pain point headline + value prop
2. Social proof — Tool logos (old way vs new way)
3. Testimonial — Named persona with pain points
4. "You're not alone" empathy section
5. Feature showcase — Discover, Create, Analyze
6. Product screenshots with annotations
7. Persona cards — CMOs, Marketing Specialists, Founders
8. Stats — "+50%", "3x" performance claims
9. **Pricing tiers** — 4-column comparison
10. Key features list
11. FAQ
12. Final CTA

---

## 10. Ad Detail Modal (Captured)

### Components

| Element | Description |
|---------|-------------|
| **Header** | Brand avatar, name, follower count, "Spy brand" button, Save/Share/Copy actions |
| **Media Carousel** | Image/video with navigation arrows, duration badge |
| **Overview Panel** | Ad ID (linkable), Saved date, Platform list, CTA Type, Active Period, Display Format, Categories, Landing page link |
| **Clone Ad CTA** | Primary action button |
| **Transcription** | "Save Ad and Generate Transcription" with credit cost indicator |
| **Caption** | Full ad copy with download media link |

### Interaction Model
- Modal overlay (dark background)
- Close X in top-right
- Keyboard navigable (Esc to close)

---

## Appendix: Screenshots Captured

### Authentication & Onboarding
1. `hookd-login-page` — Sign in form (email/password + Google OAuth)
2. `hookd-get-started-1` — Onboarding checklist with video promo

### Core App Pages
3. `hookd-after-login` — Initial dashboard (Explore Ads)
4. `hookd-explore-ads` — Main ad discovery page with filters
5. `hookd-search-skincare` — Search results view
6. `hookd-brand-spy` — Brand tracking (empty state)
7. `hookd-swipe-file` — Saved ads collection (empty state)
8. `hookd-analyze-ads` — Creative Analyzer (paywall gate)
9. `hookd-create-ads` — Ad creation tools (paywall gate)
10. `hookd-integrations` — Discord integration

### Detail Views
11. `hookd-brand-page` — Brand detail with ad grid
12. `hookd-ad-details-modal` — Full ad detail modal with metadata

### Marketing/Pricing
13. `hookd-pricing` — Pricing page hero
14. `hookd-pricing-2` through `hookd-pricing-8` — Marketing sections
15. `hookd-pricing-tiers` — 4-tier pricing comparison
16. `hookd-pricing-features` — Feature list breakdown

### Additional Pages
17. `hookd-explore-brands` — Brands leaderboard (by total saved ads)
18. `hookd-expert-picks` — Curated collections by experts (Christmas, Black Friday, VSLs, etc.)
