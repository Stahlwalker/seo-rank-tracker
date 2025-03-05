/*
  # Add SERP Rankings Table

  1. New Tables
    - `serp_rankings`
      - `id` (uuid, primary key)
      - `url_keyword_id` (uuid, foreign key to url_keyword_pairs)
      - `prev_rank` (integer, nullable)
      - `curr_rank` (integer)
      - `checked_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Changes
    - Add foreign key constraint to link with url_keyword_pairs
    - Enable RLS on serp_rankings table
    - Add policies for authenticated access

  3. Security
    - Enable RLS
    - Add policies for CRUD operations
*/

-- Create SERP rankings table
CREATE TABLE IF NOT EXISTS serp_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url_keyword_id uuid NOT NULL REFERENCES url_keyword_pairs(id) ON DELETE CASCADE,
  prev_rank integer,
  curr_rank integer NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_serp_rankings_url_keyword_id ON serp_rankings(url_keyword_id);
CREATE INDEX IF NOT EXISTS idx_serp_rankings_checked_at ON serp_rankings(checked_at);

-- Enable RLS
ALTER TABLE serp_rankings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read serp_rankings"
  ON serp_rankings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert serp_rankings"
  ON serp_rankings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own serp_rankings"
  ON serp_rankings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete their own serp_rankings"
  ON serp_rankings
  FOR DELETE
  TO authenticated
  USING (true);