/*
  # Add Profile Features

  1. New Tables
    - `user_settings`
      - User profile customization settings
      - Theme preferences, notification settings, etc.
    
    - `agent_bookmarks`
      - User's bookmarked/favorite agents
      - Tracks bookmark date and optional notes
    
    - `user_agent_history`
      - User's interaction history with agents
      - Tracks usage statistics and last interaction

  2. Security
    - Enable RLS on all tables
    - Add policies for user-specific access
*/

-- User Settings Table
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS user_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    theme text DEFAULT 'dark',
    show_email boolean DEFAULT false,
    bio text,
    avatar_url text,
    website text,
    social_links jsonb DEFAULT '{}',
    notification_preferences jsonb DEFAULT '{"email": true, "push": true}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT user_settings_user_id_key UNIQUE (user_id)
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Agent Bookmarks Table
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS agent_bookmarks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    notes text,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT agent_bookmarks_user_agent_unique UNIQUE (user_id, agent_id)
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- User Agent History Table
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS user_agent_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    total_interactions integer DEFAULT 1,
    total_tokens integer DEFAULT 0,
    last_interaction_at timestamptz DEFAULT now(),
    first_interaction_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_agent_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
  DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
  DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
  DROP POLICY IF EXISTS "Users can view own bookmarks" ON agent_bookmarks;
  DROP POLICY IF EXISTS "Users can manage own bookmarks" ON agent_bookmarks;
  DROP POLICY IF EXISTS "Users can view own history" ON user_agent_history;
  DROP POLICY IF EXISTS "Users can update own history" ON user_agent_history;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- User Settings Policies
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Agent Bookmarks Policies
CREATE POLICY "Users can view own bookmarks"
  ON agent_bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bookmarks"
  ON agent_bookmarks FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User Agent History Policies
CREATE POLICY "Users can view own history"
  ON user_agent_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own history"
  ON user_agent_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_settings_user_id_idx ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS agent_bookmarks_user_id_idx ON agent_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS agent_bookmarks_agent_id_idx ON agent_bookmarks(agent_id);
CREATE INDEX IF NOT EXISTS user_agent_history_user_id_idx ON user_agent_history(user_id);
CREATE INDEX IF NOT EXISTS user_agent_history_agent_id_idx ON user_agent_history(agent_id);

-- Create a function to update user_agent_history
CREATE OR REPLACE FUNCTION update_user_agent_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_agent_history (user_id, agent_id)
  VALUES (NEW.user_id, NEW.agent_id)
  ON CONFLICT (user_id, agent_id) DO UPDATE
  SET 
    total_interactions = user_agent_history.total_interactions + 1,
    last_interaction_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to update history on new chat messages
DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_history_on_chat ON chat_messages;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE TRIGGER update_history_on_chat
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_user_agent_history();