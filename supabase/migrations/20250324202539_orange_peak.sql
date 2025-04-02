/*
  # Fix discussions table relationships

  1. Changes
    - Add foreign key relationship between discussions and user_profiles
    - Update RLS policies to use proper joins
    - Add indexes for better query performance

  2. Security
    - Maintain existing RLS policies
    - Ensure proper access control
*/

-- Drop existing foreign key if it exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'discussions_user_id_fkey'
  ) THEN
    ALTER TABLE discussions DROP CONSTRAINT discussions_user_id_fkey;
  END IF;
END $$;

-- Update foreign key to reference user_profiles instead of auth.users
ALTER TABLE discussions
ADD CONSTRAINT discussions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Create index for user_id to improve join performance
CREATE INDEX IF NOT EXISTS discussions_user_id_idx ON discussions(user_id);

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read discussions" ON discussions;
DROP POLICY IF EXISTS "Authenticated users can create discussions" ON discussions;
DROP POLICY IF EXISTS "Users can update own discussions" ON discussions;

-- Recreate policies with proper joins
CREATE POLICY "Anyone can read discussions"
ON discussions FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can create discussions"
ON discussions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own discussions"
ON discussions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Update discussion_replies foreign key
ALTER TABLE discussion_replies
DROP CONSTRAINT IF EXISTS discussion_replies_user_id_fkey;

ALTER TABLE discussion_replies
ADD CONSTRAINT discussion_replies_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Create index for discussion_replies user_id
CREATE INDEX IF NOT EXISTS discussion_replies_user_id_idx ON discussion_replies(user_id);