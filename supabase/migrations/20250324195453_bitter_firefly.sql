/*
  # Add admin features and user tracking

  1. New Tables
    - `user_roles` - Store user roles (admin, moderator)
    - `user_bans` - Track banned users
    - `user_activity` - Track user logins and activity
    - `bot_analytics` - Track bot performance metrics
    - `content_reports` - Store user reports for moderation
    - `moderation_actions` - Track moderator actions

  2. Changes
    - Add role-based access control
    - Add analytics tracking
    - Add moderation features
*/

-- Create user_roles table if not exists
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'moderator')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users NOT NULL,
  UNIQUE(user_id, role)
);

-- Create user_bans table if not exists
CREATE TABLE IF NOT EXISTS user_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  reason text NOT NULL,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users NOT NULL
);

-- Create user_activity table if not exists
CREATE TABLE IF NOT EXISTS user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  action text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create bot_analytics table if not exists
CREATE TABLE IF NOT EXISTS bot_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents NOT NULL,
  total_interactions integer DEFAULT 0,
  avg_response_time float DEFAULT 0,
  accuracy_rating float DEFAULT 0,
  daily_active_users integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Create content_reports table if not exists
CREATE TABLE IF NOT EXISTS content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users NOT NULL,
  message_id uuid REFERENCES chat_messages,
  reason text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users
);

-- Create moderation_actions table if not exists
CREATE TABLE IF NOT EXISTS moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id uuid REFERENCES auth.users NOT NULL,
  action_type text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

-- Create or replace admin check function
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_id
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

-- Create or replace moderator check function
CREATE OR REPLACE FUNCTION is_moderator(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_id
    AND role IN ('admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
  DROP POLICY IF EXISTS "Moderators can manage bans" ON user_bans;
  DROP POLICY IF EXISTS "Admins can view all activity" ON user_activity;
  DROP POLICY IF EXISTS "Admins can view analytics" ON bot_analytics;
  DROP POLICY IF EXISTS "Users can create reports" ON content_reports;
  DROP POLICY IF EXISTS "Moderators can manage reports" ON content_reports;
  DROP POLICY IF EXISTS "Moderators can create actions" ON moderation_actions;
  DROP POLICY IF EXISTS "Admins can view all actions" ON moderation_actions;
END $$;

-- Create policies
CREATE POLICY "Admins can manage roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Moderators can manage bans"
  ON user_bans
  FOR ALL
  TO authenticated
  USING (is_moderator(auth.uid()))
  WITH CHECK (is_moderator(auth.uid()));

CREATE POLICY "Admins can view all activity"
  ON user_activity
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view analytics"
  ON bot_analytics
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can create reports"
  ON content_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Moderators can manage reports"
  ON content_reports
  FOR ALL
  TO authenticated
  USING (is_moderator(auth.uid()));

CREATE POLICY "Moderators can create actions"
  ON moderation_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (is_moderator(auth.uid()));

CREATE POLICY "Admins can view all actions"
  ON moderation_actions
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Create initial admin user
DO $$
DECLARE
  admin_id uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Insert admin user
  INSERT INTO auth.users (
    id,
    email,
    raw_user_meta_data
  )
  VALUES (
    admin_id,
    'admin@agoraai.local',
    '{"provider": "email"}'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Add admin role
  INSERT INTO user_roles (user_id, role, created_by)
  VALUES (admin_id, 'admin', admin_id)
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;