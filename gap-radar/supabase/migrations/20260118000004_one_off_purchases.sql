-- One-off Report Purchases
-- Tracks single report purchases without subscription

CREATE TABLE IF NOT EXISTS one_off_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('vetted_idea_pack', 'full_dossier', 'agency_ready')),
  payment_intent_id TEXT NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, run_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_one_off_purchases_user_id ON one_off_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_one_off_purchases_run_id ON one_off_purchases(run_id);

-- RLS policies
ALTER TABLE one_off_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own purchases"
  ON one_off_purchases
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only the system can insert purchases (via service role)
CREATE POLICY "System can insert purchases"
  ON one_off_purchases
  FOR INSERT
  WITH CHECK (true);
