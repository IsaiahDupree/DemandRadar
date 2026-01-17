# GapRadar 🎯

**AI-Powered Market Gap Analysis Tool**

GapRadar helps founders and marketers discover profitable market gaps by analyzing paid ads, Reddit discussions, app stores, and UGC content to identify underserved customer needs and generate actionable product ideas.

## Features

- 🔍 **Multi-Source Data Collection**: Meta Ads, Google Ads, Reddit, App Store (iOS/Android), TikTok, Instagram
- 🤖 **AI-Powered Analysis**: OpenAI GPT-4 for insight extraction and gap identification
- 📊 **Comprehensive Reporting**: 9-section reports with executive summaries, market snapshots, and opportunity rankings
- 💡 **Concept Generation**: Automated product idea generation with buildability scoring
- 🎬 **UGC Winners Pack**: Hooks, scripts, shot lists derived from top-performing content
- 📈 **Economics Modeling**: CPC, CAC, and TAM estimates for each concept
- 📄 **PDF Export**: Professional reports with @react-pdf/renderer
- ⚡ **Real-time Updates**: Supabase Realtime for live progress tracking
- 🔐 **Secure Authentication**: Supabase Auth with email verification
- 💳 **Subscription Billing**: Stripe integration with multiple pricing tiers

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **AI**: OpenAI GPT-4
- **UI**: shadcn/ui + Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **PDF**: @react-pdf/renderer
- **Testing**: Jest + Playwright
- **Error Tracking**: Sentry
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 18.x or 20.x
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/gap-radar.git
cd gap-radar

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys
```

### Environment Variables

Create `.env.local` with the following:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Optional: External APIs
RAPIDAPI_KEY=your_rapidapi_key
SERPAPI_KEY=your_serpapi_key

# Optional: Payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: Error Tracking
SENTRY_DSN=https://...@sentry.io/...
```

### Database Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
npx supabase start

# Run migrations
npx supabase db push
```

### Development

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## Project Structure

```
gap-radar/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── dashboard/          # Dashboard pages
│   │   ├── api/                # API routes
│   │   └── (auth)/             # Auth pages
│   ├── components/             # React components
│   │   └── ui/                 # shadcn/ui components
│   ├── lib/                    # Core libraries
│   │   ├── collectors/         # Data collection modules
│   │   ├── ai/                 # AI processing modules
│   │   ├── scoring.ts          # Scoring algorithms
│   │   └── supabase/           # Supabase clients
│   └── hooks/                  # Custom React hooks
├── supabase/
│   └── migrations/             # Database migrations
├── __tests__/                  # Test files
│   ├── lib/                    # Unit tests
│   ├── integration/            # Integration tests
│   └── e2e/                    # E2E tests
├── docs/                       # Documentation
│   ├── PRODUCTION_SUPABASE_SETUP.md
│   └── VERCEL_DEPLOYMENT.md
└── feature_list.json           # Feature tracking
```

## Data Collection Sources

### Meta Ads Library
- Collects active ads from Meta Ads Library
- Extracts headlines, descriptions, angles, offers
- Mock data fallback when API unavailable

### Google Ads
- Uses SerpAPI for Google Ads data
- Captures search and shopping ads
- Normalized format for consistent analysis

### Reddit
- Searches relevant subreddits for discussions
- Extracts pain points, feature requests, objections
- Sentiment analysis on comments

### App Stores
- **iOS**: iTunes Search API (no key required)
- **Android**: SerpAPI Google Play endpoint
- Competitor analysis and ratings

### UGC (TikTok & Instagram)
- RapidAPI integration for top-performing content
- Hook types, formats, CTAs
- Engagement metrics and patterns

## AI Analysis Pipeline

1. **Data Collection** (30-60s)
   - Parallel collection from all sources
   - Deduplication and normalization

2. **Insight Extraction** (20-30s)
   - GPT-4 analyzes ads and Reddit mentions
   - Clusters pain points and objections
   - Identifies common angles and offers

3. **Gap Generation** (15-20s)
   - Identifies mismatches between ads and user needs
   - Ranks by opportunity score and confidence
   - Categorizes gaps (product, pricing, positioning, trust, offer)

4. **Concept Generation** (20-30s)
   - Generates 5-10 product ideas per gap
   - Estimates economics (CPC, CAC, TAM)
   - Buildability scoring (difficulty, human touch)

5. **UGC Recommendations** (10-15s)
   - Generates hooks, scripts, shot lists
   - Maps angles to UGC formats
   - Provides ready-to-use content templates

6. **Action Plan** (10-15s)
   - 7-day quick start checklist
   - 30-day comprehensive roadmap
   - Prioritized by impact and effort

**Total Pipeline Time**: ~2-3 minutes

## Deployment

### Production Deployment

Follow our comprehensive deployment guides:

1. [**Production Supabase Setup**](./docs/PRODUCTION_SUPABASE_SETUP.md)
   - Create production Supabase project
   - Run database migrations
   - Configure RLS policies
   - Set up authentication

2. [**Vercel Deployment**](./docs/VERCEL_DEPLOYMENT.md)
   - Connect GitHub repository
   - Configure environment variables
   - Set up custom domain
   - Configure webhooks and monitoring

### Deployment Checklist

- [ ] Production Supabase project created
- [ ] All migrations run successfully
- [ ] Environment variables configured in Vercel
- [ ] Tests passing (`npm test`)
- [ ] Build successful (`npm run build`)
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Error tracking configured (Sentry)
- [ ] Stripe webhooks configured (if applicable)
- [ ] Smoke tests passed

## API Routes

### Public Routes
- `POST /api/runs` - Create new analysis run
- `GET /api/runs/[id]` - Get run status
- `POST /api/runs/[id]/execute` - Execute analysis pipeline
- `GET /api/reports/[runId]` - Get full report data
- `GET /api/reports/[runId]/pdf` - Download PDF report

### Authenticated Routes
All routes require authentication via Supabase Auth

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook endpoint

## Scoring Algorithms

### Market Saturation Score (0-100)
- Based on number of active advertisers
- Ad longevity (longer = more saturated)
- Competitive intensity

### Longevity Score (0-100)
- Average ad age
- Advertiser persistence
- Market staying power

### Dissatisfaction Score (0-100)
- Reddit sentiment analysis
- Pain point frequency
- Objection intensity

### Misalignment Score (0-100)
- Gap between ad messaging and user needs
- Unaddressed pain points
- Feature request density

### Opportunity Score (0-100)
- Weighted combination of all scores
- Confidence-adjusted
- Primary ranking metric

### Build-to-Profit (B2P) Score
- `(TAM × GM × Success_Prob) / (Dev_Cost + Marketing_Cost)`
- Estimates ROI potential

## Contributing

This is a private project. For access or contributions, please contact the project maintainer.

## Testing

### Test Coverage

- **Unit Tests**: 159 passing (collectors, AI modules, scoring)
- **Integration Tests**: API routes, database operations
- **E2E Tests**: Critical user flows (auth, runs, reports)
- **Target Coverage**: >80% for core modules

Run tests:
```bash
npm test                # All tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

## Performance

### Lighthouse Scores (Target)
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >90

### Core Web Vitals
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

## Security

- Row Level Security (RLS) enabled on all Supabase tables
- API keys stored in environment variables (never committed)
- Service role key used only server-side
- Stripe webhooks verified via signature
- Input validation on all API routes

## Support

For questions or issues:
- Check the [docs](./docs/) folder
- Review [AGENT_TASKS.md](../AGENT_TASKS.md) for task breakdown
- Contact: your-email@example.com

## License

Private/Proprietary - All rights reserved

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [OpenAI](https://openai.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Vercel](https://vercel.com/)

---

**Version**: 1.0.0
**Last Updated**: January 16, 2026

🚀 Ready to discover market gaps!
