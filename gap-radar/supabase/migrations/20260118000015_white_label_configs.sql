-- White Label Configurations (Studio Plan Feature)
-- Allows Studio plan users to customize report branding

CREATE TABLE IF NOT EXISTS white_label_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  remove_branding BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE white_label_configs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own white-label config
CREATE POLICY "Users can read own white-label config"
  ON white_label_configs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own white-label config
CREATE POLICY "Users can insert own white-label config"
  ON white_label_configs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own white-label config
CREATE POLICY "Users can update own white-label config"
  ON white_label_configs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own white-label config
CREATE POLICY "Users can delete own white-label config"
  ON white_label_configs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_white_label_configs_user_id
  ON white_label_configs(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_white_label_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_white_label_config_updated_at
  BEFORE UPDATE ON white_label_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_white_label_config_updated_at();

-- Add comment for documentation
COMMENT ON TABLE white_label_configs IS 'Custom branding configurations for Studio plan users - allows custom logos, colors, and removal of DemandRadar branding from reports';
