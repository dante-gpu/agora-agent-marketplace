/*
  # Fix user_profiles constraints and relationships

  1. Changes
    - Add unique constraint on user_id
    - Add unique constraint on username
    - Add proper foreign key relationship to auth.users
    - Add indexes for better performance

  2. Security
    - Keep existing RLS policies
*/

-- Add unique constraint on user_id if it doesn't exist
DO $$ BEGIN
  ALTER TABLE user_profiles
    ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Add unique constraint on username if it doesn't exist
DO $$ BEGIN
  ALTER TABLE user_profiles
    ADD CONSTRAINT user_profiles_username_key UNIQUE (username);
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Drop existing foreign key if it exists
DO $$ BEGIN
  ALTER TABLE user_profiles
    DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;
END $$;

-- Add proper foreign key relationship to auth.users
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Create index for better join performance if it doesn't exist
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS user_profiles_username_idx ON user_profiles(username);

-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Recreate policies to ensure proper access control
DROP POLICY IF EXISTS "Users can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can read all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);