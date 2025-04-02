/*
  # Add is_official field to agents table

  1. Changes
    - Add `is_official` boolean column to `agents` table with default value of false
    - This helps distinguish between official and community-created agents

  2. Notes
    - Existing agents will be marked as non-official by default
    - New agents will be non-official unless explicitly set
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agents' AND column_name = 'is_official'
  ) THEN
    ALTER TABLE agents ADD COLUMN is_official boolean DEFAULT false;
  END IF;
END $$;