# Hookd.ai Complete Site Specification

> **Purpose:** Comprehensive documentation of gethookd.ai for competitive analysis and DemandRadar feature planning  
> **Captured:** January 2026  
> **Method:** Automated Puppeteer browser capture with authenticated session

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Information Architecture](#2-information-architecture)
3. [Authentication Flow](#3-authentication-flow)
4. [Core Features](#4-core-features)
5. [Pricing & Monetization](#5-pricing--monetization)
6. [UI Components](#6-ui-components)
7. [UX Patterns](#7-ux-patterns)
8. [Marketing Site](#8-marketing-site)
9. [Implementation Notes for DemandRadar](#9-implementation-notes-for-demandradar)
10. [Screenshot Inventory](#10-screenshot-inventory)

---

## 1. Product Overview

### What is Hookd?

**Tagline:** "Stop wasting ad spend. Start scaling profitably."

**Core Value Prop:** All-in-one AI creative tool to spy, swipe, and create highly profitable ads from scratch - in minutes.

### Target Users
- CMOs
- Marketing Specialists  
- Founders / eCommerce brand owners

### Key Metrics (from marketing)
- 68+ million ads in library
- 3,000+ brand owners & agencies
- Claims: "+50%" performance improvement, "3.5x ROAS"

---

## 2. Information Architecture

### Primary Navigation (Sidebar)

```
┌─────────────────────────────────────┐
│ 🔗 gethookd (logo)                  │
├─────────────────────────────────────┤
│ ⚡ Discover Ads                      │
│    ├── Explore Ads                  │
│    ├── Swipe File                   │
│    ├── Brand Spy                    │
│    └── Expert Picks                 │
├─────────────────────────────────────┤
│ 📊 Analyze Ads                      │
│    ├── Creative Analyzer            │
│    └── Dashboard                    │
├─────────────────────────────────────┤
│ ✨ Create Ads                       │
│    ├── Clone Ads                    │
│    ├── Video Scripts                │
│    ├── Brand Assets                 │
│    ├── Image Ad Templates           │
│    └── Funnel Templates             │
├─────────────────────────────────────┤
│ 🔗 Integrations                     │
│    └── Discord                      │
├─────────────────────────────────────┤
│ 📋 [Credits: 40 left]               │
├─────────────────────────────────────┤
│ 🎯 Success Guide                    │
│    ├── Get Started                  │
│    ├── Our Blog                     │
│    └── Features Explained           │
├─────────────────────────────────────┤
│ 📁 Folders & Boards                 │
│    └── Default Folder               │
├─────────────────────────────────────┤
│ 🔌 Chrome Extension CTA             │
└─────────────────────────────────────┘
```

### URL Structure

| Route | Page | Access |
|-------|------|--------|
| `/explore` | Explore Ads (Ads tab) | All plans |
| `/explore` (Brands tab) | Brands leaderboard | All plans |
| `/swipe-file` | Saved ads collection | All plans |
| `/brand-spy` | Brand tracking | All plans |
| `/expert-picks` | Curated collections | All plans |
| `/analyze` | Creative Analyzer | Paid only |
| `/create` | Clone Ads | Paid only |
| `/video-scripts` | Video Scripts | All plans |
| `/brand-assets` | Brand Assets | Paid only |
| `/image-templates` | Image Ad Templates | Paid only |
| `/funnel-templates` | Funnel Templates | Paid only |
| `/integrations` | Discord integration | All plans |
| `/get-started` | Onboarding guide | All plans |
| `/brands/[id]` | Brand detail page | All plans |

---

## 3. Authentication Flow

### Login Page Components

| Element | Description |
|---------|-------------|
| **Google OAuth** | "Sign in with Google" button (primary) |
| **Email/Password** | Traditional form fields |
| **Forgot Password** | Link to reset flow |
| **Sign Up Link** | "Don't have an account? Sign up" |

### Login Form Fields
- Email input (placeholder: "Your email")
- Password input (placeholder: "Password")
- Submit button: "Sign in"

### Post-Login Redirect
- New users → `/get-started` (onboarding)
- Returning users → `/explore` (main dashboard)

---

## 4. Core Features

### 4.1 Explore Ads

**Purpose:** Discover and search 68M+ ads from Facebook/Instagram

#### Filter Panel (Left Sidebar)

| Filter | Type | Options |
|--------|------|---------|
| **Country** | Multi-select with search | 200+ countries |
| **EU Transparency** | Toggle + dropdowns | Gender, Age, Ad reach |
| **Performance** | Accordion | Winning, Scaling, Testing, etc. |
| **Limit ads per brand** | Accordion (NEW badge) | Limit results |
| **Ad format** | Accordion | Image, Video, Carousel |
| **Static ad style** | Accordion | Style categories |
| **Status** | Accordion | Active, Inactive |
| **Niche** | Accordion | Industry categories |
| **Run time** | Accordion | Duration filters |

#### Quick Filter Chips
- Best of the Month
- Quiz Funnels
- VSL's
- Advertorials

#### Results Area

| Element | Description |
|---------|-------------|
| **Search bar** | Full-width with "Favorite searches" |
| **Total count** | "68,079,391 total ads" |
| **View toggles** | "Spied Brands only", Ad view dropdown, Sort dropdown |
| **Ad cards** | Grid of ad previews |

#### Ad Card Components
- Brand avatar + name
- Date range (e.g., "Jan 16, 2026 - Present")
- Duration badge (e.g., "1d")
- Engagement metrics: 👍 likes, 💬 comments, ⬇️ saves
- Performance indicator (Low/Medium/High with color)
- Video thumbnail with play button + duration
- Ad caption preview
- Landing page URL
- "Shop Now" CTA indicator

### 4.2 Brands Tab

**Purpose:** Leaderboard of brands by saved ads

| Column | Description |
|--------|-------------|
| Brand | Avatar + name |
| Total Saved Ads | Number (e.g., 277,741) |

Top brands shown:
1. Protectivei (277,741)
2. Coursiv (207,870)
3. Liven: Self-Discovery Community (182,501)
4. Structuref.com (171,726)
5. Tori Repa (159,936)

### 4.3 Swipe File

**Purpose:** Personal collection of saved ads

#### Tabs
- My Ads
- Brands

#### Features
- Create new collection button
- Same filter panel as Explore
- Empty state: "No ads saved! Explore ads and brands to save inspiration here."

### 4.4 Brand Spy

**Purpose:** Track competitor brands over time

#### Features
- "Brands you spy this month" header
- "Spy new brand" CTA button
- Search brands input
- Filters: Favorites only, All folders, Sort by, Niche
- Empty state: "No brands found!"

### 4.5 Expert Picks

**Purpose:** Curated ad collections by experts

#### Table Columns
- Name (with thumbnail)
- Ads count
- Expert (avatar + name)
- Last update
- Copy count
- Actions (Copy button)

#### Example Collections
| Name | Ads | Expert | Updated |
|------|-----|--------|---------|
| Christmas Swipe File | 79 | Alex Fedotoff | Dec 4, 2025 |
| Black Friday Swipe File | 124 | Alex Fedotoff | Nov 11, 2025 |
| VSLs | 6 | mark studer | Mar 13, 2025 |
| Landing Pages | 2 | Jacobo Uribe Gonzalez | Apr 6, 2024 |
| Automotive | 87 | Jacobo Uribe Gonzalez | Apr 11, 2024 |
| Food & Beverage | 8 | Jacobo Uribe Gonzalez | Apr 5, 2024 |
| Toys & Games | 158 | Jacobo Uribe Gonzalez | Apr 11, 2024 |

### 4.6 Analyze Ads (Paid Feature)

**Sub-sections:**
- Creative Analyzer
- Dashboard

#### Creative Analyzer Intro Modal (First-Visit Only)

**Title:** "Introducing Creative Analyzer 🚀"

**Body Copy:**
> Connect your Meta Business Account and unlock AI-powered insights on your ad creatives. See what's working, what's wasting budget, and how to improve your ads instantly. Instantly track performance metrics like ROI, clicks, and CPA - and get smart suggestions to optimize your ads. No more guesswork, just data-driven creative decisions.

**CTAs:**
- "Got it" (dismiss)
- "Go to Creative Analyzer" (navigate)

**Trigger:** Appears as overlay on first app visit, positioned over Explore page

**Paywall (after modal dismissed):** "This feature is not available in your current plan!" + "Upgrade your plan" button

### 4.7 Create Ads (Paid Feature)

#### Clone Ads
- **Tagline:** "Generate high-performing AI variations in seconds"
- **Access:** Paid only

#### Video Scripts
- **Tagline:** "Turn Ad Inspiration Into Actionable Campaign Plans"
- **Access:** All plans (empty state for new users)
- Search bar + Create button
- Empty state: "No Video Scripts created!"

#### Brand Assets
- **Tabs:** Brand Profiles | Brand Products
- **Tagline:** "Product can be later used to generate AI Images"
- **Access:** Paid only

#### Image Ad Templates
- **Tagline:** "Ready-to-use ad templates for quick, high-impact creatives"
- **Access:** Paid only

#### Funnel Templates
- **Tagline:** "Pick, customize, and launch high-converting landing funnel pages in minutes."
- **Access:** Paid only

### 4.8 Integrations

#### Discord
- Status: "Inactive" badge
- Member count: "Join 250+ marketers already inside"
- CTA: "Connect Discord"

**Discord Channels:**
| Channel | Purpose |
|---------|---------|
| #hook-of-the-week | Steal proven ad hooks |
| #image-of-the-week | See top-performing visuals |
| #video-of-the-week | Watch winning creatives |
| #landing-of-the-week | Learn from high-converting pages |

### 4.9 Success Guide / Onboarding

#### Get Started Page Layout
```
┌──────────────────────────────────────────────────────────┐
│ Setup Guide                │ Video Course Promo         │
│ ────────────────────────   │ ┌─────────────────────┐    │
│ ✓ Welcome aboard!          │ │ Full video ads      │    │
│ ○ Start your product tour  │ │ course ($542k       │    │
│   (0/7)                    │ │ creative strategy)  │    │
│   - Filter and find ads    │ │ [Play video]        │    │
│   - Search and find ads    │ └─────────────────────┘    │
│   - Favorite searches      │                            │
│   - Sort and find ads      │                            │
│   - Ad card                │                            │
│   - Highlight key details  │                            │
│   - Learn how to save ads  │                            │
│ ○ Find top-performing ads  │                            │
│ ○ Install Chrome Extension │                            │
│ ○ Keep up with brands      │                            │
└──────────────────────────────────────────────────────────┘
```

#### Sidebar Guide Accordion
- Navigation
- Discover (expandable)
- Analyze (expandable)
- Create (expandable)

---

## 5. Pricing & Monetization

### Pricing Tiers

| Plan | Price | Credits/mo | Seats | Key Unlocks |
|------|-------|------------|-------|-------------|
| **Launch** | $19/mo | 40 | 1 | Explore, Save, Brand Spy, Transcription, Video Scripts |
| **Grow** ⭐ | $59/mo | 200 | 3 | + Clone Ads, Creative Analyzer (1 account) |
| **Scale** | $149/mo | 800 | 10 | + Creative Analyzer (5 accounts) |
| **Enterprise** | Custom | Custom | Custom | Premium support, tailored features |

### Billing Options
- Monthly (default)
- Yearly (25% savings)

### Free Trial
- 7 days
- Card verification required
- All features accessible

### Credits System
- Credits consumed for AI features (transcription, cloning, etc.)
- Visible in sidebar: "40 left"
- Resets monthly

### Feature Availability Matrix

| Feature | Launch | Grow | Scale | Enterprise |
|---------|--------|------|-------|------------|
| Explore Ads | ✓ | ✓ | ✓ | ✓ |
| Save Ads | ✓ | ✓ | ✓ | ✓ |
| Brand Spy | ✓ | ✓ | ✓ | ✓ |
| Ads Transcription | ✓ | ✓ | ✓ | ✓ |
| Video Scripts | ✓ | ✓ | ✓ | ✓ |
| Clone Ads | ✗ | ✓ | ✓ | ✓ |
| Creative Analyzer | ✗ | 1 acct | 5 accts | Custom |
| Brand Assets | ✗ | ✓ | ✓ | ✓ |
| Image Templates | ✗ | ✓ | ✓ | ✓ |
| Funnel Templates | ✗ | ✓ | ✓ | ✓ |

---

## 6. UI Components

### 6.1 Ad Detail Modal

**Trigger:** Click on ad card

#### Layout
```
┌─────────────────────────────────────────────────────────┐
│ [Avatar] Brand Name  ⬇️2777  [Spy brand] [Save ▼] [Share] [Copy] │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────┐  │ Overview                        │
│ │                 │  │ ─────────────────────────────── │
│ │  [Ad Creative]  │  │ Ad ID: 903998575...  [link]     │
│ │                 │  │ Saved: Jan 17, 2026             │
│ │  [◀] [▶]        │  │ Platform: FB, IG, AUDIENCE...   │
│ │                 │  │ CTA Type: SHOP_NOW              │
│ │  0:29           │  │ Active Period: 1 days           │
│ └─────────────────┘  │ Display Format: IMAGE           │
│                      │ Categories: Health/beauty       │
│ ⬇️ Download media    │ Landing page: [link]            │
│                      ├─────────────────────────────────│
│ "Ad caption text..." │ Clone Ad                        │
│                      │ [Clone Ad] button               │
│                      ├─────────────────────────────────│
│                      │ Transcription                   │
│                      │ [Save Ad and Generate...] 🎫1   │
└─────────────────────────────────────────────────────────┘
```

#### Modal Components
| Element | Description |
|---------|-------------|
| Header | Brand info, follower count, action buttons |
| Media Carousel | Image/video with navigation |
| Overview Panel | Metadata (ID, dates, platforms, CTA, categories) |
| Clone Ad CTA | Primary action for paid users |
| Transcription | AI-powered with credit cost indicator |
| Caption | Full ad copy text |
| Download | Media download option |

### 6.2 Filter Accordion

```
┌─────────────────────────┐
│ Filter Name         [▼] │
├─────────────────────────┤
│ ☐ Option 1              │
│ ☐ Option 2              │
│ ☐ Option 3              │
│ [Search...]             │
└─────────────────────────┘
```

### 6.3 Ad Card

```
┌─────────────────────────────────┐
│ [👤] Brand Name                 │
│ 🟢 Jan 16, 2026 - Present  1d   │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │      [Ad Creative]          │ │
│ │                             │ │
│ │  [▶]              0:29      │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ ✨ Ad caption preview...        │
├─────────────────────────────────┤
│ 👍 2  💬 2  ⬇️ 572  ⭐⭐⭐⭐⭐   │
└─────────────────────────────────┘
```

### 6.4 Paywall Gate

```
┌─────────────────────────────────┐
│                                 │
│   This feature is not available │
│   in your current plan!         │
│                                 │
│   [Upgrade your plan]           │
│                                 │
└─────────────────────────────────┘
```

### 6.5 Empty State

```
┌─────────────────────────────────┐
│                                 │
│       [Illustration]            │
│                                 │
│     No [items] created!         │
│                                 │
│   [Primary CTA →]               │
│                                 │
└─────────────────────────────────┘
```

### 6.6 Persistent Upsell Banner

```
┌─────────────────────────────────────────────────────────────┐
│ 💡 Want us to make a 8-fig product research...? [Book call] ✕│
└─────────────────────────────────────────────────────────────┘
```

---

## 7. UX Patterns

### Navigation
- **Persistent sidebar** - always visible, icon + label
- **Nested sections** - collapsible with chevron
- **Active state** - highlighted background
- **Credits visibility** - shown in sidebar

### Loading States
- Skeleton loaders for cards
- Spinner for actions

### Empty States
- Illustration + message + CTA
- Contextual to feature

### Error States
- Not captured (assume toast notifications)

### Paywalls
- Clean gate with single CTA
- No partial content preview
- Feature name + upgrade message

### Engagement Hooks
1. **Credits counter** in sidebar
2. **Chrome extension CTA** persistent
3. **Discord community** integration
4. **Video course** upsell in onboarding
5. **"Book a call"** banner persistent
6. **Intercom chat** widget

### Onboarding
- Checklist-driven with expandable sub-tasks
- Progress persistence
- Video content integration
- Skip option implied

---

## 8. Marketing Site

### Page Structure (gethookd.ai/pricing)

1. **Hero**
   - Headline: "Stop wasting ad spend. Start scaling profitably."
   - Subheadline: "Your all-in-one AI creative tool..."
   - CTA: "Start 7-day free trial"
   - Social proof: Tool logos (old way)
   - ROAS indicator: "3.5x"

2. **Pain Points Section**
   - Testimonial from "Hector Lewis, Marketing Lead"
   - Pain point bullets in speech bubble style

3. **Empathy Section**
   - "You're not alone! 😉"
   - CTA: "See How It Works"

4. **Value Props**
   - "Unlock profitability & predictable growth"
   - Feature descriptions

5. **Product Screenshots**
   - Annotated UI images
   - Feature callouts

6. **Persona Cards**
   - CMOs
   - Marketing Specialists
   - Founders

7. **Stats Section**
   - "+50%" improvement claim
   - "3x" performance claim

8. **Pricing Tiers**
   - 4-column comparison
   - Monthly/Yearly toggle
   - "Most Popular" badge on Grow

9. **Key Features List**
   - 21 Million+ Ads Library
   - 10X Faster Ad Scripts With AI
   - Spy On Top Competitors
   - 2 Team Member Access
   - Exclusive Gethookd Skool
   - Your Own Personal Swipe File

10. **FAQ** (not captured)

11. **Final CTA** (not captured)

---

## 9. Implementation Notes for DemandRadar

### Features to Adapt

| Hookd Feature | DemandRadar Equivalent |
|---------------|------------------------|
| Explore Ads | Explore Gaps |
| Brand Spy | Competitor Tracker |
| Swipe File | Saved Reports |
| Expert Picks | Curated Gap Collections |
| Clone Ads | N/A (different product) |
| Video Scripts | Report Templates |
| Creative Analyzer | Gap Analyzer |

### Component Library Needs

1. **Filter Panel** - Accordion sections, multi-select, range sliders
2. **Results Card** - Gap card with scores, metrics, actions
3. **Detail Modal** - Full gap analysis view
4. **Empty State** - Reusable with slots
5. **Paywall Gate** - Feature-specific messaging
6. **Onboarding Checklist** - Expandable tasks

### UX Patterns to Implement

1. **Credits/runs indicator** in sidebar
2. **Persistent upgrade banner** (dismissible)
3. **Checklist onboarding** with progress
4. **Filter state in URL** for shareability
5. **Skeleton loaders** for async content

### Pricing Model Insights

- Credits-based metering works well
- 4-tier structure (Starter → Enterprise)
- Free trial with card required
- "Most Popular" badge on mid-tier
- Yearly discount (25%)

---

## 10. Screenshot Inventory

### Total: 25+ screenshots captured

#### Authentication
| File | Description |
|------|-------------|
| `hookd-login-page` | Sign in form |
| `hookd-after-login` | Initial authenticated state |

#### Onboarding
| File | Description |
|------|-------------|
| `hookd-get-started-1` | Onboarding checklist |

#### Discover Ads Section
| File | Description |
|------|-------------|
| `hookd-explore-ads` | Main explore page |
| `hookd-explore-full` | Full explore with ad card |
| `hookd-explore-brands` | Brands leaderboard tab |
| `hookd-search-skincare` | Search results |
| `hookd-filter-performance` | Expanded filter |
| `hookd-filter-adformat` | Ad format filter |
| `hookd-brand-spy` | Brand tracking (empty) |
| `hookd-swipe-file` | Saved ads (empty) |
| `hookd-expert-picks` | Curated collections |

#### Detail Views
| File | Description |
|------|-------------|
| `hookd-brand-page` | Brand detail with ads |
| `hookd-ad-details-modal` | Ad detail modal |

#### Analyze Section
| File | Description |
|------|-------------|
| `hookd-analyze-ads` | Creative Analyzer (paywall) |

#### Create Section
| File | Description |
|------|-------------|
| `hookd-create-ads` | Clone Ads (paywall) |
| `hookd-create-ads-full` | Full Create nav visible |
| `hookd-video-scripts` | Video Scripts (empty) |
| `hookd-brand-assets` | Brand Assets (paywall) |
| `hookd-image-templates` | Image Templates (paywall) |
| `hookd-funnel-templates` | Funnel Templates (paywall) |

#### Integrations
| File | Description |
|------|-------------|
| `hookd-integrations` | Discord integration |

#### Marketing/Pricing
| File | Description |
|------|-------------|
| `hookd-pricing` | Pricing hero |
| `hookd-pricing-2` through `hookd-pricing-8` | Marketing sections |
| `hookd-pricing-tiers` | Pricing comparison |
| `hookd-pricing-features` | Feature breakdown |

#### Additional Captures
| File | Description |
|------|-------------|
| `hookd-video-scripts` | Video Scripts page (empty state with Create button) |
| `hookd-brand-assets` | Brand Assets with Brand Profiles/Products tabs |
| `hookd-image-templates` | Image Ad Templates (paywall) |
| `hookd-funnel-templates` | Funnel Templates (paywall) |
| `hookd-filter-performance` | Expanded Performance filter |
| `hookd-filter-adformat` | Expanded Ad format filter |
| `hookd-favorite-searches` | Favorite searches feature |
| `hookd-more-ads` | Additional ad examples in feed |
| `hookd-success-guide` | Success Guide / Get Started with checklist |
| `hookd-features-explained` | Features Explained navigation |
| `hookd-guide-discover` | Guide sidebar expanded |
| `hookd-create-ads-full` | Create Ads with full sub-nav visible |
| `hookd-get-started-full` | Full onboarding page with video course promo |
| `hookd-get-started-scrolled` | Scrolled view of onboarding checklist |
| `hookd-analyze-full` | 404 error page (route not accessible) |

#### Filter & UI States
| File | Description |
|------|-------------|
| `hookd-filter-niche` | Niche filter options |
| `hookd-adview-dropdown` | Ad view mode selector |
| `hookd-sort-dropdown` | Sort options (Newest, etc.) |

#### Chrome Extension
| File | Description |
|------|-------------|
| `hookd-chrome-search` | Chrome Web Store search results |
| `hookd-chrome-extension-detail` | Extension listing (5.0 rating) |

#### Marketing Page Sections (Full Scroll Capture)
| File | Description |
|------|-------------|
| `hookd-pricing-hero` | Landing page hero with tagline |
| `hookd-marketing-section1` | Pain points testimonial (Hector Lewis) |
| `hookd-marketing-section2` | "You're not alone" empathy section |
| `hookd-marketing-section3` | Value prop headline |
| `hookd-marketing-section4` | Feature cards (Stabilize ROAS, Cut waste) |
| `hookd-marketing-section5` | AI-Powered ad research with product screenshot |
| `hookd-marketing-section6` | Seamless creative production with AI script generator |
| `hookd-marketing-section7` | Build Ad Images in Seconds with AI variations |
| `hookd-marketing-section8` | Target personas section |
| `hookd-marketing-personas` | CMOs, Marketing Specialists, Founders + stats (+50%, 3x) |

#### Additional Filter States
| File | Description |
|------|-------------|
| `hookd-filter-status` | Status filter expanded |
| `hookd-filter-static-style` | Static ad style filter |
| `hookd-filter-runtime` | Run time filter options |
| `hookd-filter-niche` | Niche categories filter |
| `hookd-filter-language` | Language filter options |
| `hookd-filter-channels` | Channels filter (Facebook, Instagram, etc.) |
| `hookd-filter-startdate` | Start date filter |
| `hookd-filter-creative-usage` | Creative usage filter |
| `hookd-filter-brand-active` | Brand active ads filter |
| `hookd-filter-video-length` | Video length filter |
| `hookd-filter-hide-brands` | Hide brands filter |

#### Analyze Ads Section
| File | Description |
|------|-------------|
| `hookd-analyze-ads-click` | Creative Analyzer with paywall message |

### Total Screenshots: 63+

---

## Appendix: Copy Patterns (Non-Verbatim)

### Headlines
- Pain-point opener + solution promise
- "Stop [problem]. Start [benefit]."

### Subheadlines
- Tool description + outcome + timeframe
- "Your [category] tool to [actions] in [time]"

### CTAs
- Primary: "Start [X]-day free trial"
- Secondary: "See How It Works"
- Upgrade: "Upgrade your plan"

### Empty States
- "[Category icon] No [items] [action]!"
- "Explore [related] to [action] here."

### Paywalls
- "This feature is not available in your current plan!"
- Single upgrade CTA

### Social Proof
- "[Number]+ [personas] already [action]"
- Testimonial: Quote + Name + Role + Rating

---

*Document generated via automated browser capture. Screenshots stored in Puppeteer session.*
