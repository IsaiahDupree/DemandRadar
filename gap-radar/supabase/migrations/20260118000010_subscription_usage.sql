-- Subscription Usage Tracking (BILL-009)
-- Track runs, exports, and alerts per subscription period for enforcing limits

CREATE TABLE IF NOT EXISTS subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_id UUID REFERENCES runs(id) ON DELETE SET NULL,
  usage_type TEXT NOT NULL CHECK (usage_type IN ('run', 'export', 'alert')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX idx_subscription_usage_user_id ON subscription_usage(user_id);

-- Index for fast period queries
CREATE INDEX idx_subscription_usage_created_at ON subscription_usage(created_at);

-- Composite index for user + usage_type + date range queries
CREATE INDEX idx_subscription_usage_user_type_date ON subscription_usage(user_id, usage_type, created_at);

-- Row Level Security (RLS)
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own usage
CREATE POLICY "Users can view their own usage"
  ON subscription_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: System can insert usage records (via service role)
CREATE POLICY "System can insert usage"
  ON subscription_usage
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users cannot update or delete usage records
-- (No policies for UPDATE/DELETE = denied by default)

-- Add comments for documentation
COMMENT ON TABLE subscription_usage IS 'Tracks subscription usage (runs, exports, alerts) for enforcing plan limits';
COMMENT ON COLUMN subscription_usage.user_id IS 'User who performed the action';
COMMENT ON COLUMN subscription_usage.run_id IS 'Associated run (if applicable)';
COMMENT ON COLUMN subscription_usage.usage_type IS 'Type of usage: run, export, or alert';
COMMENT ON COLUMN subscription_usage.metadata IS 'Additional metadata (run_type, export_type, alert_type, etc.)';
COMMENT ON COLUMN subscription_usage.created_at IS 'When the usage occurred';
