/*
  # Add ranking-related fields to agents table

  1. Changes
    - Add `weekly_growth` numeric column to track weekly usage growth percentage
    - Add `rank_change` integer column to track ranking position changes
    - Add `last_week_deployments` integer column to calculate growth

  2. Notes
    - Weekly growth is stored as a percentage
    - Rank change can be positive (improved) or negative (declined)
    - These fields help track agent performance over time
*/

DO $$ 
BEGIN
  -- Add weekly_growth column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agents' AND column_name = 'weekly_growth'
  ) THEN
    ALTER TABLE agents ADD COLUMN weekly_growth numeric DEFAULT 0;
  END IF;

  -- Add rank_change column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agents' AND column_name = 'rank_change'
  ) THEN
    ALTER TABLE agents ADD COLUMN rank_change integer DEFAULT 0;
  END IF;

  -- Add last_week_deployments column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agents' AND column_name = 'last_week_deployments'
  ) THEN
    ALTER TABLE agents ADD COLUMN last_week_deployments integer DEFAULT 0;
  END IF;
END $$;