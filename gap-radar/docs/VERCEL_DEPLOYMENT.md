# Vercel Deployment Guide

This guide walks you through deploying GapRadar to Vercel for production.

## Prerequisites

- [ ] Completed [Production Supabase Setup](./PRODUCTION_SUPABASE_SETUP.md)
- [ ] GitHub repository with your code
- [ ] Vercel account (create at https://vercel.com)
- [ ] All environment variables ready
- [ ] Tests passing locally (`npm test`)

## Step 1: Prepare Your Repository

### Verify .gitignore

Ensure sensitive files are NOT committed:

```bash
# Check these are in .gitignore
cat .gitignore | grep -E "\.env|\.env\.local"
```

Your `.gitignore` should include:
```
.env
.env.local
.env.production.local
.env.development.local
```

### Verify Build Works Locally

```bash
npm run build
```

This should complete without errors. Fix any TypeScript or build issues before deploying.

### Commit and Push Latest Changes

```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

## Step 2: Connect Repository to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** > **"Project"**
3. Click **"Import Git Repository"**
4. Select your GitHub repository: `gap-radar`
5. Click **"Import"**

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project root
cd gap-radar
vercel
```

Follow the prompts to link your project.

## Step 3: Configure Build Settings

On the import/configuration screen:

### Framework Preset
- **Framework**: Next.js (auto-detected)
- **Build Command**: `next build`
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install`

### Root Directory
- Keep as `.` (root)

### Node.js Version
- Set to `20.x` or `18.x` (recommended)

## Step 4: Configure Environment Variables

### Required Environment Variables

Add these in **Settings** > **Environment Variables**:

#### Database (Supabase)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

#### OpenAI (AI Processing)
```bash
OPENAI_API_KEY=sk-proj-...
```

#### Optional: External APIs
```bash
# RapidAPI for TikTok/Instagram UGC
RAPIDAPI_KEY=your_rapidapi_key_here

# SerpAPI for Google Ads & Play Store
SERPAPI_KEY=your_serpapi_key_here
```

#### Optional: Stripe (Payments)
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Optional: Sentry (Error Tracking)
```bash
SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=your_auth_token
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

#### Optional: Email (Resend)
```bash
RESEND_API_KEY=re_...
```

### Set Environment for All Environments

For each variable:
1. Click **"Add New"**
2. Enter **Key** and **Value**
3. Select environments:
   - ✅ **Production**
   - ✅ **Preview** (recommended)
   - ⬜ **Development** (use `.env.local` instead)

⚠️ **CRITICAL**: Mark sensitive keys (service_role, secret_key, etc.) as **"Sensitive"** to prevent exposure in logs.

## Step 5: Deploy to Production

### Initial Deployment

1. After configuring environment variables, click **"Deploy"**
2. Vercel will:
   - Clone your repository
   - Install dependencies
   - Run build
   - Deploy to production

3. Monitor deployment in real-time (typically 2-3 minutes)

### Verify Deployment

Once deployed:

1. Visit your deployment URL: `https://gap-radar.vercel.app`
2. Test critical flows:
   - Sign up / Login
   - Create new analysis run
   - View dashboard
   - Generate report

## Step 6: Configure Custom Domain (Optional)

### Add Custom Domain

1. Go to **Settings** > **Domains**
2. Click **"Add"**
3. Enter your domain: `gapradar.app` or `app.gapradar.com`
4. Click **"Add"**

### DNS Configuration

Vercel will provide DNS records. Add these to your domain registrar:

**Option A: Apex Domain** (`gapradar.app`)
```
Type: A
Name: @
Value: 76.76.21.21
```

**Option B: Subdomain** (`app.gapradar.com`)
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

### SSL Certificate

Vercel automatically provisions SSL certificates via Let's Encrypt:
- Wait 10-30 minutes for DNS propagation
- Certificate auto-renews before expiration
- HTTPS is enforced automatically

## Step 7: Configure Deployment Settings

### Branch Deployments

1. Go to **Settings** > **Git**
2. Configure:
   - **Production Branch**: `main`
   - **Preview Branches**: Enable for `develop` or all branches
   - **Deploy Hooks**: Optional webhooks for external triggers

### Build & Development Settings

1. Go to **Settings** > **General**
2. Configure:
   - **Node.js Version**: `20.x`
   - **Build Command**: `next build` (default)
   - **Output Directory**: `.next` (default)

### Function Configuration

Next.js API routes run as Vercel Serverless Functions:

1. Go to **Settings** > **Functions**
2. Configure:
   - **Function Region**: Choose closest to your users (e.g., `iad1` for US East)
   - **Max Duration**: 60s (Pro plan allows up to 300s)

⚠️ Important: The analysis pipeline (`/api/runs/[id]/execute`) may take 30-60s. Ensure your plan supports this.

## Step 8: Set Up Webhooks (If Using Stripe)

If you're using Stripe for payments:

1. Go to Stripe Dashboard > **Developers** > **Webhooks**
2. Click **"Add endpoint"**
3. Enter endpoint URL:
   ```
   https://your-domain.vercel.app/api/webhooks/stripe
   ```
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Copy the **Signing Secret** and add to Vercel environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

6. Redeploy to apply the new environment variable

## Step 9: Performance Optimization

### Enable Vercel Analytics (Recommended)

1. Go to **Analytics** tab
2. Click **"Enable Analytics"**
3. This provides:
   - Real User Monitoring (RUM)
   - Web Vitals tracking
   - Traffic analytics

### Enable Vercel Speed Insights

1. Install package:
```bash
npm install @vercel/speed-insights
```

2. Add to your root layout:
```tsx
// src/app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

3. Commit and push to trigger redeployment

## Step 10: Monitoring and Logging

### View Deployment Logs

1. Go to **Deployments** tab
2. Click on a deployment
3. View:
   - **Build Logs**: See build output
   - **Function Logs**: See runtime logs from API routes
   - **Runtime Logs**: Application logs

### Set Up Alerts

1. Go to **Settings** > **Notifications**
2. Enable alerts for:
   - Failed deployments
   - Build errors
   - Domain SSL issues

### Integrate with Sentry (Recommended)

If using Sentry for error tracking:

```bash
# Install Sentry SDK
npm install @sentry/nextjs

# Initialize Sentry
npx @sentry/wizard@latest -i nextjs
```

Follow the wizard to configure Sentry integration with Vercel.

## Step 11: Testing Production Deployment

### Smoke Tests

Test these critical paths:

1. **Authentication**
   - Sign up new user
   - Verify email confirmation
   - Login with credentials
   - Logout

2. **Analysis Pipeline**
   - Create new run
   - Monitor progress
   - Wait for completion (30-60s)
   - View generated report

3. **Data Persistence**
   - Refresh page, verify data persists
   - Check Supabase dashboard for records

4. **API Routes**
   - Test `/api/runs` (GET, POST)
   - Test `/api/reports/[runId]` (GET)
   - Test PDF export

### Performance Tests

1. Check **Vercel Analytics** for Web Vitals:
   - LCP < 2.5s
   - FID < 100ms
   - CLS < 0.1

2. Use **Lighthouse** (Chrome DevTools):
   - Performance > 90
   - Accessibility > 90
   - Best Practices > 90
   - SEO > 90

## Step 12: Continuous Deployment

### Automatic Deployments

Vercel automatically deploys when you push to GitHub:

- **Push to `main`** → Production deployment
- **Push to other branches** → Preview deployment
- **Pull Requests** → Preview deployments with unique URLs

### Manual Deployment

To manually trigger deployment:

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

## Troubleshooting

### Build Failures

**Issue**: Build fails with TypeScript errors
- Fix: Run `npm run build` locally and fix all errors

**Issue**: Missing environment variables
- Fix: Add all required variables in Vercel dashboard

**Issue**: Out of memory during build
- Fix: Upgrade Vercel plan or optimize build process

### Runtime Errors

**Issue**: 500 errors on API routes
- Check: Function logs in Vercel dashboard
- Verify: Environment variables are set correctly
- Test: API route locally first

**Issue**: Database connection fails
- Check: Supabase URL and keys are correct
- Verify: Supabase project is running
- Test: Connection using test script

**Issue**: Function timeout (60s limit)
- Check: Analysis pipeline completes in < 60s
- Consider: Breaking into smaller functions
- Upgrade: To Pro plan for 300s timeout

### Preview Deployment Issues

**Issue**: Preview deployments fail but production works
- Check: Environment variables are set for Preview environment
- Verify: Branch-specific issues (merge conflicts, etc.)

## Production Checklist

- [ ] Repository connected to Vercel
- [ ] All environment variables configured
- [ ] Custom domain added and DNS configured
- [ ] SSL certificate active
- [ ] Production deployment successful
- [ ] Authentication working
- [ ] Analysis pipeline tested end-to-end
- [ ] Stripe webhooks configured (if applicable)
- [ ] Monitoring/analytics enabled
- [ ] Alerts configured
- [ ] Performance metrics > 90 (Lighthouse)
- [ ] Error tracking configured (Sentry)
- [ ] Smoke tests passed
- [ ] Team has access to Vercel project

## Post-Deployment

### Monitor First 24 Hours

1. Watch **Function Logs** for errors
2. Check **Analytics** for traffic patterns
3. Monitor **Sentry** for exceptions (if configured)
4. Verify **Stripe Webhooks** are triggering (if applicable)

### Ongoing Maintenance

1. Review **Analytics** weekly
2. Monitor **Build Times** and optimize if needed
3. Check **Function Duration** - optimize slow routes
4. Update dependencies regularly
5. Review and rotate API keys quarterly

## Scaling Considerations

### Traffic Growth

As traffic increases:

1. **Upgrade Vercel Plan**: Pro or Enterprise for more concurrent builds
2. **Enable ISR**: Use Incremental Static Regeneration for report pages
3. **Add Caching**: Implement caching for expensive operations
4. **Database Optimization**: Add indexes, connection pooling

### Team Collaboration

1. Invite team members to Vercel project
2. Set up staging environment (separate Vercel project)
3. Use branch deployments for feature testing

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Troubleshooting Deployments](https://vercel.com/docs/deployments/troubleshoot-a-build)

## Next Steps

- Set up [Error Tracking with Sentry](./SENTRY_SETUP.md)
- Configure [Email Notifications](./EMAIL_SETUP.md)
- Enable [Analytics and Monitoring](./ANALYTICS_SETUP.md)

---

**Deployment Complete!** 🚀

Your GapRadar application is now live at:
- Production: `https://your-domain.com`
- Vercel URL: `https://gap-radar.vercel.app`

Monitor your deployment and reach out for support if needed.
