-- Competitive Intelligence System
-- Implements watchlists, competitor tracking, snapshots, and alerts
-- PRD: PRD_COMPETITIVE_INTELLIGENCE.md
-- Features: INTEL-001 (Watchlists), INTEL-002 (Snapshots)

-- ============================================================================
-- 1. COMPETITOR WATCHLISTS TABLE
-- ============================================================================
-- Allows users to organize competitors into groups/collections

CREATE TABLE IF NOT EXISTS competitor_watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  name VARCHAR(255) NOT NULL, -- "Main Competitors", "Enterprise Players", etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. UPDATE TRACKED COMPETITORS TABLE
-- ============================================================================
-- Drop the old tracked_competitors table if it exists and create new one with updated schema
-- This aligns with the PRD requirements for ad tracking

DROP TABLE IF EXISTS competitor_changes CASCADE;
DROP TABLE IF EXISTS tracked_competitors CASCADE;

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

-- ============================================================================
-- 3. COMPETITOR SNAPSHOTS TABLE
-- ============================================================================
-- Stores historical competitor data for change detection

CREATE TABLE IF NOT EXISTS competitor_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES tracked_competitors(id) ON DELETE CASCADE,

  -- Snapshot data
  snapshot_date DATE NOT NULL,
  active_ads_count INT DEFAULT 0,
  new_ads_count INT DEFAULT 0,
  stopped_ads_count INT DEFAULT 0,

  -- Ad data (JSONB for flexibility)
  ads_data JSONB, -- Array of ad summaries with structure: [{id, headline, body, started_running, run_days}, ...]

  -- Detected changes
  changes JSONB, -- Array of change objects: [{type, details, significance}, ...]

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(competitor_id, snapshot_date)
);

-- ============================================================================
-- 4. COMPETITOR ALERTS TABLE
-- ============================================================================
-- Stores alerts for competitor changes

CREATE TABLE IF NOT EXISTS competitor_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  competitor_id UUID REFERENCES tracked_competitors(id) ON DELETE CASCADE,

  -- Alert details
  alert_type VARCHAR(50) NOT NULL, -- 'new_campaign', 'ad_spike', 'pricing_change', 'new_feature', 'campaign_ended', 'creative_shift'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  data JSONB, -- Additional alert data (ad count, changes, etc.)

  -- Status
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_competitor_watchlists_user ON competitor_watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_tracked_competitors_user ON tracked_competitors(user_id);
CREATE INDEX IF NOT EXISTS idx_tracked_competitors_watchlist ON tracked_competitors(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_tracked_competitors_active ON tracked_competitors(is_active, last_checked);
CREATE INDEX IF NOT EXISTS idx_competitor_snapshots_competitor ON competitor_snapshots(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_snapshots_date ON competitor_snapshots(competitor_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_alerts_user ON competitor_alerts(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_alerts_competitor ON competitor_alerts(competitor_id, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE competitor_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for competitor_watchlists
CREATE POLICY "Users can view own watchlists" ON competitor_watchlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own watchlists" ON competitor_watchlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlists" ON competitor_watchlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlists" ON competitor_watchlists
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for tracked_competitors
CREATE POLICY "Users can view own tracked competitors" ON tracked_competitors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can track competitors" ON tracked_competitors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tracked competitors" ON tracked_competitors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can untrack competitors" ON tracked_competitors
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for competitor_snapshots
CREATE POLICY "Users can view snapshots of own competitors" ON competitor_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tracked_competitors tc
      WHERE tc.id = competitor_snapshots.competitor_id
      AND tc.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert snapshots" ON competitor_snapshots
  FOR INSERT WITH CHECK (true); -- Cron job inserts snapshots

-- RLS Policies for competitor_alerts
CREATE POLICY "Users can view own alerts" ON competitor_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON competitor_alerts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts" ON competitor_alerts
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "System can create alerts" ON competitor_alerts
  FOR INSERT WITH CHECK (true); -- Cron job creates alerts

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp on watchlists
CREATE OR REPLACE FUNCTION update_watchlist_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
CREATE TRIGGER update_watchlist_timestamp
  BEFORE UPDATE ON competitor_watchlists
  FOR EACH ROW
  EXECUTE FUNCTION update_watchlist_timestamp();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for competitors with their latest snapshot data
CREATE OR REPLACE VIEW competitors_with_latest_snapshot AS
SELECT
  tc.*,
  cs.snapshot_date,
  cs.active_ads_count,
  cs.new_ads_count,
  cs.stopped_ads_count,
  cs.changes as latest_changes
FROM tracked_competitors tc
LEFT JOIN LATERAL (
  SELECT *
  FROM competitor_snapshots cs2
  WHERE cs2.competitor_id = tc.id
  ORDER BY cs2.snapshot_date DESC
  LIMIT 1
) cs ON true;

-- View for unread alerts count by user
CREATE OR REPLACE VIEW user_alert_counts AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE NOT is_read) as unread_count,
  COUNT(*) FILTER (WHERE NOT is_dismissed) as active_count,
  COUNT(*) as total_count
FROM competitor_alerts
GROUP BY user_id;

-- Grant access to views
GRANT SELECT ON competitors_with_latest_snapshot TO authenticated;
GRANT SELECT ON user_alert_counts TO authenticated;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE competitor_watchlists IS 'Organizational groups for tracking competitors';
COMMENT ON TABLE tracked_competitors IS 'Individual competitors being monitored by users';
COMMENT ON TABLE competitor_snapshots IS 'Historical snapshots of competitor data for change detection';
COMMENT ON TABLE competitor_alerts IS 'Alerts generated from detected competitor changes';

COMMENT ON COLUMN tracked_competitors.meta_page_id IS 'Meta/Facebook page ID for Ad Library API tracking';
COMMENT ON COLUMN competitor_snapshots.ads_data IS 'JSONB array of ad summaries from Meta Ad Library';
COMMENT ON COLUMN competitor_snapshots.changes IS 'JSONB array of detected changes between snapshots';
COMMENT ON COLUMN competitor_alerts.alert_type IS 'Type of alert: new_campaign, ad_spike, campaign_ended, creative_shift, etc.';
