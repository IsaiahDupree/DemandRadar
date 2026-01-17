-- DemandRadar Initial Schema
-- Based on PRD.md database design

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'builder', 'agency', 'studio')),
  runs_used INTEGER DEFAULT 0,
  runs_limit INTEGER DEFAULT 2,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects (group runs)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analysis Runs
CREATE TABLE IF NOT EXISTS runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  niche_query TEXT NOT NULL,
  seed_terms JSONB DEFAULT '[]',
  competitors JSONB DEFAULT '[]',
  geo TEXT DEFAULT 'US',
  run_type TEXT DEFAULT 'light' CHECK (run_type IN ('light', 'deep')),
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'complete', 'failed')),
  scores JSONB,
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ad Creatives (Meta + Google)
CREATE TABLE IF NOT EXISTS ad_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('meta', 'google')),
  advertiser_name TEXT,
  creative_text TEXT,
  headline TEXT,
  description TEXT,
  cta TEXT,
  landing_url TEXT,
  first_seen TIMESTAMP WITH TIME ZONE,
  last_seen TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'carousel', 'unknown')),
  raw_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reddit Mentions
CREATE TABLE IF NOT EXISTS reddit_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  subreddit TEXT,
  type TEXT CHECK (type IN ('post', 'comment')),
  title TEXT,
  body TEXT,
  score INTEGER DEFAULT 0,
  num_comments INTEGER DEFAULT 0,
  permalink TEXT,
  matched_entities JSONB DEFAULT '[]',
  posted_at TIMESTAMP WITH TIME ZONE,
  raw_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- App Store Results
CREATE TABLE IF NOT EXISTS app_store_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  app_name TEXT,
  app_id TEXT,
  developer TEXT,
  rating NUMERIC,
  review_count INTEGER DEFAULT 0,
  description TEXT,
  category TEXT,
  price TEXT,
  raw_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LLM Extractions
CREATE TABLE IF NOT EXISTS extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('ad', 'reddit')),
  source_id UUID,
  offers JSONB DEFAULT '[]',
  claims JSONB DEFAULT '[]',
  angles JSONB DEFAULT '[]',
  objections JSONB DEFAULT '[]',
  desired_features JSONB DEFAULT '[]',
  sentiment JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clusters
CREATE TABLE IF NOT EXISTS clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  cluster_type TEXT NOT NULL CHECK (cluster_type IN ('angle', 'objection', 'feature', 'offer')),
  label TEXT,
  examples JSONB DEFAULT '[]',
  frequency INTEGER DEFAULT 0,
  intensity NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gap Opportunities
CREATE TABLE IF NOT EXISTS gap_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  gap_type TEXT CHECK (gap_type IN ('product', 'offer', 'positioning', 'trust', 'pricing')),
  title TEXT,
  problem TEXT,
  evidence_ads JSONB DEFAULT '[]',
  evidence_reddit JSONB DEFAULT '[]',
  recommendation TEXT,
  opportunity_score NUMERIC,
  confidence NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Concept Ideas (Vetted Product Ideas)
CREATE TABLE IF NOT EXISTS concept_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  name TEXT,
  one_liner TEXT,
  platform_recommendation TEXT CHECK (platform_recommendation IN ('web', 'mobile', 'hybrid')),
  platform_reasoning TEXT,
  industry TEXT,
  icp TEXT,
  business_model TEXT CHECK (business_model IN ('b2b', 'b2c', 'b2b2c')),
  gap_thesis TEXT,
  mvp_spec JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Concept Metrics Estimates
CREATE TABLE IF NOT EXISTS concept_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES concept_ideas(id) ON DELETE CASCADE,
  cpc_low NUMERIC,
  cpc_expected NUMERIC,
  cpc_high NUMERIC,
  cac_low NUMERIC,
  cac_expected NUMERIC,
  cac_high NUMERIC,
  tam_low NUMERIC,
  tam_expected NUMERIC,
  tam_high NUMERIC,
  implementation_difficulty INTEGER CHECK (implementation_difficulty BETWEEN 1 AND 10),
  human_touch_level TEXT CHECK (human_touch_level IN ('high', 'medium', 'low')),
  autonomous_suitability TEXT CHECK (autonomous_suitability IN ('high', 'medium', 'low')),
  build_difficulty INTEGER CHECK (build_difficulty BETWEEN 1 AND 10),
  distribution_difficulty INTEGER CHECK (distribution_difficulty BETWEEN 1 AND 10),
  opportunity_score NUMERIC,
  confidence NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- UGC Assets
CREATE TABLE IF NOT EXISTS ugc_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  source TEXT CHECK (source IN ('tiktok_top_ads', 'tiktok_commercial', 'tiktok_trend', 'ig_hashtag', 'tiktok_connected', 'ig_connected')),
  platform TEXT CHECK (platform IN ('tiktok', 'instagram')),
  url TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  posted_at TIMESTAMP WITH TIME ZONE,
  raw_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- UGC Metrics
CREATE TABLE IF NOT EXISTS ugc_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ugc_asset_id UUID NOT NULL REFERENCES ugc_assets(id) ON DELETE CASCADE,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  reach_unique_users INTEGER,
  first_shown TIMESTAMP WITH TIME ZONE,
  last_shown TIMESTAMP WITH TIME ZONE,
  score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- UGC Patterns
CREATE TABLE IF NOT EXISTS ugc_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ugc_asset_id UUID NOT NULL REFERENCES ugc_assets(id) ON DELETE CASCADE,
  hook_type TEXT,
  format TEXT,
  proof_type TEXT,
  objection_handled TEXT,
  cta_style TEXT,
  notes TEXT,
  confidence NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- UGC Recommendations
CREATE TABLE IF NOT EXISTS ugc_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  hooks JSONB DEFAULT '[]',
  scripts JSONB DEFAULT '[]',
  shot_list JSONB DEFAULT '[]',
  angle_map JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  report_url TEXT,
  pdf_url TEXT,
  export_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE reddit_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_store_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE gap_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ugc_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ugc_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ugc_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ugc_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for projects
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can create projects" ON projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for runs
CREATE POLICY "Users can view own runs" ON runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create runs" ON runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own runs" ON runs FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for run-related data (via run ownership)
CREATE POLICY "Users can view own ad_creatives" ON ad_creatives FOR SELECT 
  USING (EXISTS (SELECT 1 FROM runs WHERE runs.id = ad_creatives.run_id AND runs.user_id = auth.uid()));

CREATE POLICY "Users can view own reddit_mentions" ON reddit_mentions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM runs WHERE runs.id = reddit_mentions.run_id AND runs.user_id = auth.uid()));

CREATE POLICY "Users can view own app_store_results" ON app_store_results FOR SELECT 
  USING (EXISTS (SELECT 1 FROM runs WHERE runs.id = app_store_results.run_id AND runs.user_id = auth.uid()));

CREATE POLICY "Users can view own extractions" ON extractions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM runs WHERE runs.id = extractions.run_id AND runs.user_id = auth.uid()));

CREATE POLICY "Users can view own clusters" ON clusters FOR SELECT 
  USING (EXISTS (SELECT 1 FROM runs WHERE runs.id = clusters.run_id AND runs.user_id = auth.uid()));

CREATE POLICY "Users can view own gap_opportunities" ON gap_opportunities FOR SELECT 
  USING (EXISTS (SELECT 1 FROM runs WHERE runs.id = gap_opportunities.run_id AND runs.user_id = auth.uid()));

CREATE POLICY "Users can view own concept_ideas" ON concept_ideas FOR SELECT 
  USING (EXISTS (SELECT 1 FROM runs WHERE runs.id = concept_ideas.run_id AND runs.user_id = auth.uid()));

CREATE POLICY "Users can view own ugc_assets" ON ugc_assets FOR SELECT 
  USING (EXISTS (SELECT 1 FROM runs WHERE runs.id = ugc_assets.run_id AND runs.user_id = auth.uid()));

CREATE POLICY "Users can view own ugc_recommendations" ON ugc_recommendations FOR SELECT 
  USING (EXISTS (SELECT 1 FROM runs WHERE runs.id = ugc_recommendations.run_id AND runs.user_id = auth.uid()));

CREATE POLICY "Users can view own reports" ON reports FOR SELECT 
  USING (EXISTS (SELECT 1 FROM runs WHERE runs.id = reports.run_id AND runs.user_id = auth.uid()));

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_runs_user_id ON runs(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
CREATE INDEX IF NOT EXISTS idx_ad_creatives_run_id ON ad_creatives(run_id);
CREATE INDEX IF NOT EXISTS idx_reddit_mentions_run_id ON reddit_mentions(run_id);
CREATE INDEX IF NOT EXISTS idx_gap_opportunities_run_id ON gap_opportunities(run_id);
CREATE INDEX IF NOT EXISTS idx_concept_ideas_run_id ON concept_ideas(run_id);
