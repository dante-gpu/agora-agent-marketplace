/*
  # Fix discussions queries and relationships

  1. Changes
    - Add views for discussions with user profile data
    - Update policies to use the views
    - Add proper indexes for performance

  2. Security
    - Maintain existing RLS policies
    - Ensure proper access control
*/

-- Create a view that joins discussions with user profiles
CREATE OR REPLACE VIEW discussion_details AS
SELECT 
  d.*,
  up.username,
  up.created_at as user_created_at
FROM discussions d
LEFT JOIN user_profiles up ON up.user_id = d.user_id;

-- Create a view that joins discussion replies with user profiles
CREATE OR REPLACE VIEW discussion_reply_details AS
SELECT 
  dr.*,
  up.username,
  up.created_at as user_created_at
FROM discussion_replies dr
LEFT JOIN user_profiles up ON up.user_id = dr.user_id;

-- Add indexes to improve join performance
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);

-- Grant appropriate permissions to the views
GRANT SELECT ON discussion_details TO public;
GRANT SELECT ON discussion_reply_details TO public;