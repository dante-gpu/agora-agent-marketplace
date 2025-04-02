/*
  # Add model_name and api_config columns to agents table
  # Create chat_messages table for agent conversations

  1. Changes
    - Add model_name and api_config columns to agents table
    - Create chat_messages table for storing conversation history
    - Add RLS policies for chat messages

  2. Security
    - Enable RLS on chat_messages table
    - Add policies for message access and creation
*/

-- Add new columns to agents table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agents' AND column_name = 'model_name'
  ) THEN
    ALTER TABLE agents ADD COLUMN model_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agents' AND column_name = 'api_config'
  ) THEN
    ALTER TABLE agents ADD COLUMN api_config jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create chat_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  content text NOT NULL,
  is_bot boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Add policies for chat_messages if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_messages' AND policyname = 'Users can read own messages'
  ) THEN
    CREATE POLICY "Users can read own messages"
      ON chat_messages
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_messages' AND policyname = 'Users can create messages'
  ) THEN
    CREATE POLICY "Users can create messages"
      ON chat_messages
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;