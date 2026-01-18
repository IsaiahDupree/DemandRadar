-- Tracked Competitors Table
-- Allows users to track specific competitors over time with alerts on changes

CREATE TABLE IF NOT EXISTS tracked_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT,
  notes TEXT,

  -- Tracked data (latest snapshot)
  pricing_model TEXT,
  pricing_amount NUMERIC,
  pricing_currency TEXT DEFAULT 'USD',
  features JSONB DEFAULT '[]',
  description TEXT,

  -- Change tracking
  last_checked_at TIMESTAMP WITH TIME ZONE,
  pricing_changed_at TIMESTAMP WITH TIME ZONE,
  features_changed_at TIMESTAMP WITH TIME ZONE,

  -- Alert preferences
  alert_on_pricing_change BOOLEAN DEFAULT true,
  alert_on_feature_change BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate tracking
  UNIQUE(user_id, url)
);

-- Competitor Change History
CREATE TABLE IF NOT EXISTS competitor_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_competitor_id UUID NOT NULL REFERENCES tracked_competitors(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('pricing', 'features', 'description', 'status')),
  old_value JSONB,
  new_value JSONB,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notified BOOLEAN DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE tracked_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_changes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tracked_competitors
CREATE POLICY "Users can view own tracked competitors" ON tracked_competitors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can track competitors" ON tracked_competitors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tracked competitors" ON tracked_competitors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can untrack competitors" ON tracked_competitors
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for competitor_changes
CREATE POLICY "Users can view changes for own competitors" ON competitor_changes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tracked_competitors tc
      WHERE tc.id = competitor_changes.tracked_competitor_id
      AND tc.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tracked_competitors_user_id ON tracked_competitors(user_id);
CREATE INDEX IF NOT EXISTS idx_tracked_competitors_last_checked ON tracked_competitors(last_checked_at);
CREATE INDEX IF NOT EXISTS idx_competitor_changes_tracked_id ON competitor_changes(tracked_competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_changes_detected_at ON competitor_changes(detected_at DESC);

-- View for competitors with recent changes
CREATE OR REPLACE VIEW competitors_with_changes AS
SELECT
  tc.*,
  (
    SELECT COUNT(*)
    FROM competitor_changes cc
    WHERE cc.tracked_competitor_id = tc.id
    AND cc.detected_at > NOW() - INTERVAL '7 days'
  ) as changes_last_7_days,
  (
    SELECT json_agg(
      json_build_object(
        'id', cc.id,
        'change_type', cc.change_type,
        'old_value', cc.old_value,
        'new_value', cc.new_value,
        'detected_at', cc.detected_at
      )
      ORDER BY cc.detected_at DESC
    )
    FROM (
      SELECT * FROM competitor_changes cc2
      WHERE cc2.tracked_competitor_id = tc.id
      ORDER BY cc2.detected_at DESC
      LIMIT 5
    ) cc
  ) as recent_changes
FROM tracked_competitors tc;

-- Grant access to the view
GRANT SELECT ON competitors_with_changes TO authenticated;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tracked_competitor_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
CREATE TRIGGER update_tracked_competitor_timestamp
  BEFORE UPDATE ON tracked_competitors
  FOR EACH ROW
  EXECUTE FUNCTION update_tracked_competitor_timestamp();
