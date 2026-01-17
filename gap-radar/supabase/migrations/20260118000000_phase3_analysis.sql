-- Add Phase 3 analysis fields to runs table
-- This migration adds support for storing 3% Better Plans and scores

-- Add three_percent_better_plans JSONB column to runs table
ALTER TABLE runs ADD COLUMN IF NOT EXISTS three_percent_better_plans JSONB;

-- Add scores JSONB column to runs table (for opportunity_score, confidence, etc.)
ALTER TABLE runs ADD COLUMN IF NOT EXISTS scores JSONB;

-- Comment on columns
COMMENT ON COLUMN runs.three_percent_better_plans IS 'Generated 3% Better action plans for each gap';
COMMENT ON COLUMN runs.scores IS 'Calculated scores: opportunity, confidence, saturation, longevity, etc.';
