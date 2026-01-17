-- White-Label Branding Settings
-- Allows Studio plan users to customize report branding

CREATE TABLE IF NOT EXISTS branding_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  -- Company Information
  company_name TEXT,
  company_logo_url TEXT,

  -- Brand Colors (hex codes)
  primary_color TEXT DEFAULT '#2563eb',
  secondary_color TEXT DEFAULT '#1e40af',
  accent_color TEXT DEFAULT '#3b82f6',

  -- Report Customization
  report_title_prefix TEXT, -- e.g., "Acme Corp" instead of "DemandRadar"
  footer_text TEXT,
  show_powered_by BOOLEAN DEFAULT true,

  -- Contact Information (optional)
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_branding_settings_user_id ON branding_settings(user_id);

-- RLS Policies
ALTER TABLE branding_settings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own branding settings
CREATE POLICY "Users can view own branding settings"
  ON branding_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own branding settings
CREATE POLICY "Users can insert own branding settings"
  ON branding_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own branding settings
CREATE POLICY "Users can update own branding settings"
  ON branding_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own branding settings
CREATE POLICY "Users can delete own branding settings"
  ON branding_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_branding_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER branding_settings_updated_at
  BEFORE UPDATE ON branding_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_branding_settings_updated_at();
