-- Performance Indexes for Common Query Patterns
-- PERF-003: Database Query Optimization

-- Enable pg_trgm extension for full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ==============================================================================
-- FOREIGN KEY INDEXES
-- PostgreSQL doesn't automatically index foreign keys, so we need to create them
-- These improve JOIN performance and CASCADE DELETE operations
-- ==============================================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Projects table indexes
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Runs table indexes (most frequently queried)
CREATE INDEX IF NOT EXISTS idx_runs_user_id ON runs(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_project_id ON runs(project_id);
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
CREATE INDEX IF NOT EXISTS idx_runs_created_at ON runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runs_finished_at ON runs(finished_at DESC);

-- Composite index for common query: user's runs ordered by date
CREATE INDEX IF NOT EXISTS idx_runs_user_created ON runs(user_id, created_at DESC);

-- Composite index for filtering by status and ordering
CREATE INDEX IF NOT EXISTS idx_runs_user_status_created ON runs(user_id, status, created_at DESC);

-- Ad Creatives table indexes
CREATE INDEX IF NOT EXISTS idx_ad_creatives_run_id ON ad_creatives(run_id);
CREATE INDEX IF NOT EXISTS idx_ad_creatives_source ON ad_creatives(source);
CREATE INDEX IF NOT EXISTS idx_ad_creatives_advertiser_name ON ad_creatives(advertiser_name);
CREATE INDEX IF NOT EXISTS idx_ad_creatives_is_active ON ad_creatives(is_active);
CREATE INDEX IF NOT EXISTS idx_ad_creatives_first_seen ON ad_creatives(first_seen DESC);

-- Composite index for filtering active ads by run
CREATE INDEX IF NOT EXISTS idx_ad_creatives_run_active ON ad_creatives(run_id, is_active);

-- Reddit Mentions table indexes
CREATE INDEX IF NOT EXISTS idx_reddit_mentions_run_id ON reddit_mentions(run_id);
CREATE INDEX IF NOT EXISTS idx_reddit_mentions_subreddit ON reddit_mentions(subreddit);
CREATE INDEX IF NOT EXISTS idx_reddit_mentions_score ON reddit_mentions(score DESC);
CREATE INDEX IF NOT EXISTS idx_reddit_mentions_posted_at ON reddit_mentions(posted_at DESC);

-- Composite index for top-scored mentions by run
CREATE INDEX IF NOT EXISTS idx_reddit_mentions_run_score ON reddit_mentions(run_id, score DESC);

-- App Store Results table indexes
CREATE INDEX IF NOT EXISTS idx_app_store_run_id ON app_store_results(run_id);
CREATE INDEX IF NOT EXISTS idx_app_store_platform ON app_store_results(platform);
CREATE INDEX IF NOT EXISTS idx_app_store_rating ON app_store_results(rating DESC);

-- Composite index for platform filtering by run
CREATE INDEX IF NOT EXISTS idx_app_store_run_platform ON app_store_results(run_id, platform);

-- Extractions table indexes
CREATE INDEX IF NOT EXISTS idx_extractions_run_id ON extractions(run_id);
CREATE INDEX IF NOT EXISTS idx_extractions_source_type ON extractions(source_type);
CREATE INDEX IF NOT EXISTS idx_extractions_source_id ON extractions(source_id);

-- Clusters table indexes
CREATE INDEX IF NOT EXISTS idx_clusters_run_id ON clusters(run_id);
CREATE INDEX IF NOT EXISTS idx_clusters_type ON clusters(cluster_type);
CREATE INDEX IF NOT EXISTS idx_clusters_frequency ON clusters(frequency DESC);

-- Composite index for cluster ranking by type
CREATE INDEX IF NOT EXISTS idx_clusters_run_type_freq ON clusters(run_id, cluster_type, frequency DESC);

-- Gap Opportunities table indexes
CREATE INDEX IF NOT EXISTS idx_gap_opportunities_run_id ON gap_opportunities(run_id);
CREATE INDEX IF NOT EXISTS idx_gap_opportunities_type ON gap_opportunities(gap_type);
CREATE INDEX IF NOT EXISTS idx_gap_opportunities_score ON gap_opportunities(opportunity_score DESC);

-- Composite index for ranking gaps by score
CREATE INDEX IF NOT EXISTS idx_gap_opportunities_run_score ON gap_opportunities(run_id, opportunity_score DESC);

-- Concept Ideas table indexes
CREATE INDEX IF NOT EXISTS idx_concept_ideas_run_id ON concept_ideas(run_id);
CREATE INDEX IF NOT EXISTS idx_concept_ideas_platform ON concept_ideas(platform_recommendation);
CREATE INDEX IF NOT EXISTS idx_concept_ideas_business_model ON concept_ideas(business_model);

-- ==============================================================================
-- JSONB INDEXES
-- For filtering and searching within JSON fields
-- ==============================================================================

-- Index for searching seed terms (if we need to query by specific terms)
CREATE INDEX IF NOT EXISTS idx_runs_seed_terms_gin ON runs USING GIN(seed_terms);

-- Index for searching competitors
CREATE INDEX IF NOT EXISTS idx_runs_competitors_gin ON runs USING GIN(competitors);

-- ==============================================================================
-- TEXT SEARCH INDEXES
-- For full-text search capabilities
-- ==============================================================================

-- Full-text search on niche queries
CREATE INDEX IF NOT EXISTS idx_runs_niche_query_trgm ON runs USING gin(niche_query gin_trgm_ops);

-- Full-text search on ad creative text
CREATE INDEX IF NOT EXISTS idx_ad_creatives_text_trgm ON ad_creatives USING gin(creative_text gin_trgm_ops);

-- Full-text search on Reddit post titles
CREATE INDEX IF NOT EXISTS idx_reddit_mentions_title_trgm ON reddit_mentions USING gin(title gin_trgm_ops);

-- ==============================================================================
-- PARTIAL INDEXES
-- For commonly filtered subsets of data
-- ==============================================================================

-- Index for active runs only
CREATE INDEX IF NOT EXISTS idx_runs_active ON runs(user_id, created_at DESC)
WHERE status IN ('running', 'queued');

-- Index for completed runs only
CREATE INDEX IF NOT EXISTS idx_runs_completed ON runs(user_id, finished_at DESC)
WHERE status = 'complete';

-- Index for failed runs (for debugging)
CREATE INDEX IF NOT EXISTS idx_runs_failed ON runs(user_id, created_at DESC)
WHERE status = 'failed';

-- Index for active ads only
CREATE INDEX IF NOT EXISTS idx_ad_creatives_active ON ad_creatives(run_id, first_seen DESC)
WHERE is_active = true;

-- ==============================================================================
-- VACUUM AND ANALYZE
-- Refresh statistics for the query planner
-- ==============================================================================

-- Refresh table statistics for better query planning
ANALYZE users;
ANALYZE projects;
ANALYZE runs;
ANALYZE ad_creatives;
ANALYZE reddit_mentions;
ANALYZE app_store_results;
ANALYZE extractions;
ANALYZE clusters;
ANALYZE gap_opportunities;
ANALYZE concept_ideas;
