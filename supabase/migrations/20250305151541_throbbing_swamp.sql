/*
  # Initial Schema Setup for SEO Rank Tracker

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
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamptz, default now())

    - `ranking_history`
      - `id` (uuid, primary key)
      - `url_keyword_id` (uuid, references url_keyword_pairs)
      - `month` (text)
      - `position` (integer)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
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
  user_id uuid REFERENCES auth.users(id),
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

-- Enable Row Level Security
ALTER TABLE url_keyword_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_history ENABLE ROW SECURITY;

-- Create policies for url_keyword_pairs
CREATE POLICY "Users can create their own url_keyword_pairs"
  ON url_keyword_pairs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own url_keyword_pairs"
  ON url_keyword_pairs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own url_keyword_pairs"
  ON url_keyword_pairs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own url_keyword_pairs"
  ON url_keyword_pairs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for ranking_history
CREATE POLICY "Users can create ranking history for their pairs"
  ON ranking_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM url_keyword_pairs
      WHERE id = url_keyword_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view ranking history for their pairs"
  ON ranking_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM url_keyword_pairs
      WHERE id = url_keyword_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update ranking history for their pairs"
  ON ranking_history
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM url_keyword_pairs
      WHERE id = url_keyword_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM url_keyword_pairs
      WHERE id = url_keyword_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete ranking history for their pairs"
  ON ranking_history
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM url_keyword_pairs
      WHERE id = url_keyword_id
      AND user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_url_keyword_pairs_user_id ON url_keyword_pairs(user_id);
CREATE INDEX IF NOT EXISTS idx_ranking_history_url_keyword_id ON ranking_history(url_keyword_id);
CREATE INDEX IF NOT EXISTS idx_url_keyword_pairs_last_updated ON url_keyword_pairs(last_updated);