/*
  # Add official bots and chat functionality

  1. Changes
    - Add `model_name` column to agents table
    - Add `api_config` column to agents table for model-specific settings
    - Create system user for official bots
    - Insert official bot records
    - Add chat_messages table for storing conversations

  2. Security
    - Enable RLS on chat_messages table
    - Add policies for authenticated users
*/

-- Create a function to get or create system user
CREATE OR REPLACE FUNCTION get_system_user()
RETURNS uuid AS $$
DECLARE
  system_user_id uuid;
BEGIN
  -- Try to get existing system user
  SELECT id INTO system_user_id
  FROM auth.users
  WHERE email = 'system@agoraai.local'
  LIMIT 1;
  
  -- If not found, create new system user
  IF system_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'system@agoraai.local',
      crypt('system-password-never-used', gen_salt('bf')),
      now(),
      now(),
      now()
    )
    RETURNING id INTO system_user_id;
  END IF;
  
  RETURN system_user_id;
END;
$$ LANGUAGE plpgsql;

-- Add new columns to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS model_name text;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS api_config jsonb DEFAULT '{}'::jsonb;

-- Create chat_messages table
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

-- Add policies for chat_messages
CREATE POLICY "Users can read own messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Insert official bots
INSERT INTO agents (
  name,
  description,
  category,
  is_official,
  model_name,
  price,
  technical_specs,
  status,
  slug,
  creator,
  image_url
) VALUES 
  (
    'Assistant',
    'A versatile AI assistant capable of general chat, writing, coding, and information retrieval.',
    'Knowledge',
    true,
    'assistant-v1',
    0,
    '{"capabilities": ["chat", "writing", "coding", "knowledge"], "context_length": 16000, "response_speed": "fast"}',
    'active',
    'assistant',
    get_system_user(),
    'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&q=80&w=500'
  ),
  (
    'App-Creators',
    'Specialized in web application development assistance and technical guidance.',
    'Programming',
    true,
    'app-creators-v1',
    0,
    '{"capabilities": ["web_development", "coding", "technical_design"], "context_length": 32000, "response_speed": "medium"}',
    'active',
    'app-creators',
    get_system_user(),
    'https://images.unsplash.com/photo-1555066931-bf19f8fd1085?auto=format&fit=crop&q=80&w=500'
  ),
  (
    'Claude-3.7-Sonnet',
    'Advanced AI model with exceptional reasoning capabilities and quick response times.',
    'Research',
    true,
    'claude-3.7-sonnet',
    0,
    '{"capabilities": ["reasoning", "analysis", "research"], "context_length": 64000, "response_speed": "very_fast"}',
    'active',
    'claude-3-7-sonnet',
    get_system_user(),
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=500'
  ),
  (
    'GPT-4o',
    'Creative AI assistant specializing in natural responses and STEM subjects.',
    'Knowledge',
    true,
    'gpt-4o',
    0,
    '{"capabilities": ["mathematics", "physics", "creative_writing"], "context_length": 128000, "response_speed": "fast"}',
    'active',
    'gpt-4o',
    get_system_user(),
    'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=500'
  ),
  (
    'GPT-4.5-Preview',
    'Empathetic AI focused on coaching and personalized learning experiences.',
    'Knowledge',
    true,
    'gpt-4.5-preview',
    0,
    '{"capabilities": ["coaching", "learning", "empathy"], "context_length": 128000, "response_speed": "medium"}',
    'active',
    'gpt-4-5-preview',
    get_system_user(),
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=500'
  ),
  (
    'Deepseek-V3-FW',
    'Cost-effective open-source AI model for general-purpose tasks.',
    'Knowledge',
    true,
    'deepseek-v3-fw',
    0,
    '{"capabilities": ["general_purpose", "open_source"], "context_length": 32000, "response_speed": "medium"}',
    'active',
    'deepseek-v3-fw',
    get_system_user(),
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=500'
  ),
  (
    'Gemini-2.0-Flash',
    'Lightning-fast AI with integrated web search capabilities.',
    'Research',
    true,
    'gemini-2.0-flash',
    0,
    '{"capabilities": ["web_search", "quick_responses"], "context_length": 64000, "response_speed": "very_fast"}',
    'active',
    'gemini-2-0-flash',
    get_system_user(),
    'https://images.unsplash.com/photo-1519608425089-7f3bfa6f6bb8?auto=format&fit=crop&q=80&w=500'
  ),
  (
    'Grok-2',
    'Specialized AI optimized for coding and multi-step problem solving.',
    'Programming',
    true,
    'grok-2',
    0,
    '{"capabilities": ["coding", "problem_solving"], "context_length": 128000, "response_speed": "fast"}',
    'active',
    'grok-2',
    get_system_user(),
    'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=500'
  ),
  (
    'Claude-3.5-Sonnet',
    'Advanced AI with strong capabilities in coding, analysis, and visual processing.',
    'Programming',
    true,
    'claude-3.5-sonnet',
    0,
    '{"capabilities": ["coding", "analysis", "visual_processing"], "context_length": 64000, "response_speed": "fast"}',
    'active',
    'claude-3-5-sonnet',
    get_system_user(),
    'https://images.unsplash.com/photo-1551033406-611cf9a28f67?auto=format&fit=crop&q=80&w=500'
  ),
  (
    'Gemini-1.5-Pro',
    'Multimodal AI supporting text, image, and video inputs.',
    'Knowledge',
    true,
    'gemini-1.5-pro',
    0,
    '{"capabilities": ["multimodal", "text", "image", "video"], "context_length": 128000, "response_speed": "medium"}',
    'active',
    'gemini-1-5-pro',
    get_system_user(),
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=500'
  )
ON CONFLICT (slug) DO NOTHING;