-- Demand Brief Tables Migration
-- Created: January 16, 2026
-- Description: Tables for weekly demand brief subscription feature

-- =============================================================================
-- TABLE: user_niches
-- Description: Stores user's tracked niches for weekly demand monitoring
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_niches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Core niche data
  offering_name TEXT NOT NULL,
  category TEXT,
  niche_tags TEXT[],

  -- Customer profile
  customer_profile JSONB DEFAULT '{
    "type": "B2C",
    "segment": "creator",
    "price_point": "mid"
  }'::jsonb,

  -- Monitoring config
  competitors TEXT[] DEFAULT ARRAY[]::TEXT[],
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  geo TEXT DEFAULT 'US',
  sources_enabled TEXT[] DEFAULT ARRAY['meta', 'google', 'reddit', 'tiktok', 'appstore'],

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_user_niches_user_id ON user_niches(user_id);
CREATE INDEX idx_user_niches_active ON user_niches(is_active) WHERE is_active = true;

-- RLS policies for user_niches
ALTER TABLE user_niches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own niches"
  ON user_niches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own niches"
  ON user_niches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own niches"
  ON user_niches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own niches"
  ON user_niches FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- TABLE: demand_snapshots
-- Description: Weekly snapshots of demand signals and scores for each niche
-- =============================================================================
CREATE TABLE IF NOT EXISTS demand_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id UUID NOT NULL REFERENCES user_niches(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,

  -- Scores (0-100)
  demand_score INTEGER CHECK (demand_score BETWEEN 0 AND 100),
  demand_score_change INTEGER DEFAULT 0,
  opportunity_score INTEGER CHECK (opportunity_score BETWEEN 0 AND 100),
  message_market_fit_score INTEGER CHECK (message_market_fit_score BETWEEN 0 AND 100),

  -- Trend indicator
  trend TEXT CHECK (trend IN ('up', 'down', 'stable')) DEFAULT 'stable',

  -- Raw signals (JSONB for flexibility)
  ad_signals JSONB DEFAULT '{
    "new_advertisers": 0,
    "top_angles": [],
    "top_offers": [],
    "avg_longevity_days": 0
  }'::jsonb,

  search_signals JSONB DEFAULT '{
    "rising_keywords": [],
    "buyer_intent_keywords": [],
    "volume_change_pct": 0
  }'::jsonb,

  ugc_signals JSONB DEFAULT '{
    "top_formats": [],
    "engagement_rates": {},
    "trending_hooks": []
  }'::jsonb,

  forum_signals JSONB DEFAULT '{
    "top_complaints": [],
    "top_desires": [],
    "sentiment_breakdown": {}
  }'::jsonb,

  competitor_signals JSONB DEFAULT '{
    "pricing_changes": [],
    "feature_changes": [],
    "new_entrants": []
  }'::jsonb,

  -- AI-Generated content
  plays JSONB DEFAULT '[]'::jsonb,  -- [{type: 'product', action: '...', evidence: '...'}]
  ad_hooks TEXT[] DEFAULT ARRAY[]::TEXT[],
  subject_lines TEXT[] DEFAULT ARRAY[]::TEXT[],
  landing_copy TEXT,

  -- Meta
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one snapshot per niche per week
  UNIQUE(niche_id, week_start)
);

-- Add indexes for performance
CREATE INDEX idx_snapshots_niche_id ON demand_snapshots(niche_id);
CREATE INDEX idx_snapshots_week_start ON demand_snapshots(week_start DESC);
CREATE INDEX idx_snapshots_niche_week ON demand_snapshots(niche_id, week_start DESC);

-- RLS policies for demand_snapshots
ALTER TABLE demand_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view snapshots for their niches"
  ON demand_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_niches
      WHERE user_niches.id = demand_snapshots.niche_id
      AND user_niches.user_id = auth.uid()
    )
  );

-- Only system can insert/update snapshots (via service role)
CREATE POLICY "Service role can insert snapshots"
  ON demand_snapshots FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can update snapshots"
  ON demand_snapshots FOR UPDATE
  USING (auth.jwt()->>'role' = 'service_role');

-- =============================================================================
-- TABLE: niche_alerts
-- Description: Between-brief alerts for significant events
-- =============================================================================
CREATE TABLE IF NOT EXISTS niche_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id UUID NOT NULL REFERENCES user_niches(id) ON DELETE CASCADE,

  -- Alert details
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'competitor_price',
    'trend_spike',
    'new_angle',
    'pain_surge',
    'feature_change'
  )),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),

  -- Status
  is_read BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_alerts_niche_id ON niche_alerts(niche_id);
CREATE INDEX idx_alerts_created_at ON niche_alerts(created_at DESC);
CREATE INDEX idx_alerts_unread ON niche_alerts(niche_id, is_read) WHERE is_read = false;

-- RLS policies for niche_alerts
ALTER TABLE niche_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view alerts for their niches"
  ON niche_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_niches
      WHERE user_niches.id = niche_alerts.niche_id
      AND user_niches.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their alerts"
  ON niche_alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_niches
      WHERE user_niches.id = niche_alerts.niche_id
      AND user_niches.user_id = auth.uid()
    )
  );

-- =============================================================================
-- UPDATE: users table for subscription tiers
-- =============================================================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'starter', 'builder', 'agency', 'studio')),
  ADD COLUMN IF NOT EXISTS max_niches INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS addons TEXT[] DEFAULT ARRAY[]::TEXT[];

-- =============================================================================
-- TABLE: subscription_usage
-- Description: Track monthly usage per user
-- =============================================================================
CREATE TABLE IF NOT EXISTS subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month DATE NOT NULL,

  -- Usage counters
  niches_used INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  alerts_sent INTEGER DEFAULT 0,
  exports_generated INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One record per user per month
  UNIQUE(user_id, month)
);

-- Add indexes
CREATE INDEX idx_usage_user_month ON subscription_usage(user_id, month DESC);

-- RLS policies for subscription_usage
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage"
  ON subscription_usage FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================================================
-- FUNCTION: update_updated_at
-- Description: Automatically update updated_at timestamp
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_user_niches_updated_at
  BEFORE UPDATE ON user_niches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscription_usage_updated_at
  BEFORE UPDATE ON subscription_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE user_niches IS 'Stores user-configured niches for weekly demand monitoring';
COMMENT ON TABLE demand_snapshots IS 'Weekly snapshots of demand signals, scores, and AI-generated content';
COMMENT ON TABLE niche_alerts IS 'Between-brief alerts for significant niche events';
COMMENT ON TABLE subscription_usage IS 'Monthly usage tracking per user';
