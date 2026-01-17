# Production Supabase Setup Guide

This guide walks you through setting up a production Supabase project for GapRadar.

## Prerequisites

- Supabase account (create at https://supabase.com)
- All database migrations located in `supabase/migrations/`
- Local development completed and tested

## Step 1: Create Production Supabase Project

1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Configure project settings:
   - **Organization**: Choose or create an organization
   - **Name**: `gapradar-production` (or your preferred name)
   - **Database Password**: Generate a strong password (save it securely!)
   - **Region**: Choose closest to your users (e.g., `us-east-1`, `eu-west-1`)
   - **Pricing Plan**: Select based on your needs (Pro recommended for production)

4. Click **"Create new project"** and wait for provisioning (~2 minutes)

## Step 2: Run Database Migrations

### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI if not already installed:
```bash
npm install -g supabase
```

2. Link your project:
```bash
cd gap-radar
supabase link --project-ref YOUR_PROJECT_REF
```

Find your `PROJECT_REF` in the Supabase dashboard under Project Settings > General

3. Run migrations:
```bash
supabase db push
```

This will apply all migrations in `supabase/migrations/` to your production database.

### Option B: Manual Migration via Dashboard

1. Go to **SQL Editor** in your Supabase dashboard
2. For each migration file in `supabase/migrations/` (in order):
   - Open the file locally
   - Copy the SQL content
   - Paste into SQL Editor
   - Click **"Run"**

3. Verify all tables were created:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables (16 total):
- `action_plans`
- `ad_creatives`
- `app_store_results`
- `clusters`
- `concept_ideas`
- `concept_metrics`
- `extractions`
- `gap_opportunities`
- `reddit_mentions`
- `runs`
- `subscriptions`
- `ugc_assets`
- `ugc_metrics`
- `ugc_patterns`
- `ugc_recommendations`
- `users`

## Step 3: Configure Row Level Security (RLS)

RLS policies should be included in your migrations. Verify they're active:

1. Go to **Authentication** > **Policies** in dashboard
2. Check each table has appropriate policies
3. Common policies to verify:
   - Users can only read/write their own data
   - Service role can access all data
   - Anonymous access is restricted

Example verification query:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public';
```

## Step 4: Set Up Authentication

### Enable Email Authentication

1. Go to **Authentication** > **Providers**
2. Enable **Email** provider
3. Configure settings:
   - **Enable Email Confirmations**: ON (recommended)
   - **Confirm email**: Enable for production
   - **Secure email change**: Enable
   - **Secure password change**: Enable

### Configure Email Templates (Optional but Recommended)

1. Go to **Authentication** > **Email Templates**
2. Customize templates:
   - Confirm signup
   - Magic Link
   - Change Email Address
   - Reset Password

### Enable OAuth Providers (Optional)

If you want social login:
1. Go to **Authentication** > **Providers**
2. Enable desired providers (Google, GitHub, etc.)
3. Configure OAuth credentials for each provider

## Step 5: Get Production API Keys

1. Go to **Project Settings** > **API**
2. You'll need these keys:
   - **Project URL**: `https://YOUR_PROJECT_REF.supabase.co`
   - **anon/public** key: Safe to use in browser
   - **service_role** key: SECRET - server-side only

3. Save these for your Vercel deployment (next step)

## Step 6: Configure Storage (For UGC Assets - Optional)

If you plan to store images/videos:

1. Go to **Storage**
2. Create a new bucket: `ugc-thumbnails`
3. Set bucket as **Public** or **Private** based on needs
4. Configure policies for the bucket

## Step 7: Set Up Database Backups

1. Go to **Project Settings** > **Database**
2. Verify **Point in Time Recovery (PITR)** is enabled (Pro plan)
3. Configure backup retention as needed

## Step 8: Environment Variables for Production

Save these values for your Vercel deployment:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

⚠️ **SECURITY WARNING**:
- NEVER commit `SUPABASE_SERVICE_ROLE_KEY` to git
- Only use `service_role` key in server-side code
- Use `anon` key for client-side code

## Step 9: Test Database Connection

Create a test file to verify connection:

```typescript
// test-db-connection.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  const { data, error } = await supabase
    .from('users')
    .select('count')
    .limit(1)

  if (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  }

  console.log('✅ Database connection successful!')
  console.log('Tables accessible')
}

testConnection()
```

Run with:
```bash
npx tsx test-db-connection.ts
```

## Step 10: Monitor and Optimize

### Set Up Monitoring

1. Go to **Reports** in Supabase dashboard
2. Monitor:
   - Database size
   - API requests
   - Active connections
   - Query performance

### Add Database Indexes

For better performance, ensure these indexes exist:

```sql
-- Run in SQL Editor
CREATE INDEX IF NOT EXISTS idx_runs_user_id ON runs(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
CREATE INDEX IF NOT EXISTS idx_ad_creatives_run_id ON ad_creatives(run_id);
CREATE INDEX IF NOT EXISTS idx_gap_opportunities_run_id ON gap_opportunities(run_id);
CREATE INDEX IF NOT EXISTS idx_concept_ideas_run_id ON concept_ideas(run_id);
```

## Troubleshooting

### Migration Errors

If you encounter errors during migration:

1. Check migration order - they must run sequentially
2. Look for foreign key constraint violations
3. Verify schema conflicts with existing tables

### Connection Issues

If you can't connect:

1. Verify API keys are correct
2. Check your IP isn't blocked (Supabase allows all by default)
3. Ensure project is fully provisioned (check dashboard)

### RLS Policy Issues

If queries fail with permission errors:

1. Verify RLS policies exist for the table
2. Check user authentication status
3. Temporarily disable RLS for debugging (re-enable after!):
```sql
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;
```

## Production Checklist

- [ ] Production project created
- [ ] All 16 tables created successfully
- [ ] RLS policies active and tested
- [ ] Email authentication configured
- [ ] Production API keys saved securely
- [ ] Environment variables documented
- [ ] Database backups configured
- [ ] Performance indexes added
- [ ] Connection tested successfully
- [ ] Monitoring dashboards reviewed

## Next Steps

After completing this setup:
1. Proceed to [Vercel Deployment Guide](./VERCEL_DEPLOYMENT.md)
2. Configure production environment variables
3. Run smoke tests on production deployment

## Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Database Performance](https://supabase.com/docs/guides/platform/performance)
- [Security Best Practices](https://supabase.com/docs/guides/platform/security)
