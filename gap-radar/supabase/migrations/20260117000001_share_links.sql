-- Share Links Feature
-- Allows users to generate shareable report URLs with optional password protection

CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Optional password protection
  password_hash TEXT,

  -- Access control
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for share_links
-- Users can view their own share links
CREATE POLICY "Users can view own share_links" ON share_links FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create share links for their own runs
CREATE POLICY "Users can create share_links" ON share_links FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM runs WHERE runs.id = run_id AND runs.user_id = auth.uid())
  );

-- Users can update their own share links
CREATE POLICY "Users can update own share_links" ON share_links FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own share links
CREATE POLICY "Users can delete own share_links" ON share_links FOR DELETE
  USING (auth.uid() = user_id);

-- Public can view active, non-expired share links (for the public share page)
-- This is handled in the application layer via service role, not RLS

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);
CREATE INDEX IF NOT EXISTS idx_share_links_run_id ON share_links(run_id);
CREATE INDEX IF NOT EXISTS idx_share_links_user_id ON share_links(user_id);
CREATE INDEX IF NOT EXISTS idx_share_links_active ON share_links(is_active) WHERE is_active = true;

-- Function to generate unique token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    -- Generate a random 32-character token
    token := encode(gen_random_bytes(24), 'base64');
    token := replace(token, '/', '_');
    token := replace(token, '+', '-');
    token := replace(token, '=', '');

    -- Check if token already exists
    SELECT COUNT(*) INTO exists_count FROM share_links WHERE share_links.token = token;

    EXIT WHEN exists_count = 0;
  END LOOP;

  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_share_view_count(share_token TEXT)
RETURNS void AS $$
BEGIN
  UPDATE share_links
  SET
    view_count = view_count + 1,
    last_viewed_at = NOW()
  WHERE token = share_token AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
