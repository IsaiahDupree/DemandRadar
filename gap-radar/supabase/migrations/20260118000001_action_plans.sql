-- Action Plans Table
-- Stores the generated action plans for each run (7-day, 30-day, quick wins, risks)

CREATE TABLE IF NOT EXISTS action_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,

  -- 7-day action plan
  seven_day JSONB DEFAULT '[]'::jsonb,

  -- 30-day action plan
  thirty_day JSONB DEFAULT '[]'::jsonb,

  -- Quick wins
  quick_wins JSONB DEFAULT '[]'::jsonb,

  -- Key risks
  key_risks JSONB DEFAULT '[]'::jsonb,

  -- Next steps summary
  next_steps TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_action_plans_run_id ON action_plans(run_id);

-- RLS Policies
ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;

-- Users can view action plans for runs in their projects
CREATE POLICY "Users can view action plans for their runs"
  ON action_plans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM runs r
      JOIN projects p ON p.id = r.project_id
      WHERE r.id = action_plans.run_id
      AND p.owner_id = auth.uid()
    )
  );

-- Service role can insert/update action plans
CREATE POLICY "Service role can manage action plans"
  ON action_plans
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Comments
COMMENT ON TABLE action_plans IS 'Stores generated action plans for runs';
COMMENT ON COLUMN action_plans.seven_day IS 'Array of 7-day action items with day, task, category, effort, priority';
COMMENT ON COLUMN action_plans.thirty_day IS 'Array of 30-day action items with day, task, category, effort, priority';
COMMENT ON COLUMN action_plans.quick_wins IS 'Array of quick win items';
COMMENT ON COLUMN action_plans.key_risks IS 'Array of key risk items';
COMMENT ON COLUMN action_plans.next_steps IS 'Summary of recommended next steps';
