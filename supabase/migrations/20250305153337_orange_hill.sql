/*
  # Create URL tracking tables

  1. New Tables
    - `url_keyword_pairs`
      - `id` (uuid, primary key)
      - `url` (text, not null)
      - `keyword` (text, not null)
      - `monthly_search_volume` (integer)
      - `current_ranking` (integer)
      - `note` (text)
      - `status` (text)
      - `last_updated` (timestamptz)
      - `created_at` (timestamptz, default now())

    - `ranking_history`
      - `id` (uuid, primary key)
      - `url_keyword_id` (uuid, references url_keyword_pairs)
      - `month` (text, not null)
      - `position` (integer, not null)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on both tables
    - Add policies for public access (temporary for development)
*/

-- Drop existing tables if they exist (to ensure clean state)
DO $$ 
BEGIN
  -- Drop tables if they exist
  DROP TABLE IF EXISTS ranking_history;
  DROP TABLE IF EXISTS url_keyword_pairs;
END $$;

-- Create url_keyword_pairs table
CREATE TABLE url_keyword_pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  keyword text NOT NULL,
  monthly_search_volume integer,
  current_ranking integer,
  note text,
  status text,
  last_updated timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create ranking_history table
CREATE TABLE ranking_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url_keyword_id uuid REFERENCES url_keyword_pairs(id) ON DELETE CASCADE,
  month text NOT NULL,
  position integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(url_keyword_id, month)
);

-- Enable RLS
ALTER TABLE url_keyword_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop url_keyword_pairs policies
  DROP POLICY IF EXISTS "Public can read url_keyword_pairs" ON url_keyword_pairs;
  DROP POLICY IF EXISTS "Public can insert url_keyword_pairs" ON url_keyword_pairs;
  DROP POLICY IF EXISTS "Public can update url_keyword_pairs" ON url_keyword_pairs;
  DROP POLICY IF EXISTS "Public can delete url_keyword_pairs" ON url_keyword_pairs;
  
  -- Drop ranking_history policies
  DROP POLICY IF EXISTS "Public can read ranking_history" ON ranking_history;
  DROP POLICY IF EXISTS "Public can insert ranking_history" ON ranking_history;
  DROP POLICY IF EXISTS "Public can update ranking_history" ON ranking_history;
  DROP POLICY IF EXISTS "Public can delete ranking_history" ON ranking_history;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create policies for url_keyword_pairs
CREATE POLICY "Public can read url_keyword_pairs"
  ON url_keyword_pairs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert url_keyword_pairs"
  ON url_keyword_pairs
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update url_keyword_pairs"
  ON url_keyword_pairs
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete url_keyword_pairs"
  ON url_keyword_pairs
  FOR DELETE
  TO public
  USING (true);

-- Create policies for ranking_history
CREATE POLICY "Public can read ranking_history"
  ON ranking_history
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert ranking_history"
  ON ranking_history
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update ranking_history"
  ON ranking_history
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete ranking_history"
  ON ranking_history
  FOR DELETE
  TO public
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_url_keyword_pairs_url ON url_keyword_pairs(url);
CREATE INDEX IF NOT EXISTS idx_url_keyword_pairs_keyword ON url_keyword_pairs(keyword);
CREATE INDEX IF NOT EXISTS idx_ranking_history_url_keyword_id ON ranking_history(url_keyword_id);
CREATE INDEX IF NOT EXISTS idx_ranking_history_month ON ranking_history(month);