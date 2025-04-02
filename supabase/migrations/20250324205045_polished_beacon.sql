/*
  # Enhance user profiles table with username validation

  1. Changes
    - Add username validation check constraint
    - Add proper indexes for username lookups
    - Update RLS policies for better security

  2. Security
    - Enable RLS
    - Add comprehensive policies for profile management
*/

-- Drop existing constraints if they exist
DO $$ BEGIN
  ALTER TABLE user_profiles
    DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;
  ALTER TABLE user_profiles
    DROP CONSTRAINT IF EXISTS user_profiles_user_id_key;
  ALTER TABLE user_profiles
    DROP CONSTRAINT IF EXISTS user_profiles_username_key;
  ALTER TABLE user_profiles
    DROP CONSTRAINT IF EXISTS user_profiles_username_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add proper constraints
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_username_key UNIQUE (username);

-- Add username validation constraint
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_username_check 
  CHECK (
    length(username) >= 3 AND
    length(username) <= 30 AND
    username ~ '^[a-z0-9_-]+$'
  );

-- Add proper foreign key relationship to auth.users
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS user_profiles_username_idx ON user_profiles(username);
CREATE INDEX IF NOT EXISTS user_profiles_username_lower_idx ON user_profiles(lower(username));

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Create comprehensive policies
CREATE POLICY "Users can read all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);