/*
  # Initial Schema for SEO Rank Tracker

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `updated_at` (timestamp)
      - `username` (text)
      - `full_name` (text)
      - `avatar_url` (text)
      - `website` (text)
    - `url_keyword_pairs`
      - `id` (uuid, primary key)
      - `url` (text, not null)
      - `keyword` (text, not null)
      - `monthly_search_volume` (integer)
      - `current_ranking` (integer)
      - `note` (text)
      - `status` (text)
      - `last_updated` (timestamp)
      - `user_id` (uuid, references profiles.id)
      - `created_at` (timestamp)
    - `ranking_history`
      - `id` (uuid, primary key)
      - `url_keyword_id` (uuid, references url_keyword_pairs.id)
      - `month` (text, not null)
      - `position` (integer, not null)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  updated_at TIMESTAMPTZ,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT
);

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
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(url, keyword, user_id)
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

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_keyword_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_history ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for url_keyword_pairs
CREATE POLICY "Users can view their own URL/keyword pairs"
  ON url_keyword_pairs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own URL/keyword pairs"
  ON url_keyword_pairs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own URL/keyword pairs"
  ON url_keyword_pairs
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own URL/keyword pairs"
  ON url_keyword_pairs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for ranking_history
CREATE POLICY "Users can view ranking history for their own URL/keyword pairs"
  ON ranking_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM url_keyword_pairs
      WHERE url_keyword_pairs.id = ranking_history.url_keyword_id
      AND url_keyword_pairs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert ranking history for their own URL/keyword pairs"
  ON ranking_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM url_keyword_pairs
      WHERE url_keyword_pairs.id = ranking_history.url_keyword_id
      AND url_keyword_pairs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update ranking history for their own URL/keyword pairs"
  ON ranking_history
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM url_keyword_pairs
      WHERE url_keyword_pairs.id = ranking_history.url_keyword_id
      AND url_keyword_pairs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete ranking history for their own URL/keyword pairs"
  ON ranking_history
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM url_keyword_pairs
      WHERE url_keyword_pairs.id = ranking_history.url_keyword_id
      AND url_keyword_pairs.user_id = auth.uid()
    )
  );

-- Create a function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();