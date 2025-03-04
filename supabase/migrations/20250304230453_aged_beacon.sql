-- Create url_keyword_pairs table
CREATE TABLE IF NOT EXISTS url_keyword_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  keyword TEXT NOT NULL,
  monthly_search_volume INTEGER,
  current_ranking INTEGER,
  note TEXT,
  status TEXT,
  last_updated TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create ranking_history table
CREATE TABLE IF NOT EXISTS ranking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_keyword_id UUID NOT NULL REFERENCES url_keyword_pairs(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(url_keyword_id, month)
);

-- Disable Row Level Security for public access
ALTER TABLE url_keyword_pairs DISABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_history DISABLE ROW LEVEL SECURITY;