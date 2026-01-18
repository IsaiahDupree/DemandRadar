-- Credits System
-- Tracks user credits for pay-as-you-go model
-- Feature: CREDIT-001 - Credits System Backend

-- Add credits column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;

-- Add constraint to ensure credits can't go negative
ALTER TABLE users ADD CONSTRAINT credits_non_negative CHECK (credits >= 0);

-- Credits Transactions (for audit trail)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positive for additions, negative for deductions
  balance_after INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'deduction', 'refund', 'bonus', 'adjustment')),
  reference_id UUID, -- run_id for deductions, payment_intent_id for purchases
  reference_type TEXT CHECK (reference_type IN ('run', 'purchase', 'refund', 'bonus', 'manual')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_reference_id ON credit_transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- RLS policies
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own credit transactions"
  ON credit_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only the system can insert/update transactions (via service role)
CREATE POLICY "System can insert credit transactions"
  ON credit_transactions
  FOR INSERT
  WITH CHECK (true);

-- Function to deduct credits safely (atomic operation)
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_reference_id UUID,
  p_reference_type TEXT,
  p_description TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Lock the user row and get current balance
  SELECT credits INTO v_current_balance
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check if user has enough credits
  IF v_current_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance - p_amount;

  -- Update user credits
  UPDATE users
  SET credits = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Record transaction
  INSERT INTO credit_transactions (
    user_id,
    amount,
    balance_after,
    transaction_type,
    reference_id,
    reference_type,
    description
  ) VALUES (
    p_user_id,
    -p_amount,
    v_new_balance,
    'deduction',
    p_reference_id,
    p_reference_type,
    p_description
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits safely (atomic operation)
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_reference_id UUID,
  p_reference_type TEXT,
  p_description TEXT,
  p_transaction_type TEXT DEFAULT 'purchase'
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Lock the user row and get current balance
  SELECT credits INTO v_current_balance
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  -- Calculate new balance
  v_new_balance := v_current_balance + p_amount;

  -- Update user credits
  UPDATE users
  SET credits = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Record transaction
  INSERT INTO credit_transactions (
    user_id,
    amount,
    balance_after,
    transaction_type,
    reference_id,
    reference_type,
    description
  ) VALUES (
    p_user_id,
    p_amount,
    v_new_balance,
    p_transaction_type,
    p_reference_id,
    p_reference_type,
    p_description
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for user credit summary
CREATE OR REPLACE VIEW user_credit_summary AS
SELECT
  u.id AS user_id,
  u.credits AS current_balance,
  COALESCE(SUM(CASE WHEN ct.amount > 0 THEN ct.amount ELSE 0 END), 0) AS total_purchased,
  COALESCE(SUM(CASE WHEN ct.amount < 0 THEN ABS(ct.amount) ELSE 0 END), 0) AS total_spent,
  COUNT(CASE WHEN ct.transaction_type = 'deduction' THEN 1 END) AS total_runs
FROM users u
LEFT JOIN credit_transactions ct ON u.id = ct.user_id
GROUP BY u.id, u.credits;

-- Grant access to authenticated users for the view
GRANT SELECT ON user_credit_summary TO authenticated;

-- RLS policy for the view
ALTER VIEW user_credit_summary SET (security_invoker = on);
