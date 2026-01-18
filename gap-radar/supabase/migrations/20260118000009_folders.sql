-- Folders Table
-- Allows users to organize saved gaps and reports into custom folders/collections

CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate folder names per user
  UNIQUE(user_id, name)
);

-- Folder Items Table
-- Junction table linking items (gaps, reports, etc.) to folders
CREATE TABLE IF NOT EXISTS folder_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('gap', 'report', 'concept', 'run')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate items in the same folder
  UNIQUE(folder_id, item_id, item_type)
);

-- Enable Row Level Security
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for folders
CREATE POLICY "Users can view own folders" ON folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create folders" ON folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders" ON folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders" ON folders
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for folder_items
CREATE POLICY "Users can view own folder items" ON folder_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM folders
      WHERE folders.id = folder_items.folder_id
      AND folders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add items to own folders" ON folder_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM folders
      WHERE folders.id = folder_items.folder_id
      AND folders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove items from own folders" ON folder_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM folders
      WHERE folders.id = folder_items.folder_id
      AND folders.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folder_items_folder_id ON folder_items(folder_id);
CREATE INDEX IF NOT EXISTS idx_folder_items_item ON folder_items(item_id, item_type);

-- View for folders with item counts
CREATE OR REPLACE VIEW folders_with_counts AS
SELECT
  f.id,
  f.user_id,
  f.name,
  f.description,
  f.created_at,
  f.updated_at,
  COALESCE(COUNT(fi.id), 0) as item_count
FROM folders f
LEFT JOIN folder_items fi ON f.id = fi.folder_id
GROUP BY f.id, f.user_id, f.name, f.description, f.created_at, f.updated_at;

-- Grant access to the view
GRANT SELECT ON folders_with_counts TO authenticated;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER folders_updated_at_trigger
  BEFORE UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION update_folders_updated_at();
