-- Favorite Searches Table
-- Allows users to save frequently used search queries for quick access

CREATE TABLE IF NOT EXISTS favorite_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate favorites for same query
  UNIQUE(user_id, query)
);

-- Enable Row Level Security
ALTER TABLE favorite_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for favorite_searches
CREATE POLICY "Users can view own favorite searches" ON favorite_searches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorite searches" ON favorite_searches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorite searches" ON favorite_searches
  FOR DELETE USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_favorite_searches_user_id ON favorite_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_searches_query ON favorite_searches(query);

-- Grant access to authenticated users
GRANT SELECT, INSERT, DELETE ON favorite_searches TO authenticated;
