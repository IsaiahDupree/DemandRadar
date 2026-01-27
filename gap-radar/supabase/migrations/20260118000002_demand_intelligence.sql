-- Demand Intelligence System
-- Aggregates signals from multiple sources to identify "what to build next"

-- ============================================
-- 1. DEMAND SIGNALS TABLE
-- Raw signals from various sources
-- ============================================
CREATE TABLE IF NOT EXISTS demand_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche VARCHAR(255) NOT NULL,
  signal_type VARCHAR(50) NOT NULL CHECK (signal_type IN ('pain_point', 'ad_spend', 'search', 'content', 'app', 'social')),
  source VARCHAR(50) NOT NULL CHECK (source IN ('reddit', 'meta', 'google', 'youtube', 'appstore', 'tiktok', 'twitter', 'instagram')),
  
  -- Signal data
  title TEXT,
  content TEXT,
  url TEXT,
  score DECIMAL(5,2) DEFAULT 0,
  
  -- Metadata
  raw_data JSONB,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Tracking
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  run_id UUID REFERENCES runs(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signals_niche ON demand_signals(niche);
CREATE INDEX idx_signals_type ON demand_signals(signal_type);
CREATE INDEX idx_signals_source ON demand_signals(source);
CREATE INDEX idx_signals_detected ON demand_signals(detected_at DESC);
CREATE INDEX idx_signals_score ON demand_signals(score DESC);

-- ============================================
-- 2. NICHE OPPORTUNITIES TABLE
-- Aggregated scores for each niche
-- ============================================
CREATE TABLE IF NOT EXISTS niche_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100),
  description TEXT,
  
  -- Individual signal scores (0-100)
  pain_score DECIMAL(5,2) DEFAULT 0,      -- Reddit/forum pain points
  spend_score DECIMAL(5,2) DEFAULT 0,     -- Meta/ad spend signals
  search_score DECIMAL(5,2) DEFAULT 0,    -- Google search demand
  content_score DECIMAL(5,2) DEFAULT 0,   -- YouTube/content gaps
  app_score DECIMAL(5,2) DEFAULT 0,       -- App store demand
  social_score DECIMAL(5,2) DEFAULT 0,    -- Social media buzz
  
  -- Unified demand score (weighted average)
  demand_score DECIMAL(5,2) GENERATED ALWAYS AS (
    ROUND(
      (COALESCE(pain_score, 0) * 0.25) + 
      (COALESCE(spend_score, 0) * 0.25) + 
      (COALESCE(search_score, 0) * 0.20) + 
      (COALESCE(content_score, 0) * 0.15) + 
      (COALESCE(app_score, 0) * 0.10) +
      (COALESCE(social_score, 0) * 0.05)
    , 2)
  ) STORED,
  
  -- Trend analysis
  trend VARCHAR(20) DEFAULT 'stable' CHECK (trend IN ('rising', 'stable', 'declining', 'new')),
  trend_velocity DECIMAL(5,2) DEFAULT 0, -- Rate of change
  previous_score DECIMAL(5,2),
  
  -- Market analysis
  estimated_market_size VARCHAR(50),
  competition_level VARCHAR(20) CHECK (competition_level IN ('low', 'medium', 'high', 'saturated')),
  build_complexity VARCHAR(20) CHECK (build_complexity IN ('low', 'medium', 'high')),
  
  -- Counts
  signal_count INT DEFAULT 0,
  pain_point_count INT DEFAULT 0,
  ad_count INT DEFAULT 0,
  
  -- Recommendations
  recommended_action TEXT,
  
  -- Timestamps
  first_detected TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  last_signal_at TIMESTAMPTZ,
  
  -- User tracking
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_watching BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opportunities_score ON niche_opportunities(demand_score DESC);
CREATE INDEX idx_opportunities_trend ON niche_opportunities(trend, trend_velocity DESC);
CREATE INDEX idx_opportunities_watching ON niche_opportunities(is_watching, demand_score DESC);

-- ============================================
-- 3. BUILD RECOMMENDATIONS TABLE
-- AI-generated product recommendations
-- ============================================
CREATE TABLE IF NOT EXISTS build_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id UUID REFERENCES niche_opportunities(id) ON DELETE CASCADE,
  niche VARCHAR(255) NOT NULL,
  
  -- What to build
  product_name VARCHAR(255),
  product_idea TEXT NOT NULL,
  product_type VARCHAR(50) CHECK (product_type IN ('saas', 'tool', 'api', 'marketplace', 'content', 'service', 'plugin')),
  tagline VARCHAR(255),
  
  -- Target market
  target_audience TEXT,
  target_persona JSONB, -- { name, role, pain_points, goals }
  
  -- Supporting evidence
  pain_points JSONB,        -- Array of pain points from Reddit
  competitor_ads JSONB,     -- Sample winning ads
  search_queries JSONB,     -- High-intent keywords
  content_gaps JSONB,       -- Missing content/tutorials
  
  -- Marketing strategy
  recommended_hooks JSONB,  -- Ad hooks based on winning ads
  recommended_channels JSONB, -- Best marketing channels
  estimated_cac_range VARCHAR(50),
  pricing_suggestion VARCHAR(100),
  
  -- Confidence & reasoning
  confidence_score DECIMAL(5,2),
  reasoning TEXT,
  risks JSONB,
  
  -- Status
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'building', 'launched', 'archived')),
  priority INT DEFAULT 0,
  
  -- User interaction
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_saved BOOLEAN DEFAULT FALSE,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recommendations_niche ON build_recommendations(niche_id);
CREATE INDEX idx_recommendations_confidence ON build_recommendations(confidence_score DESC);
CREATE INDEX idx_recommendations_status ON build_recommendations(status);

-- ============================================
-- 4. WINNING ADS TABLE
-- Tracked winning ad creatives
-- ============================================
CREATE TABLE IF NOT EXISTS winning_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche VARCHAR(255) NOT NULL,
  
  -- Ad info
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('meta', 'tiktok', 'google', 'youtube', 'linkedin')),
  advertiser_name VARCHAR(255),
  advertiser_id VARCHAR(255),
  
  -- Creative
  headline TEXT,
  primary_text TEXT,
  description TEXT,
  cta VARCHAR(100),
  landing_url TEXT,
  media_type VARCHAR(50) CHECK (media_type IN ('image', 'video', 'carousel', 'text')),
  media_url TEXT,
  
  -- Performance signals
  first_seen TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  run_days INT, -- Calculated via trigger instead of generated column
  is_active BOOLEAN DEFAULT TRUE,
  estimated_spend VARCHAR(50),
  
  -- Analysis
  hook_type VARCHAR(100),
  value_prop TEXT,
  target_emotion VARCHAR(100),
  ad_formula TEXT, -- e.g., "Problem-Agitation-Solution"
  
  -- Metadata
  raw_data JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_winning_ads_niche ON winning_ads(niche);
CREATE INDEX idx_winning_ads_platform ON winning_ads(platform);
CREATE INDEX idx_winning_ads_runtime ON winning_ads(run_days DESC);
CREATE INDEX idx_winning_ads_active ON winning_ads(is_active, run_days DESC);

-- ============================================
-- 5. DEMAND ALERTS TABLE
-- User-configured alerts for opportunities
-- ============================================
CREATE TABLE IF NOT EXISTS demand_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Alert config
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('score_threshold', 'trend_change', 'new_niche', 'ad_spike', 'pain_point')),
  niche VARCHAR(255), -- NULL for global alerts
  threshold DECIMAL(5,2),
  
  -- Notification settings
  email_enabled BOOLEAN DEFAULT TRUE,
  webhook_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered TIMESTAMPTZ,
  trigger_count INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_user ON demand_alerts(user_id);
CREATE INDEX idx_alerts_niche ON demand_alerts(niche);

-- ============================================
-- 6. FUNCTIONS
-- ============================================

-- Function to update niche scores from signals
CREATE OR REPLACE FUNCTION update_niche_scores(p_niche VARCHAR(255))
RETURNS VOID AS $$
DECLARE
  v_pain DECIMAL(5,2);
  v_spend DECIMAL(5,2);
  v_search DECIMAL(5,2);
  v_content DECIMAL(5,2);
  v_app DECIMAL(5,2);
  v_social DECIMAL(5,2);
  v_signal_count INT;
  v_prev_score DECIMAL(5,2);
BEGIN
  -- Get current score before update
  SELECT demand_score INTO v_prev_score
  FROM niche_opportunities WHERE niche = p_niche;

  -- Calculate scores from recent signals (last 7 days)
  SELECT 
    COALESCE(AVG(CASE WHEN signal_type = 'pain_point' THEN score END), 0),
    COALESCE(AVG(CASE WHEN signal_type = 'ad_spend' THEN score END), 0),
    COALESCE(AVG(CASE WHEN signal_type = 'search' THEN score END), 0),
    COALESCE(AVG(CASE WHEN signal_type = 'content' THEN score END), 0),
    COALESCE(AVG(CASE WHEN signal_type = 'app' THEN score END), 0),
    COALESCE(AVG(CASE WHEN signal_type = 'social' THEN score END), 0),
    COUNT(*)
  INTO v_pain, v_spend, v_search, v_content, v_app, v_social, v_signal_count
  FROM demand_signals
  WHERE niche = p_niche
    AND detected_at > NOW() - INTERVAL '7 days';

  -- Upsert niche opportunity
  INSERT INTO niche_opportunities (
    niche, pain_score, spend_score, search_score, 
    content_score, app_score, social_score,
    signal_count, previous_score, last_updated, last_signal_at
  ) VALUES (
    p_niche, v_pain, v_spend, v_search,
    v_content, v_app, v_social,
    v_signal_count, v_prev_score, NOW(), NOW()
  )
  ON CONFLICT (niche) DO UPDATE SET
    pain_score = EXCLUDED.pain_score,
    spend_score = EXCLUDED.spend_score,
    search_score = EXCLUDED.search_score,
    content_score = EXCLUDED.content_score,
    app_score = EXCLUDED.app_score,
    social_score = EXCLUDED.social_score,
    signal_count = niche_opportunities.signal_count + v_signal_count,
    previous_score = v_prev_score,
    last_updated = NOW(),
    last_signal_at = NOW();

  -- Update trend
  UPDATE niche_opportunities
  SET trend = CASE
    WHEN demand_score > COALESCE(previous_score, 0) + 5 THEN 'rising'
    WHEN demand_score < COALESCE(previous_score, 0) - 5 THEN 'declining'
    ELSE 'stable'
  END,
  trend_velocity = demand_score - COALESCE(previous_score, demand_score)
  WHERE niche = p_niche;
END;
$$ LANGUAGE plpgsql;

-- Function to get top opportunities
CREATE OR REPLACE FUNCTION get_top_opportunities(
  p_limit INT DEFAULT 10,
  p_min_score DECIMAL DEFAULT 50,
  p_trend VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  niche VARCHAR(255),
  demand_score DECIMAL(5,2),
  trend VARCHAR(20),
  pain_score DECIMAL(5,2),
  spend_score DECIMAL(5,2),
  signal_count INT,
  recommended_action TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    no.niche,
    no.demand_score,
    no.trend,
    no.pain_score,
    no.spend_score,
    no.signal_count,
    no.recommended_action
  FROM niche_opportunities no
  WHERE no.demand_score >= p_min_score
    AND (p_trend IS NULL OR no.trend = p_trend)
  ORDER BY 
    CASE no.trend WHEN 'rising' THEN 1 WHEN 'new' THEN 2 ELSE 3 END,
    no.demand_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. RLS POLICIES
-- ============================================
ALTER TABLE demand_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE niche_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE winning_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_alerts ENABLE ROW LEVEL SECURITY;

-- Public read for aggregated data
CREATE POLICY "Public read for opportunities" ON niche_opportunities
  FOR SELECT USING (true);

CREATE POLICY "Public read for winning ads" ON winning_ads
  FOR SELECT USING (true);

-- User-specific for personal data
CREATE POLICY "Users manage own alerts" ON demand_alerts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own recommendations" ON build_recommendations
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- Service role for signal collection
CREATE POLICY "Service can insert signals" ON demand_signals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service can read signals" ON demand_signals
  FOR SELECT USING (true);

-- ============================================
-- 8. SEED DATA - Initial niches to monitor
-- ============================================
INSERT INTO niche_opportunities (niche, category, description) VALUES
  ('ai-writing-tools', 'AI/ML', 'AI-powered writing assistants and content generators'),
  ('no-code-builders', 'Development', 'No-code/low-code app and website builders'),
  ('video-editing-saas', 'Media', 'Cloud-based video editing and creation tools'),
  ('email-marketing', 'Marketing', 'Email marketing and automation platforms'),
  ('crm-vertical', 'Sales', 'Industry-specific CRM solutions'),
  ('landing-page-builders', 'Marketing', 'Landing page and funnel builders'),
  ('api-tools', 'Development', 'API development, testing, and management tools'),
  ('automation-tools', 'Productivity', 'Workflow automation and integration platforms'),
  ('analytics-dashboards', 'Data', 'Business intelligence and analytics tools'),
  ('project-management', 'Productivity', 'Project and task management software')
ON CONFLICT (niche) DO NOTHING;

COMMENT ON TABLE demand_signals IS 'Raw demand signals from various sources (Reddit, Meta, etc.)';
COMMENT ON TABLE niche_opportunities IS 'Aggregated demand scores for each niche - the "What to Build" list';
COMMENT ON TABLE build_recommendations IS 'AI-generated product recommendations based on demand signals';
COMMENT ON TABLE winning_ads IS 'Tracked winning ad creatives for reference';
COMMENT ON TABLE demand_alerts IS 'User-configured alerts for demand opportunities';
