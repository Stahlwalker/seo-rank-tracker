/*
  # Initial Schema Setup

  1. New Tables
    - `url_keyword_pairs`
      - `id` (uuid, primary key)
      - `url` (text)
      - `keyword` (text)
      - `monthly_search_volume` (integer, nullable)
      - `current_ranking` (integer, nullable)
      - `note` (text, nullable)
      - `status` (text, nullable)
      - `last_updated` (timestamptz, nullable)
      - `created_at` (timestamptz, default now())
    - `ranking_history`
      - `id` (uuid, primary key)
      - `url_keyword_id` (uuid, references url_keyword_pairs)
      - `month` (text)
      - `position` (integer)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on both tables
    - Add policies for public access (for demo purposes)
*/

-- Create url_keyword_pairs table
CREATE TABLE IF NOT EXISTS url_keyword_pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  keyword text NOT NULL,
  monthly_search_volume integer,
  current_ranking integer,
  note text,
  status text CHECK (status IN ('Testing', 'Needs Improvement', '')),
  last_updated timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create ranking_history table
CREATE TABLE IF NOT EXISTS ranking_history (
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

-- Create policies for public access (for demo purposes)
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