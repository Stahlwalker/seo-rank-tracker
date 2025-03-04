/*
  # Create public tables for SEO Rank Tracker

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
      - `url_keyword_id` (uuid, foreign key to url_keyword_pairs)
      - `month` (text)
      - `position` (integer)
      - `created_at` (timestamptz, default now())
  2. Security
    - Disable RLS on tables for public access
*/

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