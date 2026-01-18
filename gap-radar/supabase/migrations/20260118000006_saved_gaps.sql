-- Saved Gaps Table
-- Allows users to bookmark gap opportunities for later reference

CREATE TABLE IF NOT EXISTS saved_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gap_opportunity_id UUID NOT NULL REFERENCES gap_opportunities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate saves
  UNIQUE(user_id, gap_opportunity_id)
);

-- Enable Row Level Security
ALTER TABLE saved_gaps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_gaps
CREATE POLICY "Users can view own saved gaps" ON saved_gaps
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save gaps" ON saved_gaps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave gaps" ON saved_gaps
  FOR DELETE USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_saved_gaps_user_id ON saved_gaps(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_gaps_gap_id ON saved_gaps(gap_opportunity_id);

-- View for saved gaps with gap details
CREATE OR REPLACE VIEW user_saved_gaps AS
SELECT
  sg.id as saved_id,
  sg.user_id,
  sg.created_at as saved_at,
  go.*
FROM saved_gaps sg
INNER JOIN gap_opportunities go ON sg.gap_opportunity_id = go.id;

-- Grant access to the view
GRANT SELECT ON user_saved_gaps TO authenticated;
