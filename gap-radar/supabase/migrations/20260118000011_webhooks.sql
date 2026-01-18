-- ============================================
-- Webhook Configuration
-- ============================================
-- Description: Outbound webhooks for run events and gap discoveries
-- Feature: INTEG-003

-- Webhook configurations table
CREATE TABLE IF NOT EXISTS webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Webhook settings
  url TEXT NOT NULL,
  secret TEXT NOT NULL, -- Used for HMAC signing
  is_active BOOLEAN DEFAULT TRUE,

  -- Event selection (JSONB array of event types)
  -- Example: ["run.started", "run.completed", "run.failed", "gap.discovered"]
  events JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Metadata
  name TEXT, -- Optional friendly name
  description TEXT,

  -- Statistics
  last_triggered_at TIMESTAMPTZ,
  success_count INT DEFAULT 0,
  failure_count INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook delivery logs table
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_config_id UUID NOT NULL REFERENCES webhook_configs(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,

  -- Delivery details
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  status_code INT,
  response_body TEXT,
  error_message TEXT,

  -- Retry tracking
  attempt_count INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  next_retry_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_webhook_configs_user ON webhook_configs(user_id);
CREATE INDEX idx_webhook_configs_active ON webhook_configs(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_webhook_deliveries_config ON webhook_deliveries(webhook_config_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_retry ON webhook_deliveries(next_retry_at) WHERE status = 'failed' AND attempt_count < max_attempts;

-- Row Level Security (RLS)
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Policies for webhook_configs
CREATE POLICY "Users can view their own webhook configs"
  ON webhook_configs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own webhook configs"
  ON webhook_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhook configs"
  ON webhook_configs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhook configs"
  ON webhook_configs FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for webhook_deliveries
CREATE POLICY "Users can view deliveries for their webhook configs"
  ON webhook_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM webhook_configs
      WHERE webhook_configs.id = webhook_deliveries.webhook_config_id
      AND webhook_configs.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_webhook_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER webhook_configs_updated_at
  BEFORE UPDATE ON webhook_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_webhook_config_updated_at();
