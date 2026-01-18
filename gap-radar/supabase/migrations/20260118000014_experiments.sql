-- Experiments Tables Migration
-- Created: January 18, 2026
-- Description: Tables for tracking weekly experiments and their results

-- =============================================================================
-- TABLE: niche_experiments
-- Description: Weekly experiment suggestions for each niche
-- =============================================================================
CREATE TABLE IF NOT EXISTS niche_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id UUID NOT NULL REFERENCES user_niches(id) ON DELETE CASCADE,

  -- Week identifier (ISO 8601 format: YYYY-Www, e.g., 2026-W03)
  week TEXT NOT NULL,

  -- Experiment details
  type TEXT NOT NULL CHECK (type IN ('copy', 'angle', 'offer', 'pricing', 'feature', 'targeting')),
  title TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  setup_instructions TEXT NOT NULL,
  success_metrics TEXT[] NOT NULL,
  estimated_effort TEXT CHECK (estimated_effort IN ('low', 'medium', 'high')),
  priority INTEGER CHECK (priority BETWEEN 1 AND 10),
  evidence TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One experiment per niche per week
  UNIQUE(niche_id, week)
);

-- Add indexes
CREATE INDEX idx_experiments_niche_id ON niche_experiments(niche_id);
CREATE INDEX idx_experiments_week ON niche_experiments(week DESC);
CREATE INDEX idx_experiments_niche_week ON niche_experiments(niche_id, week DESC);

-- RLS policies for niche_experiments
ALTER TABLE niche_experiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view experiments for their niches"
  ON niche_experiments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_niches
      WHERE user_niches.id = niche_experiments.niche_id
      AND user_niches.user_id = auth.uid()
    )
  );

-- Only system can insert/update experiments (via service role)
CREATE POLICY "Service role can insert experiments"
  ON niche_experiments FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can update experiments"
  ON niche_experiments FOR UPDATE
  USING (auth.jwt()->>'role' = 'service_role');

-- =============================================================================
-- TABLE: experiment_results
-- Description: Track results and learnings from experiments
-- =============================================================================
CREATE TABLE IF NOT EXISTS experiment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES niche_experiments(id) ON DELETE CASCADE,

  -- Outcome
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'failed', 'inconclusive', 'in_progress')),

  -- Metrics achieved (flexible JSONB for various metric types)
  metrics_achieved JSONB DEFAULT '{}'::jsonb,

  -- Learnings and insights
  learnings TEXT NOT NULL,
  confidence NUMERIC CHECK (confidence BETWEEN 0 AND 1),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One result per experiment
  UNIQUE(experiment_id)
);

-- Add indexes
CREATE INDEX idx_results_experiment_id ON experiment_results(experiment_id);
CREATE INDEX idx_results_outcome ON experiment_results(outcome);

-- RLS policies for experiment_results
ALTER TABLE experiment_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view results for their experiments"
  ON experiment_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM niche_experiments ne
      JOIN user_niches un ON un.id = ne.niche_id
      WHERE ne.id = experiment_results.experiment_id
      AND un.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create results for their experiments"
  ON experiment_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM niche_experiments ne
      JOIN user_niches un ON un.id = ne.niche_id
      WHERE ne.id = experiment_results.experiment_id
      AND un.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their experiment results"
  ON experiment_results FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM niche_experiments ne
      JOIN user_niches un ON un.id = ne.niche_id
      WHERE ne.id = experiment_results.experiment_id
      AND un.user_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_experiment_results_updated_at
  BEFORE UPDATE ON experiment_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE niche_experiments IS 'Weekly experiment suggestions for each tracked niche';
COMMENT ON TABLE experiment_results IS 'Track outcomes and learnings from experiments';
