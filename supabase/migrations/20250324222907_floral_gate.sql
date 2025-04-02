/*
  # Update Chat Messages Schema

  1. Changes
    - Drop and recreate chat_messages table with proper constraints
    - Update foreign key relationships
    - Maintain existing indexes and policies

  2. Security
    - Preserve RLS policies
    - Maintain data integrity with proper CASCADE rules
*/

-- First drop the foreign key constraint from content_reports
ALTER TABLE content_reports
DROP CONSTRAINT IF EXISTS content_reports_message_id_fkey;

-- Now we can safely drop and recreate the chat_messages table
DROP TABLE IF EXISTS chat_messages CASCADE;

CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_bot boolean DEFAULT false,
  is_markdown boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX chat_messages_user_id_idx ON chat_messages(user_id);
CREATE INDEX chat_messages_agent_id_idx ON chat_messages(agent_id);
CREATE INDEX chat_messages_created_at_idx ON chat_messages(created_at);

-- Recreate the foreign key constraint on content_reports
ALTER TABLE content_reports
ADD CONSTRAINT content_reports_message_id_fkey
FOREIGN KEY (message_id) REFERENCES chat_messages(id)
ON DELETE CASCADE;