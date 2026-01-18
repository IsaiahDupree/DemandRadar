-- ============================================
-- Webhook Helper Functions
-- ============================================
-- Description: Functions for updating webhook statistics
-- Feature: INTEG-003

-- Function to increment webhook success count
CREATE OR REPLACE FUNCTION increment_webhook_success(webhook_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE webhook_configs
  SET
    success_count = success_count + 1,
    last_triggered_at = NOW()
  WHERE id = webhook_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment webhook failure count
CREATE OR REPLACE FUNCTION increment_webhook_failure(webhook_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE webhook_configs
  SET
    failure_count = failure_count + 1,
    last_triggered_at = NOW()
  WHERE id = webhook_id;
END;
$$ LANGUAGE plpgsql;
