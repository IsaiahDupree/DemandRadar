-- API Keys Table
-- Stores API keys for Agency and Studio tier users
-- Keys are hashed before storage for security

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- User-friendly name for the key
  key_hash TEXT NOT NULL UNIQUE, -- Hashed API key (bcrypt)
  key_prefix TEXT NOT NULL, -- First 8 chars for display (e.g., "sk_live_12345...")
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Optional expiration
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Rate limiting
  rate_limit INTEGER NOT NULL DEFAULT 100, -- Requests per hour

  -- Scopes/permissions (for future expansion)
  scopes TEXT[] NOT NULL DEFAULT ARRAY['runs:read', 'runs:write', 'reports:read'],

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- API Usage Tracking
-- Tracks API requests for rate limiting and analytics
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Request metadata
  ip_address TEXT,
  user_agent TEXT,
  request_id TEXT
);

-- Indexes for performance
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active) WHERE is_active = true;
CREATE INDEX idx_api_usage_api_key_id ON api_usage(api_key_id);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at DESC);
CREATE INDEX idx_api_usage_user_id_created_at ON api_usage(user_id, created_at DESC);

-- RLS Policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Users can only see their own API keys
CREATE POLICY "Users can view their own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Users can view their own API usage
CREATE POLICY "Users can view their own API usage"
  ON api_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert usage records
-- (API endpoints will use service role client)

-- Function to clean up old API usage records (optional)
CREATE OR REPLACE FUNCTION cleanup_old_api_usage()
RETURNS void AS $$
BEGIN
  DELETE FROM api_usage
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Comment for documentation
COMMENT ON TABLE api_keys IS 'API keys for programmatic access (Agency+ plans only)';
COMMENT ON TABLE api_usage IS 'API usage logs for rate limiting and analytics';
