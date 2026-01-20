-- Build recommendations table for AI-powered product ideas
-- Part of BUILD-004: Recommendations API

CREATE TABLE IF NOT EXISTS build_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES runs(id) ON DELETE SET NULL,
  niche_id UUID REFERENCES user_niches(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- What to build
  product_idea TEXT NOT NULL,
  product_type VARCHAR(50) CHECK (product_type IN ('saas', 'tool', 'api', 'marketplace', 'mobile_app', 'chrome_extension')),
  one_liner TEXT,
  target_audience TEXT,

  -- Why to build it (JSONB for flexibility)
  pain_points JSONB DEFAULT '[]'::jsonb,
  competitor_gaps JSONB DEFAULT '[]'::jsonb,
  search_queries JSONB DEFAULT '[]'::jsonb,

  -- How to market it
  recommended_hooks JSONB DEFAULT '[]'::jsonb,
  recommended_channels JSONB DEFAULT '[]'::jsonb,
  sample_ad_copy JSONB,
  landing_page_angle TEXT,

  -- Feasibility
  build_complexity VARCHAR(20) CHECK (build_complexity IN ('weekend', 'month', 'quarter')),
  tech_stack_suggestion JSONB DEFAULT '[]'::jsonb,
  estimated_time_to_mvp VARCHAR(50),
  estimated_cac_range VARCHAR(50),

  -- Confidence
  confidence_score DECIMAL(5,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  reasoning TEXT,
  supporting_signals INT DEFAULT 0,

  -- Status tracking
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'saved', 'in_progress', 'completed', 'dismissed')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_recommendations_user ON build_recommendations(user_id);
CREATE INDEX idx_recommendations_run ON build_recommendations(run_id);
CREATE INDEX idx_recommendations_niche ON build_recommendations(niche_id);
CREATE INDEX idx_recommendations_status ON build_recommendations(status);
CREATE INDEX idx_recommendations_confidence ON build_recommendations(confidence_score DESC);
CREATE INDEX idx_recommendations_created ON build_recommendations(created_at DESC);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_build_recommendations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_build_recommendations_timestamp
  BEFORE UPDATE ON build_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_build_recommendations_updated_at();

-- Row Level Security (RLS)
ALTER TABLE build_recommendations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own recommendations
CREATE POLICY "Users can view own recommendations"
  ON build_recommendations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own recommendations
CREATE POLICY "Users can create own recommendations"
  ON build_recommendations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own recommendations
CREATE POLICY "Users can update own recommendations"
  ON build_recommendations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own recommendations
CREATE POLICY "Users can delete own recommendations"
  ON build_recommendations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comment for documentation
COMMENT ON TABLE build_recommendations IS 'AI-generated product recommendations based on market demand signals';
COMMENT ON COLUMN build_recommendations.confidence_score IS 'Confidence score 0-100 based on signal strength and data quality';
COMMENT ON COLUMN build_recommendations.supporting_signals IS 'Number of data points supporting this recommendation';
COMMENT ON COLUMN build_recommendations.status IS 'Workflow status: new, saved, in_progress, completed, dismissed';
