/*
  # Add Discussion System Tables

  1. New Tables
    - `discussions`
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `is_markdown` (boolean)

    - `discussion_replies`
      - `id` (uuid, primary key)
      - `discussion_id` (uuid, references discussions)
      - `user_id` (uuid, references auth.users)
      - `content` (text)
      - `created_at` (timestamp)
      - `is_markdown` (boolean)

    - `discussion_likes`
      - `id` (uuid, primary key)
      - `discussion_id` (uuid, references discussions)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)

    - `reply_likes`
      - `id` (uuid, primary key)
      - `reply_id` (uuid, references discussion_replies)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create discussions table
CREATE TABLE IF NOT EXISTS discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_markdown boolean DEFAULT false
);

-- Create discussion_replies table
CREATE TABLE IF NOT EXISTS discussion_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid REFERENCES discussions ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_markdown boolean DEFAULT false
);

-- Create discussion_likes table
CREATE TABLE IF NOT EXISTS discussion_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid REFERENCES discussions ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(discussion_id, user_id)
);

-- Create reply_likes table
CREATE TABLE IF NOT EXISTS reply_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reply_id uuid REFERENCES discussion_replies ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(reply_id, user_id)
);

-- Enable RLS
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reply_likes ENABLE ROW LEVEL SECURITY;

-- Policies for discussions
CREATE POLICY "Anyone can read discussions"
  ON discussions
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create discussions"
  ON discussions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own discussions"
  ON discussions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for discussion_replies
CREATE POLICY "Anyone can read replies"
  ON discussion_replies
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create replies"
  ON discussion_replies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own replies"
  ON discussion_replies
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for discussion_likes
CREATE POLICY "Anyone can read likes"
  ON discussion_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create likes"
  ON discussion_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON discussion_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for reply_likes
CREATE POLICY "Anyone can read reply likes"
  ON reply_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reply likes"
  ON reply_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reply likes"
  ON reply_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add functions to get like counts
CREATE OR REPLACE FUNCTION get_discussion_likes(discussion_id uuid)
RETURNS bigint AS $$
  SELECT COUNT(*)
  FROM discussion_likes
  WHERE discussion_id = $1;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_reply_likes(reply_id uuid)
RETURNS bigint AS $$
  SELECT COUNT(*)
  FROM reply_likes
  WHERE reply_id = $1;
$$ LANGUAGE sql STABLE;