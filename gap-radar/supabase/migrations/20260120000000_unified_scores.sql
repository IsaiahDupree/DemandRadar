-- Unified Demand Score Schema Updates
-- Feature: UDS-008
--
-- Adds JSONB columns to store detailed breakdowns of unified demand scores.
-- This allows us to store:
-- - Individual signal contributions
-- - Weight configurations
-- - Trend velocity details
-- - Data quality metrics

-- ============================================
-- 1. ADD BREAKDOWN COLUMNS TO NICHE_OPPORTUNITIES
-- ============================================

-- Add JSONB columns for storing detailed score breakdowns
ALTER TABLE niche_opportunities
ADD COLUMN IF NOT EXISTS unified_score_breakdown JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS search_score_breakdown JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS content_score_breakdown JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS app_score_breakdown JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS trend_breakdown JSONB DEFAULT '{}'::jsonb;

-- ============================================
-- 2. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN niche_opportunities.unified_score_breakdown IS
'JSONB: Detailed breakdown of unified demand score including individual signal contributions and weights
Example: {
  "pain_score": {"value": 80, "weight": 0.25, "contribution": 20},
  "spend_score": {"value": 70, "weight": 0.25, "contribution": 17.5},
  "search_score": {"value": 60, "weight": 0.20, "contribution": 12},
  "content_score": {"value": 50, "weight": 0.15, "contribution": 7.5},
  "app_score": {"value": 40, "weight": 0.15, "contribution": 6},
  "unified_score": 63,
  "calculated_at": "2026-01-20T12:00:00Z"
}';

COMMENT ON COLUMN niche_opportunities.search_score_breakdown IS
'JSONB: Detailed breakdown of Google search score including trend velocity, search volume, and keyword data
Example: {
  "search_volume": 12500,
  "trend_direction": "rising",
  "velocity_percent": 25.5,
  "top_keywords": ["keyword1", "keyword2"],
  "confidence": 0.85,
  "data_points": 30
}';

COMMENT ON COLUMN niche_opportunities.content_score_breakdown IS
'JSONB: Detailed breakdown of YouTube content score including video metrics and gap analysis
Example: {
  "total_videos": 450,
  "avg_views": 15000,
  "gap_score": 72,
  "content_density": "medium",
  "top_channels": ["channel1", "channel2"],
  "confidence": 0.75
}';

COMMENT ON COLUMN niche_opportunities.app_score_breakdown IS
'JSONB: Detailed breakdown of App Store demand including platform-specific metrics
Example: {
  "ios_apps": 120,
  "android_apps": 180,
  "avg_rating": 4.2,
  "total_reviews": 45000,
  "saturation_level": "medium",
  "confidence": 0.80
}';

COMMENT ON COLUMN niche_opportunities.trend_breakdown IS
'JSONB: Detailed trend velocity data over time
Example: {
  "direction": "rising",
  "velocity_percent": 42.5,
  "indicator": "↗",
  "confidence": 0.9,
  "data_points": [
    {"timestamp": "2026-01-01", "value": 50},
    {"timestamp": "2026-01-15", "value": 71.25}
  ],
  "calculated_at": "2026-01-20T12:00:00Z"
}';

-- ============================================
-- 3. CREATE INDEXES FOR JSONB QUERIES
-- ============================================

-- Index for querying unified score confidence
CREATE INDEX IF NOT EXISTS idx_opportunities_unified_breakdown
ON niche_opportunities USING GIN (unified_score_breakdown);

-- Index for querying trend direction
CREATE INDEX IF NOT EXISTS idx_opportunities_trend_breakdown
ON niche_opportunities USING GIN (trend_breakdown);

-- ============================================
-- 4. UPDATE EXISTING ROWS WITH DEFAULT EMPTY OBJECTS
-- ============================================

UPDATE niche_opportunities
SET
  unified_score_breakdown = '{}'::jsonb,
  search_score_breakdown = '{}'::jsonb,
  content_score_breakdown = '{}'::jsonb,
  app_score_breakdown = '{}'::jsonb,
  trend_breakdown = '{}'::jsonb
WHERE
  unified_score_breakdown IS NULL
  OR search_score_breakdown IS NULL
  OR content_score_breakdown IS NULL
  OR app_score_breakdown IS NULL
  OR trend_breakdown IS NULL;

-- ============================================
-- 5. CREATE HELPER FUNCTION TO UPDATE BREAKDOWN
-- ============================================

CREATE OR REPLACE FUNCTION update_niche_breakdown(
  p_niche VARCHAR(255),
  p_unified_breakdown JSONB DEFAULT NULL,
  p_search_breakdown JSONB DEFAULT NULL,
  p_content_breakdown JSONB DEFAULT NULL,
  p_app_breakdown JSONB DEFAULT NULL,
  p_trend_breakdown JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE niche_opportunities
  SET
    unified_score_breakdown = COALESCE(p_unified_breakdown, unified_score_breakdown),
    search_score_breakdown = COALESCE(p_search_breakdown, search_score_breakdown),
    content_score_breakdown = COALESCE(p_content_breakdown, content_score_breakdown),
    app_score_breakdown = COALESCE(p_app_breakdown, app_score_breakdown),
    trend_breakdown = COALESCE(p_trend_breakdown, trend_breakdown),
    last_updated = NOW()
  WHERE niche = p_niche;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_niche_breakdown IS
'Helper function to update JSONB breakdown columns for a niche opportunity.
Only updates non-NULL parameters, leaving others unchanged.';

-- ============================================
-- 6. CREATE VIEW FOR EASY QUERYING
-- ============================================

CREATE OR REPLACE VIEW niche_opportunities_with_details AS
SELECT
  no.*,
  (unified_score_breakdown->>'unified_score')::decimal as calculated_unified_score,
  (trend_breakdown->>'direction')::text as trend_direction_detail,
  (trend_breakdown->>'velocity_percent')::decimal as trend_velocity_detail,
  (trend_breakdown->>'confidence')::decimal as trend_confidence
FROM niche_opportunities no;

COMMENT ON VIEW niche_opportunities_with_details IS
'Convenience view that extracts commonly-used fields from JSONB breakdown columns';
