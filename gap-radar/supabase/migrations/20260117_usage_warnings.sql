-- Usage Warnings table
-- Tracks when we send usage limit warning emails to users

CREATE TABLE IF NOT EXISTS usage_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  warning_level INTEGER NOT NULL, -- 80 or 90 (percent used)
  runs_used INTEGER NOT NULL,
  runs_limit INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_usage_warnings_user_id ON usage_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_warnings_created_at ON usage_warnings(created_at);

-- RLS policies
ALTER TABLE usage_warnings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own warnings
CREATE POLICY "Users can view own warnings"
  ON usage_warnings
  FOR SELECT
  USING (auth.uid() = user_id);
